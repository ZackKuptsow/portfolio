import { z } from 'zod';

import { ValidationError } from '../shared/errors';
import type { ResumeRequest } from '../shared/types';

// Phone handling lived here until SMS delivery was deferred; `git log` has it
// (commit 45ff6d0) for whenever `functions/send_sms.ts` gets wired up.
const resumeRequestSchema = z.object({
	email: z.string().trim().pipe(z.email('Invalid email format'))
});

const describeIssue = (issue: z.core.$ZodIssue): string =>
	issue.path.length > 0
		? `${issue.path.join('.')}: ${issue.message}`
		: issue.message;

/**
 * Validates an untrusted request payload.
 *
 * @throws ValidationError when the payload does not describe a resume request.
 */
export const parseResumeRequest = (input: unknown): ResumeRequest => {
	const result = resumeRequestSchema.safeParse(input);

	if (!result.success) {
		throw new ValidationError(result.error.issues.map(describeIssue));
	}

	return { email: result.data.email };
};
