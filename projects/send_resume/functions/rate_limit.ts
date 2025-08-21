import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';

import { DynamoDB } from 'aws-sdk';

export const handler: APIGatewayProxyHandler = async (
	event: APIGatewayProxyEvent
) => {
	const dynamo = new DynamoDB.DocumentClient();
	const RATE_LIMIT_TABLE_NAME = process.env.RATE_LIMIT_TABLE_NAME;
	const TTL_SECONDS = 86400;

	console.log('Rate limit check event:', event.body);
	if (!event.body) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				allowed: false,
				reason: 'Missing request body'
			})
		};
	}

	if (!RATE_LIMIT_TABLE_NAME) {
		throw new Error('RATE_LIMIT_TABLE_NAME not set');
	}

	let body: any;
	try {
		body = JSON.parse(event.body);
	} catch {
		return {
			statusCode: 400,
			body: JSON.stringify({
				allowed: false,
				reason: 'Invalid JSON format'
			})
		};
	}

	const identifiers: string[] = [];
	if (body.email) {
		identifiers.push(`email:${body.email}`);
	}
	if (body.phone) {
		identifiers.push(`phone:${body.phone}`);
	}
	const ip = event.requestContext.identity.sourceIp || 'unknown';
	identifiers.push(`ip:${ip}`);

	// Check all identifiers for existing entries
	for (const id of identifiers) {
		const existing = await dynamo
			.get({
				TableName: RATE_LIMIT_TABLE_NAME,
				Key: { id }
			})
			.promise();

		if (existing.Item) {
			console.log('Rate limit hit for:', id, identifiers);
			return {
				statusCode: 429,
				body: JSON.stringify({
					allowed: false,
					reason: 'Rate limit exceeded'
				})
			};
		}
	}

	// Store identifiers with TTL if rate limit not exceeded
	const expireAt = Math.floor(Date.now() / 1000) + TTL_SECONDS;
	for (const id of identifiers) {
		await dynamo
			.put({
				TableName: RATE_LIMIT_TABLE_NAME,
				Item: { id, expireAt }
			})
			.promise();
	}

	console.log('Rate limit passed for:', identifiers);
	return {
		statusCode: 200,
		body: JSON.stringify({ allowed: true })
	};
};
