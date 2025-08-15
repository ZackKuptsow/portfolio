import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';

import { z } from 'zod';

// Normalize phone numbers to E.164 format
// (Twilio and most SMS services require this format)
const normalizePhone = (phone: string) => {
	// Remove all non-digit characters
	const digits = phone.replace(/\D/g, '');

	// If no country code, assume US (+1)
	if (digits.length === 10) {
		return `+1${digits}`;
	}

	// If already has country code, ensure it starts with "+"
	if (!digits.startsWith('+')) {
		return `+${digits}`;
	}

	return digits;
};

const ValidationInputSchema = z
	.object({
		email: z
			.string()
			.trim()
			.email('Invalid email format')
			.optional()
			.or(z.literal('').transform(() => undefined)), // Treat empty as undefined
		phone: z
			.string()
			.trim()
			.regex(/^[\d\+\-\s\(\)\.]{7,20}$/, 'Invalid phone number format') // loose check
			.optional()
			.or(z.literal('').transform(() => undefined)) // Treat empty as undefined
	})
	.refine(
		(data: Record<string, string>) => data.email || data.phone,
		"At least one 'email' or 'phone' must be provided"
	)
	.transform((data: Record<string, string>) => {
		const transformed: { email?: string; phone?: string } = {};
		if (data.email) {
			transformed.email = data.email;
		}
		if (data.phone) {
			const normalized = normalizePhone(data.phone);
			// Final strict validation of E.164
			if (!/^\+[1-9]\d{1,14}$/.test(normalized)) {
				throw new Error(
					'Invalid phone number format after normalization'
				);
			}
			transformed.phone = normalized;
		}
		return transformed;
	});

export const handler: APIGatewayProxyHandler = async (
	event: APIGatewayProxyEvent
) => {
	console.log('Validation Lambda triggered event:', event.body);

	if (!event.body) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				isValid: false,
				errors: ['Missing request body']
			})
		};
	}

	let parsedBody: unknown;
	try {
		parsedBody = JSON.parse(event.body);
	} catch {
		return {
			statusCode: 400,
			body: JSON.stringify({
				isValid: false,
				errors: ['Invalid JSON format']
			})
		};
	}

	const parsedResult = ValidationInputSchema.safeParse(parsedBody);
	if (!parsedResult.success) {
		console.warn(
			'Validation failed:',
			parsedResult.error.issues.map(
				(issue: Record<string, string>) => issue.message
			)
		);
		return {
			statusCode: 400,
			body: JSON.stringify({
				isValid: false,
				errors: parsedResult.error.issues.map(
					(issue: Record<string, string>) => issue.message
				)
			})
		};
	}

	console.log('Validation passed:', parsedResult.data);
	return {
		statusCode: 200,
		body: JSON.stringify({
			isValid: true,
			...parsedResult.data
		})
	};
};
