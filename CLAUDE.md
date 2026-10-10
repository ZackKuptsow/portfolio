# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a portfolio monorepo with three main projects using Yarn workspaces:

- **`projects/resume/`** - Next.js portfolio site (deployed to kups.me)
- **`projects/infrastructure/`** - AWS CDK stack for hosting the resume site
- **`projects/send_resume/`** - AWS CDK stack with Lambda functions for email/SMS resume delivery

## Development Commands

### Resume Site (Next.js)
```bash
cd projects/resume
yarn dev                 # Start development server with Turbopack
yarn build              # Build for production
yarn check              # Run linting, formatting, and typechecking
yarn check:fix           # Auto-fix linting and formatting issues
yarn typecheck          # TypeScript type checking only
yarn test               # Run tests with Vitest
yarn test:watch         # Run tests in watch mode
yarn test:built-site    # After a build: check the files in out/
yarn test:browser       # After a build: check the site in Chrome with Playwright
```

### Infrastructure (AWS CDK)
```bash
cd projects/infrastructure
yarn cdk:deploy          # Deploy infrastructure with environment variables loaded
```

### Send Resume Service (AWS CDK + Lambda)
```bash
cd projects/send_resume
yarn test                # Run tests with Vitest
yarn test:watch          # Run tests in watch mode
yarn test:coverage       # Run tests with coverage report
yarn typecheck           # Typecheck handlers and tests
yarn cdk                 # CDK CLI commands (deploy needs CDK_DEFAULT_ACCOUNT/REGION)
```

## Architecture Overview

### Resume Site
- Next.js 15 application using React 19
- Tailwind CSS for styling with custom CSS variables for theming
- Component-based architecture in `components/` directory
- Custom glow cursor effect and theme toggle functionality
- Static export deployed to S3 via CloudFront
- Get-resume modal (`components/GetResume/`): a native `<dialog>` offering the PDF as a download, as a link that opens it in the browser, and by email through the send_resume API
- The modal's QR code opens the PDF on a phone. Its drawing is the committed `qrCodeArtwork.json`, which a test redraws when run with `-u` (see "QR code" in the resume README). The section is hidden below the `sm` breakpoint (`max-sm:hidden`), because a phone cannot scan its own screen, and only a browser can check that rule
- Content lives in `data/`: `identity.ts` (name forms, role, location, email, profile links, site URL) and `profile.ts` (jobs, degrees, skills, about copy). Job highlights, skills and the bio are copied from the public resume, so change the resume first. The page shows a selection, and the Qlik entry and degree descriptions exist only on the page
- No em dash or en dash in anything a visitor reads. `test/data/copy.test.ts` and `test/app/page.test.tsx` enforce it
- Search engines: `app/siteMetadata.ts`, `components/StructuredData/` (schema.org `ProfilePage`), `app/robots.ts`, `app/sitemap.ts`, and the committed `app/opengraph-image.png` (source in `share-image/`)
- Every prompt symbol (`.command-prompt`) sits inside an `aria-hidden` element, and `test/app/page.test.tsx` checks all of them. Arrows and `[EOF]` are hidden too
- Sections render visible on the server, and the running script hides only one that starts below the fold (`components/ScrollFadeIn/`). The observer's threshold must stay 0: a fraction of a section many screens tall never fits on a phone, and the section would stay hidden

### Infrastructure Stack
- AWS S3 bucket for static site hosting
- CloudFront distribution with SSL certificate
- Route53 DNS records for kups.me domain
- Automatic www to root domain redirection using CloudFront Functions
- Static asset deployment from Next.js build output
- A missing path returns the 404 page with a 404 status (S3 itself answers 403)
- Every `*.pdf` response carries `X-Robots-Tag: noindex`; `robots.txt` must not block PDFs, or crawlers never see the header

### Send Resume Service
- HTTP API → intake Lambda (Zod validation + DynamoDB rate limiting) → 202/400/429
- AWS Step Functions delivering the email asynchronously, with retries
- SES domain identity for `kups.me` with DKIM, a `mail.kups.me` MAIL FROM domain, and DMARC
- Private S3 bucket holding the PDF that gets attached to the email
- SMS delivery is deferred; `functions/send_sms.ts` is kept but not wired up

## Testing

- Resume project: Uses Vitest with jsdom and Testing Library; suites in `test/` mirror `app/`, `components/` and `data/`
- Resume project, after `yarn build`: `test-built-site/` (Vitest) reads the files in `out/`, and `test-browser/` (Playwright, in the installed Chrome, no browser download) checks what jsdom cannot see: sections revealed on a phone, sideways scroll, focus in the modal, and the QR code's breakpoint. Every request to another host is aborted, so no browser check can send an email. See "Checks that need a build" in the resume README
- Send Resume project: Uses Vitest with coverage reporting via @vitest/coverage-v8
- Test files located in `test/` directories, mirroring the source layout (`functions/` in send_resume; `app/`, `components/` and `data/` in resume)
- Run individual tests: `yarn test test/intake/rate_limit.test.ts`

## Continuous Integration

- `.github/workflows/gates.yml` holds the checks: payload scan, then lint, format, typecheck, tests and build for the site, the checks of the built site and the browser checks, then typecheck and tests for the infrastructure. `deploy.yml` calls it and its deploy job `needs` it, so a red gate means no deploy. `pull-request.yml` calls the same file on every pull request that is not a draft. `send-resume.yml` checks send_resume when a pull request changes it
- Branch rules are not available on this private repository, so nothing can block a merge. The `needs` in `deploy.yml` is the only gate that blocks
- The payload scan (`.github/scripts/scan-for-payload.sh`) is the first step of every job that installs. It reads the commit, not the working tree, and exits non-zero with UNKNOWN when it cannot run
- The deploy job ships the `out/` folder the gates job built, runs only on `main`, and ends with `.github/scripts/check-live-site.sh`. Its keys are secrets of the `production` environment, which no other job names
- Every action is pinned to a commit SHA with the version in a comment. The deploy workflow's concurrency group is per branch (`deploy-<ref>`) and never cancels a run in progress
- CI runs `yarn lint`, `yarn format` and `yarn typecheck` as separate steps. Together they are `yarn check`, so a new part of `yarn check` needs its own step in `gates.yml`
- A new gate is unproven until it has been seen red: break what it protects on a branch, open a pull request, and read the failing step
- `.githooks/pre-push` runs the payload scan, then the static checks and tests of each project a push changes. It is on only in a clone where `git config core.hooksPath .githooks` was run, and that setting turns off any hook in `.git/hooks`. It reads the working tree, so the pushed commit must be the one checked out, and it scans the working tree as well as the commit. It has no file extension, so name it explicitly to `shellcheck`

## Code Conventions

- TypeScript throughout all projects
- Use Yarn as package manager (v4.9.2)
- ESLint and Prettier for code formatting
- Functional components in React
- AWS CDK constructs follow standard naming patterns
- Lambda handlers use AWS Lambda types from @types/aws-lambda

## Environment Variables

Infrastructure deployment requires:
- `CERTIFICATE_ARN` - SSL certificate ARN for CloudFront distribution

The resume site build requires:
- `NEXT_PUBLIC_RESUME_REQUEST_API_URL` - the send_resume `ResumeRequestApiUrl` stack output. It is set locally in `projects/resume/.env.local` and in CI by the `RESUME_REQUEST_API_URL` repository variable. The build fails if it is missing or malformed.

Load environment variables in infrastructure project using:
```bash
set -a && source .env && set +a
```