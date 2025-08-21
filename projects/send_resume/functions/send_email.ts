import { APIGatewayProxyHandler } from 'aws-lambda';
import { SES } from 'aws-sdk';

const ses = new SES();

export const handler: APIGatewayProxyHandler = async event => {
	console.log('Send Email event:', event.body);

	// Validate required environment variables
	const resumeUrl = process.env.RESUME_URL;
	const fromAddress = process.env.SES_FROM_ADDRESS;

	if (!resumeUrl || !fromAddress) {
		console.error('Missing required environment variables');
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

	if (!body.email) {
		return {
			statusCode: 400,
			body: JSON.stringify({ success: false, reason: 'Missing email' })
		};
	}

	try {
		await ses
			.sendEmail({
				Destination: { ToAddresses: [body.email] },
				Message: {
					Subject: { Data: 'Resume from Zack Kuptsow' },
					Body: {
						Text: {
							Data: `Hi there 👋 — here's my resume!\n${resumeUrl}`
						},
						Html: {
							Data: `<p>Hi there 👋 — here's my resume!</p><p><a href="${resumeUrl}">Download Resume PDF</a></p>`
						}
					}
				},
				Source: fromAddress
			})
			.promise();

		return { statusCode: 200, body: JSON.stringify({ success: true }) };
	} catch (err: any) {
		console.error('SES error', err);
		return {
			statusCode: 500,
			body: JSON.stringify({
				success: false,
				reason: 'Failed to send email'
			})
		};
	}
};
