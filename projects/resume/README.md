# resume

The portfolio site behind **[kups.me](https://kups.me)** — a Next.js 15 app exported to static HTML and served from S3 + CloudFront (provisioned by the [`infrastructure`](../infrastructure) project).

## Stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4** with CSS-variable theming and a light/dark toggle
- **Static export** — the build emits `out/`, which the infrastructure project deploys
- Small touches: a custom glow cursor and scroll fade-in animations

## Structure

```
app/             # App Router entry (layout, page, global styles)
components/      # UI components (Header, AboutMe, Card, ThemeToggle, GlowCursor, ...)
data/profile.ts  # Resume content: work experience, education, skills
public/          # Static assets
test/            # Vitest suites, mirroring components/
```

## Commands

From inside `projects/resume`:

```bash
yarn install    # install dependencies
yarn dev        # dev server (Turbopack)
yarn build      # production static export -> out/
python3 -m http.server 3000 --directory out  # serve the export on port 3000
yarn check      # lint + format check + typecheck
yarn check:fix  # autofix lint/format, then typecheck
yarn test       # run the Vitest suites once
yarn test:watch # re-run the suites on change
yarn clean      # remove .next / out / coverage
```

## Environment

The get-resume modal posts to the `send_resume` API. Its URL is inlined at build time, and
`yarn dev` and `yarn build` both fail if it is missing or malformed:

```bash
# projects/resume/.env.local (gitignored)
NEXT_PUBLIC_RESUME_REQUEST_API_URL=https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests
```

The value is the `ResumeRequestApiUrl` output of `SendResumeStack`. CI reads it from the
`RESUME_REQUEST_API_URL` repository variable. The API accepts browser requests only from
`https://kups.me` and `http://localhost:3000`, so test the form on port 3000. `next dev`
silently moves to 3001 when 3000 is busy, and every request from there fails CORS.

## Deployment

`yarn build` produces `out/`, which the **infrastructure** project uploads to S3 and serves through CloudFront. Pushing to `main` triggers the deploy workflow automatically.
