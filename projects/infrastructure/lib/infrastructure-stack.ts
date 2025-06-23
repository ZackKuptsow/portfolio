import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";

import {
  CachePolicy,
  Distribution,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { Duration, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import { Construct } from "constructs";
import { S3StaticWebsiteOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // S3 bucket to store compiled website
    const siteBucket = new s3.Bucket(this, "ResumeSiteBucket", {
      websiteIndexDocument: "index.html",
      websiteErrorDocument: "404.html",
      publicReadAccess: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront distribution
    const distribution = new Distribution(this, "ResumeSiteDistribution", {
      defaultBehavior: {
        origin: new S3StaticWebsiteOrigin(siteBucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
    });

    // Deploy static files to S3
    new s3deploy.BucketDeployment(this, "ResumeSiteDeploy", {
      sources: [s3deploy.Source.asset("../resume/out")],
      destinationBucket: siteBucket,
      distribution,
      distributionPaths: ["/*"],
    });
  }
}
