import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import {
	type DynamoDBDocumentClient,
	TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';

import {
	RATE_LIMIT_COUNT_ATTRIBUTE,
	RATE_LIMIT_TABLE_PARTITION_KEY,
	RATE_LIMIT_TABLE_TTL_ATTRIBUTE
} from '../shared/constants';
import { RateLimitExceededError } from '../shared/errors';
import type { RateLimitPolicy } from '../shared/types';

/** Everything `claimRequestSlot` needs to record one request attempt. */
export type RateLimitClaim = {
	readonly documentClient: DynamoDBDocumentClient;
	readonly email: string;
	readonly now: Date;
	readonly policy: RateLimitPolicy;
	readonly sourceIp: string;
	readonly tableName: string;
};

type Identifier = {
	readonly key: string;
	readonly limit: number;
};

const CONDITION_FAILED_CODE = 'ConditionalCheckFailed';
const SECONDS_PER_MILLISECOND = 1000;

// Folding the window into the key is what keeps this correct without reading
// anything first: an entry belongs to exactly one window, so a stale entry from
// a past window can never be reached again. DynamoDB deletes expired items
// lazily — "within a few days" — and that delay cannot affect a decision here.
const windowIndexFor = ({ now, policy }: RateLimitClaim): number =>
	Math.floor(now.getTime() / SECONDS_PER_MILLISECOND / policy.windowSeconds);

const identifiersFor = (claim: RateLimitClaim, windowIndex: number): Identifier[] => [
	{
		key: `email:${claim.email.toLowerCase()}#${windowIndex}`,
		limit: claim.policy.maxRequestsPerEmail
	},
	{
		key: `ip:${claim.sourceIp}#${windowIndex}`,
		limit: claim.policy.maxRequestsPerSourceIp
	}
];

const wasRejectedByCondition = (error: unknown): boolean =>
	error instanceof TransactionCanceledException &&
	(error.CancellationReasons ?? []).some(
		reason => reason.Code === CONDITION_FAILED_CODE
	);

/**
 * Records a request against the caller's email and source IP, refusing it when
 * either identifier is already at its limit for the current window.
 *
 * Both counters move in one transaction, so a refused request leaves no trace
 * and a granted one cannot be half-recorded.
 *
 * @throws RateLimitExceededError when an identifier is over its limit.
 */
export const claimRequestSlot = async (claim: RateLimitClaim): Promise<void> => {
	const windowIndex = windowIndexFor(claim);
	const expiresAt = (windowIndex + 1) * claim.policy.windowSeconds;

	try {
		await claim.documentClient.send(
			new TransactWriteCommand({
				TransactItems: identifiersFor(claim, windowIndex).map(
					identifier => ({
						Update: {
							TableName: claim.tableName,
							Key: {
								[RATE_LIMIT_TABLE_PARTITION_KEY]: identifier.key
							},
							UpdateExpression:
								'SET #expiresAt = :expiresAt ADD #requestCount :increment',
							ConditionExpression:
								'attribute_not_exists(#requestCount) OR #requestCount < :limit',
							ExpressionAttributeNames: {
								'#expiresAt': RATE_LIMIT_TABLE_TTL_ATTRIBUTE,
								'#requestCount': RATE_LIMIT_COUNT_ATTRIBUTE
							},
							ExpressionAttributeValues: {
								':expiresAt': expiresAt,
								':increment': 1,
								':limit': identifier.limit
							}
						}
					})
				)
			})
		);
	} catch (error) {
		if (wasRejectedByCondition(error)) {
			throw new RateLimitExceededError();
		}
		throw error;
	}
};
