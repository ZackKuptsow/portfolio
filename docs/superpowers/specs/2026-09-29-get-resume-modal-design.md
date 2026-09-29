# Get-resume modal: design

Date: 2026-09-29 · Branch: `feat/resume-request-form` (from `origin/main` @ 82cb5e4)
Decisions were made on three companion pages (round 1: 15 questions, round 2: 7, round 3: 7).
Every choice below traces to one of them; the tables at the end record which.

## Goal

A visitor on kups.me clicks one button, gets a modal listing every way to get the resume,
and can either download the PDF or type their email address and receive the PDF by email.
The email backend (`projects/send_resume`) is deployed, verified end to end, and frozen for
this work; the modal adapts to its contract.

The modal is built so later delivery options are one subcomponent each:

- **Next PR:** a QR code that opens the PDF on the visitor's phone.
- **After that, a research spike:** whether texting the resume can be done for free. Server-sent
  SMS to US numbers appears to need a registered sending number with monthly and per-message
  fees (unverified). A visitor-side option such as an `sms:` link is the likely free route.
  The spike reports back before anything is built.

## Scope

In this PR:

- A trigger button replacing today's download button.
- A native `<dialog>` modal with two sections: download (today's button, moved) and email.
- The email request form, its seven states, and their copy.
- The API URL as a build-time env var, with a build guard, `.env.local`, a deploy.yml `env:`
  block and a GitHub repository variable.
- A test runner for `projects/resume` (Vitest, jsdom, Testing Library) and the tests below.
- `input` added to the site's focus-visible rules, a modal backdrop, and a scroll-lock rule.
- Docs: `projects/resume/README.md` and root `CLAUDE.md`.

Out of scope:

- Any backend change (CORS, rate limits, email content).
- QR, SMS.
- Running tests in CI (Task 3).
- The stale `data/profile.ts` and the metadata em dashes in `layout.tsx` (Task 2).
- The other root `CLAUDE.md` corrections tracked on issue #2.

## Backend contract (fixed)

- `POST ${NEXT_PUBLIC_RESUME_REQUEST_API_URL}`: path exactly `/resume-requests`, no trailing
  slash.
- The request has `Content-Type: application/json` and body `{"email": "<trimmed address>"}`.
  It is not credentialed: the API allows a specific origin without `allow-credentials`.
- Responses:

  | Status | Body | Meaning |
  |---|---|---|
  | 202 | `requestId` | Accepted, not delivered. Delivery is async, about 2 to 3 s. |
  | 400 | `issues` | Invalid request |
  | 429 | "Rate limit exceeded" | 1 per address or 5 per IP per UTC day; the body doesn't say which |
  | 500 | | Internal server error |
  | 429 | "Too Many Requests" | API Gateway throttle, 2 rps with a burst of 5. Whether it carries CORS headers is unverified; if it doesn't, the browser reports it as a failed fetch. |

- CORS origins are exactly `https://kups.me` and `http://localhost:3000`.
- The validator (zod 4.4.3, checked 2026-09-29):
  - rejects `a@b`, `not-an-email` and `""`
  - accepts and trims `"  you@company.com  "`
  - accepts `success@simulator.amazonses.com`

  Browsers accept `a@b` as `type="email"`, so a 400 is reachable whatever the page validates.

## Structure

```
app/page.tsx                       <DownloadButton /> becomes <GetResume />
components/GetResume/
  index.ts                         export { GetResume }
  GetResume.tsx                    trigger button, <dialog>, the option sections
  hooks.ts                         useModalDialog: open, close, click outside
  constants.ts                     dialog title, header path, section names
  components/
    DownloadIcon.tsx               the pulsing arrow, shared by the trigger and the link
    DownloadOption.tsx             git mv of components/DownloadButton.tsx, named export
    EmailOption/
      index.ts                     export { EmailOption }
      EmailOption.tsx              the form and its status message
      hooks.ts                     useResumeRequest: status + in-flight guard
      interpretResponse.ts         status code to outcome (Zack writes the body)
      requestResume.ts             the fetch call; never rejects
      constants.ts                 API URL (from the env var), copy for each state
      types.ts                     ResumeRequestOutcome, ResumeRequestStatus
test/components/GetResume/...      mirrors the tree above
```

The folder follows `~/.claude/rules/javascript-typescript.md` for the new code only. The other
flat components in `components/` are untouched, except `DownloadButton.tsx`, which moves
because the modal becomes its only consumer. It keeps its `href`, `download` attribute and
classes. The class list becomes a constant shared with the trigger, and the link gains
`flex-1` so it fills the section's width.

## The page

`app/page.tsx` renders `<GetResume />` where `<DownloadButton />` is today, inside the
existing `<ScrollFadeIn delay={800}>`.

The trigger is a `<button type="button" aria-haspopup="dialog">`. It keeps today's download
button styling and its pulsing icon, and reads `$ ./get_resume.sh`.

## The modal

- **Mechanism:** a native `<dialog>` opened with `showModal()`. No dependency. The browser:
  - puts it in the top layer
  - makes the page behind it inert
  - closes it on Escape
- **Name:** `aria-labelledby` points at the heading "Get the resume". The window header path
  reads `~/portfolio/get_resume.sh`.
- **First focus:** the browser default, the first focusable element, which is the close
  button. Focusing the email field instead would raise the phone keyboard over the modal.
- **Closing:**
  - the header button, visible text `esc ✕`, accessible name "Close (esc)". The name contains
    the visible text, as WCAG 2.5.3 requires.
  - Escape
  - a click on the backdrop. It counts only if the pointer press and the click both target the
    dialog element itself, so a text selection dragged out of the input does not close it.
  - A backdrop click is also ignored when it is the second click of a double-click
    (`event.detail > 1`). Double-clicking the trigger opens the dialog on the first click, and
    the second click lands on the backdrop.
- **Scroll lock:** `html:has(dialog[open]) { overflow: hidden; }` in `globals.css`.
- **Focus return:** browsers restore focus to the trigger on close. This is verified in the
  manual keyboard pass, because jsdom cannot prove it.
- **Persistence:** the dialog stays mounted while closed. A request sent before closing
  finishes, and its result shows on reopen. Only a page reload resets it.
- **Layout:** stacked sections, all visible at once.
  - `## download`: today's `$ wget resume.pdf` link, full width
  - `## email`: hint "have it emailed to you", then a command-line input
    `$ mail --to [you@company.com] [send ⏎]`

  Decorative `## ` and `$ mail --to` are `aria-hidden`.
- **Look:** reuses `.terminal-window` and `.terminal-header` (About Me). A `dialog::backdrop`
  adds the dim and a slight blur.

## The email option

### States

Each state has one piece of copy. None of the copy uses em or en dashes. Every error state
(`invalid`, `limited`, `server-error`, `network-error`) points to the download link one
section up.

| Status | Trigger | UI | Copy |
|---|---|---|---|
| `idle` | initial | input + send | placeholder `you@company.com`, button `send`, hidden label "Your email address" |
| `submitting` | submit with a non-empty value | input `readOnly`, button `aria-disabled` | One moment, then animated dots (CSS, `aria-hidden`) |
| `success` | 202 | form replaced by the message; focus moves to the message | Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam. |
| `invalid` | 400, or an empty value (no request) | `aria-invalid`, `aria-describedby` to the message, focus back to the input, value kept | That email address doesn't look right. Check it and try again, or use the download button. |
| `limited` | 429 from any source | form kept | This address or network already requested the resume today. Check your inbox, or try again tomorrow. The download button works any time. |
| `server-error` | 500 or any status not mapped elsewhere | form kept | Something went wrong on my end. Please use the download button instead. |
| `network-error` | fetch rejected with `TypeError` | form kept | Couldn't reach the server. Try again in a moment, or use the download button. |

From any state except `success`, a new submit starts over: an empty value goes straight to
`invalid`, anything else to `submitting`. `success` has no form left to submit from, so a
second request (which would 429) cannot overwrite a real success.

### Request path

- `useResumeRequest` holds the status and an in-flight **ref**. The ref is set synchronously
  on submit, so Enter and a click in the same tick produce exactly one fetch. React state
  alone can't guarantee that, because it is read before re-render.
- `requestResume(email)` POSTs with `credentials: 'omit'` and **never rejects**:
  - A resolved response goes through `interpretResumeRequestResponse(response.status)`.
  - A `TypeError` (offline, CORS, gateway 429 without CORS headers) becomes `network-error`.
  - Any other error is logged with `console.error` and becomes `server-error`.
- `interpretResumeRequestResponse(status: number): ResumeRequestOutcome` is pure and reads only
  the status. The body is never parsed, so a malformed body cannot break the mapping and raw
  `issues` strings cannot reach the page. **Zack writes its body.** The open choice inside it
  is exactly 202 versus any 2xx. Unmapped statuses become `server-error`.
- The form sets `noValidate`, so every invalid case has one presentation. The input keeps
  `type="email"`, `autoComplete="email"` and `required`.
- The status message is a `role="status"` region that is always in the DOM. It sits outside
  the form, so it survives the success swap.

### Color

Error text (`invalid`, `server-error`, `network-error`):

- Dark mode uses `--destructive`, at 5.3:1 on the card.
- Light mode uses `hsl(0 72% 42%)`, at 6.2:1 on the card. `--destructive` measures 3.6:1 there,
  below the 4.5:1 text minimum. All ratios were computed.

`limited` and `submitting` use `--muted-foreground`. `success` uses `--foreground`.

## Styling changes in `app/globals.css`

- Add `input` to both `:where(a, button, [tabindex]):focus-visible` rules (the light and
  `html.dark` variants).
- `html:has(dialog[open]) { overflow: hidden; }`.
- A dialog reset (no UA padding or border, transparent background, width capped) and the
  `::backdrop` style.
- An `--error-text` token (light `0 72% 42%`, dark equal to `--destructive`), registered as the
  `text-error-text` utility.
- `.loading-dots`: the animated `...` after "One moment". It uses `forwards` fill, so the
  site's reduced-motion rule leaves the dots showing rather than hiding them.

## API URL (env var)

- **Name and access:** `NEXT_PUBLIC_RESUME_REQUEST_API_URL`. `EmailOption/constants.ts` reads
  it as the literal `process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL`, the only form Next
  inlines at build time.
- **Build guard in `next.config.ts`:** `next build` and `next dev` fail unless the value
  - parses as a URL
  - is `https:`
  - has pathname exactly `/resume-requests`
  - has no trailing slash and no query string

  The guard must be watched failing for an unset value, a trailing slash and a wrong path.
  Next 15.3.4 loads `.env*` files before it evaluates the config: `loadConfig` calls
  `loadEnvConfig` (`next/dist/server/config.js:941`) before it locates and requires the config
  file. Checked 2026-09-29.
- **Types:** a `ProcessEnv` declaration types the value as `string`, backed by the guard.
- **Local:** `projects/resume/.env.local`, which the root `.gitignore` already ignores
  (`git check-ignore` confirmed).
- **CI:** the "Build `resume` site" step in `.github/workflows/deploy.yml` gets
  `env: NEXT_PUBLIC_RESUME_REQUEST_API_URL: ${{ vars.RESUME_REQUEST_API_URL }}`. A missing
  variable fails the build before the CDK deploy step, so the live site is left unchanged.
- **GitHub:** a **repository** variable `RESUME_REQUEST_API_URL`, created with
  `gh variable set` before merge, and only on Zack's go-ahead. The repo has no variables
  today; its one environment is `production`.
- **Value:** `https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests`. Re-derive
  it from the `SendResumeStack` output `ResumeRequestApiUrl`.
- **Tests:** `vitest.config.ts` sets a fake URL, so tests can never reach the real API, and
  asserts that exact URL is called.

## Tests

Test runner:

- devDependencies, installed through `__incident_guard_run corepack yarn`:
  - `vitest` ^3.2.4 (matches send_resume)
  - `jsdom`
  - `@testing-library/react`
  - `@testing-library/dom`
  - `@testing-library/user-event`
- `vitest.config.ts`: jsdom, `test/**/*.test.{ts,tsx}`, the `@/` alias, automatic JSX (the
  tsconfig has `jsx: preserve`), and the fake URL.
- A `yarn test` script. It is not in `yarn check` and not in CI.

**Settled 2026-09-29:** jsdom 30.1.1's `HTMLDialogElement` is an empty class, with no
`showModal()` or `close()`. A setup file stubs both, toggling `open`. Inertness, Escape and
focus return are therefore manual checks.

Every test below is watched failing before the code that passes it:

- **`interpretResponse`:**
  - 202 → success
  - 400 → invalid
  - 429 → limited
  - 500, 503, 404, 418 → server-error
  - 200: expected outcome set by Zack's exact-202-versus-2xx choice, added when he makes it
- **`requestResume`:**
  - the exact URL, method, header, body and `credentials: 'omit'` (a payload assertion)
  - 202 with a non-JSON body → success
  - `TypeError` → network-error
  - any other error → server-error, and `console.error` called
- **`EmailOption`:**
  - the accessible name "Your email address"
  - the status region is present before any submit
  - an empty submit sends 0 fetches and shows invalid
  - a 400 sets `aria-invalid`, keeps the value and focuses the input
  - a 202 replaces the form and focuses the message
  - a double submit while submitting sends **exactly 1** fetch
  - limited, server-error and network-error each show their copy and keep the form
- **`useResumeRequest`:**
  - trims the address before sending it
  - an address of only spaces is invalid and sends nothing
  - a retry after a network error sends a second request
- **`GetResume`:**
  - the trigger opens a dialog named "Get the resume"
  - the close button closes it
  - a backdrop click closes it; a click inside does not; a press inside with a release on the
    backdrop does not; the second click of a double-click on the trigger does not
  - the download link keeps its `href` and `download` attribute
  - a success is still shown after closing mid-request and reopening
- **Copy:** no visible string in either constants module contains an em or en dash. The test
  asserts the exact count of strings it examined.

## Verification (before calling it done)

1. `yarn check`, `yarn test` and `yarn build` all exit 0. The build guard fails for an unset
   value, a trailing slash and a wrong path.
2. Serve the export on port 3000 exactly:
   `python3 -m http.server 3000 --directory out`.
3. Submit `not-an-email`: the API returns 400 (Network tab) and the invalid state shows.
4. Submit `success@simulator.amazonses.com`: the success state shows, and the Step Functions
   execution SUCCEEDED (`aws stepfunctions list-executions`, profile `personal`).
5. Reload and submit the same address: limited (429).
6. Devtools set to offline: network-error.
7. Close the modal mid-request and reopen it: the result is shown.
8. A keyboard-only pass in light and dark:
   - the trigger opens the modal and focus lands inside
   - Tab stays inside
   - Escape closes it and focus returns to the trigger
   - the input focus ring is visible
9. A VoiceOver pass: the dialog name, the input label, and each status is announced.
10. The real email to zkups56@gmail.com, only if Zack wants it (it uses that address's daily
    slot).

## Rollout

- Commits and the PR happen only on Zack's go-ahead. The repo merges with merge commits.
- Create the GitHub variable before merge. Merging deploys kups.me immediately, with no
  staging.
- After the deploy, one real request from https://kups.me with a simulator address. SES
  documents `+label` simulator addresses, which would avoid the per-address limit already used
  that day; confirm before relying on it.

## Follow-ups

- The next PR adds a QR code section: one subcomponent folder plus one line in `GetResume.tsx`.
- An SMS research spike reports free options before any build.
- Tasks 2 and 3 from the handoff: profile data and metadata dashes, then CI tests.

## Decision record

Round 1 (form):

| # | Question | Pick |
|---|---|---|
| 1 | Placement | stacked under the button (superseded by the modal) |
| 2 | Look | terminal window card (now the modal chrome) |
| 3 | Invalid input | the page's own message, `noValidate` |
| 4 | After success | the message replaces the input |
| 5 | Idle copy | `you@company.com`, `send`, hidden label "Your email address" |
| 6 | Submitting copy | "One moment..." |
| 7 to 11 | State copy | option A for all |
| 12 | API URL | env var |
| 13 | Structure | colocated folder for new code |
| 14 | Tests | Vitest, jsdom, Testing Library |
| 15 | Contribution | Zack writes the status mapping |

Round 2 (modal):

| # | Question | Pick |
|---|---|---|
| 1 | The page | one button opens the modal; download inside |
| 2 | Button text | `$ ./get_resume.sh` |
| 3 | Layout | stacked sections |
| 4 | Mechanism | native `<dialog>` |
| 5 | Reopening | keep the result until reload |
| 6 | This PR | download and email; QR next |
| 7 | Texting | research spike after this PR |

Round 3 (design approval):

| # | Item | Result |
|---|---|---|
| 1 | Structure | approved |
| 2 | DownloadButton | move into the modal folder |
| 3 | Modal behavior | approved |
| 4 | Email option | approved |
| 5 | Env var | approved |
| 6 | GitHub variable | repository variable |
| 7 | Tests and rollout | approved |
