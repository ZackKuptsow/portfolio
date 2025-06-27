import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

import { ARecord, RecordTarget } from "aws-cdk-lib/aws-route53";
import {
  CachePolicy,
  Function as CfFunction,
  Distribution,
  FunctionCode,
  FunctionEventType,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const certificateArn = process.env.AWS_CERTIFICATE_ARN;
    if (!certificateArn) {
      throw new Error("Missing environment variable: AWS_CERTIFICATE_ARN");
    }

    // S3 bucket to store compiled website
    const siteBucket = new s3.Bucket(this, "ResumeSiteBucket", {
      autoDeleteObjects: true,
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      websiteErrorDocument: "404.html",
      websiteIndexDocument: "index.html",
    });

    // Get existing hosted zone
    const zone = HostedZone.fromLookup(this, "KupsZone", {
      domainName: "kups.me",
    });

    // Create an SSL cert
    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "KupsCert",
      certificateArn
    );

    // CloudFront distribution
    const distribution = new Distribution(this, "ResumeSiteDistribution", {
      certificate,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      domainNames: ["kups.me"],
    });

    // Create DNS record alias
    new ARecord(this, "KupsAliasRecord", {
      recordName: "kups.me",
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
      zone,
    });

    // Print out URL to deployed website
    // new CfnOutput(this, "CloudFrontURL", {
    //   description: "The Cloudfront distribution domain",
    //   value: distribution.distributionDomainName,
    // });

    // Deploy static files to S3
    new s3deploy.BucketDeployment(this, "ResumeSiteDeploy", {
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"], // Cache invalidation -> old buckets purged
      sources: [s3deploy.Source.asset("../resume/out")],
    });

    //##########
    // ADDING ROUTING for www.kups.me
    //##########

    // Redirect function
    const redirectFunction = new CfFunction(this, "RedirectToRoot", {
      functionName: "redirect-www-to-root",
      comment: "Redirect www.kups.me to kups.me",
      code: FunctionCode.fromInline(`
    function handler(event) {
      var request = event.request;
      var host = request.headers.host.value;
      if (host === 'www.kups.me') {
        return {
          statusCode: 301,
          statusDescription: 'Moved Permanently',
          headers: {
            location: { value: 'https://kups.me' }
          }
        };
      }
      return request;
    }
  `),
    });

    // Create second distribution
    const redirectDistribution = new Distribution(
      this,
      "RedirectWWWDistribution",
      {
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(siteBucket),
          functionAssociations: [
            {
              eventType: FunctionEventType.VIEWER_REQUEST,
              function: redirectFunction,
            },
          ],
        },
        domainNames: ["www.kups.me"],
        certificate: certificate,
      }
    );

    // Create redirect record for www
    new ARecord(this, "KupsWWWAliasRecord", {
      recordName: "www",
      target: RecordTarget.fromAlias(
        new CloudFrontTarget(redirectDistribution)
      ),
      zone,
    });
  }
}
