# infrastructure

AWS CDK stack that hosts the [`resume`](../resume) site at **[kups.me](https://kups.me)**. The stack lives in [`lib/infrastructure-stack.ts`](lib/infrastructure-stack.ts) (`InfrastructureStack`).

## What it provisions

- **S3 bucket** — private origin holding the exported static site
- **CloudFront distribution** — HTTPS via an ACM certificate, optimized caching, serving `kups.me`
- **Route 53 A records** — aliases in the existing `kups.me` hosted zone
- **Route 53 TXT record at the apex**: proves ownership of the domain to Google Search Console. A name holds one set of TXT records, so any later apex TXT value goes in the same list in the stack
- **www → root redirect** — a second distribution plus a CloudFront Function that 301-redirects `www.kups.me` to `kups.me`
- **Static deployment** — uploads `../resume/out` and invalidates the CloudFront cache on each deploy
- **Real 404s**: the bucket's reader may not list it, so S3 answers 403 for a missing path. CloudFront turns that into the site's 404 page with a 404 status. Every 403 from the origin is turned, so a broken bucket policy would also show up as 404s
- **PDFs kept out of search results**: every `*.pdf` response carries `X-Robots-Tag: noindex`. The file stays downloadable. `robots.txt` must not block it, because a crawler has to fetch the file to see the header

## Prerequisites

- An existing Route 53 hosted zone for `kups.me`
- An ACM certificate in `us-east-1` covering `kups.me` and `www.kups.me`
- AWS credentials permitted to manage these resources

## Configuration

Provided via environment variables. `cdk:deploy` loads a local `.env` first:

| Variable | Purpose |
| --- | --- |
| `CERTIFICATE_ARN` | ACM certificate ARN for the CloudFront distributions |
| `AWS_REGION`, `CDK_DEFAULT_ACCOUNT` | Target account / region |

## Commands

From inside `projects/infrastructure`:

```bash
yarn install     # install dependencies
yarn test        # CDK assertion tests (Vitest)
yarn typecheck   # tsc --noEmit
yarn cdk:deploy  # load .env, then cdk deploy
```

Deploy needs the site's built assets first — from the repo root:

```bash
cd projects/resume && yarn build          # produces ../resume/out
cd ../infrastructure && yarn cdk:deploy
```

Pushing to `main` runs this automatically via GitHub Actions using repository secrets: `CERTIFICATE_ARN`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `CDK_DEFAULT_ACCOUNT`.
