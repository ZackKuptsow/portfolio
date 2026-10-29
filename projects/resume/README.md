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
data/projects.ts  # The projects page: side projects and open source, each with its links and any demo
data/householdAssistantSms.ts  # The household assistant's SMS pages: brand, keyword, the three Twilio replies
public/           # Static assets
share-image/      # HTML source of the picture shown when the site is shared
test/             # Vitest suites, mirroring app/, components/ and data/
test-browser/     # Playwright checks of the built site in a real browser
test-built-site/  # Vitest suites that read the built site in out/
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

## The projects page

`/projects.html` (`app/projects/page.tsx`) lists side projects and open source, one card each,
from `data/projects.ts`. The footer of the home page links it. As with the household
assistant's pages, the `.html` is part of the address. Unlike them, it names itself as canonical
and is in the sitemap: the point of the page is to be found.

Every project gives a visitor somewhere to go: a link, or a recording to open. A project card
with neither is only a claim, so `ProjectEntry` does not compile without one or the other, and
`test/data/projects.test.ts` checks that each link is `https://` or a file in `public/`. A project
may carry a recording (`video`). The card then ends its link row with a control that opens the
recording in a `TerminalDialog`, the same window the get-resume button opens. Only the poster and
the file's metadata load with the page; closing the window pauses the recording.

The Save State card shows a `live site` link only when `NEXT_PUBLIC_SAVE_STATE_LIVE_URL` is set
at build time (see Environment). Leave it unset until the site is behind a login, so the card
offers no way to a site anyone could write to. Its code link waits on the repository being
public.

`test/data/projects.typecheck.ts` holds the values that must not compile: a project with no
links and no recording, and a card that is a link while also holding links or a control.

## The household assistant's pages

Three pages serve the Twilio A2P 10DLC campaign of the household assistant, an automated SMS
assistant whose users are, at present, the two adults of one household (the
`household-assistant` repository). The pages describe it as software: the campaign was rejected
on 2026-10-21 for reading as two people texting each other. The campaign's registration
links each one, so each address must keep answering:

| Address         | Source                 | What the campaign uses it for                                    |
| --------------- | ---------------------- | ---------------------------------------------------------------- |
| `/sms.html`     | `app/sms/page.tsx`     | The opt-in proof: the invitation, the consent text, the exchange |
| `/privacy.html` | `app/privacy/page.tsx` | The privacy policy                                               |
| `/terms.html`   | `app/terms/page.tsx`   | The terms, with their SMS Terms section                          |

The `.html` is part of the address. CloudFront serves a file by its exact name and has no rule
that adds an extension, so `/privacy` answers 404. Each page names itself as canonical, asks
search engines to leave it out, and is not in the sitemap: the pages are for the campaign's
reviewers and the household, not for a search for the name.

`data/householdAssistantSms.ts` holds the brand, the keyword, the text the pages share, and
the three messages Twilio sends in reply to the keyword, HELP and STOP. Those three are
configured in Twilio word for word. Change Twilio first, then this file, so the pages never
show a message the phone does not. `test/data/householdAssistantSms.test.ts` keeps each to one
GSM-7 segment, and `test/app/smsProgramPages.test.tsx` checks the statements Twilio's form
names: the page titles, the brand on every page, the rates disclosure, the non-sharing
statement, the SMS Terms section, and the consent text inside the call to action. The deploy's
live check requests all three pages.

## Search engines

The goal is that a search for "Zack Kuptsow" or "Zachary Kuptsow" finds this page.

| File                         | What it produces                                                                           |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `app/siteMetadata.ts`        | Title, description, canonical link, and link-preview tags                                  |
| `components/StructuredData/` | A schema.org `ProfilePage` naming the person, both name forms, and the public profiles     |
| `app/robots.ts`              | `/robots.txt`. It blocks nothing, the PDF included (see the infrastructure README)         |
| `app/sitemap.ts`             | `/sitemap.xml`: the home page and the projects page, stamped with the time of the build    |
| `app/opengraph-image.png`    | The share picture. `opengraph-image.alt.txt` is its alt text and must not end in a newline |

`robots.ts` and `sitemap.ts` each export `dynamic = 'force-static'`. The static export fails
without it.

