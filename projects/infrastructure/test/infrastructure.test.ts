import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';

import { beforeEach, describe, expect, it } from 'vitest';

import { InfrastructureStack } from '../lib/infrastructure-stack';

const CERTIFICATE_ARN =
	'arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000';

// Synthesize the stack into a CloudFormation template for assertion. A concrete
// account/region is required so the Route 53 HostedZone.fromLookup can resolve
// (CDK returns a dummy zone during synth when no lookup context is cached).
function synthesizeStackTemplate(): Template {
	const app = new App();
	const stack = new InfrastructureStack(app, 'TestInfrastructureStack', {
		env: { account: '123456789012', region: 'us-east-1' }
	});
	return Template.fromStack(stack);
}

describe('InfrastructureStack', () => {
	beforeEach(() => {
		process.env.CERTIFICATE_ARN = CERTIFICATE_ARN;
	});

	it('provisions a single S3 bucket to hold the exported site', () => {
		synthesizeStackTemplate().resourceCountIs('AWS::S3::Bucket', 1);
	});

	it('serves the site and the www redirect from two CloudFront distributions', () => {
		synthesizeStackTemplate().resourceCountIs(
			'AWS::CloudFront::Distribution',
			2
		);
	});

	it('redirects www.kups.me to the apex via a CloudFront function', () => {
		synthesizeStackTemplate().hasResourceProperties(
			'AWS::CloudFront::Function',
			{
				FunctionConfig: {
					Comment: 'Redirect www.kups.me to kups.me'
				}
			}
		);
	});

	it('creates Route 53 alias records for the apex and www', () => {
		synthesizeStackTemplate().resourceCountIs('AWS::Route53::RecordSet', 2);
	});

	it('fails fast when CERTIFICATE_ARN is not configured', () => {
		delete process.env.CERTIFICATE_ARN;
		expect(() => synthesizeStackTemplate()).toThrow(
			'Missing environment variable: CERTIFICATE_ARN'
		);
	});
});
