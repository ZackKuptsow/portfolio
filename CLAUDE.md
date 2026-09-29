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
- Get-resume modal (`components/GetResume/`): a native `<dialog>` offering the PDF download and delivery by email through the send_resume API

### Infrastructure Stack
- AWS S3 bucket for static site hosting
- CloudFront distribution with SSL certificate
- Route53 DNS records for kups.me domain
- Automatic www to root domain redirection using CloudFront Functions
- Static asset deployment from Next.js build output

### Send Resume Service
- HTTP API → intake Lambda (Zod validation + DynamoDB rate limiting) → 202/400/429
- AWS Step Functions delivering the email asynchronously, with retries
- SES domain identity for `kups.me` with DKIM, a `mail.kups.me` MAIL FROM domain, and DMARC
- Private S3 bucket holding the PDF that gets attached to the email
- SMS delivery is deferred; `functions/send_sms.ts` is kept but not wired up

## Testing

- Resume project: Uses Vitest with jsdom and Testing Library; suites in `test/` mirror `components/`
- Send Resume project: Uses Vitest with coverage reporting via @vitest/coverage-v8
- Test files located in `test/` directories, mirroring the source layout (`functions/` in send_resume, `components/` in resume)
- Run individual tests: `yarn test test/intake/rate_limit.test.ts`

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