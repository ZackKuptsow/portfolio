// NOT WIRED UP. SMS delivery is deferred until a toll-free or 10DLC origination
// number is registered, without which SNS will not deliver to US numbers. The
// stack does not deploy this handler and the state machine has no SMS branch, so
// it is kept here, still tested, as the starting point for that work.
//
// It is also still shaped for API Gateway (`event.body`), which is how the whole
// pipeline used to be wrong: Step Functions passes raw state JSON. Reshape it
// like `send_email/handler.ts` when wiring it up. Phone validation and E.164
// normalization were removed from the validator in this change; `git show
// 45ff6d0:projects/send_resume/functions/validate_input.ts` has them.

import { APIGatewayProxyHandler } from 'aws-lambda';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const sns = new SNSClient({});

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

		await sns.send(
			new PublishCommand({
				PhoneNumber: body.phone,
				Message: message
			})
		);

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
