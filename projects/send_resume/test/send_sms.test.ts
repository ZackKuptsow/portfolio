import { beforeEach, describe, expect, it } from 'vitest';

import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult
} from 'aws-lambda';
import { mockClient } from 'aws-sdk-client-mock';

import { handler } from '../functions/send_sms';

const snsMock = mockClient(SNSClient);

function makeEvent(body: any): APIGatewayProxyEvent {
	return {
		body: body ? JSON.stringify(body) : null,
		requestContext: { identity: { sourceIp: '1.2.3.4' } } as any
	} as any;
}

const invoke = (event: APIGatewayProxyEvent) =>
	handler(event, {} as any, () => {}) as Promise<APIGatewayProxyResult>;

describe('send_sms handler', () => {
	beforeEach(() => {
		snsMock.reset();
		process.env.RESUME_URL = 'https://s3.test/resume.pdf';
	});

	it('returns 500 if env var missing', async () => {
		delete process.env.RESUME_URL;
		const response = await invoke(makeEvent({ phone: '+15555550123' }));
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).success).toBe(false);
	});

	it('returns 400 if no body', async () => {
		const response = await invoke(makeEvent(null));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing body');
	});

	it('returns 400 for invalid JSON', async () => {
		const event = makeEvent({ phone: '+15555550123' });
		event.body = 'invalid-json';
		const response = await invoke(event);
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Invalid JSON');
	});

	it('returns 400 if missing phone', async () => {
		const response = await invoke(makeEvent({}));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing phone');
	});

	it('returns 400 if SMS message too long', async () => {
		process.env.RESUME_URL = 'x'.repeat(200); // force >160 chars
		const response = await invoke(makeEvent({ phone: '+15555550123' }));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe(
			'Message too long for SMS'
		);
	});

	it('sends SMS successfully', async () => {
		snsMock.on(PublishCommand).resolves({});
		const response = await invoke(makeEvent({ phone: '+15555550123' }));
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).success).toBe(true);
		expect(snsMock.commandCalls(PublishCommand)).toHaveLength(1);
	});

	it('handles SNS error', async () => {
		snsMock.on(PublishCommand).rejects(new Error('SNS failure'));
		const response = await invoke(makeEvent({ phone: '+15555550123' }));
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).reason).toBe('Failed to send SMS');
	});
});
