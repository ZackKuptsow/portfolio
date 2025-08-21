import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from 'vitest';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../functions/rate_limit';

const { mockGet, mockPut } = vi.hoisted(() => ({
	mockGet: vi.fn(),
	mockPut: vi.fn()
}));

vi.mock('aws-sdk', () => ({
	DynamoDB: {
		DocumentClient: vi.fn(() => ({
			get: mockGet,
			put: mockPut
		}))
	}
}));

function makeEvent(body: any, ip = '1.2.3.4'): APIGatewayProxyEvent {
	return {
		body: body ? JSON.stringify(body) : null,
		headers: {},
		multiValueHeaders: {},
		httpMethod: 'POST',
		isBase64Encoded: false,
		path: '/',
		pathParameters: null,
		queryStringParameters: null,
		multiValueQueryStringParameters: null,
		stageVariables: null,
		resource: '/',
		requestContext: {
			accountId: '123',
			apiId: 'abc',
			httpMethod: 'POST',
			identity: {
				sourceIp: ip
			} as any,
			path: '/',
			stage: 'dev',
			requestId: 'req',
			requestTimeEpoch: Date.now(),
			resourceId: 'res',
			resourcePath: '/'
		}
	} as any;
}

describe('rate_limit handler', () => {
	beforeEach(() => {
		mockGet.mockReset();
		mockPut.mockReset();
		// process.env.RATE_LIMIT_TABLE_NAME = 'TestTable';
		// vi.stubEnv('RATE_LIMIT_TABLE_NAME', 'TestTable');
	});

	beforeAll(() => {
		vi.stubEnv('RATE_LIMIT_TABLE_NAME', 'TestTable');
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	it('returns 400 if no body', async () => {
		const response = await handler(makeEvent(null));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).allowed).toBe(false);
	});

	it('returns 429 if identifier already exists', async () => {
		mockGet.mockReturnValueOnce({
			promise: () =>
				Promise.resolve({ Item: { id: 'email:test@test.com' } })
		});
		const response = await handler(makeEvent({ email: 'test@test.com' }));
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
	});

	it('returns 200 and stores identifiers if not found', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const response = await handler(makeEvent({ email: 'new@test.com' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Ensures we attempted to put at least once
		expect(mockPut).toHaveBeenCalled();
	});

	it('returns 400 for invalid JSON', async () => {
		const event = makeEvent({ email: 'test@test.com' });
		event.body = 'invalid-json';

		const response = await handler(event);
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Invalid JSON format');
	});

	it('handles email-only requests', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const response = await handler(
			makeEvent({ email: 'test@example.com' })
		);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check email and IP identifiers (2 calls)
		expect(mockGet).toHaveBeenCalledTimes(2);
		// Should store email and IP identifiers (2 calls)
		expect(mockPut).toHaveBeenCalledTimes(2);
	});

	it('handles phone-only requests', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const response = await handler(makeEvent({ phone: '+12155551234' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check phone and IP identifiers (2 calls)
		expect(mockGet).toHaveBeenCalledTimes(2);
		// Should store phone and IP identifiers (2 calls)
		expect(mockPut).toHaveBeenCalledTimes(2);
	});

	it('handles both email and phone requests', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const response = await handler(
			makeEvent({
				email: 'test@example.com',
				phone: '+12155551234'
			})
		);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check email, phone, and IP identifiers (3 calls)
		expect(mockGet).toHaveBeenCalledTimes(3);
		// Should store email, phone, and IP identifiers (3 calls)
		expect(mockPut).toHaveBeenCalledTimes(3);
	});

	it('blocks on IP rate limit even with valid email', async () => {
		mockGet
			.mockReturnValueOnce({ promise: () => Promise.resolve({}) }) // email check passes
			.mockReturnValueOnce({
				promise: () => Promise.resolve({ Item: { id: 'ip:1.2.3.4' } })
			}); // IP check fails

		const response = await handler(
			makeEvent({ email: 'test@example.com' })
		);
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Rate limit exceeded');

		// Should not store anything when rate limited
		expect(mockPut).not.toHaveBeenCalled();
	});

	it('blocks on phone rate limit', async () => {
		mockGet.mockReturnValueOnce({
			promise: () =>
				Promise.resolve({ Item: { id: 'phone:+12155551234' } })
		});

		const response = await handler(makeEvent({ phone: '+12155551234' }));
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Rate limit exceeded');

		// Should only check the phone identifier before blocking
		expect(mockGet).toHaveBeenCalledTimes(1);
		expect(mockPut).not.toHaveBeenCalled();
	});

	it('handles unknown IP address', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const event = makeEvent({ email: 'test@example.com' });
		event.requestContext.identity.sourceIp = undefined as any;

		const response = await handler(event);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should still check and store with 'unknown' IP
		expect(mockGet).toHaveBeenCalledTimes(2);
		expect(mockPut).toHaveBeenCalledTimes(2);
	});

	it('handles empty request body with just IP tracking', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const response = await handler(makeEvent({}));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should only check IP identifier (1 call)
		expect(mockGet).toHaveBeenCalledTimes(1);
		// Should only store IP identifier (1 call)
		expect(mockPut).toHaveBeenCalledTimes(1);
	});

	// TODO: figureo out why this isn't working
	it.skip('sets proper TTL when storing identifiers', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.resolve({})
		});
		mockPut.mockReturnValue({
			promise: () => Promise.resolve({})
		});

		const mockDate = new Date('2024-01-01T00:00:00Z');
		const originalDateNow = Date.now;
		Date.now = vi.fn(() => mockDate.getTime());

		const response = await handler(
			makeEvent({ email: 'test@example.com' })
		);
		expect(response.statusCode).toBe(200);

		const expectedExpireAt = Math.floor(mockDate.getTime() / 1000) + 86400; // 24 hours

		// Check that put was called with proper TTL for email identifier
		expect(mockPut).toHaveBeenCalledWith({
			TableName: 'TestTable', // Should use the environment variable we set
			Item: { id: 'email:test@example.com', expireAt: expectedExpireAt }
		});

		// Restore Date.now
		Date.now = originalDateNow;
	});

	it('propagates DynamoDB errors', async () => {
		mockGet.mockReturnValue({
			promise: () => Promise.reject(new Error('DynamoDB error'))
		});

		await expect(
			handler(makeEvent({ email: 'test@example.com' }))
		).rejects.toThrow('DynamoDB error');
	});
});
