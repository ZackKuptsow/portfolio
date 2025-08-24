import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { StepFunctions } from 'aws-sdk';

import {
	beforeAll,
	describe,
	expect,
	it
} from 'vitest';

import { SendResumeStack } from '../lib/send_resume-stack';

describe('SendResumeStack', () => {
	it('creates a Step Function with Validate, RateLimit, Email, and SMS steps', () => {
		const app = new cdk.App();
		const stack = new SendResumeStack(app, 'TestStack');
		const template = Template.fromStack(stack);

		// Confirm a state machine exists
		template.hasResourceProperties('AWS::StepFunctions::StateMachine', {});

		// Get the template as JSON to verify step names are present
		const templateJson = JSON.stringify(template.toJSON());

		// Verify all required steps are present in the definition
		expect(templateJson).toContain('Validate Input');
		expect(templateJson).toContain('Rate Limit Check');
		expect(templateJson).toContain('Send Email');
		expect(templateJson).toContain('Send SMS');
		expect(templateJson).toContain('Send Notifications');
		expect(templateJson).toContain('Has Email?');
		expect(templateJson).toContain('Has Phone?');
	});

	it('creates a DynamoDB table with TTL and PAY_PER_REQUEST', () => {
		const app = new cdk.App();
		const stack = new SendResumeStack(app, 'TestStack');
		const template = Template.fromStack(stack);

		template.hasResourceProperties('AWS::DynamoDB::Table', {
			BillingMode: 'PAY_PER_REQUEST',
			TimeToLiveSpecification: {
				AttributeName: 'ttl',
				Enabled: true
			}
		});
	});
});

// LocalStack Integration Tests
// To run these tests:
// 1. Start LocalStack: docker run --rm -it -p 4566:4566 localstack/localstack
// 2. Deploy the stack to LocalStack: cdk deploy --app "cdk.out" SendResumeStack
// 3. Set environment variable: export STATE_MACHINE_ARN=arn:aws:states:us-east-1:000000000000:stateMachine:YourStateMachine
// 4. Run tests: yarn test

const stepFunctions = new StepFunctions({
	endpoint: 'http://localhost:4566', // LocalStack
	region: 'us-east-1'
});

// Only run LocalStack integration tests if environment is configured
describe.skipIf(!process.env.STATE_MACHINE_ARN)('SendResumeStateMachine (LocalStack)', () => {
	let stateMachineArn: string;

	beforeAll(async () => {
		// Get the state machine ARN from environment
		stateMachineArn = process.env.STATE_MACHINE_ARN!;
		if (!stateMachineArn) {
			throw new Error('Missing STATE_MACHINE_ARN env variable');
		}

		// Test LocalStack connectivity
		try {
			await stepFunctions.listStateMachines({}).promise();
		} catch (error) {
			throw new Error('Failed to connect to LocalStack Step Functions. Make sure LocalStack is running on localhost:4566');
		}
	});

	it('executes successfully when both email and phone are provided', async () => {
		const input = {
			email: 'test@example.com',
			phone: '+12155551234',
			sendEmail: true,
			sendSms: true
		};

		const start = await stepFunctions
			.startExecution({
				stateMachineArn,
				input: JSON.stringify(input)
			})
			.promise();

		expect(start.executionArn).toBeDefined();

		// Poll for completion with timeout
		let result;
		let attempts = 0;
		const maxAttempts = 30; // 30 seconds max
		
		do {
			await new Promise(res => setTimeout(res, 1000));
			result = await stepFunctions
				.describeExecution({
					executionArn: start.executionArn!
				})
				.promise();
			attempts++;
		} while (result.status === 'RUNNING' && attempts < maxAttempts);

		if (attempts >= maxAttempts) {
			throw new Error('Step Function execution timed out after 30 seconds');
		}

		expect(result.status).toBe('SUCCEEDED');
		
		// Parse and verify the output
		if (result.output) {
			const output = JSON.parse(result.output);
			expect(output).toBeDefined();
			// The output should be an array from the parallel step
			expect(Array.isArray(output)).toBe(true);
		}
	}, 35000); // 35 second timeout for this test

	it('executes successfully with email only', async () => {
		const input = {
			email: 'test@example.com',
			sendEmail: true,
			sendSms: false
		};

		const start = await stepFunctions
			.startExecution({
				stateMachineArn,
				input: JSON.stringify(input)
			})
			.promise();

		expect(start.executionArn).toBeDefined();

		// Poll for completion
		let result;
		let attempts = 0;
		const maxAttempts = 30;
		
		do {
			await new Promise(res => setTimeout(res, 1000));
			result = await stepFunctions
				.describeExecution({
					executionArn: start.executionArn!
				})
				.promise();
			attempts++;
		} while (result.status === 'RUNNING' && attempts < maxAttempts);

		expect(result.status).toBe('SUCCEEDED');
	}, 35000);
});
