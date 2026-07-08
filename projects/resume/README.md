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
```

## Commands

From inside `projects/resume`:

```bash
yarn install    # install dependencies
yarn dev        # dev server (Turbopack)
yarn build      # production static export -> out/
yarn start      # serve a production build
yarn check      # lint + format check + typecheck
yarn check:fix  # autofix lint/format, then typecheck
yarn clean      # remove .next / out / coverage
```

## Deployment

`yarn build` produces `out/`, which the **infrastructure** project uploads to S3 and serves through CloudFront. Pushing to `main` triggers the deploy workflow automatically.
