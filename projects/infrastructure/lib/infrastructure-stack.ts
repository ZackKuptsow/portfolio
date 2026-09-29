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
  ResponseHeadersPolicy,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";

import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { S3BucketOrigin } from "aws-cdk-lib/aws-cloudfront-origins";

const FORBIDDEN_STATUS = 403;
const NOT_FOUND_PAGE_PATH = "/404.html";
const NOT_FOUND_STATUS = 404;
const PDF_PATH_PATTERN = "*.pdf";

/**
 * Hosts kups.me: a private bucket behind CloudFront, DNS for the apex and www,
 * and a redirect from www to the apex. It also answers a missing path with the
 * site's 404 page, and keeps PDFs out of search results.
 */
export class InfrastructureStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const certificateArn = process.env.CERTIFICATE_ARN;
    if (!certificateArn) {
      throw new Error("Missing environment variable: CERTIFICATE_ARN");
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

    // One origin object shared by both behaviors. CDK binds each origin object
    // separately, so two objects would give this distribution two origins, two
    // access controls and two identical statements in the bucket policy.
    const siteOrigin = S3BucketOrigin.withOriginAccessControl(siteBucket);

    // A search for the name should lead to the page, not to a PDF whose listing
    // shows the contact line. The file stays downloadable. Crawlers must still
    // be allowed to fetch it, because the header is how they learn to drop it.
    const pdfResponseHeadersPolicy = new ResponseHeadersPolicy(
      this,
      "PdfNoIndexHeaders",
      {
        comment: "Keep PDFs out of search results",
        customHeadersBehavior: {
          customHeaders: [
            { header: "X-Robots-Tag", override: true, value: "noindex" },
          ],
        },
      }
    );

    // CloudFront distribution
    const distribution = new Distribution(this, "ResumeSiteDistribution", {
      additionalBehaviors: {
        [PDF_PATH_PATTERN]: {
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          origin: siteOrigin,
          responseHeadersPolicy: pdfResponseHeadersPolicy,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
      },
      certificate,
      defaultBehavior: {
        origin: siteOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: "index.html",
      domainNames: ["kups.me"],
      // The bucket's reader may not list it, so S3 answers 403 for a missing
      // object. Visitors and crawlers should see a 404. The cost: every 403
      // from the origin becomes a 404, so a broken bucket policy would show up
      // as missing pages, not as access errors.
      errorResponses: [
        {
          httpStatus: FORBIDDEN_STATUS,
          responseHttpStatus: NOT_FOUND_STATUS,
          responsePagePath: NOT_FOUND_PAGE_PATH,
        },
      ],
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
