import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
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

		// Create resource bucket
		const resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
			blockPublicAccess: new s3.BlockPublicAccess({
				blockPublicAcls: false,
				blockPublicPolicy: false,
				ignorePublicAcls: false,
				restrictPublicBuckets: false
			}),
			publicReadAccess: true,
			removalPolicy: cdk.RemovalPolicy.RETAIN,
			autoDeleteObjects: false
		});

		// Deploy resume PDF into bucket
		new s3deploy.BucketDeployment(this, 'DeployResume', {
			sources: [s3deploy.Source.asset('./assets')],
			destinationBucket: resumeBucket
		});
		const resumeUrl = `https://${resumeBucket.bucketRegionalDomainName}/zachary_kuptsow_resume.pdf`;

		// Instantiate Lambdas
		const validateInputLambda = new lambda.Function(
			this,
			`ValidateInputLambda`,
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: 'index.validateInputHandler',
				code: lambda.Code.fromAsset('functions')
			}
		);
		const rateLimitLambda = new lambda.Function(
			this,
			`RateLimitLambda`,
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: 'index.rateLimitHandler',
				code: lambda.Code.fromAsset('functions'),
				environment: {
					RATE_LIMIT_TABLE_NAME: requestsTable.tableName
				}
			}
		);
		const sendEmailLambda = new lambda.Function(
			this,
			'SendEmailLambda',
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: 'index.sendEmailHandler',
				code: lambda.Code.fromAsset('functions'),
				environment: {
					SES_FROM_ADDRESS:
						process.env.SES_FROM_ADDRESS || 'zkups56@gmail.com',
					RESUME_URL: resumeUrl
				}
			}
		);
		const sendSmsLambda = new lambda.Function(
			this,
			`SendSmsLambda`,
			{
				runtime: lambda.Runtime.NODEJS_22_X,
				handler: 'index.sendSmsHandler',
				code: lambda.Code.fromAsset('functions'),
				environment: {
					RESUME_URL: resumeUrl
				}
			}
		);

		// Grant permissions
		requestsTable.grantReadWriteData(validateInputLambda);
		requestsTable.grantReadWriteData(rateLimitLambda);
		requestsTable.grantReadWriteData(sendEmailLambda);
		requestsTable.grantReadWriteData(sendSmsLambda);
		resumeBucket.grantRead(sendEmailLambda);
		resumeBucket.grantRead(sendSmsLambda);

		// Add IAM Policies - Scoped to specific email identity
		const sesFromAddress =
			process.env.SES_FROM_ADDRESS || 'zkups56@gmail.com';
		sendEmailLambda.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ['ses:SendEmail', 'ses:SendRawEmail'],
				resources: [
					`arn:aws:ses:${cdk.Stack.of(this).region}:${
						cdk.Stack.of(this).account
					}:identity/${sesFromAddress}`
				]
			})
		);
		sendSmsLambda.addToRolePolicy(
			new iam.PolicyStatement({
				actions: ['sns:Publish'],
				resources: ['*'], // SNS to phone numbers requires wildcard, but limited to Publish action only
				conditions: {
					StringEquals: {
						'sns:sms-sandbox-phone-number': 'false' // Allow production SMS sending
					}
				}
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

		// State machine definition - use parallel execution for email and SMS
		const emailChoice = new sfn.Choice(this, 'Has Email?')
			.when(
				sfn.Condition.booleanEquals('$.sendEmail', true),
				sendEmailStep
			)
			.otherwise(new sfn.Pass(this, 'Skip Email'));

		const smsChoice = new sfn.Choice(this, 'Has Phone?')
			.when(
				sfn.Condition.booleanEquals('$.sendSms', true),
				sendSmsStep
			)
			.otherwise(new sfn.Pass(this, 'Skip SMS'));

		const parallelStep = new sfn.Parallel(this, 'Send Notifications')
			.branch(emailChoice)
			.branch(smsChoice);

		const definition = validateStep
			.next(rateLimitStep)
			.next(parallelStep);
		new sfn.StateMachine(this, 'SendResumeStateMachine', {
			definition,
			timeout: cdk.Duration.minutes(5)
		});
	}
}
