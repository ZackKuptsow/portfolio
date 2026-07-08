import { beforeEach, describe, expect, it } from 'vitest';

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult
} from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '../functions/send_email';

const sesMock = mockClient(SESClient);

function makeEvent(body: any): APIGatewayProxyEvent {
	return {
		body: body ? JSON.stringify(body) : null,
		requestContext: { identity: { sourceIp: '1.2.3.4' } } as any
	} as any;
}

// Invoke the handler with the Lambda context/callback the type requires and
// narrow the union return type to the proxy result the handler always produces.
const invoke = (event: APIGatewayProxyEvent) =>
	handler(event, {} as any, () => {}) as Promise<APIGatewayProxyResult>;

describe('send_email handler', () => {
	beforeEach(() => {
		sesMock.reset();
		process.env.RESUME_URL = 'https://s3.test/resume.pdf';
		process.env.SES_FROM_ADDRESS = 'noreply@example.com';
	});

	it('returns 500 if env vars missing', async () => {
		delete process.env.RESUME_URL;
		const response = await invoke(makeEvent({ email: 'test@example.com' }));
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).success).toBe(false);
	});

	it('returns 400 if no body', async () => {
		const response = await invoke(makeEvent(null));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing body');
	});

	it('returns 400 for invalid JSON', async () => {
		const event = makeEvent({ email: 'test@example.com' });
		event.body = 'invalid-json';
		const response = await invoke(event);
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Invalid JSON');
	});

	it('returns 400 if missing email', async () => {
		const response = await invoke(makeEvent({}));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing email');
	});

	it('sends email successfully', async () => {
		sesMock.on(SendEmailCommand).resolves({});
		const response = await invoke(makeEvent({ email: 'test@example.com' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).success).toBe(true);
		expect(sesMock.commandCalls(SendEmailCommand)).toHaveLength(1);
	});

	it('handles SES error', async () => {
		sesMock.on(SendEmailCommand).rejects(new Error('SES failure'));
		const response = await invoke(makeEvent({ email: 'fail@example.com' }));
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).reason).toBe('Failed to send email');
	});
});
