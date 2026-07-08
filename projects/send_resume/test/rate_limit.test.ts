import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi
} from 'vitest';

import {
	DynamoDBDocumentClient,
	GetCommand,
	PutCommand
} from '@aws-sdk/lib-dynamodb';
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult
} from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '../functions/rate_limit';

const ddbMock = mockClient(DynamoDBDocumentClient);

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
			requestTimeEpoch: 0,
			resourceId: 'res',
			resourcePath: '/'
		}
	} as any;
}

const invoke = (event: APIGatewayProxyEvent) =>
	handler(event, {} as any, () => {}) as Promise<APIGatewayProxyResult>;

describe('rate_limit handler', () => {
	beforeEach(() => {
		ddbMock.reset();
	});

	beforeAll(() => {
		vi.stubEnv('RATE_LIMIT_TABLE_NAME', 'TestTable');
	});

	afterAll(() => {
		vi.unstubAllEnvs();
	});

	it('returns 400 if no body', async () => {
		const response = await invoke(makeEvent(null));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).allowed).toBe(false);
	});

	it('returns 429 if identifier already exists', async () => {
		ddbMock.on(GetCommand).resolvesOnce({
			Item: { id: 'email:test@test.com' }
		});
		const response = await invoke(makeEvent({ email: 'test@test.com' }));
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
	});

	it('returns 200 and stores identifiers if not found', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const response = await invoke(makeEvent({ email: 'new@test.com' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Ensures we attempted to put at least once
		expect(ddbMock.commandCalls(PutCommand).length).toBeGreaterThan(0);
	});

	it('returns 400 for invalid JSON', async () => {
		const event = makeEvent({ email: 'test@test.com' });
		event.body = 'invalid-json';

		const response = await invoke(event);
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Invalid JSON format');
	});

	it('handles email-only requests', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const response = await invoke(makeEvent({ email: 'test@example.com' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check email and IP identifiers (2 calls)
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(2);
		// Should store email and IP identifiers (2 calls)
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
	});

	it('handles phone-only requests', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const response = await invoke(makeEvent({ phone: '+12155551234' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check phone and IP identifiers (2 calls)
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(2);
		// Should store phone and IP identifiers (2 calls)
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
	});

	it('handles both email and phone requests', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const response = await invoke(
			makeEvent({
				email: 'test@example.com',
				phone: '+12155551234'
			})
		);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should check email, phone, and IP identifiers (3 calls)
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(3);
		// Should store email, phone, and IP identifiers (3 calls)
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(3);
	});

	it('blocks on IP rate limit even with valid email', async () => {
		ddbMock
			.on(GetCommand)
			.resolvesOnce({}) // email check passes
			.resolvesOnce({ Item: { id: 'ip:1.2.3.4' } }); // IP check fails

		const response = await invoke(makeEvent({ email: 'test@example.com' }));
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Rate limit exceeded');

		// Should not store anything when rate limited
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
	});

	it('blocks on phone rate limit', async () => {
		ddbMock.on(GetCommand).resolvesOnce({
			Item: { id: 'phone:+12155551234' }
		});

		const response = await invoke(makeEvent({ phone: '+12155551234' }));
		expect(response.statusCode).toBe(429);
		expect(JSON.parse(response.body).allowed).toBe(false);
		expect(JSON.parse(response.body).reason).toBe('Rate limit exceeded');

		// Should only check the phone identifier before blocking
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(0);
	});

	it('handles unknown IP address', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const event = makeEvent({ email: 'test@example.com' });
		event.requestContext.identity.sourceIp = undefined as any;

		const response = await invoke(event);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should still check and store with 'unknown' IP
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(2);
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(2);
	});

	it('handles empty request body with just IP tracking', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const response = await invoke(makeEvent({}));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).allowed).toBe(true);

		// Should only check IP identifier (1 call)
		expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
		// Should only store IP identifier (1 call)
		expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
	});

	it('sets proper TTL when storing identifiers', async () => {
		ddbMock.on(GetCommand).resolves({});
		ddbMock.on(PutCommand).resolves({});

		const fixedNow = new Date('2024-01-01T00:00:00Z').getTime();
		const dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

		const response = await invoke(makeEvent({ email: 'test@example.com' }));
		expect(response.statusCode).toBe(200);

		const expectedExpireAt = Math.floor(fixedNow / 1000) + 86400; // 24 hours

		// Check that put was called with proper TTL for the email identifier
		const emailPut = ddbMock
			.commandCalls(PutCommand)
			.find(
				call => call.args[0].input.Item?.id === 'email:test@example.com'
			);
		expect(emailPut).toBeDefined();
		expect(emailPut!.args[0].input).toEqual({
			TableName: 'TestTable',
			Item: { id: 'email:test@example.com', expireAt: expectedExpireAt }
		});

		dateNowSpy.mockRestore();
	});

	it('propagates DynamoDB errors', async () => {
		ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

		await expect(
			invoke(makeEvent({ email: 'test@example.com' }))
		).rejects.toThrow('DynamoDB error');
	});
});
