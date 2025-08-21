import { APIGatewayProxyHandler } from 'aws-lambda';
import { SNS } from 'aws-sdk';

const sns = new SNS();

export const handler: APIGatewayProxyHandler = async event => {
	console.log('Send SMS event:', event.body);

	// Validate required environment variables
	const resumeUrl = process.env.RESUME_URL;

	if (!resumeUrl) {
		console.error('Missing required environment variable: RESUME_URL');
		return {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				reason: 'Configuration error'
			})
		};
	}

	if (!event.body) {
		return {
			statusCode: 400,
			body: JSON.stringify({ success: false, reason: 'Missing body' })
		};
	}

	let body: any;
	try {
		body = JSON.parse(event.body);
	} catch {
		return {
			statusCode: 400,
			body: JSON.stringify({ success: false, reason: 'Invalid JSON' })
		};
	}

	if (!body.phone) {
		return {
			statusCode: 400,
			body: JSON.stringify({ success: false, reason: 'Missing phone' })
		};
	}

	try {
		const message = `Hi there 👋 — here's my resume! ${resumeUrl}`;

		// Validate SMS message length (160 character limit)
		if (message.length > 160) {
			console.warn(`SMS message too long: ${message.length} characters`);
			return {
				statusCode: 400,
				body: JSON.stringify({
					success: false,
					reason: 'Message too long for SMS'
				})
			};
		}

		await sns
			.publish({
				PhoneNumber: body.phone,
				Message: message
			})
			.promise();

		return { statusCode: 200, body: JSON.stringify({ success: true }) };
	} catch (err: any) {
		console.error('SNS error:', err);
		return {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				reason: 'Failed to send SMS'
			})
		};
	}
};
