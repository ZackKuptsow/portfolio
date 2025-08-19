import { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from '../functions/validate_input';

const makeEvent = (body: object | string): APIGatewayProxyEvent => ({
	body: typeof body === 'string' ? body : JSON.stringify(body)
});

describe('Validate Input Lambda', () => {
	it('should pass with valid email only', async () => {
		const result = await handler(
			makeEvent({ email: 'test@example.com', phone: '' }),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(200);

		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(true);
		expect(body.email).toBe('test@example.com');
		expect(body.phone).toBeUndefined();
	});

	it('should pass with valid phone only', async () => {
		const result = await handler(
			makeEvent({ email: '', phone: '(215) 555-1234' }),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(200);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(true);
		expect(body.phone).toBe('+12155551234'); // E.164 format
	});

	it('should fail with invalid email', async () => {
		const result = await handler(
			makeEvent({ email: 'bad-email', phone: '' }),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain('Invalid email format');
	});

	it('should fail with invalid phone', async () => {
		const result = await handler(
			makeEvent({ email: '', phone: '12345' }),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
	});

	it('should fail when both fields are missing', async () => {
		const result = await handler(
			makeEvent({ email: '', phone: '' }),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain(
			"At least one 'email' or 'phone' must be provided"
		);
	});

	it('should fail with invalid JSON', async () => {
		const result = await handler(
			makeEvent('not-json'),
			{} as any,
			() => {}
		);
		expect(result.statusCode).toBe(400);
		const body = JSON.parse(result.body);
		expect(body.isValid).toBe(false);
		expect(body.errors).toContain('Invalid JSON format');
	});
});
