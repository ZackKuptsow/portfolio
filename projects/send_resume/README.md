# send_resume

A serverless service that emails my resume on request, built with an HTTP API in front of a
Lambda that validates and rate limits, and AWS **Step Functions** handling delivery. The stack
lives in [`lib/send_resume-stack.ts`](lib/send_resume-stack.ts) (`SendResumeStack`).

## Request flow

```
POST /resume-requests  (HTTP API, CORS limited to https://kups.me)
  -> IntakeFunction         validate -> claim a rate-limit slot -> start execution -> 202
       400 invalid | 429 rate limited | 500 misconfigured
  -> SendResumeStateMachine SendEmail task, retried on failure
       -> SES, from resume@kups.me with the PDF attached
```

Everything the caller waits on happens in [`functions/intake/`](functions/intake), so status
codes are decided in TypeScript and can be unit tested. Delivery runs asynchronously, which is
where retries and execution history are worth having. A `202` means the request was accepted,
not that the mail has landed.

Delivery handlers are invoked by Step Functions, so their event is the **raw state JSON** and
they signal failure by **throwing** — a returned `{statusCode: 500}` looks like success to a
state machine.

## Sending domain

[`lib/sender_domain.ts`](lib/sender_domain.ts) verifies `kups.me` with SES. `EmailIdentity`
writes the Easy DKIM records and, because a custom MAIL FROM domain (`mail.kups.me`) is set,
its MX and SPF records into the hosted zone as well. That custom MAIL FROM domain is the point:
it puts the envelope sender on the same domain as the From header, so SPF aligns and DMARC can
pass. The construct adds the `_dmarc` record itself, starting at `p=none`.

## Backing resources

- **DynamoDB table** — rate-limit counters, keyed per identifier per window and expired by TTL.
  The key and TTL attribute names come from
  [`functions/shared/constants.ts`](functions/shared/constants.ts), which the stack and the
  handlers both import, so the two cannot drift apart.
- **S3 bucket** — private, holding the PDF that gets attached. The public copy the site's
  download button uses is served by the `resume` project, not from here.

Rate limiting is one conditional `TransactWriteItems`: both counters move together or not at
all. Windows are folded into the key, so an entry belongs to exactly one window and DynamoDB's
lazy TTL deletion cannot affect a decision.

## Stack

- AWS CDK + `aws-cdk-lib`, with `NodejsFunction` (esbuild) bundling each handler
- **AWS SDK v3** — `@aws-sdk/client-{sesv2,s3,sfn,dynamodb}` and `@aws-sdk/lib-dynamodb`,
  bundled rather than taken from the runtime
- Zod for validation, Vitest for tests

## Commands

From inside `projects/send_resume`:

```bash
yarn install       # install dependencies
yarn test          # run the Vitest suite
yarn test:coverage # with coverage (v8)
yarn typecheck     # tsc over the handlers and the tests
yarn cdk synth     # synthesize (needs credentials for the hosted-zone lookup)
yarn cdk deploy    # deploy the stack
```

Deployment needs `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION`: the stack looks up the
`kups.me` hosted zone, and a lookup cannot run in an account-agnostic stack.

## Testing

Unit tests mock AWS with [`aws-sdk-client-mock`](https://github.com/m-radzikowski/aws-sdk-client-mock).
Stack tests synthesize with `aws:cdk:bundling-stacks` set to `[]` so assertions do not shell out
to esbuild.

## SMS

Deferred. [`functions/send_sms.ts`](functions/send_sms.ts) and its tests are kept but **not
wired up**: SNS will not deliver to US numbers without a registered toll-free or 10DLC
origination number. That handler is still shaped for API Gateway and needs reshaping like
`send_email/handler.ts` before use. Phone validation and E.164 normalization were removed from
the validator along with the SMS branch; `git show 45ff6d0:projects/send_resume/functions/validate_input.ts`
has them.
