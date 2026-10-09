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
data/identity.ts  # Who the site is about: name forms, role, location, email, profile links, site URL
data/profile.ts   # Resume content: work experience, education, skills, about copy
public/           # Static assets
share-image/      # HTML source of the picture shown when the site is shared
test/             # Vitest suites, mirroring app/, components/ and data/
```

## Content

Job highlights, skills and the bio in `data/profile.ts` are copied from the public resume, the
same source the PDF in `public/` is rendered from, so they match it word for word. Change the
resume first, then copy the wording here.

The page is not a full copy of the resume:

- It shows a selection of the highlights. Low Rate Co. has 7 of the resume's 9.
- The Qlik entry, the degree descriptions, `mission` and `specialty` exist only here.

`data/identity.ts` holds the name, role and city for the page chrome, the metadata and the
structured data. Prose spells them out by hand: the bio, `share-image/opengraph-image.html` and
`app/opengraph-image.alt.txt`. Change those too when a value in `identity.ts` changes.

Nothing a visitor reads may contain an em dash or an en dash. `test/data/copy.test.ts` checks
the data and the alt text, and `test/app/page.test.tsx` checks the rendered page.

`test/data/profile.typecheck.ts` holds values that must not compile, such as a job with nothing
to show. `yarn typecheck` enforces it. `yarn test` does not, because Vitest does not check types.

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
builds from a clean checkout, so it is not affected. That stops being true if the workflow ever
caches `.next/cache`.

The share picture is a committed PNG, not a generated route. A generated one is exported with
no file extension, and S3 would serve it with the wrong content type. To change it, edit
`share-image/opengraph-image.html` and render it again. The command is for macOS, runs from
`projects/resume`, and needs a network connection: the page loads its font from Google Fonts and
falls back to another font, without an error, when it cannot.

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --hide-scrollbars --window-size=1200,630 --force-device-scale-factor=1 \
  --virtual-time-budget=10000 --screenshot="$PWD/app/opengraph-image.png" \
  "file://$PWD/share-image/opengraph-image.html"
```

## QR code

The get-resume modal shows a QR code that opens the PDF on a phone. The code holds
`QR_CODE_ADDRESS` from `components/GetResume/components/QrCodeOption/constants.ts`: the site
URL followed by the PDF path.

The drawing is committed as `qrCodeArtwork.json` in that folder. The component draws it inline,
not as an image file, so the stylesheet can color it for each theme. `qr` makes the drawing and
is a dev dependency only, so nothing from it ships to visitors. `qrCodeArtwork.test.ts` fails
when the file is not the drawing of the address, which is what happens after the PDF is renamed
or the site moves. To redraw it, from `projects/resume`:

```bash
yarn test -u test/components/GetResume/components/QrCodeOption/qrCodeArtwork.test.ts
```

A phone is not shown the code, because it cannot scan its own screen. "A phone" means a screen
narrower than Tailwind's `sm` breakpoint, 640px: the section carries `max-sm:hidden`, and the
link that opens the PDF stays. The rule looks at the width alone, so a phone held sideways still
gets the code and a narrow laptop window does not. jsdom ignores media queries, so the tests
check only that the class is there. After changing it, check it in Chrome's device emulation.

Scan the code in both themes after changing its colors: the dark theme draws it light on dark,
which older scanners can fail to read.

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
yarn clean      # remove .next / dist / coverage
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
