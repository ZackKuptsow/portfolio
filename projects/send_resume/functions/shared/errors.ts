/**
 * Errors shared by the intake and delivery handlers.
 *
 * Delivery handlers run as Step Functions tasks, where a task only fails if the
 * handler throws — a returned error-shaped object is treated as a successful
 * result. Every failure path therefore raises one of these instead of returning.
 * The class name is what Step Functions matches in `ErrorEquals`, so renaming one
 * of these changes the state machine contract.
 */

/** A request that failed schema validation. Maps to HTTP 400. */
export class ValidationError extends Error {
	readonly issues: readonly string[];

	constructor(issues: readonly string[]) {
		super(`Invalid request: ${issues.join('; ')}`);
		this.name = 'ValidationError';
		this.issues = issues;
	}
}

/** A request rejected because an identifier exhausted its quota. Maps to HTTP 429. */
export class RateLimitExceededError extends Error {
	constructor() {
		super('Rate limit exceeded');
		this.name = 'RateLimitExceededError';
	}
}

/** A required environment variable is missing or empty. Maps to HTTP 500. */
export class ConfigurationError extends Error {
	constructor(variableName: string) {
		super(`Missing required environment variable: ${variableName}`);
		this.name = 'ConfigurationError';
	}
}
