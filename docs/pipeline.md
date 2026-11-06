# The pipeline

How a commit reaches kups.me, what checks it on the way, and the rules for changing any of that.

## Deployment

The site deploys through GitHub Actions on every push to `main` that touches `projects/resume/**`, `projects/infrastructure/**` or the pipeline itself. [`deploy.yml`](../.github/workflows/deploy.yml) runs two jobs:

1. **Gates** ([`gates.yml`](../.github/workflows/gates.yml)): a payload scan, then lint, format, typecheck and tests for the site, the build, the checks of the built files, the checks in a real browser, and the typecheck and tests for the infrastructure.
2. **Deploy**: runs `cdk deploy` with the site the gates job built, then checks the live site. It needs the gates job, so a red gate means nothing is deployed. It runs only on `main`.

See the [infrastructure README](../projects/infrastructure/README.md) for the required secrets.

## Checks

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`deploy.yml`](../.github/workflows/deploy.yml) | A push to `main`, or by hand | The gates, then the deploy |
| [`pull-request.yml`](../.github/workflows/pull-request.yml) | Every pull request that is not a draft | The same gates, with no deploy |
| [`send-resume.yml`](../.github/workflows/send-resume.yml) | A pull request that changes `projects/send_resume/**` | Typecheck and tests for `send_resume`, which is deployed by hand |

A red pull request can still be merged, because no branch rule is set on this repository. It cannot be deployed: the `needs` in `deploy.yml` is the gate that blocks.

A draft runs nothing. Marking it ready for review starts the checks. Do not push and mark ready in the same second: GitHub then reports the newest commit as still a draft and skips it, and the pull request shows "skipped" where a result should be. `gh pr ready --undo` followed by `gh pr ready` starts the checks for the newest commit.

The deploy job ships the site the gates job built in the same run, and that copy is kept for one day. Within the day, "Re-run failed jobs" deploys it again. After that, use "Re-run all jobs", which builds again. Re-running an older run publishes that older commit, so re-run only the newest one.

### Before a push

A pre-push hook runs the quick checks on your machine, before the code is on GitHub. It costs no Actions minutes. Turn it on once in each clone:

```bash
git config core.hooksPath .githooks
```

That setting makes git read its hooks from `.githooks` and from nowhere else. A hook that sits in `.git/hooks` stops running, without a word. If a clone has one there, such as a checkout guard, either leave the setting alone and link this hook in beside it (`ln -s ../../.githooks/pre-push .git/hooks/pre-push`), or move the other hook into `.githooks`.

For each branch or tag being pushed, the hook first runs the payload scan on its newest commit. Then, for each project the push changes, it runs the static checks and the tests: `yarn check` and `yarn test` for the site, `yarn typecheck` and `yarn test` for the other two. A push that changes the site takes about 10 seconds. The hook does not build the site, so the checks that need a build are left to CI, and the infrastructure tests run only when a build is already there.

The checks read the files in your folder, not the commit. So:

- The commit being pushed has to be the one that is checked out. Otherwise the hook stops the push.
- The folder is scanned for the payload too, before any tool runs.
- A change that is not committed, or a new file that was never added, is checked along with the rest. The hook warns when a project has one and goes on. A check can then pass because of a file the push does not carry, and CI, which checks the exact commit, is what catches that.

`git push --no-verify` skips the hook.

### The scripts

The scripts the workflows call live in [`.github/scripts`](../.github/scripts):

- `scan-for-payload.sh` is the first step of every job that installs anything, and of the pre-push hook. It reads the commit for the build-config dropper and stops the job before an install or a build can run it. When it cannot run it answers UNKNOWN, which also stops the job.
- `report-static-check-inputs.sh` prints how many files lint, format and typecheck read, and fails when one of them reads none.
- `check-live-site.sh` runs after a deploy. It asks the live site whether it serves the build that was just deployed.

Rules for changing the pipeline:

- Pin every action to a commit SHA, with the version in a comment. A tag can be moved. Take the SHA from the release's tag, and read the release notes before moving to a new major version.
- Keep the payload scan first.
- Give each gate its own step with the `!cancelled()` guard, so one red gate never hides another.
- Never set `cancel-in-progress: true` on the `deploy` group. It could stop a deploy halfway.
- A new gate is unproven until it has been seen red. Break what it protects on a branch, open a pull request, and read the failing step.
