# Portfolio

Home for my personal site and the AWS infrastructure behind it. The live site is **[kups.me](https://kups.me)**.

This repo is a **modular monolith**: three independent projects kept together for convenience, but each is fully self-contained — its own dependencies, lockfile, and tooling — so any one can be lifted out into its own repo whenever it makes sense. Nothing at the root binds them together.

## Projects

| Project | Path | What it is |
| --- | --- | --- |
| **resume** | [`projects/resume`](projects/resume) | The portfolio site — a Next.js 15 static export served at kups.me. |
| **infrastructure** | [`projects/infrastructure`](projects/infrastructure) | AWS CDK stack that hosts the site (S3 + CloudFront + Route 53). |
| **send_resume** | [`projects/send_resume`](projects/send_resume) | AWS Step Functions service that emails / texts my resume on request. |

Each project has its own README with the details.

## Getting started

There's no root install — work inside whichever project you're touching. Each uses Node (see the project's `.nvmrc`) and Yarn 4 via Corepack:

```bash
corepack enable          # activates the Yarn version pinned in the project
cd projects/resume       # (or infrastructure / send_resume)
yarn install             # installs just that project
```

## Deployment

The site deploys automatically via GitHub Actions ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) on every push to `main` that touches `projects/resume/**` or `projects/infrastructure/**`: it installs and builds the Next.js export, then runs `cdk deploy`. See the infrastructure README for the required secrets.

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Infrastructure:** AWS CDK (S3, CloudFront, Route 53, ACM)
- **Backend service:** AWS Step Functions + Lambda, DynamoDB, SES, SNS, AWS SDK v3
- **Tooling:** TypeScript, Yarn 4 (per project), ESLint, Prettier, Vitest
