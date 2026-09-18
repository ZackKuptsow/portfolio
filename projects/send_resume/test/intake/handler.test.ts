import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DynamoDBDocumentClient, TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { TransactionCanceledException } from '@aws-sdk/client-dynamodb';
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyStructuredResultV2
} from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '../../functions/intake/handler';

const dynamoMock = mockClient(DynamoDBDocumentClient);
const stepFunctionsMock = mockClient(SFNClient);

const STATE_MACHINE_ARN =
	'arn:aws:states:us-east-1:123456789012:stateMachine:SendResume';
const REQUEST_ID = 'abcd-1234';

const makeEvent = (
	body: string | null,
	overrides: Partial<APIGatewayProxyEventV2> = {}
): APIGatewayProxyEventV2 =>
	({
		body,
		isBase64Encoded: false,
		requestContext: {
			http: { method: 'POST', sourceIp: '1.2.3.4' },
			requestId: REQUEST_ID
		},
		...overrides
	}) as APIGatewayProxyEventV2;

const invoke = async (
	event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> =>
	(await handler(
		event,
		{} as never,
		() => {}
	)) as APIGatewayProxyStructuredResultV2;

const bodyOf = (response: APIGatewayProxyStructuredResultV2) =>
	JSON.parse(response.body ?? '{}');

describe('intake handler', () => {
	// The 500 paths log deliberately; capturing the spy keeps the suite output
	// clean and lets one test assert the failure is actually recorded.
	let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		consoleErrorSpy = vi
			.spyOn(console, 'error')
			.mockImplementation(() => {});
		dynamoMock.reset();
		stepFunctionsMock.reset();
		dynamoMock.on(TransactWriteCommand).resolves({});
		stepFunctionsMock.on(StartExecutionCommand).resolves({
			executionArn: 'arn:aws:states:us-east-1:123456789012:execution:x'
		});
		vi.stubEnv('RATE_LIMIT_TABLE_NAME', 'TestRateLimitTable');
		vi.stubEnv('STATE_MACHINE_ARN', STATE_MACHINE_ARN);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.restoreAllMocks();
	});

	it('accepts a valid request with 202', async () => {
		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'test@example.com' }))
		);

		expect(response.statusCode).toBe(202);
		expect(bodyOf(response).requestId).toBe(REQUEST_ID);
	});

	it('starts the delivery execution with the validated email', async () => {
		await invoke(makeEvent(JSON.stringify({ email: ' test@example.com ' })));

		const calls = stepFunctionsMock.commandCalls(StartExecutionCommand);
		expect(calls).toHaveLength(1);
		expect(calls[0].args[0].input).toEqual({
			stateMachineArn: STATE_MACHINE_ARN,
			name: REQUEST_ID,
			input: JSON.stringify({
				email: 'test@example.com',
				requestId: REQUEST_ID
			})
		});
	});

	it('reads a base64-encoded body', async () => {
		const response = await invoke(
			makeEvent(
				Buffer.from(JSON.stringify({ email: 'test@example.com' })).toString(
					'base64'
				),
				{ isBase64Encoded: true }
			)
		);

		expect(response.statusCode).toBe(202);
	});

	it('rejects a malformed email with 400 and the reason', async () => {
		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'bad-email' }))
		);

		expect(response.statusCode).toBe(400);
		expect(bodyOf(response).issues).toContain('email: Invalid email format');
		expect(stepFunctionsMock.commandCalls(StartExecutionCommand)).toHaveLength(
			0
		);
	});

	it('rejects a body that is not JSON with 400', async () => {
		const response = await invoke(makeEvent('not-json'));

		expect(response.statusCode).toBe(400);
		expect(stepFunctionsMock.commandCalls(StartExecutionCommand)).toHaveLength(
			0
		);
	});

	it('rejects a missing body with 400', async () => {
		const response = await invoke(makeEvent(null));

		expect(response.statusCode).toBe(400);
	});

	it('returns 429 and starts nothing once the caller is over the limit', async () => {
		dynamoMock.on(TransactWriteCommand).rejects(
			new TransactionCanceledException({
				$metadata: {},
				message: 'Transaction cancelled',
				CancellationReasons: [{ Code: 'ConditionalCheckFailed' }]
			})
		);

		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'test@example.com' }))
		);

		expect(response.statusCode).toBe(429);
		expect(stepFunctionsMock.commandCalls(StartExecutionCommand)).toHaveLength(
			0
		);
	});

	it('returns 500 without starting an execution when the state machine is not configured', async () => {
		vi.stubEnv('STATE_MACHINE_ARN', '');

		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'test@example.com' }))
		);

		expect(response.statusCode).toBe(500);
		expect(stepFunctionsMock.commandCalls(StartExecutionCommand)).toHaveLength(
			0
		);
	});

	it('returns 500 when DynamoDB fails rather than sending anyway', async () => {
		dynamoMock
			.on(TransactWriteCommand)
			.rejects(new Error('DynamoDB unavailable'));

		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'test@example.com' }))
		);

		expect(response.statusCode).toBe(500);
		expect(stepFunctionsMock.commandCalls(StartExecutionCommand)).toHaveLength(
			0
		);
		expect(consoleErrorSpy).toHaveBeenCalledOnce();
	});

	it('does not leak internal failure detail to the caller', async () => {
		dynamoMock
			.on(TransactWriteCommand)
			.rejects(new Error('DynamoDB unavailable'));

		const response = await invoke(
			makeEvent(JSON.stringify({ email: 'test@example.com' }))
		);

		expect(response.body).not.toContain('DynamoDB unavailable');
	});
});
