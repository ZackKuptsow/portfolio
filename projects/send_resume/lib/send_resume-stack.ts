import * as cdk from 'aws-cdk-lib';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

import {
	ENVIRONMENT_VARIABLE,
	RATE_LIMIT_TABLE_PARTITION_KEY,
	RATE_LIMIT_TABLE_TTL_ATTRIBUTE
} from '../functions/shared/constants';
import { SenderDomain } from './sender_domain';

const DOMAIN_NAME = 'kups.me';
const MAIL_FROM_SUBDOMAIN = 'mail';
const SENDER_ADDRESS = `resume@${DOMAIN_NAME}`;
// Replies reach a mailbox that is actually read; nothing receives mail at kups.me.
const REPLY_TO_ADDRESS = 'zkups56@gmail.com';

const RESUME_OBJECT_KEY = 'zachary_kuptsow_resume.pdf';
const REQUEST_ROUTE_PATH = '/resume-requests';
const ALLOWED_BROWSER_ORIGINS = ['https://kups.me', 'http://localhost:3000'];

// A resume request is a human action, so single-digit rates are generous. This
// is an abuse ceiling in front of SES reputation, not a capacity limit.
const API_RATE_LIMIT_PER_SECOND = 2;
const API_BURST_LIMIT = 5;

const LAMBDA_RUNTIME = Runtime.NODEJS_22_X;

// Bundle the AWS SDK instead of relying on the runtime's copy. NodejsFunction
// leaves `@aws-sdk/*` external by default, which assumes every client used here
// ships in the runtime image; that cannot be confirmed without deploying, and a
// wrong assumption fails at runtime as "Cannot find module". Bundling also pins
// the SDK version the tests ran against.
const LAMBDA_BUNDLING = { externalModules: [], minify: true };
const DELIVERY_TIMEOUT = cdk.Duration.seconds(30);
const INTAKE_TIMEOUT = cdk.Duration.seconds(10);
const EXECUTION_TIMEOUT = cdk.Duration.minutes(5);

export class SendResumeStack extends cdk.Stack {
	constructor(scope: Construct, id: string, props?: cdk.StackProps) {
		super(scope, id, props);

		const hostedZone = route53.PublicHostedZone.fromLookup(this, 'KupsZone', {
			domainName: DOMAIN_NAME
		}) as route53.IPublicHostedZone;

		const senderDomain = new SenderDomain(this, 'SenderDomain', {
			hostedZone,
			mailFromSubdomain: MAIL_FROM_SUBDOMAIN
		});

		// Counters are keyed per identifier per window and expire with the
		// window, so the table only ever holds the current window's traffic.
		const requestsTable = new dynamodb.Table(this, 'RequestsTable', {
			partitionKey: {
				name: RATE_LIMIT_TABLE_PARTITION_KEY,
				type: dynamodb.AttributeType.STRING
			},
			billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
			timeToLiveAttribute: RATE_LIMIT_TABLE_TTL_ATTRIBUTE,
			removalPolicy: cdk.RemovalPolicy.RETAIN
		});

		// Private: the PDF is attached to the mail, never linked from the bucket.
		// The site serves its own public copy for the download button.
		const resumeBucket = new s3.Bucket(this, 'ResumeBucket', {
			blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
			encryption: s3.BucketEncryption.S3_MANAGED,
			enforceSSL: true,
			removalPolicy: cdk.RemovalPolicy.RETAIN
		});

		new s3deploy.BucketDeployment(this, 'DeployResume', {
			destinationBucket: resumeBucket,
			sources: [s3deploy.Source.asset('./assets')]
		});

		const sendEmailFunction = new NodejsFunction(this, 'SendEmailFunction', {
			entry: 'functions/send_email/handler.ts',
			handler: 'handler',
			bundling: LAMBDA_BUNDLING,
			runtime: LAMBDA_RUNTIME,
			timeout: DELIVERY_TIMEOUT,
			environment: {
				[ENVIRONMENT_VARIABLE.replyToAddress]: REPLY_TO_ADDRESS,
				[ENVIRONMENT_VARIABLE.resumeBucketName]: resumeBucket.bucketName,
				[ENVIRONMENT_VARIABLE.resumeObjectKey]: RESUME_OBJECT_KEY,
				[ENVIRONMENT_VARIABLE.senderAddress]: SENDER_ADDRESS
			}
		});
		resumeBucket.grantRead(sendEmailFunction);
		senderDomain.grantSendEmail(sendEmailFunction);

		const sendEmailTask = new tasks.LambdaInvoke(this, 'Send Email', {
			lambdaFunction: sendEmailFunction,
			// Hand the handler's return value to the next state instead of the
			// invocation envelope.
			payloadResponseOnly: true
		});
		sendEmailTask.addRetry({
			backoffRate: 2,
			errors: ['States.TaskFailed'],
			interval: cdk.Duration.seconds(2),
			maxAttempts: 3
		});

		const deliveryStateMachine = new sfn.StateMachine(
			this,
			'SendResumeStateMachine',
			{
				definitionBody: sfn.DefinitionBody.fromChainable(sendEmailTask),
				timeout: EXECUTION_TIMEOUT
			}
		);

		const intakeFunction = new NodejsFunction(this, 'IntakeFunction', {
			entry: 'functions/intake/handler.ts',
			handler: 'handler',
			bundling: LAMBDA_BUNDLING,
			runtime: LAMBDA_RUNTIME,
			timeout: INTAKE_TIMEOUT,
			environment: {
				[ENVIRONMENT_VARIABLE.rateLimitTableName]: requestsTable.tableName,
				[ENVIRONMENT_VARIABLE.stateMachineArn]:
					deliveryStateMachine.stateMachineArn
			}
		});
		requestsTable.grantReadWriteData(intakeFunction);
		deliveryStateMachine.grantStartExecution(intakeFunction);

		const api = new apigatewayv2.HttpApi(this, 'ResumeRequestApi', {
			corsPreflight: {
				allowHeaders: ['Content-Type'],
				allowMethods: [apigatewayv2.CorsHttpMethod.POST],
				allowOrigins: ALLOWED_BROWSER_ORIGINS
			}
		});

		api.addRoutes({
			path: REQUEST_ROUTE_PATH,
			methods: [apigatewayv2.HttpMethod.POST],
			integration: new HttpLambdaIntegration(
				'IntakeIntegration',
				intakeFunction
			)
		});

		// Throttling is not exposed on HttpApi props, and replacing the default
		// stage to set it would leave `api.url` undefined.
		const defaultStage = api.defaultStage?.node
			.defaultChild as apigatewayv2.CfnStage;
		defaultStage.defaultRouteSettings = {
			throttlingBurstLimit: API_BURST_LIMIT,
			throttlingRateLimit: API_RATE_LIMIT_PER_SECOND
		};

		new cdk.CfnOutput(this, 'ResumeRequestApiUrl', {
			description: 'Base URL the site posts resume requests to',
			value: `${api.url ?? ''}${REQUEST_ROUTE_PATH.slice(1)}`
		});

		new cdk.CfnOutput(this, 'SendResumeStateMachineArn', {
			description: 'Delivery state machine, for the integration tests',
			value: deliveryStateMachine.stateMachineArn
		});
	}
}
