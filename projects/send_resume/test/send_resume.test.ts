import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { describe, expect, it } from 'vitest';

import {
	RATE_LIMIT_TABLE_PARTITION_KEY,
	RATE_LIMIT_TABLE_TTL_ATTRIBUTE
} from '../functions/shared/constants';
import { SendResumeStack } from '../lib/send_resume-stack';

// Bundling is skipped so synthesis does not shell out to esbuild for every
// assertion; the key is matched against the stack's node path.
const synthesize = (): Template => {
	const app = new cdk.App({ context: { 'aws:cdk:bundling-stacks': [] } });
	const stack = new SendResumeStack(app, 'TestStack', {
		env: { account: '123456789012', region: 'us-east-1' }
	});
	return Template.fromStack(stack);
};

describe('SendResumeStack', () => {
	it('keys the rate-limit table by the same attribute the handlers write', () => {
		synthesize().hasResourceProperties('AWS::DynamoDB::Table', {
			KeySchema: [
				{
					AttributeName: RATE_LIMIT_TABLE_PARTITION_KEY,
					KeyType: 'HASH'
				}
			],
			BillingMode: 'PAY_PER_REQUEST'
		});
	});

	it('expires rate-limit entries by the same attribute the handlers set', () => {
		synthesize().hasResourceProperties('AWS::DynamoDB::Table', {
			TimeToLiveSpecification: {
				AttributeName: RATE_LIMIT_TABLE_TTL_ATTRIBUTE,
				Enabled: true
			}
		});
	});

	it('keeps the resume bucket private', () => {
		synthesize().hasResourceProperties('AWS::S3::Bucket', {
			PublicAccessBlockConfiguration: {
				BlockPublicAcls: true,
				BlockPublicPolicy: true,
				IgnorePublicAcls: true,
				RestrictPublicBuckets: true
			}
		});
	});

	it('verifies kups.me with SES and sends from a matching MAIL FROM domain', () => {
		synthesize().hasResourceProperties('AWS::SES::EmailIdentity', {
			EmailIdentity: 'kups.me',
			MailFromAttributes: { MailFromDomain: 'mail.kups.me' }
		});
	});

	it('publishes DKIM, MAIL FROM and DMARC records into the hosted zone', () => {
		// 3 DKIM CNAMEs + MAIL FROM MX + MAIL FROM SPF TXT + DMARC TXT
		synthesize().resourceCountIs('AWS::Route53::RecordSet', 6);
	});

	it('starts DMARC in monitoring mode', () => {
		synthesize().hasResourceProperties('AWS::Route53::RecordSet', {
			Name: '_dmarc.kups.me.',
			Type: 'TXT',
			ResourceRecords: ['"v=DMARC1; p=none;"']
		});
	});

	it('exposes exactly one POST route for resume requests', () => {
		const template = synthesize();

		template.resourceCountIs('AWS::ApiGatewayV2::Route', 1);
		template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
			RouteKey: 'POST /resume-requests'
		});
	});

	it('only allows the site origin to call the API from a browser', () => {
		synthesize().hasResourceProperties('AWS::ApiGatewayV2::Api', {
			CorsConfiguration: {
				AllowMethods: ['POST'],
				AllowOrigins: ['https://kups.me', 'http://localhost:3000']
			}
		});
	});

	it('throttles the API so the endpoint cannot be hammered', () => {
		synthesize().hasResourceProperties('AWS::ApiGatewayV2::Stage', {
			DefaultRouteSettings: {
				ThrottlingBurstLimit: Match.anyValue(),
				ThrottlingRateLimit: Match.anyValue()
			}
		});
	});

	it('lets the delivery function send only from the verified identity', () => {
		synthesize().hasResourceProperties('AWS::IAM::Policy', {
			PolicyDocument: {
				Statement: Match.arrayWith([
					Match.objectLike({
						Action: ['ses:SendEmail', 'ses:SendRawEmail'],
						Effect: 'Allow',
						// Scoped to the verified identity's ARN rather than '*'.
						Resource: {
							'Fn::Join': Match.arrayWith([
								Match.arrayWith([
									Match.stringLikeRegexp(':identity/'),
									{
										Ref: Match.stringLikeRegexp(
											'SenderDomainIdentity'
										)
									}
								])
							])
						}
					})
				])
			}
		});
	});

	it('delivers through a state machine rather than from the request path', () => {
		const template = synthesize();

		template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
		expect(JSON.stringify(template.toJSON())).toContain('Send Email');
	});

	it('publishes the API url so the site can be pointed at it', () => {
		expect(Object.keys(synthesize().findOutputs('*'))).toContain(
			'ResumeRequestApiUrl'
		);
	});
});
