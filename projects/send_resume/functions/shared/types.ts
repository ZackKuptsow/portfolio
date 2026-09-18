/**
 * Types shared across the request path.
 *
 * `DeliveryInput` is the contract between the intake Lambda (which starts an
 * execution) and the delivery Lambda (which Step Functions invokes with the raw
 * state JSON). Both sides import it so a change to one fails to compile the other.
 */

/** A validated request for the resume. */
export type ResumeRequest = {
	readonly email: string;
};

/** The state machine's input, and therefore the delivery handler's event. */
export type DeliveryInput = {
	readonly email: string;
	readonly requestId: string;
};

/** What the delivery handler returns when SES has accepted the message. */
export type DeliveryResult = {
	readonly messageId: string;
};

/** How many requests each identifier may make within one window. */
export type RateLimitPolicy = {
	readonly maxRequestsPerEmail: number;
	readonly maxRequestsPerSourceIp: number;
	readonly windowSeconds: number;
};
