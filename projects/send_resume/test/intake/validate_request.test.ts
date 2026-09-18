import { describe, expect, it } from 'vitest';

import { parseResumeRequest } from '../../functions/intake/validate_request';
import { ValidationError } from '../../functions/shared/errors';

describe('parseResumeRequest', () => {
	it('returns the email from a valid request', () => {
		expect(parseResumeRequest({ email: 'test@example.com' })).toEqual({
			email: 'test@example.com'
		});
	});

	it('trims surrounding whitespace from the email', () => {
		expect(parseResumeRequest({ email: '  test@example.com  ' })).toEqual({
			email: 'test@example.com'
		});
	});

	it('rejects a malformed email', () => {
		expect(() => parseResumeRequest({ email: 'bad-email' })).toThrow(
			ValidationError
		);
	});

	it('rejects an empty email', () => {
		expect(() => parseResumeRequest({ email: '' })).toThrow(ValidationError);
	});

	it('rejects a missing email', () => {
		expect(() => parseResumeRequest({})).toThrow(ValidationError);
	});

	it('rejects a payload that is not an object', () => {
		expect(() => parseResumeRequest('test@example.com')).toThrow(
			ValidationError
		);
	});

	it('reports every validation issue on the error', () => {
		try {
			parseResumeRequest({ email: 'bad-email' });
			expect.unreachable('parseResumeRequest should have thrown');
		} catch (error) {
			expect(error).toBeInstanceOf(ValidationError);
			expect((error as ValidationError).issues).toHaveLength(1);
			expect((error as ValidationError).issues[0]).toMatch(/email/i);
		}
	});

	it('ignores fields it does not know about', () => {
		expect(
			parseResumeRequest({
				email: 'test@example.com',
				phone: '(215) 555-1234'
			})
		).toEqual({ email: 'test@example.com' });
	});
});
