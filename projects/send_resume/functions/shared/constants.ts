import type { RateLimitPolicy } from './types';

/**
 * Names and limits shared by the CDK stack and the Lambda handlers.
 *
 * The attribute names below are the reason this module exists: the stack builds
 * the table from them and the handlers read and write with them, so the two
 * cannot drift apart the way `requestId`/`id` and `ttl`/`expireAt` did.
 */

/** Partition key of the rate-limit table. */
export const RATE_LIMIT_TABLE_PARTITION_KEY = 'requestKey';

/** Attribute DynamoDB watches to expire rate-limit entries. */
export const RATE_LIMIT_TABLE_TTL_ATTRIBUTE = 'expiresAt';

/** Attribute holding how many requests an identifier has made this window. */
export const RATE_LIMIT_COUNT_ATTRIBUTE = 'requestCount';

/** Environment variables each handler reads. */
export const ENVIRONMENT_VARIABLE = {
	rateLimitTableName: 'RATE_LIMIT_TABLE_NAME',
	replyToAddress: 'SES_REPLY_TO_ADDRESS',
	resumeBucketName: 'RESUME_BUCKET_NAME',
	resumeObjectKey: 'RESUME_OBJECT_KEY',
	senderAddress: 'SES_FROM_ADDRESS',
	stateMachineArn: 'STATE_MACHINE_ARN'
} as const;

// The window is a fixed bucket, so a caller gets `maxRequestsPer*` requests per
// `windowSeconds` and the count resets when the bucket rolls over. The per-IP
// allowance is deliberately higher than the per-email one: several people can
// share one office or coffee-shop NAT, and only the email limit protects a
// recipient from repeat sends.
/** How many resume requests one email address or source IP may make per window. */
export const DEFAULT_RATE_LIMIT_POLICY: RateLimitPolicy = {
	maxRequestsPerEmail: 1,
	maxRequestsPerSourceIp: 5,
	windowSeconds: 86_400
};
