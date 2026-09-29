# resume

The portfolio site behind **[kups.me](https://kups.me)** — a Next.js 15 app exported to static HTML and served from S3 + CloudFront (provisioned by the [`infrastructure`](../infrastructure) project).

## Stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4** with CSS-variable theming and a light/dark toggle
- **Static export** — the build emits `out/`, which the infrastructure project deploys
- Small touches: a custom glow cursor and scroll fade-in animations

## Structure

```
app/              # App Router entry (layout, page, global styles), plus what search engines read
components/       # UI components (Header, AboutMe, Card, ThemeToggle, GlowCursor, ...)
data/identity.ts  # Who the site is about: name forms, role, location, profile links, site URL
data/profile.ts   # Resume content: work experience, education, skills, about copy
public/           # Static assets
share-image/      # HTML source of the picture shown when the site is shared
test/             # Vitest suites, mirroring app/, components/ and data/
```

## Content

The wording in `data/profile.ts` is copied from the public resume, the same source the PDF in
`public/` is rendered from, so the page and the PDF say the same thing. Change the resume first,
then copy the wording here.

Nothing a visitor reads may contain an em dash or an en dash. `test/data/copy.test.ts` checks
the data and `test/app/page.test.tsx` checks the rendered page.

## Search engines

The goal is that a search for "Zack Kuptsow" or "Zachary Kuptsow" finds this page.

| File                         | What it produces                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `app/siteMetadata.ts`        | Title, description, canonical link, and link-preview tags                                  |
| `components/StructuredData/` | A schema.org `ProfilePage` naming the person, both name forms, and the public profiles     |
| `app/robots.ts`              | `/robots.txt`. It blocks nothing, the PDF included (see the infrastructure README)         |
| `app/sitemap.ts`             | `/sitemap.xml`, stamped with the time of the build                                         |
| `app/opengraph-image.png`    | The share picture. `opengraph-image.alt.txt` is its alt text and must not end in a newline |

`robots.ts` and `sitemap.ts` each export `dynamic = 'force-static'`. The static export fails
without it.

After changing only `opengraph-image.alt.txt`, run `yarn clean` before a local build. The build
cache does not notice a change to that file alone, and the built page keeps the old text. CI
builds from a clean checkout, so it is not affected.

The share picture is a committed PNG, not a generated route. A generated one is exported with
no file extension, and S3 would serve it with the wrong content type. To change it, edit
`share-image/opengraph-image.html` and render it again:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --hide-scrollbars --window-size=1200,630 --force-device-scale-factor=1 \
  --virtual-time-budget=10000 --screenshot="$PWD/app/opengraph-image.png" \
  "file://$PWD/share-image/opengraph-image.html"
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
