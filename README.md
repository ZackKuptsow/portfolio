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

The site deploys through GitHub Actions on every push to `main` that touches `projects/resume/**`, `projects/infrastructure/**` or the pipeline itself. [`deploy.yml`](.github/workflows/deploy.yml) runs two jobs:

1. **Gates** ([`gates.yml`](.github/workflows/gates.yml)): a payload scan, then lint, format, typecheck and tests for the site, the build, the checks of the built files, the checks in a real browser, and the typecheck and tests for the infrastructure.
2. **Deploy**: runs `cdk deploy` with the site the gates job built, then checks the live site. It needs the gates job, so a red gate means nothing is deployed. It runs only on `main`.

See the infrastructure README for the required secrets.

## Checks

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`deploy.yml`](.github/workflows/deploy.yml) | A push to `main`, or by hand | The gates, then the deploy |
| [`pull-request.yml`](.github/workflows/pull-request.yml) | Every pull request that is not a draft | The same gates, with no deploy |
| [`send-resume.yml`](.github/workflows/send-resume.yml) | A pull request that changes `projects/send_resume/**` | Typecheck and tests for `send_resume`, which is deployed by hand |

A red pull request can still be merged, because branch rules are not available on this repository. It cannot be deployed: the `needs` in `deploy.yml` is the gate that blocks.

A draft runs nothing. Marking it ready for review starts the checks. Do not push and mark ready in the same second: GitHub then reports the newest commit as still a draft and skips it, and the pull request shows "skipped" where a result should be. `gh pr ready --undo` followed by `gh pr ready` starts the checks for the newest commit.

The scripts the workflows call live in [`.github/scripts`](.github/scripts):

- `scan-for-payload.sh` is the first step of every job that installs anything. It reads the commit for the build-config dropper and stops the job before an install or a build can run it. When it cannot run it answers UNKNOWN, which also stops the job.
- `report-static-check-inputs.sh` prints how many files lint, format and typecheck read, and fails when one of them reads none.
- `check-live-site.sh` runs after a deploy. It asks the live site whether it serves the build that was just deployed.

Rules for changing the pipeline:

- Pin every action to a commit SHA, with the version in a comment. A tag can be moved. Take the SHA from the release's tag, and read the release notes before moving to a new major version.
- Keep the payload scan first.
- Give each gate its own step with the `!cancelled()` guard, so one red gate never hides another.
- Never set `cancel-in-progress: true` on the `deploy` group. It could stop a deploy halfway.
- A new gate is unproven until it has been seen red. Break what it protects on a branch, open a pull request, and read the failing step.

## Tech stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS 4
- **Infrastructure:** AWS CDK (S3, CloudFront, Route 53, ACM)
- **Backend service:** AWS Step Functions + Lambda, DynamoDB, SES, SNS, AWS SDK v3
- **Tooling:** TypeScript, Yarn 4 (per project), ESLint, Prettier, Vitest
