import { beforeEach, describe, expect, it, vi } from 'vitest';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../functions/send_email';

const { mockSendEmail } = vi.hoisted(() => ({
	mockSendEmail: vi.fn()
}));

vi.mock('aws-sdk', () => ({
	SES: vi.fn(() => ({
		sendEmail: mockSendEmail
	}))
}));

function makeEvent(body: any): APIGatewayProxyEvent {
	return {
		body: body ? JSON.stringify(body) : null,
		requestContext: { identity: { sourceIp: '1.2.3.4' } } as any
	} as any;
}

describe('send_email handler', () => {
	beforeEach(() => {
		mockSendEmail.mockReset();
		process.env.RESUME_URL = 'https://s3.test/resume.pdf';
		process.env.SES_FROM_ADDRESS = 'noreply@example.com';
	});

	it('returns 500 if env vars missing', async () => {
		delete process.env.RESUME_URL;
		const response = await handler(
			makeEvent({ email: 'test@example.com' })
		);
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).success).toBe(false);
	});

	it('returns 400 if no body', async () => {
		const response = await handler(makeEvent(null));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing body');
	});

	it('returns 400 for invalid JSON', async () => {
		const event = makeEvent({ email: 'test@example.com' });
		event.body = 'invalid-json';
		const response = await handler(event);
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Invalid JSON');
	});

	it('returns 400 if missing email', async () => {
		const response = await handler(makeEvent({}));
		expect(response.statusCode).toBe(400);
		expect(JSON.parse(response.body).reason).toBe('Missing email');
	});

	it('sends email successfully', async () => {
		mockSendEmail.mockReturnValue({ promise: () => Promise.resolve({}) });
		const response = await handler(
			makeEvent({ email: 'test@example.com' })
		);
		expect(response.statusCode).toBe(200);
		expect(JSON.parse(response.body).success).toBe(true);
		expect(mockSendEmail).toHaveBeenCalled();
	});

	it('handles SES error', async () => {
		mockSendEmail.mockReturnValue({
			promise: () => Promise.reject(new Error('SES failure'))
		});
		const response = await handler(
			makeEvent({ email: 'fail@example.com' })
		);
		expect(response.statusCode).toBe(500);
		expect(JSON.parse(response.body).reason).toBe('Failed to send email');
	});
});
