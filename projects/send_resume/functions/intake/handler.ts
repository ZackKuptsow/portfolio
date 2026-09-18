import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { SFNClient, StartExecutionCommand } from '@aws-sdk/client-sfn';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type {
	APIGatewayProxyEventV2,
	APIGatewayProxyHandlerV2,
	APIGatewayProxyStructuredResultV2
} from 'aws-lambda';

import {
	DEFAULT_RATE_LIMIT_POLICY,
	ENVIRONMENT_VARIABLE
} from '../shared/constants';
import { readRequiredEnvironmentVariable } from '../shared/environment';
import { RateLimitExceededError, ValidationError } from '../shared/errors';
import type { DeliveryInput } from '../shared/types';
import { claimRequestSlot } from './rate_limit';
import { parseResumeRequest } from './validate_request';

const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const stepFunctions = new SFNClient({});

const jsonResponse = (
	statusCode: number,
	payload: Record<string, unknown>
): APIGatewayProxyStructuredResultV2 => ({
	statusCode,
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(payload)
});

const readRequestPayload = (event: APIGatewayProxyEventV2): unknown => {
	if (!event.body) {
		throw new ValidationError(['Missing request body']);
	}

	const body = event.isBase64Encoded
		? Buffer.from(event.body, 'base64').toString('utf8')
		: event.body;

	try {
		return JSON.parse(body);
	} catch {
		throw new ValidationError(['Body is not valid JSON']);
	}
};

/**
 * Entry point for `POST /resume-requests`.
 *
 * Owns everything the caller waits on: validation, rate limiting, and starting
 * the delivery execution. Delivery itself runs asynchronously in Step Functions,
 * so a 202 means the request was accepted, not that the mail has been sent.
 *
 * CORS headers are added by the HTTP API itself, so they are deliberately absent
 * here — see `corsPreflight` on the API in `lib/send_resume-stack.ts`.
 */
export const handler: APIGatewayProxyHandlerV2 = async event => {
	const { requestId } = event.requestContext;

	try {
		const tableName = readRequiredEnvironmentVariable(
			ENVIRONMENT_VARIABLE.rateLimitTableName
		);
		const stateMachineArn = readRequiredEnvironmentVariable(
			ENVIRONMENT_VARIABLE.stateMachineArn
		);
		const request = parseResumeRequest(readRequestPayload(event));

		await claimRequestSlot({
			documentClient,
			email: request.email,
			now: new Date(),
			policy: DEFAULT_RATE_LIMIT_POLICY,
			sourceIp: event.requestContext.http.sourceIp,
			tableName
		});

		const deliveryInput: DeliveryInput = { email: request.email, requestId };
		await stepFunctions.send(
			new StartExecutionCommand({
				stateMachineArn,
				// The API's own request id makes a retried request reuse the
				// execution name, which Step Functions rejects as a duplicate
				// rather than sending the resume twice.
				name: requestId,
				input: JSON.stringify(deliveryInput)
			})
		);

		return jsonResponse(202, { requestId });
	} catch (error) {
		if (error instanceof ValidationError) {
			return jsonResponse(400, {
				message: 'Invalid request',
				issues: error.issues
			});
		}

		if (error instanceof RateLimitExceededError) {
			return jsonResponse(429, { message: 'Rate limit exceeded' });
		}

		console.error('Resume request failed', { requestId, error });
		return jsonResponse(500, { message: 'Internal server error' });
	}
};
