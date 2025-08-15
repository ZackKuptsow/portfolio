import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { Construct } from 'constructs';

export class SendResumeStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		// DynamoDB table
		const requestsTable = new dynamodb.Table(this, 'RequestsTable', {
			partitionKey: {
				name: 'requestId',
				type: dynamodb.AttributeType.STRING
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			timeToLiveAttribute: 'ttl',
			removalPolicy: cdk.RemovalPolicy.RETAIN
		});

		// Helper to create Lambda
		const createLambda = (name: string) =>
			new lambda.Function(this, `${name}Lambda`, {
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: 'index.handler',
				code: lambda.Code.fromAsset(`functions/${name}`),
				environment: {
					TABLE_NAME: requestsTable.tableName
				}
			});

		// Instantiate Lambdas
		const validateInputLambda = createLambda('validate_input');
		const rateLimitLambda = createLambda('rate_limit');
		const sendEmailLambda = createLambda('send_email');
		const sendSmsLambda = createLambda('send_sms');

		// Grant permissions
		requestsTable.grantReadWriteData(validateInputLambda);
		requestsTable.grantReadWriteData(rateLimitLambda);
		requestsTable.grantReadWriteData(sendEmailLambda);
		requestsTable.grantReadWriteData(sendSmsLambda);

		// Add IAM Policies
		sendEmailLambda.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ['ses:SendEmail', 'ses:SendRawEmail'],
				resources: ['*']
			})
		);
		sendSmsLambda.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ['sns:Publish'],
				resources: ['*']
			})
		);

		// Step Functions tasks
		const validateStep = new tasks.LambdaInvoke(this, 'Validate Input', {
			lambdaFunction: validateInputLambda,
			outputPath: '$.Payload'
		});
		const rateLimitStep = new tasks.LambdaInvoke(this, 'Rate Limit Check', {
			lambdaFunction: rateLimitLambda,
			outputPath: '$.Payload'
		});
		const sendEmailStep = new tasks.LambdaInvoke(this, 'Send Email', {
			lambdaFunction: sendEmailLambda,
			outputPath: '$.Payload'
		});
		const sendSmsStep = new tasks.LambdaInvoke(this, 'Send SMS', {
			lambdaFunction: sendSmsLambda,
			outputPath: '$.Payload'
		});

		// State machine definition
		const definition = validateStep
			.next(rateLimitStep)
			.next(
				new sfn.Choice(this, 'Has Email?')
					.when(
						sfn.Condition.booleanEquals('$.sendEmail', true),
						sendEmailStep
					)
					.otherwise(new sfn.Pass(this, 'Skip Email'))
			)
			.next(
				new sfn.Choice(this, 'Has Phone?')
					.when(
						sfn.Condition.booleanEquals('$.sendSms', true),
						sendSmsStep
					)
					.otherwise(new sfn.Pass(this, 'Skip SMS'))
			);
		new sfn.StateMachine(this, 'SendResumeStateMachine', {
			definition,
			timeout: cdk.Duration.minutes(5)
		});
	}
}
