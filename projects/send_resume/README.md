# send_resume

A serverless service that delivers my resume by **email or SMS** on request, built with AWS **Step Functions** orchestrating a handful of Lambda functions and fronted by rate limiting. The stack lives in [`lib/send_resume-stack.ts`](lib/send_resume-stack.ts) (`SendResumeStack`).

## Workflow

The state machine runs:

1. **Validate input** ([`functions/validate_input.ts`](functions/validate_input.ts)) — a Zod schema that also normalizes phone numbers to E.164
2. **Rate limit** ([`functions/rate_limit.ts`](functions/rate_limit.ts)) — checks and records email, phone, and IP identifiers in DynamoDB with a 24h TTL
3. **Send notifications** (parallel) — **email via SES** ([`send_email.ts`](functions/send_email.ts)) and/or **SMS via SNS** ([`send_sms.ts`](functions/send_sms.ts)), each gated on whether that channel was requested

Backing resources: a DynamoDB table (PAY_PER_REQUEST, TTL enabled) for rate limiting, plus an S3 bucket holding the resume PDF.

## Stack

- AWS CDK + `aws-cdk-lib`
- **AWS SDK v3** — `@aws-sdk/client-{ses,sns,dynamodb}` and `@aws-sdk/lib-dynamodb`
- Zod for validation
- Vitest for tests

## Commands

From inside `projects/send_resume`:

```bash
yarn install       # install dependencies
yarn test          # run the Vitest suite
yarn test:coverage # with coverage (v8)
yarn typecheck     # tsc against tsconfig.build.json
yarn build         # compile functions for deployment
yarn cdk deploy    # deploy the stack
```

## Testing

Unit tests mock AWS with [`aws-sdk-client-mock`](https://github.com/m-radzikowski/aws-sdk-client-mock). There's also an optional LocalStack integration suite in [`test/send_resume.test.ts`](test/send_resume.test.ts), skipped unless `STATE_MACHINE_ARN` is set — see the comment block there for setup.
