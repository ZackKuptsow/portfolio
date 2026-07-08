import {
	APIGatewayProxyEvent,
	APIGatewayProxyResult
} from 'aws-lambda';

import { describe, expect, it } from 'vitest';

import { handler } from '../functions/validate_input';

const makeEvent = (body: object | string): APIGatewayProxyEvent =>
	({
		body: typeof body === 'string' ? body : JSON.stringify(body)
	}) as any;

const invoke = (event: APIGatewayProxyEvent) =>
	handler(event, {} as any, () => {}) as Promise<APIGatewayProxyResult>;

describe('Validate Input Lambda', () => {
	it('should pass with valid email only', async () => {
		const result = await invoke(
			makeEvent({ email: 'test@example.com', phone: '' })
		);
		expect(result.statusCode).toBe(200);

		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(true);
		expect(body.email).toBe('test@example.com');
		expect(body.phone).toBeUndefined();
	});

	it('should pass with valid phone only', async () => {
		const result = await invoke(
			makeEvent({ email: '', phone: '(215) 555-1234' })
		);
		expect(result.statusCode).toBe(200);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(true);
		expect(body.phone).toBe('+12155551234'); // E.164 format
	});

	it('should fail with invalid email', async () => {
		const result = await invoke(makeEvent({ email: 'bad-email', phone: '' }));
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain('Invalid email format');
	});

	it('should fail with invalid phone', async () => {
		const result = await invoke(makeEvent({ email: '', phone: '12345' }));
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
	});

	it('should fail when both fields are missing', async () => {
		const result = await invoke(makeEvent({ email: '', phone: '' }));
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain(
			"At least one 'email' or 'phone' must be provided"
		);
	});

	it('should fail with invalid JSON', async () => {
		const result = await invoke(makeEvent('not-json'));
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain('Invalid JSON format');
	});
});