After changing only `opengraph-image.alt.txt`, run `yarn clean` before a local build. The build
cache does not notice a change to that file alone, and the built page keeps the old text. CI
builds from a clean checkout, so it is not affected. That stops being true if the workflow ever
caches `.next/cache`. `yarn test:built-site` fails on a build that still carries the old text.

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
when the file is not the drawing of the address, which is what happens after `RESUME_PDF_PATH`
or `SITE_URL` changes. `resumePdf.test.ts` fails when `public/` holds no file at that path. To
redraw the code, from `projects/resume`:

```bash
yarn test -u test/components/GetResume/components/QrCodeOption/qrCodeArtwork.test.ts
```

That run rewrites the file and still ends red, on purpose, until two things are updated by hand:

- `RESUME_PDF_ADDRESS` in that test file. It is the address a phone must open, written out, so
  redrawing alone cannot point the code somewhere unintended.
- The size, if the address grew. At 42 characters the address is the longest a code of this
  size holds. A longer one makes the code 41 units a side, not 37. Set `QR_CODE_SIZE_PIXELS` to
  a multiple of 41, such as 205, and update the size `GetResume.test.tsx` expects.

CI runs these tests on every pull request and before every deploy, and never with `-u`. A
drawing that does not match the address fails there, and the deploy does not start.

A phone is not shown the code, because it cannot scan its own screen. "A phone" means a screen
narrower than Tailwind's `sm` breakpoint, 640px: the section carries `max-sm:hidden`, and the
link that opens the PDF stays. The rule looks at the width alone, so a phone held sideways still
gets the code and a narrow laptop window does not. jsdom ignores media queries, so the unit
tests check only that the class is there. `yarn test:browser` checks what it does, at 639px and
at 640px.

Scan the code in both themes after changing its colors: the dark theme draws it light on dark,
which older scanners can fail to read.

## Checks that need a build

`yarn test` reads the source. Two more suites read what `yarn build` wrote to `out/`, so run
the build first. CI runs both on every pull request and before every deploy.

`yarn test:built-site` (in `test-built-site/`) reads the files: the tags a search engine and a
link preview read in the built page, `robots.txt`, `sitemap.xml`, the PDF, the 404 page, and
whether every script, stylesheet and font the page asks for was written.

`yarn test:browser` (in `test-browser/`) opens the site in Chrome with Playwright, for what
jsdom cannot see:

- Every section appears when a visitor scrolls to it on a 360x640 phone.
- Nothing scrolls sideways at 15 widths from 320px to 1280px, with the get-resume window closed
  and open.
- The keyboard lands on the close button of the get-resume window, also when the window has to
  scroll.
- The QR code is shown at 640px wide and hidden at 639px.
- No script error on load or when the window opens.
- On the projects page, the Save State tour opens in a window that fits a phone and a laptop
  screen, Escape and the close button close it, and nothing scrolls sideways on a phone.

Playwright is a dev dependency pinned to an exact version. It drives the Google Chrome that is
already installed, on your machine and on the CI runner, so it downloads no browser. The site
is served from `out/` on port 4173 by `python3 -m http.server`, and the run fails if something
is already using that port, because that could be an older build. A page may talk to that
server only. Every other request is aborted, so no check can reach the resume API and send an
email, and a check fails when the page starts to depend on another site.

A failed check leaves a trace in `test-results/`. Open it with
`yarn playwright show-trace <path to trace.zip>`. CI keeps the folder for 7 days as the
`browser-check-traces` artifact of the run.

A new check is unproven until it has been seen red: break what it protects, build, and watch it
fail.

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
yarn test:built-site  # after a build: check the files in out/
yarn test:browser     # after a build: check the site in Chrome
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

One more value is optional. When it is set, the Save State card on the projects page gets a
`live site` link to it; unset, the card shows the code link only. Set it only once the site is
behind a login:

```bash
NEXT_PUBLIC_SAVE_STATE_LIVE_URL=https://dojo.kups.me
```

## Deployment

`yarn build` produces `out/`, which the **infrastructure** project uploads to S3 and serves through CloudFront. Pushing to `main` triggers the deploy workflow automatically. It deploys only when lint, format, typecheck, the tests and the build all pass (see "Checks" in the root README).
