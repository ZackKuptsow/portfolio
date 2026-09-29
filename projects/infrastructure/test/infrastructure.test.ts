import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import { beforeEach, describe, expect, it } from 'vitest';

import { InfrastructureStack } from '../lib/infrastructure-stack';

const CERTIFICATE_ARN =
	'arn:aws:acm:us-east-1:123456789012:certificate/00000000-0000-0000-0000-000000000000';
// The stack has two distributions. A matcher that does not name this one also
// accepts the www redirect, so it could not tell which of them got a setting.
const SITE_DOMAIN = 'kups.me';

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
		const aliasRecords = synthesizeStackTemplate().findResources(
			'AWS::Route53::RecordSet',
			{ Properties: { Type: 'A' } }
		);
		const aliasRecordNames = Object.values(aliasRecords)
			.map((record) => record.Properties.Name)
			.sort();

		expect(aliasRecordNames).toEqual(['kups.me.', 'www.kups.me.']);
	});

	it('proves to Google Search Console that the domain is ours', () => {
		const template = synthesizeStackTemplate();

		// A name holds one set of TXT records. A second set at the apex would
		// fail to deploy, so every apex TXT value has to live in this one.
		template.resourcePropertiesCountIs(
			'AWS::Route53::RecordSet',
			{ Name: 'kups.me.', Type: 'TXT' },
			1
		);
		template.hasResourceProperties('AWS::Route53::RecordSet', {
			Name: 'kups.me.',
			ResourceRecords: [
				'"google-site-verification=a4EbT7tY9AjW578xpSeYG4X-rUD_bLe6kyVIi32RPUs"'
			],
			Type: 'TXT'
		});
	});

	it('answers a missing path with the 404 page and a 404 status', () => {
		// S3 answers 403 for a missing object when the reader may not list the bucket.
		synthesizeStackTemplate().hasResourceProperties(
			'AWS::CloudFront::Distribution',
			{
				DistributionConfig: Match.objectLike({
					Aliases: [SITE_DOMAIN],
					CustomErrorResponses: [
						Match.objectLike({
							ErrorCode: 403,
							ResponseCode: 404,
							ResponsePagePath: '/404.html'
						})
					]
				})
			}
		);
	});

	it('sends a noindex header with every PDF, and only with PDFs', () => {
		const template = synthesizeStackTemplate();
		const noIndexPolicies = template.findResources(
			'AWS::CloudFront::ResponseHeadersPolicy',
			{
				Properties: {
					ResponseHeadersPolicyConfig: Match.objectLike({
						CustomHeadersConfig: {
							Items: [
								{ Header: 'X-Robots-Tag', Override: true, Value: 'noindex' }
							]
						}
					})
				}
			}
		);
		const noIndexPolicyIds = Object.keys(noIndexPolicies);

		expect(noIndexPolicyIds).toHaveLength(1);
		template.hasResourceProperties('AWS::CloudFront::Distribution', {
			DistributionConfig: Match.objectLike({
				Aliases: [SITE_DOMAIN],
				CacheBehaviors: [
					Match.objectLike({
						PathPattern: '*.pdf',
						ResponseHeadersPolicyId: { Ref: noIndexPolicyIds[0] }
					})
				],
				DefaultCacheBehavior: Match.objectLike({
					ResponseHeadersPolicyId: Match.absent()
				})
			})
		});
	});

	it('fails fast when CERTIFICATE_ARN is not configured', () => {
		delete process.env.CERTIFICATE_ARN;
		expect(() => synthesizeStackTemplate()).toThrow(
			'Missing environment variable: CERTIFICATE_ARN'
		);
	});
});
