import { beforeEach, describe, expect, it } from 'vitest';

import {
	DynamoDBClient,
	TransactionCanceledException
} from '@aws-sdk/client-dynamodb';
import {
	DynamoDBDocumentClient,
	TransactWriteCommand
} from '@aws-sdk/lib-dynamodb';
import { mockClient } from 'aws-sdk-client-mock';

import { claimRequestSlot } from '../../functions/intake/rate_limit';
import { RateLimitExceededError } from '../../functions/shared/errors';
import type { RateLimitPolicy } from '../../functions/shared/types';

const dynamoMock = mockClient(DynamoDBDocumentClient);

const TABLE_NAME = 'TestRateLimitTable';
const POLICY: RateLimitPolicy = {
	maxRequestsPerEmail: 1,
	maxRequestsPerSourceIp: 5,
	windowSeconds: 86_400
};

// 2026-09-17T00:00:00Z is exactly a day boundary, so the window index is stable
// and a test can step into the next window by adding windowSeconds.
const WINDOW_START = new Date('2026-09-17T00:00:00Z');
const WINDOW_INDEX = Math.floor(WINDOW_START.getTime() / 1000 / 86_400);
const WINDOW_END_EPOCH = (WINDOW_INDEX + 1) * 86_400;

const claim = (overrides: Partial<Parameters<typeof claimRequestSlot>[0]> = {}) =>
	claimRequestSlot({
		documentClient: DynamoDBDocumentClient.from(
			new DynamoDBClient({ region: 'us-east-1' })
		),
		email: 'test@example.com',
		now: WINDOW_START,
		policy: POLICY,
		sourceIp: '1.2.3.4',
		tableName: TABLE_NAME,
		...overrides
	});

const transactItems = () => {
	const calls = dynamoMock.commandCalls(TransactWriteCommand);
	expect(calls).toHaveLength(1);
	return calls[0].args[0].input.TransactItems ?? [];
};

const keysWritten = () =>
	transactItems().map(item => item.Update?.Key?.requestKey);

describe('claimRequestSlot', () => {
	beforeEach(() => {
		dynamoMock.reset();
		dynamoMock.on(TransactWriteCommand).resolves({});
	});

	it('counts one request against both the email and the source IP', async () => {
		await claim();

		expect(keysWritten()).toEqual([
			`email:test@example.com#${WINDOW_INDEX}`,
			`ip:1.2.3.4#${WINDOW_INDEX}`
		]);
	});

	it('writes both updates in a single transaction', async () => {
		await claim();

		expect(dynamoMock.commandCalls(TransactWriteCommand)).toHaveLength(1);
		expect(transactItems()).toHaveLength(2);
	});

	it('applies each identifier its own limit', async () => {
		await claim();

		const limits = transactItems().map(
			item => item.Update?.ExpressionAttributeValues?.[':limit']
		);
		expect(limits).toEqual([
			POLICY.maxRequestsPerEmail,
			POLICY.maxRequestsPerSourceIp
		]);
	});

	it('expires each entry at the end of its window', async () => {
		await claim();

		const expiries = transactItems().map(
			item => item.Update?.ExpressionAttributeValues?.[':expiresAt']
		);
		expect(expiries).toEqual([WINDOW_END_EPOCH, WINDOW_END_EPOCH]);
	});

	it('counts the following window under a different key', async () => {
		await claim({
			now: new Date(WINDOW_START.getTime() + POLICY.windowSeconds * 1000)
		});

		expect(keysWritten()).toEqual([
			`email:test@example.com#${WINDOW_INDEX + 1}`,
			`ip:1.2.3.4#${WINDOW_INDEX + 1}`
		]);
	});

	it('keys the email case-insensitively so casing cannot buy a second send', async () => {
		await claim({ email: 'TEST@Example.COM' });

		expect(keysWritten()[0]).toBe(`email:test@example.com#${WINDOW_INDEX}`);
	});

	it('rejects the request when an identifier is over its limit', async () => {
		dynamoMock.on(TransactWriteCommand).rejects(
			new TransactionCanceledException({
				$metadata: {},
				message: 'Transaction cancelled',
				CancellationReasons: [
					{ Code: 'None' },
					{ Code: 'ConditionalCheckFailed' }
				]
			})
		);

		await expect(claim()).rejects.toBeInstanceOf(RateLimitExceededError);
	});

	it('propagates a cancellation that is not a failed condition', async () => {
		dynamoMock.on(TransactWriteCommand).rejects(
			new TransactionCanceledException({
				$metadata: {},
				message: 'Transaction cancelled',
				CancellationReasons: [
					{ Code: 'None' },
					{ Code: 'ThrottlingError' }
				]
			})
		);

		await expect(claim()).rejects.toBeInstanceOf(
			TransactionCanceledException
		);
	});

	it('propagates an unexpected DynamoDB failure instead of allowing the request', async () => {
		dynamoMock
			.on(TransactWriteCommand)
			.rejects(new Error('DynamoDB unavailable'));

		await expect(claim()).rejects.toThrow('DynamoDB unavailable');
	});
});
