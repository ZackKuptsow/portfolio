# Get-resume modal: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace kups.me's one-click resume download with a `$ ./get_resume.sh` button that
opens a native `<dialog>`. The dialog offers the PDF download and delivery by email through
the deployed send_resume API.

**Architecture:** `components/GetResume/` is a colocated folder with a barrel. The trigger and
the dialog live in `GetResume.tsx`, and each delivery option is a subcomponent under
`components/`. The email option is layered:

- a pure status mapping, written by Zack
- a fetch wrapper that never rejects
- a hook with a ref-based in-flight guard
- a form that renders one live status region

The API URL is a build-time env var guarded in `next.config.ts`.

**Tech Stack:**
- Next.js 15.3.4 static export, React 19, Tailwind CSS 4
- Vitest 3, jsdom 30 and Testing Library, new to `projects/resume`

**Spec:** `docs/superpowers/specs/2026-09-29-get-resume-modal-design.md`. Read it first; it
holds the contract, the state table with the exact copy, and the decision record.

## Global Constraints

- **Node and yarn:** Node v24.20.0. Start every Bash call with
  `export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"`. Run every yarn command as
  `__incident_guard_run corepack yarn <args>` from `/Users/zack/Projects/portfolio/projects/resume`.
  Plain `corepack yarn` bypasses the supply-chain scan.
- **Paths:** use absolute paths and `git -C /Users/zack/Projects/portfolio`. The Bash working
  directory persists between calls and drifts.
- **Style (projects/resume):** Prettier with no semicolons, single quotes, 2-space indent,
  width 100 and trailing commas.
- **Import order:** ESLint `import/order` expects builtin, then external, then internal `@/`,
  then parent/sibling, then `import type` last. Each group is alphabetized, with a blank line
  between groups.
- **New code:**
  - named exports, and one barrel `index.ts` per component folder
  - TSDoc on every exported symbol
  - `'use client'` on files that use hooks
  - no magic strings (constants), alphabetized object keys
- **Copy:** visible strings are verbatim from the spec's state table. No em dash (U+2014) or en
  dash (U+2013) in any string a visitor sees.
- **devDependencies only:**
  - `vitest@^3.2.4`
  - `jsdom@^30.1.1`
  - `@testing-library/react@^16.3.3`
  - `@testing-library/dom@^10.4.2`
  - `@testing-library/user-event@^14.6.7`

  No new runtime dependency.
- **Backend is frozen:** nothing under `projects/send_resume` changes. CORS allows exactly
  `https://kups.me` and `http://localhost:3000`, so serve locally on port 3000 only.
- **SES is in production:** submit only `success@simulator.amazonses.com`. Use `+label`
  variants only after confirming them (Task 6). Never use made-up addresses, `bounce@` or
  `complaint@`.
- **Git:**
  - Commits are signed, and each message ends with
    `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.
  - `git push`, the PR, and `gh variable set` happen only on Zack's word.
  - Never `git checkout -- <file>`. Undo with a targeted reverse edit.
- **Guards:** a guard is verified only after its test has failed against deliberately broken
  code. Restore the code with a targeted edit and re-run the test green.

## Review Focus

Five failure modes the spec implies but that are easy to miss, most likely first. Each has a
test in the task that owns the code.

1. **Double-clicking `$ ./get_resume.sh`.** The first click opens the dialog, and the second
   lands on the backdrop. The dialog must stay open. The test is in Task 1, plus a real
   double-click in Chrome and Safari in Task 6, because only a browser sets `detail` from the
   OS click count.
2. **Retrying after a failure** (network error, 429, 500). The next submit must send a new
   request, which means the in-flight flag must clear on every outcome. The test is in Task 5
   (hook).
3. **Whitespace around the address, or only whitespace.** The address must be trimmed before
   sending, and whitespace alone is invalid with no request. The browser already strips it for
   `type="email"`, so only a hook-level test can go red. The test is in Task 5 (hook).
4. **Closing the dialog while a request is in flight** (Escape or the close button). The
   result must be shown on reopen, with no error. The test is in Task 5 (GetResume).
5. **The download link after the move.** It must keep `href="/Zachary_Kuptsow_Resume.pdf"`
   and its `download` attribute, because every error message points to it. The test is in
   Task 1.

---

### Task 1: Test runner, and the modal with the download option

**Files:**
- Modify: `projects/resume/package.json` (devDependencies, scripts), `projects/resume/yarn.lock`
- Create: `projects/resume/vitest.config.ts`, `projects/resume/test/setup.ts`
- Move: `projects/resume/components/DownloadButton.tsx` →
  `projects/resume/components/GetResume/components/DownloadOption.tsx`
- Create: `projects/resume/components/GetResume/index.ts`, `GetResume.tsx`, `hooks.ts`,
  `constants.ts`, `components/DownloadIcon.tsx`
- Modify: `projects/resume/app/page.tsx` (the `DownloadButton` import, and
  `<ScrollFadeIn delay={800}>`)
- Modify: `projects/resume/app/globals.css` (append the modal block)
- Modify: `projects/resume/README.md`, `CLAUDE.md` (repo root)
- Test: `projects/resume/test/components/GetResume/GetResume.test.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `GetResume()`, a component exported from `@/components/GetResume`
  - `useModalDialog(): ModalDialogControls` in `components/GetResume/hooks.ts`
  - constants in `components/GetResume/constants.ts`: `CLOSE_BUTTON_LABEL = 'Close (esc)'`,
    `CLOSE_BUTTON_TEXT`, `DIALOG_HEADER_PATH`, `DIALOG_TITLE = 'Get the resume'`,
    `RESUME_PDF_FILE_NAME`, `RESUME_PDF_PATH`, `SECTION_TITLE` (`download`, `email`),
    `TERMINAL_BUTTON_CLASS_NAME`, `TRIGGER_COMMAND = './get_resume.sh'`
  - The Vitest env sets `NEXT_PUBLIC_RESUME_REQUEST_API_URL` to
    `https://resume-requests.invalid/resume-requests`.

- [ ] **Step 1: Install the test dependencies**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn add --dev vitest@^3.2.4 jsdom@^30.1.1 @testing-library/react@^16.3.3 @testing-library/dom@^10.4.2 @testing-library/user-event@^14.6.7
```

Expected: exit 0, and `package.json` devDependencies list all five with those ranges.

- [ ] **Step 2: Add the test scripts**

In `projects/resume/package.json` `scripts`, insert these after `"start": "next start",`
(alphabetical order):

```json
    "test": "vitest run",
    "test:watch": "vitest",
```

- [ ] **Step 3: Write the Vitest config and setup file**

Create `projects/resume/vitest.config.ts`:

```ts
import path from 'node:path'

import { defineConfig } from 'vitest/config'

// Tests must never reach the deployed API. The `.invalid` top-level domain is reserved
// (RFC 2606) and never resolves. The tests assert this exact value was called.
const TEST_RESUME_REQUEST_API_URL = 'https://resume-requests.invalid/resume-requests'

export default defineConfig({
  esbuild: {
    // tsconfig keeps `jsx: preserve` for Next, so tests compile JSX here.
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname),
    },
  },
  test: {
    env: {
      NEXT_PUBLIC_RESUME_REQUEST_API_URL: TEST_RESUME_REQUEST_API_URL,
    },
    environment: 'jsdom',
    include: ['test/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['test/setup.ts'],
    unstubGlobals: true,
  },
})
```

Create `projects/resume/test/setup.ts`:

```ts
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Testing Library unmounts between tests on its own only when the runner exposes
// globals, and this config imports from vitest explicitly instead.
afterEach(() => {
  cleanup()
})

// jsdom 30 ships HTMLDialogElement as an empty class, with no showModal() or close().
// This stub only toggles `open` and fires `close`. Inertness, Escape and focus return
// are browser behavior, and they are checked by hand in Task 6.
if (typeof HTMLDialogElement.prototype.showModal !== 'function') {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
    this.dispatchEvent(new Event('close'))
  }
}
```

- [ ] **Step 4: Write the failing GetResume tests**

Create `projects/resume/test/components/GetResume/GetResume.test.tsx`:

```tsx
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { GetResume } from '@/components/GetResume'

import type { UserEvent } from '@testing-library/user-event'

const CLOSE_NAME = 'Close (esc)'
const DIALOG_NAME = 'Get the resume'
const TRIGGER_NAME = './get_resume.sh'

async function renderAndOpenDialog(user: UserEvent): Promise<HTMLElement> {
  render(<GetResume />)
  await user.click(screen.getByRole('button', { name: TRIGGER_NAME }))
  return screen.getByRole('dialog', { name: DIALOG_NAME })
}

describe('GetResume', () => {
  it('opens a dialog named "Get the resume" from the trigger', async () => {
    const user = userEvent.setup()
    render(<GetResume />)
    const trigger = screen.getByRole('button', { name: TRIGGER_NAME })

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByRole('dialog', { hidden: true }).hasAttribute('open')).toBe(false)

    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: DIALOG_NAME }).hasAttribute('open')).toBe(true)
  })

  it('closes from the close button', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    await user.click(within(dialog).getByRole('button', { name: CLOSE_NAME }))

    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('closes on a click that starts and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog, { detail: 1 })

    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('stays open on a click inside the window', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    await user.click(within(dialog).getByRole('heading', { name: DIALOG_NAME }))

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('stays open when a press inside the window is released on the backdrop', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    fireEvent.pointerDown(within(dialog).getByRole('heading', { name: DIALOG_NAME }))
    fireEvent.click(dialog, { detail: 1 })

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('stays open when the second click of a double-click on the trigger lands on the backdrop', () => {
    render(<GetResume />)
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }), { detail: 1 })
    const dialog = screen.getByRole('dialog', { name: DIALOG_NAME })

    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog, { detail: 2 })

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('offers the PDF download inside the dialog', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    const downloadLink = within(dialog).getByRole('link', { name: /wget resume\.pdf/ })

    expect(downloadLink.getAttribute('href')).toBe('/Zachary_Kuptsow_Resume.pdf')
    expect(downloadLink.getAttribute('download')).toBe('Zachary_Kuptsow_Resume.pdf')
  })
})
```

- [ ] **Step 5: Run the tests and confirm they fail**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn test test/components/GetResume/GetResume.test.tsx
```

Expected: FAIL. The suite fails to import, because `@/components/GetResume` does not resolve.
If it fails for any other reason (the JSX transform, the alias, jsdom), fix the config first.

- [ ] **Step 6: Move DownloadButton and write the shared pieces**

```bash
mkdir -p /Users/zack/Projects/portfolio/projects/resume/components/GetResume/components
git -C /Users/zack/Projects/portfolio mv projects/resume/components/DownloadButton.tsx projects/resume/components/GetResume/components/DownloadOption.tsx
```

Create `projects/resume/components/GetResume/constants.ts`:

```ts
/** Accessible name of the close button. It contains the visible text, per WCAG 2.5.3. */
export const CLOSE_BUTTON_LABEL = 'Close (esc)'

/** Visible text of the close button. */
export const CLOSE_BUTTON_TEXT = 'esc ✕'

/** Decorative path in the dialog's terminal window header. */
export const DIALOG_HEADER_PATH = '~/portfolio/get_resume.sh'

/** Visible heading of the dialog, and its accessible name. */
export const DIALOG_TITLE = 'Get the resume'

/** File name the browser saves the PDF as. */
export const RESUME_PDF_FILE_NAME = 'Zachary_Kuptsow_Resume.pdf'

/** Where the static export serves the PDF from (`public/`). */
export const RESUME_PDF_PATH = '/Zachary_Kuptsow_Resume.pdf'

/** Section headings inside the dialog, each shown after a decorative `## `. */
export const SECTION_TITLE = {
  download: 'download',
  email: 'email',
} as const

/** Shared by the trigger and the download link, so both keep the original button look. */
export const TERMINAL_BUTTON_CLASS_NAME = [
  'terminal-download-btn group relative overflow-hidden',
  'bg-primary text-background font-mono text-sm font-semibold',
  'px-6 py-3 rounded-lg border-2 border-primary',
  'hover:bg-transparent hover:text-primary',
  'transition-all duration-300 ease-out',
  'hover:shadow-glow hover:-translate-y-1',
  'before:absolute before:inset-0 before:bg-gradient-to-r',
  'before:from-transparent before:via-background/20 before:to-transparent',
  'before:-translate-x-full hover:before:translate-x-full',
  'before:transition-transform before:duration-700 before:ease-in-out',
].join(' ')

/** Command text on the button that opens the dialog. */
export const TRIGGER_COMMAND = './get_resume.sh'
```

Create `projects/resume/components/GetResume/components/DownloadIcon.tsx`:

```tsx
/** The pulsing download arrow shared by the trigger and the download link. Decorative. */
export function DownloadIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="animate-pulse drop-shadow-[0_0_10px_currentColor] transition-all duration-300
               group-hover:drop-shadow-[0_0_12px_currentColor] [animation-duration:3s]"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  )
}
```

Replace the entire contents of the moved
`projects/resume/components/GetResume/components/DownloadOption.tsx` with:

```tsx
import { RESUME_PDF_FILE_NAME, RESUME_PDF_PATH, TERMINAL_BUTTON_CLASS_NAME } from '../constants'
import { DownloadIcon } from './DownloadIcon'

/** The PDF download link. Every email error message points visitors back to it. */
export function DownloadOption() {
  return (
    <div className="flex">
      <a
        href={RESUME_PDF_PATH}
        target="_blank"
        rel="noopener noreferrer"
        className={`${TERMINAL_BUTTON_CLASS_NAME} flex-1`}
        download={RESUME_PDF_FILE_NAME}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span className="command-prompt">$</span>
          <span>
            wget <span className="underline underline-offset-2">resume.pdf</span>
          </span>
          <DownloadIcon />
        </span>
      </a>
    </div>
  )
}
```

- [ ] **Step 7: Write the dialog hook**

Create `projects/resume/components/GetResume/hooks.ts`:

```ts
'use client'

import { useCallback, useRef } from 'react'

import type { MouseEvent, PointerEvent, RefObject } from 'react'

// `MouseEvent.detail` counts rapid clicks, so anything above one is the second
// half of a double-click.
const SINGLE_CLICK_COUNT = 1

/** What `useModalDialog` hands to the component that renders the dialog. */
export type ModalDialogControls = {
  close: () => void
  dialogRef: RefObject<HTMLDialogElement | null>
  handleDialogClick: (event: MouseEvent<HTMLDialogElement>) => void
  handleDialogPointerDown: (event: PointerEvent<HTMLDialogElement>) => void
  open: () => void
}

/**
 * Drive a native `<dialog>` as a modal.
 *
 * `showModal()` supplies the inert page, focus containment and Escape. What it
 * lacks is closing on a backdrop click. The backdrop belongs to the dialog
 * element, and the terminal window fills the dialog's box, so a click whose
 * target is the dialog itself landed on the backdrop. It closes the dialog only
 * when:
 * - the press also started on the backdrop, so a text selection dragged out of
 *   the email field does not close it, and
 * - it is not the second click of a double-click. When the trigger is
 *   double-clicked, the first click opens the dialog and the second lands on
 *   the backdrop.
 */
export function useModalDialog(): ModalDialogControls {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const didPressStartOnBackdropRef = useRef(false)

  const open = useCallback(() => {
    dialogRef.current?.showModal()
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const handleDialogPointerDown = useCallback((event: PointerEvent<HTMLDialogElement>) => {
    didPressStartOnBackdropRef.current = event.target === event.currentTarget
  }, [])

  const handleDialogClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    const didClickEndOnBackdrop = event.target === event.currentTarget
    const isSecondClickOfDoubleClick = event.detail > SINGLE_CLICK_COUNT
    if (
      didPressStartOnBackdropRef.current &&
      didClickEndOnBackdrop &&
      !isSecondClickOfDoubleClick
    ) {
      event.currentTarget.close()
    }
    didPressStartOnBackdropRef.current = false
  }, [])

  return { close, dialogRef, handleDialogClick, handleDialogPointerDown, open }
}
```

- [ ] **Step 8: Write the component and its barrel**

Create `projects/resume/components/GetResume/GetResume.tsx`:

```tsx
'use client'

import { useId } from 'react'

import { DownloadIcon } from './components/DownloadIcon'
import { DownloadOption } from './components/DownloadOption'
import {
  CLOSE_BUTTON_LABEL,
  CLOSE_BUTTON_TEXT,
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TERMINAL_BUTTON_CLASS_NAME,
  TRIGGER_COMMAND,
} from './constants'
import { useModalDialog } from './hooks'

/**
 * The page's one way to get the resume: a terminal-styled button that opens a
 * modal listing every delivery option.
 *
 * The dialog stays mounted while it is closed, so a request started before
 * closing finishes in the background and its result is still shown on reopen.
 */
export function GetResume() {
  const titleId = useId()
  const { close, dialogRef, handleDialogClick, handleDialogPointerDown, open } = useModalDialog()

  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={open}
          className={`${TERMINAL_BUTTON_CLASS_NAME} cursor-pointer`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span aria-hidden="true" className="command-prompt">
              $
            </span>
            <span>{TRIGGER_COMMAND}</span>
            <DownloadIcon />
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="get-resume-dialog"
        onClick={handleDialogClick}
        onPointerDown={handleDialogPointerDown}
      >
        <div className="terminal-window shadow-card">
          <div className="terminal-header terminal-header-style gap-3 pl-16">
            <span className="flex-1 text-center font-mono text-xs text-primary sm:text-sm">
              {DIALOG_HEADER_PATH}
            </span>
            <button
              type="button"
              aria-label={CLOSE_BUTTON_LABEL}
              onClick={close}
              className="cursor-pointer rounded border border-border px-2 font-mono text-xs
                         text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {CLOSE_BUTTON_TEXT}
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <h2 id={titleId} className="font-mono text-xl font-bold text-primary">
              {DIALOG_TITLE}
            </h2>

            <section>
              <h3 className="mb-2 font-mono text-sm text-primary">
                <span aria-hidden="true">## </span>
                {SECTION_TITLE.download}
              </h3>
              <DownloadOption />
            </section>
          </div>
        </div>
      </dialog>
    </>
  )
}
```

Create `projects/resume/components/GetResume/index.ts`:

```ts
export { GetResume } from './GetResume'
```

- [ ] **Step 9: Run the tests and confirm they pass**

Run the Step 5 command. Expected: 7 passed, 0 failed.

- [ ] **Step 10: Watch both backdrop guards fail**

Each guard gets broken on purpose, the suite runs red on the named test, and then the guard is
restored.

1. In `components/GetResume/hooks.ts`, delete `didPressStartOnBackdropRef.current &&` from the
   `if`. Run the Step 5 command. Expected: exactly one FAIL, on "stays open when a press
   inside the window is released on the backdrop". Restore the line exactly.
2. Delete `&& !isSecondClickOfDoubleClick` from the `if`. Run it again. Expected: exactly one
   FAIL, on "stays open when the second click of a double-click on the trigger lands on the
   backdrop". Restore the line.
3. Run it once more. Expected: 7 passed.

If either broken variant still passes, stop. That test is not exercising its guard. Report it,
and don't continue.

- [ ] **Step 11: Put the trigger on the page**

In `projects/resume/app/page.tsx`, replace
`import DownloadButton from '@/components/DownloadButton'` with:

```tsx
import { GetResume } from '@/components/GetResume'
```

Move it so the internal imports stay alphabetized: it goes between `@/components/Footer` and
`@/components/Header`.

Then replace:

```tsx
        <ScrollFadeIn delay={800}>
          <DownloadButton />
        </ScrollFadeIn>
```

with:

```tsx
        <ScrollFadeIn delay={800}>
          <GetResume />
        </ScrollFadeIn>
```

Confirm nothing else imports the old file:
`git -C /Users/zack/Projects/portfolio grep -n "DownloadButton" -- projects/resume`. Expected:
no output. The command exits 1 when grep finds nothing, which is expected here.

- [ ] **Step 12: Style the dialog**

Append to `projects/resume/app/globals.css`:

```css
/*
 * Get-resume modal. The terminal window is the dialog's only visible box, so a
 * click whose target is the dialog element itself landed on the backdrop (see
 * useModalDialog). No display value is set here. The UA hides a closed dialog
 * with display: none, and overriding display would show the dialog while it is
 * closed.
 */
.get-resume-dialog {
  width: min(28rem, calc(100vw - 2rem));
  max-width: none;
  max-height: none;
  margin: auto;
  padding: 0;
  border: none;
  background: transparent;
  color: hsl(var(--foreground));
  overflow: visible;
}

/* The window scrolls, not the dialog, so a scrollbar can never count as the backdrop */
.get-resume-dialog .terminal-window {
  max-height: calc(100dvh - 2rem);
  overflow-y: auto;
}

/* Literal colors, because ::backdrop does not reliably inherit custom properties */
.get-resume-dialog::backdrop {
  background: hsl(0 0% 0% / 0.35);
  backdrop-filter: blur(2px);
}

html.dark .get-resume-dialog::backdrop {
  background: hsl(0 0% 0% / 0.7);
}

/* Keep the page behind an open modal from scrolling */
html:has(dialog[open]) {
  overflow: hidden;
}
```

- [ ] **Step 13: Document the test runner**

In `projects/resume/README.md`:

1. In the Structure block, add this line after `public/          # Static assets`:
   `test/            # Vitest suites, mirroring components/`
2. In the Commands block, add these after `yarn check:fix  # autofix lint/format, then typecheck`:

```
yarn test       # run the Vitest suites once
yarn test:watch # re-run the suites on change
```

In the repo-root `CLAUDE.md`:

1. In the "Resume Site (Next.js)" commands block, add these after the `yarn typecheck` line:

```
yarn test               # Run tests with Vitest
yarn test:watch         # Run tests in watch mode
```

2. In "## Testing", replace `- Resume project: Uses Next.js built-in testing setup` with:
   ``- Resume project: Uses Vitest with jsdom and Testing Library; suites in `test/` mirror `components/` ``
3. Replace ``- Test files located in `test/` directories, mirroring the `functions/` layout`` with:
   ``- Test files located in `test/` directories, mirroring the source layout (`functions/` in send_resume, `components/` in resume)``

- [ ] **Step 14: Lint, format, typecheck and build**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check:fix && __incident_guard_run corepack yarn check && __incident_guard_run corepack yarn test && __incident_guard_run corepack yarn build
grep -c 'get_resume.sh' out/index.html
grep -c '<dialog' out/index.html
```

Expected:
- every command exits 0
- `yarn test` reports 7 passed
- the first grep prints at least 1
- the second grep prints exactly 1

The dialog markup is in the static HTML. If `check:fix` rewrote any file outside this task's
list, stop and report it; the baseline was clean.

- [ ] **Step 15: Commit**

```bash
git -C /Users/zack/Projects/portfolio add projects/resume/package.json projects/resume/yarn.lock projects/resume/vitest.config.ts projects/resume/test projects/resume/components/GetResume projects/resume/components/DownloadButton.tsx projects/resume/app/page.tsx projects/resume/app/globals.css projects/resume/README.md CLAUDE.md
git -C /Users/zack/Projects/portfolio status --short
git -C /Users/zack/Projects/portfolio commit -F - <<'EOF'
feat(resume): open a get-resume modal from the resume button

The page's one-click download becomes a `$ ./get_resume.sh` button that
opens a native <dialog>, and the download link moves inside it. Backdrop
clicks close the dialog unless the press started inside the window or the
click is the second half of a double-click on the trigger. Adds Vitest,
jsdom and Testing Library to projects/resume.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

Expected: `status --short` shows the rename as `R  projects/resume/components/DownloadButton.tsx -> ...DownloadOption.tsx`
and no untracked files from this task. The commit is signed.

---

### Task 2: The API URL as a build-time env var, guarded

**Files:**
- Create: `projects/resume/environment.d.ts`
- Modify: `projects/resume/next.config.ts` (whole file)
- Create, not committed: `projects/resume/.env.local` (the root `.gitignore` ignores it)
- Modify: `.github/workflows/deploy.yml` (the "Build `resume` site" step)
- Modify: `projects/resume/README.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: nothing from Task 1.
- Produces: `process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL`, typed `string`. It is validated
  before any build or dev server starts. Task 4 reads it.

- [ ] **Step 1: Re-derive the URL from the stack**

```bash
AWS_PROFILE=personal aws sts get-caller-identity --query Account --output text
AWS_PROFILE=personal aws cloudformation describe-stacks --stack-name SendResumeStack --region us-east-1 --query "Stacks[0].Outputs[?OutputKey=='ResumeRequestApiUrl'].OutputValue" --output text
```

Expected: `654654426829`, then
`https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests`.

If the account is anything else, stop. `hbv` is a different org. If the session has expired,
ask Zack to run `! aws login --profile personal`. If he'd rather not, use the value above,
which was verified 2026-09-28, and say so in the task report.

- [ ] **Step 2: Write `.env.local` and confirm git ignores it**

Create `projects/resume/.env.local`:

```
NEXT_PUBLIC_RESUME_REQUEST_API_URL=https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests
```

```bash
git -C /Users/zack/Projects/portfolio check-ignore -v projects/resume/.env.local
```

Expected: `.gitignore:47:.env.local	projects/resume/.env.local`.

- [ ] **Step 3: Type the variable**

Create `projects/resume/environment.d.ts`:

```ts
/**
 * Build-time environment the site reads. next.config.ts validates every entry
 * before a build or dev server starts, which is what lets these be non-optional.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Full URL of the send_resume intake endpoint, ending in exactly /resume-requests. */
    readonly NEXT_PUBLIC_RESUME_REQUEST_API_URL: string
  }
}
```

- [ ] **Step 4: Write the build guard**

Replace the entire contents of `projects/resume/next.config.ts` with:

```ts
import type { NextConfig } from 'next'

const REQUIRED_PROTOCOL = 'https:'
const RESUME_REQUEST_API_PATH = '/resume-requests'
const RESUME_REQUEST_API_URL_VARIABLE = 'NEXT_PUBLIC_RESUME_REQUEST_API_URL'

/**
 * Fail the build unless the resume request API URL has exactly the shape the
 * deployed API accepts. Next inlines the value into the browser bundle, so a
 * typo would otherwise ship and surface only as a failed request on the live
 * site. Next loads `.env*` files before it evaluates this config.
 */
function assertResumeRequestApiUrl(value: string | undefined): void {
  if (!value) {
    throw new Error(
      `${RESUME_REQUEST_API_URL_VARIABLE} is not set. Put it in .env.local (see README.md).`,
    )
  }

  let url: URL
  try {
    url = new URL(value)
  } catch (error) {
    throw new Error(`${RESUME_REQUEST_API_URL_VARIABLE} is not a URL: ${value}`, { cause: error })
  }

  const problems = [
    url.protocol !== REQUIRED_PROTOCOL && `use ${REQUIRED_PROTOCOL}`,
    url.pathname !== RESUME_REQUEST_API_PATH &&
      `end in exactly ${RESUME_REQUEST_API_PATH}, with no trailing slash`,
    (url.search !== '' || url.hash !== '') && 'have no query string or fragment',
  ].filter((problem) => problem !== false)

  if (problems.length > 0) {
    throw new Error(
      `${RESUME_REQUEST_API_URL_VARIABLE} must ${problems.join(', ')}. Got: ${value}`,
    )
  }
}

assertResumeRequestApiUrl(process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL)

const nextConfig: NextConfig = {
  output: 'export',
}

export default nextConfig
```

- [ ] **Step 5: Watch the guard fail four ways, then pass**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
mv .env.local /tmp/resume.env.local.bak
__incident_guard_run corepack yarn build; echo "exit=$?"
mv /tmp/resume.env.local.bak .env.local
```

Expected: exit non-zero, and the output contains
`NEXT_PUBLIC_RESUME_REQUEST_API_URL is not set`. Confirm `.env.local` is back with
`test -f .env.local && echo restored`.

The next three runs rely on a shell variable overriding `.env.local`. The `Got:` value in each
message proves which value was checked.

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
for bad_url in \
  'https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests/' \
  'https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-request' \
  'http://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests'; do
  (export NEXT_PUBLIC_RESUME_REQUEST_API_URL="$bad_url"; __incident_guard_run corepack yarn build 2>&1 | grep -m1 'NEXT_PUBLIC_RESUME_REQUEST_API_URL must'); echo "---"
done
```

Expected: three lines, each ending in `Got: <that bad_url>`. The first two contain
`end in exactly /resume-requests, with no trailing slash`, and the third contains `use https:`.
A missing line means the build did not fail on that value. Stop and report it.

Then confirm the real value passes:

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn build; echo "exit=$?"
```

Expected: `exit=0`.

- [ ] **Step 6: Pass the variable to the CI build**

In `.github/workflows/deploy.yml`, replace:

```yaml
            - name: Build `resume` site
              working-directory: projects/resume
              run: yarn build
```

with:

```yaml
            - name: Build `resume` site
              working-directory: projects/resume
              env:
                  NEXT_PUBLIC_RESUME_REQUEST_API_URL: ${{ vars.RESUME_REQUEST_API_URL }}
              run: yarn build
```

A missing repository variable expands to an empty string. The guard then fails the build
before the CDK deploy step runs, and the live site is left unchanged.

- [ ] **Step 7: Document the variable**

In `projects/resume/README.md`, first delete this line from the Commands block:
`yarn start      # serve a production build`. `next start` does not serve an
`output: 'export'` build.

Add this line after `yarn build      # production static export -> out/`:
`python3 -m http.server 3000 --directory out  # serve the export on port 3000`

Then insert this section before `## Deployment`:

````markdown
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
````

In the repo-root `CLAUDE.md` "## Environment Variables", insert this before the line
`Load environment variables in infrastructure project using:`:

```markdown
The resume site build requires:
- `NEXT_PUBLIC_RESUME_REQUEST_API_URL` - the send_resume `ResumeRequestApiUrl` stack output. It is set locally in `projects/resume/.env.local` and in CI by the `RESUME_REQUEST_API_URL` repository variable. The build fails if it is missing or malformed.

```

- [ ] **Step 8: Check and commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check:fix && __incident_guard_run corepack yarn check && __incident_guard_run corepack yarn test
git -C /Users/zack/Projects/portfolio add projects/resume/environment.d.ts projects/resume/next.config.ts .github/workflows/deploy.yml projects/resume/README.md CLAUDE.md
git -C /Users/zack/Projects/portfolio status --short
git -C /Users/zack/Projects/portfolio commit -F - <<'EOF'
feat(resume): read the resume request API URL from a guarded env var

NEXT_PUBLIC_RESUME_REQUEST_API_URL is inlined at build time. next.config.ts
now fails the build unless it is https with the exact /resume-requests
path, so a typo cannot ship as a form that only fails on the live site.
The deploy workflow passes the RESUME_REQUEST_API_URL repository variable.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

Expected: `check` and `test` exit 0, with 7 tests passing. `status --short` does not list
`.env.local`.

---

### Task 3: The status → outcome mapping (Zack writes the body)

**Files:**
- Create: `projects/resume/components/GetResume/components/EmailOption/types.ts`
- Create: `projects/resume/components/GetResume/components/EmailOption/interpretResponse.ts`
- Test: `projects/resume/test/components/GetResume/components/EmailOption/interpretResponse.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type ResumeRequestOutcome = 'invalid' | 'limited' | 'network-error' | 'server-error' | 'success'`
  - `type ResumeRequestStatus = 'idle' | 'submitting' | ResumeRequestOutcome`
  - `interpretResumeRequestResponse(status: number): ResumeRequestOutcome`

- [ ] **Step 1: Write the types**

Create `projects/resume/components/GetResume/components/EmailOption/types.ts`:

```ts
/** How a resume request ended, in the terms the visitor is told. */
export type ResumeRequestOutcome =
  | 'invalid'
  | 'limited'
  | 'network-error'
  | 'server-error'
  | 'success'

/** Every state the email option can show: before, during, or after a request. */
export type ResumeRequestStatus = 'idle' | 'submitting' | ResumeRequestOutcome
```

- [ ] **Step 2: Write the failing tests**

Create `projects/resume/test/components/GetResume/components/EmailOption/interpretResponse.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import { interpretResumeRequestResponse } from '@/components/GetResume/components/EmailOption/interpretResponse'

import type { ResumeRequestOutcome } from '@/components/GetResume/components/EmailOption/types'

// The statuses the intake API and API Gateway actually return, plus unexpected
// ones that must never tell a visitor an email is coming.
const EXPECTED_OUTCOMES: ReadonlyArray<[number, ResumeRequestOutcome]> = [
  [202, 'success'],
  [400, 'invalid'],
  [404, 'server-error'],
  [418, 'server-error'],
  [429, 'limited'],
  [500, 'server-error'],
  [503, 'server-error'],
]

describe('interpretResumeRequestResponse', () => {
  it.each(EXPECTED_OUTCOMES)('maps %i to %s', (status, expectedOutcome) => {
    expect(interpretResumeRequestResponse(status)).toBe(expectedOutcome)
  })
})
```

- [ ] **Step 3: Write the scaffold**

Create `projects/resume/components/GetResume/components/EmailOption/interpretResponse.ts`:

```ts
import type { ResumeRequestOutcome } from './types'

/**
 * Map the intake API's HTTP status to what the visitor is told.
 *
 * Only the status decides. The body is never read, so a malformed body cannot
 * change the outcome, and the API's raw validation issues never reach the
 * page. The API returns:
 * - 202: accepted
 * - 400: invalid
 * - 429: rate limited, by the handler or by the API Gateway throttle
 * - 500: internal error
 *
 * Anything else is unexpected.
 */
export function interpretResumeRequestResponse(status: number): ResumeRequestOutcome {
  // TODO(zack): map `status` to an outcome, in 5 to 10 lines. The tests in
  // test/components/GetResume/components/EmailOption/interpretResponse.test.ts
  // list the required cases.
  //
  // Your call: is only 202 a success, or any 2xx? The API only ever returns
  // 202, so this decides what an unexpected 200 or 204 tells a visitor:
  // "an email is coming", or "use the download button".
  throw new Error(`interpretResumeRequestResponse is not implemented (status ${status})`)
}
```

- [ ] **Step 4: Run the tests and confirm they fail**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn test test/components/GetResume/components/EmailOption/interpretResponse.test.ts
```

Expected: 7 FAIL, each with `interpretResumeRequestResponse is not implemented`.

- [ ] **Step 5: Zack writes the body (human step)**

Stop and hand this over. Show Zack the failing output, the file path, and the one real
decision: exactly 202, or any 2xx.

When he's done, add one row to `EXPECTED_OUTCOMES` for `200` that records his decision. It is
`[200, 'success']` if any 2xx is a success, or `[200, 'server-error']` if only 202 is. Keep the
rows sorted by status.

- [ ] **Step 6: Run the tests and confirm they pass**

Run the Step 4 command. Expected: 8 passed.

- [ ] **Step 7: Check and commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check:fix && __incident_guard_run corepack yarn check
git -C /Users/zack/Projects/portfolio add projects/resume/components/GetResume/components/EmailOption projects/resume/test/components/GetResume/components/EmailOption
git -C /Users/zack/Projects/portfolio commit -F - <<'EOF'
feat(resume): map resume request statuses to what the visitor is told

Only the HTTP status decides the outcome, and the body is never read, so
a malformed body cannot change it and raw validation issues never reach
the page.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 4: The request and the copy

**Files:**
- Create: `projects/resume/components/GetResume/components/EmailOption/constants.ts`
- Create: `projects/resume/components/GetResume/components/EmailOption/requestResume.ts`
- Test: `projects/resume/test/components/GetResume/components/EmailOption/requestResume.test.ts`
- Test: `projects/resume/test/components/GetResume/copy.test.ts`

**Interfaces:**
- Consumes: `interpretResumeRequestResponse` and `ResumeRequestOutcome`/`ResumeRequestStatus`
  (Task 3); `process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL` (Task 2); the Task 1 constants in
  the copy test.
- Produces:
  - `requestResume(email: string): Promise<ResumeRequestOutcome>`, which never rejects
  - constants: `COMMAND_PREFIX`, `EMAIL_INPUT_LABEL`, `EMAIL_INPUT_PLACEHOLDER`,
    `EMAIL_SECTION_HINT`, `RESUME_REQUEST_API_URL`, `SEND_BUTTON_TEXT`,
    `STATUS_MESSAGE: Record<ResumeRequestStatus, string>` and
    `STATUS_TEXT_CLASS_NAME: Record<ResumeRequestStatus, string>`

- [ ] **Step 1: Write the failing request tests**

Create `projects/resume/test/components/GetResume/components/EmailOption/requestResume.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest'

import { requestResume } from '@/components/GetResume/components/EmailOption/requestResume'

// Set in vitest.config.ts. It deliberately differs from the real URL, so this
// proves the value comes from the environment.
const TEST_API_URL = 'https://resume-requests.invalid/resume-requests'

describe('requestResume', () => {
  it('posts the address as JSON to the configured URL, without credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    await requestResume('you@company.com')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(TEST_API_URL, {
      body: '{"email":"you@company.com"}',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
  })

  it('reports success for a 202 whose body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>not json</html>', { status: 202 })),
    )

    await expect(requestResume('you@company.com')).resolves.toBe('success')
  })

  it('reports a network error when fetch rejects with a TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(requestResume('you@company.com')).resolves.toBe('network-error')
  })

  it('reports a server error and logs it when anything else goes wrong', async () => {
    const unexpectedError = new Error('unexpected')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(unexpectedError))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(requestResume('you@company.com')).resolves.toBe('server-error')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Resume request failed unexpectedly',
      unexpectedError,
    )
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn test test/components/GetResume/components/EmailOption/requestResume.test.ts
```

Expected: FAIL. `requestResume` does not resolve.

- [ ] **Step 3: Write the constants**

Create `projects/resume/components/GetResume/components/EmailOption/constants.ts`:

```ts
import type { ResumeRequestStatus } from './types'

/** Decorative command text before the email field. It is hidden from screen readers. */
export const COMMAND_PREFIX = 'mail --to'

/** Accessible name of the email field. The field has no visible label. */
export const EMAIL_INPUT_LABEL = 'Your email address'

export const EMAIL_INPUT_PLACEHOLDER = 'you@company.com'

/** Visible line under the section heading. */
export const EMAIL_SECTION_HINT = 'have it emailed to you'

/**
 * The send_resume intake endpoint, which is the `ResumeRequestApiUrl` output of
 * SendResumeStack. Next inlines it at build time, and next.config.ts fails the
 * build when it is missing or malformed. Read it only in this literal form,
 * because Next does not inline `process.env` accessed any other way.
 */
export const RESUME_REQUEST_API_URL = process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL

export const SEND_BUTTON_TEXT = 'send'

/**
 * What the status region says in each state. The copy was approved by Zack,
 * with no em or en dashes. `submitting` gets animated dots from CSS.
 */
export const STATUS_MESSAGE: Record<ResumeRequestStatus, string> = {
  idle: '',
  invalid: "That email address doesn't look right. Check it and try again, or use the download button.",
  limited:
    'This address or network already requested the resume today. Check your inbox, or try again tomorrow. The download button works any time.',
  'network-error': "Couldn't reach the server. Try again in a moment, or use the download button.",
  'server-error': 'Something went wrong on my end. Please use the download button instead.',
  submitting: 'One moment',
  success:
    'Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam.',
}

/** Text color per state: red for errors, muted for waiting and limits, plain for success. */
export const STATUS_TEXT_CLASS_NAME: Record<ResumeRequestStatus, string> = {
  idle: '',
  invalid: 'text-error-text',
  limited: 'text-muted-foreground',
  'network-error': 'text-error-text',
  'server-error': 'text-error-text',
  submitting: 'text-muted-foreground',
  success: 'text-foreground',
}
```

- [ ] **Step 4: Write the request**

Create `projects/resume/components/GetResume/components/EmailOption/requestResume.ts`:

```ts
import { RESUME_REQUEST_API_URL } from './constants'
import { interpretResumeRequestResponse } from './interpretResponse'

import type { ResumeRequestOutcome } from './types'

/**
 * Send one resume request and report how it ended. This never rejects, so
 * the caller can always leave the submitting state.
 *
 * A `TypeError` from fetch means no response reached the page: the visitor is
 * offline, CORS blocked the request, or the API Gateway throttle answered
 * without CORS headers. The browser cannot tell those apart, so they share one
 * outcome. Any other error is unexpected. It is logged, and the visitor is sent
 * to the download.
 */
export async function requestResume(email: string): Promise<ResumeRequestOutcome> {
  try {
    const response = await fetch(RESUME_REQUEST_API_URL, {
      body: JSON.stringify({ email }),
      // The API allows the site's origin without `allow-credentials`, so CORS
      // would block a credentialed request.
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    return interpretResumeRequestResponse(response.status)
  } catch (error) {
    if (error instanceof TypeError) {
      return 'network-error'
    }
    console.error('Resume request failed unexpectedly', error)
    return 'server-error'
  }
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run the Step 2 command. Expected: 4 passed.

- [ ] **Step 6: Watch the status-only guard fail**

In `requestResume.ts`, insert `await response.json()` on the line before
`return interpretResumeRequestResponse(response.status)`. Run the Step 2 command.

Expected: exactly one FAIL, on "reports success for a 202 whose body is not JSON". The
`SyntaxError` becomes `server-error`. Delete the inserted line and run the command again.
Expected: 4 passed.

- [ ] **Step 7: Write the copy test and watch it fail**

Create `projects/resume/test/components/GetResume/copy.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import {
  COMMAND_PREFIX,
  EMAIL_INPUT_LABEL,
  EMAIL_INPUT_PLACEHOLDER,
  EMAIL_SECTION_HINT,
  SEND_BUTTON_TEXT,
  STATUS_MESSAGE,
} from '@/components/GetResume/components/EmailOption/constants'
import {
  CLOSE_BUTTON_LABEL,
  CLOSE_BUTTON_TEXT,
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TRIGGER_COMMAND,
} from '@/components/GetResume/constants'

// Writing Voice hard rule for anything a visitor reads.
const EM_OR_EN_DASH = /[–—]/
// 7 strings in GetResume/constants.ts and 12 in EmailOption/constants.ts.
const VISIBLE_STRING_COUNT = 19

describe('visible copy', () => {
  it('has no em or en dashes in any string a visitor sees', () => {
    const visibleStrings = [
      CLOSE_BUTTON_LABEL,
      CLOSE_BUTTON_TEXT,
      DIALOG_HEADER_PATH,
      DIALOG_TITLE,
      TRIGGER_COMMAND,
      ...Object.values(SECTION_TITLE),
      COMMAND_PREFIX,
      EMAIL_INPUT_LABEL,
      EMAIL_INPUT_PLACEHOLDER,
      EMAIL_SECTION_HINT,
      SEND_BUTTON_TEXT,
      ...Object.values(STATUS_MESSAGE),
    ]

    // Assert the exact count, so an empty or shortened list cannot pass unexamined.
    expect(visibleStrings).toHaveLength(VISIBLE_STRING_COUNT)
    expect(visibleStrings.filter((text) => EM_OR_EN_DASH.test(text))).toEqual([])
  })
})
```

Run it:
`__incident_guard_run corepack yarn test test/components/GetResume/copy.test.ts` (with the same
PATH export and `cd`). Expected: 1 passed.

Then change `DIALOG_TITLE` to `'Get the resume — now'` and run it again. Expected: FAIL,
and the diff lists that string. Restore `'Get the resume'` and run it again. Expected:
1 passed.

- [ ] **Step 8: Check and commit**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check:fix && __incident_guard_run corepack yarn check && __incident_guard_run corepack yarn test
git -C /Users/zack/Projects/portfolio add projects/resume/components/GetResume/components/EmailOption projects/resume/test/components/GetResume
git -C /Users/zack/Projects/portfolio commit -F - <<'EOF'
feat(resume): send resume requests and hold the form's copy

requestResume posts the address without credentials and never rejects:
a TypeError becomes network-error, and anything else is logged and
becomes server-error. A copy test asserts that no visible string
contains an em or en dash.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

Expected: `yarn test` reports 20 passed (7 + 8 + 4 + 1).

---

### Task 5: The email option in the modal

**Files:**
- Create: `projects/resume/components/GetResume/components/EmailOption/hooks.ts`
- Create: `projects/resume/components/GetResume/components/EmailOption/EmailOption.tsx`
- Create: `projects/resume/components/GetResume/components/EmailOption/index.ts`
- Modify: `projects/resume/components/GetResume/GetResume.tsx` (add the email section)
- Modify: `projects/resume/app/globals.css` (focus rules, the `--error-text` token, loading dots)
- Modify: `CLAUDE.md` (a Resume Site architecture bullet)
- Test: `projects/resume/test/components/GetResume/components/EmailOption/hooks.test.ts`
- Test: `projects/resume/test/components/GetResume/components/EmailOption/EmailOption.test.tsx`
- Test: `projects/resume/test/components/GetResume/GetResume.test.tsx` (one new test)

**Interfaces:**
- Consumes: `requestResume` and every Task 4 constant; `ResumeRequestStatus` (Task 3);
  `SECTION_TITLE.email` (Task 1).
- Produces:
  - `useResumeRequest(): ResumeRequestControls`, where
    `ResumeRequestControls = { status: ResumeRequestStatus; submitEmail: (email: string) => void }`
  - `EmailOption()`, a component exported from `./components/EmailOption`

- [ ] **Step 1: Write the failing hook tests**

Create `projects/resume/test/components/GetResume/components/EmailOption/hooks.test.ts`:

```ts
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useResumeRequest } from '@/components/GetResume/components/EmailOption/hooks'

const TEST_API_URL = 'https://resume-requests.invalid/resume-requests'

describe('useResumeRequest', () => {
  it('trims the address before sending it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('  you@company.com  ')
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      TEST_API_URL,
      expect.objectContaining({ body: '{"email":"you@company.com"}' }),
    )
  })

  it('treats an address of only spaces as invalid and sends nothing', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('   ')
    })

    expect(result.current.status).toBe('invalid')
    expect(fetchMock).toHaveBeenCalledTimes(0)
  })

  it('sends a new request when the visitor retries after a network error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('you@company.com')
    })
    await waitFor(() => expect(result.current.status).toBe('network-error'))
    act(() => {
      result.current.submitEmail('you@company.com')
    })
    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn test test/components/GetResume/components/EmailOption/hooks.test.ts
```

Expected: FAIL. `hooks` does not resolve.

- [ ] **Step 3: Write the hook**

Create `projects/resume/components/GetResume/components/EmailOption/hooks.ts`:

```ts
'use client'

import { useCallback, useRef, useState } from 'react'

import { requestResume } from './requestResume'

import type { ResumeRequestStatus } from './types'

/** What `useResumeRequest` hands to the form. */
export type ResumeRequestControls = {
  status: ResumeRequestStatus
  submitEmail: (email: string) => void
}

/**
 * Hold the email option's status, and send at most one request at a time.
 *
 * The in-flight flag is a ref, not state. A ref changes the moment it is set,
 * so an Enter and a click landing in the same tick still send one request. A
 * state flag would read as stale until the next render.
 */
export function useResumeRequest(): ResumeRequestControls {
  const [status, setStatus] = useState<ResumeRequestStatus>('idle')
  const isRequestInFlightRef = useRef(false)

  const submitEmail = useCallback((email: string) => {
    if (isRequestInFlightRef.current) {
      return
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail === '') {
      setStatus('invalid')
      return
    }

    isRequestInFlightRef.current = true
    setStatus('submitting')
    // requestResume never rejects, so this chain always ends by clearing the flag.
    void requestResume(trimmedEmail).then((outcome) => {
      isRequestInFlightRef.current = false
      setStatus(outcome)
    })
  }, [])

  return { status, submitEmail }
}
```

- [ ] **Step 4: Run the tests, then watch the retry and trim guards fail**

Run the Step 2 command. Expected: 3 passed.

1. Delete the line `isRequestInFlightRef.current = false`, then run. Expected: exactly one FAIL,
   on "sends a new request when the visitor retries after a network error" (the `waitFor`
   times out). Restore the line.
2. Change `const trimmedEmail = email.trim()` to `const trimmedEmail = email`, then run.
   Expected: two FAILs, on "trims the address..." and "treats an address of only spaces...".
   Restore the line.
3. Run once more. Expected: 3 passed.

- [ ] **Step 5: Write the failing EmailOption tests**

Create `projects/resume/test/components/GetResume/components/EmailOption/EmailOption.test.tsx`:

```tsx
import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmailOption } from '@/components/GetResume/components/EmailOption'

import type { UserEvent } from '@testing-library/user-event'

const EMAIL_LABEL = 'Your email address'
const INVALID_MESSAGE =
  "That email address doesn't look right. Check it and try again, or use the download button."
const LIMITED_MESSAGE =
  'This address or network already requested the resume today. Check your inbox, or try again tomorrow. The download button works any time.'
const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Try again in a moment, or use the download button."
const SERVER_ERROR_MESSAGE =
  'Something went wrong on my end. Please use the download button instead.'
const SUCCESS_MESSAGE =
  'Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam.'

// A fetch whose response the test releases when it chooses, so the submitting
// state can be observed and more submits attempted while it lasts.
function stubPendingFetch() {
  let resolveLatestResponse: (response: Response) => void = () => undefined
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        resolveLatestResponse = resolve
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, resolveLatest: (response: Response) => resolveLatestResponse(response) }
}

async function typeAndSend(user: UserEvent, email: string): Promise<void> {
  await user.type(screen.getByRole('textbox', { name: EMAIL_LABEL }), email)
  await user.click(screen.getByRole('button', { name: 'send' }))
}

describe('EmailOption', () => {
  it('labels the field and renders an empty status region before any submit', () => {
    render(<EmailOption />)
    const input = screen.getByRole('textbox', { name: EMAIL_LABEL })

    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('autocomplete')).toBe('email')
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('shows the invalid message, sends nothing, and focuses the field when it is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<EmailOption />)

    await user.click(screen.getByRole('button', { name: 'send' }))

    const input = screen.getByRole('textbox', { name: EMAIL_LABEL })
    expect(fetchMock).toHaveBeenCalledTimes(0)
    expect(screen.getByRole('status').textContent).toBe(INVALID_MESSAGE)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(input)
  })

  it('marks the field invalid on a 400, keeps the address, and returns focus to it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })))
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'a@b')

    const status = await screen.findByText(INVALID_MESSAGE)
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    expect(input.value).toBe('a@b')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(status.id)
    expect(document.activeElement).toBe(input)
  })

  it('replaces the form with the success message on a 202 and moves focus to it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    const status = await screen.findByText(SUCCESS_MESSAGE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(document.activeElement).toBe(status)
  })

  it.each([
    ['a 429', () => Promise.resolve(new Response(null, { status: 429 })), LIMITED_MESSAGE],
    ['a 500', () => Promise.resolve(new Response(null, { status: 500 })), SERVER_ERROR_MESSAGE],
    ['a TypeError', () => Promise.reject(new TypeError('Failed to fetch')), NETWORK_ERROR_MESSAGE],
  ])('after %s, shows its message and keeps the form', async (_label, respond, message) => {
    vi.stubGlobal('fetch', vi.fn(respond))
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    await screen.findByText(message)
    expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).not.toBeNull()
  })

  it('shows the waiting message while a request is in flight and ignores more submits', async () => {
    const { fetchMock, resolveLatest } = stubPendingFetch()
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    const sendButton = screen.getByRole('button', { name: 'send' })
    expect(screen.getByRole('status').textContent).toBe('One moment')
    expect(sendButton.getAttribute('aria-disabled')).toBe('true')
    expect(input.readOnly).toBe(true)

    await user.click(sendButton)
    await user.click(sendButton)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveLatest(new Response(null, { status: 202 }))
    })
    await screen.findByText(SUCCESS_MESSAGE)
  })

  it('sends exactly one request when two submits land before React re-renders', () => {
    const { fetchMock } = stubPendingFetch()
    render(<EmailOption />)
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    fireEvent.change(input, { target: { value: 'you@company.com' } })
    const form = input.form
    if (!form) {
      throw new Error('The email field is not inside a form')
    }

    act(() => {
      form.requestSubmit()
      form.requestSubmit()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 6: Run the tests and confirm they fail**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn test test/components/GetResume/components/EmailOption/EmailOption.test.tsx
```

Expected: FAIL. `@/components/GetResume/components/EmailOption` does not resolve.

- [ ] **Step 7: Write the component and its barrel**

Create `projects/resume/components/GetResume/components/EmailOption/EmailOption.tsx`:

```tsx
'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
  COMMAND_PREFIX,
  EMAIL_INPUT_LABEL,
  EMAIL_INPUT_PLACEHOLDER,
  EMAIL_SECTION_HINT,
  SEND_BUTTON_TEXT,
  STATUS_MESSAGE,
  STATUS_TEXT_CLASS_NAME,
} from './constants'
import { useResumeRequest } from './hooks'

import type { FormEvent } from 'react'

/**
 * The email delivery option: one address field that asks the send_resume API
 * to email the PDF, and a status line that reports how the request went.
 *
 * The status line is a live region that stays mounted outside the form, so it
 * still announces the result after a success removes the form.
 */
export function EmailOption() {
  const inputId = useId()
  const statusId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const [email, setEmail] = useState('')
  const { status, submitEmail } = useResumeRequest()

  const isInvalid = status === 'invalid'
  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  // Move focus to where the visitor needs it next: back to the field to fix
  // the address, or onto the message once the form it was in is gone.
  useEffect(() => {
    if (status === 'invalid') {
      inputRef.current?.focus()
    }
    if (status === 'success') {
      statusRef.current?.focus()
    }
  }, [status])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitEmail(email)
  }

  return (
    <div>
      <p className="mb-2 font-mono text-xs text-muted-foreground">{EMAIL_SECTION_HINT}</p>

      {!isSuccess && (
        <form
          noValidate
          onSubmit={handleSubmit}
          className={`flex items-center gap-2 rounded border bg-muted px-3 py-2 font-mono text-sm ${
            isInvalid ? 'border-error-text' : 'border-border'
          }`}
        >
          <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
            <span className="command-prompt">$</span>
            <span className="text-muted-foreground">{COMMAND_PREFIX}</span>
          </span>
          <label htmlFor={inputId} className="sr-only">
            {EMAIL_INPUT_LABEL}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder={EMAIL_INPUT_PLACEHOLDER}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={isSubmitting}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? statusId : undefined}
            className="min-w-0 flex-1 bg-transparent text-foreground caret-primary
                       placeholder:text-muted-foreground/60"
          />
          <button
            type="submit"
            aria-disabled={isSubmitting}
            className="shrink-0 cursor-pointer rounded border border-primary px-2 py-0.5 text-primary
                       transition-colors hover:bg-primary hover:text-background
                       aria-disabled:cursor-wait aria-disabled:opacity-50"
          >
            {SEND_BUTTON_TEXT} <span aria-hidden="true">⏎</span>
          </button>
        </form>
      )}

      <p
        ref={statusRef}
        id={statusId}
        role="status"
        tabIndex={-1}
        className={`mt-2 font-mono text-xs ${STATUS_TEXT_CLASS_NAME[status]}`}
      >
        {STATUS_MESSAGE[status]}
        {isSubmitting && <span aria-hidden="true" className="loading-dots" />}
      </p>
    </div>
  )
}
```

Create `projects/resume/components/GetResume/components/EmailOption/index.ts`:

```ts
export { EmailOption } from './EmailOption'
```

- [ ] **Step 8: Run the tests, then watch the same-tick guard fail**

Run the Step 6 command. Expected: 9 passed.

In `EmailOption/hooks.ts`, change `if (isRequestInFlightRef.current) {` to
`if (status === 'submitting') {`, and change the `useCallback` dependency list from `[]` to
`[status]`. Run the Step 6 command.

Expected: exactly one FAIL, on "sends exactly one request when two submits land before React
re-renders", with 2 calls.

Restore both edits and run again. Expected: 9 passed.

If the state-based variant passes, the two submits are being rendered between. The test is
then not exercising the same-tick path, so stop and report it.

- [ ] **Step 9: Add the email section to the dialog, with the persistence test**

In `projects/resume/components/GetResume/GetResume.tsx`, add this import after
`import { DownloadOption } from './components/DownloadOption'`:

```tsx
import { EmailOption } from './components/EmailOption'
```

Insert this section after the download `</section>`:

```tsx
            <section>
              <h3 className="mb-2 font-mono text-sm text-primary">
                <span aria-hidden="true">## </span>
                {SECTION_TITLE.email}
              </h3>
              <EmailOption />
            </section>
```

In `projects/resume/test/components/GetResume/GetResume.test.tsx`:

1. Change the first import to
   `import { act, fireEvent, render, screen, within } from '@testing-library/react'`.
2. Change the vitest import to `import { describe, expect, it, vi } from 'vitest'`.
3. Add this constant after `const DIALOG_NAME = 'Get the resume'`:

```tsx
const SUCCESS_MESSAGE =
  'Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam.'
```

4. Append this test inside the `describe`:

```tsx
  it('still shows the result after closing mid-request and reopening', async () => {
    let resolveResponse: (response: Response) => void = () => undefined
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((resolve) => {
            resolveResponse = resolve
          }),
      ),
    )
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    await user.type(
      within(dialog).getByRole('textbox', { name: 'Your email address' }),
      'you@company.com',
    )
    await user.click(within(dialog).getByRole('button', { name: 'send' }))
    await user.click(within(dialog).getByRole('button', { name: CLOSE_NAME }))
    expect(dialog.hasAttribute('open')).toBe(false)

    await act(async () => {
      resolveResponse(new Response(null, { status: 202 }))
    })
    await user.click(screen.getByRole('button', { name: TRIGGER_NAME }))

    expect(dialog.hasAttribute('open')).toBe(true)
    expect(within(dialog).getByRole('status').textContent).toBe(SUCCESS_MESSAGE)
  })
```

Run:
`__incident_guard_run corepack yarn test test/components/GetResume/GetResume.test.tsx` (with
the same PATH export and `cd`). Expected: 8 passed.

- [ ] **Step 10: Styles: input focus ring, error color, loading dots**

In `projects/resume/app/globals.css`:

1. Replace `:where(a, button, [tabindex]):focus-visible {` with
   `:where(a, button, input, [tabindex]):focus-visible {`.
2. Replace `html.dark :where(a, button, [tabindex]):focus-visible {` with
   `html.dark :where(a, button, input, [tabindex]):focus-visible {`.
3. In `@theme inline`, add this after `--color-destructive-foreground: hsl(var(--destructive-foreground));`:
   `  --color-error-text: hsl(var(--error-text));`
4. In the light `:root` theme block, add this after `  --destructive-foreground: 0 0% 100%;`:

```css

  /* Error text. --destructive measures 3.6:1 on the light card, below the 4.5:1 text minimum. */
  --error-text: 0 72% 42%;
```

5. In the `html.dark` block, add this after `  --accent-foreground: 120 100% 50%;`:

```css

  /* Error text: --destructive's value, 5.3:1 on the dark card */
  --error-text: 0 84.2% 60.2%;
```

6. Append to the end of the file:

```css
/*
 * Animated "..." after the submitting message. `forwards` matters: the
 * reduced-motion rule above cuts every animation to one near-instant run, and
 * without it the dots would snap back to width 0 and vanish.
 */
.loading-dots::after {
  content: '...';
  display: inline-block;
  width: 0;
  overflow: hidden;
  vertical-align: bottom;
  animation: loading-dots 1.2s steps(4, end) infinite forwards;
}

@keyframes loading-dots {
  to {
    width: 4ch;
  }
}
```

- [ ] **Step 11: Architecture note**

In the repo-root `CLAUDE.md`, under "### Resume Site", add this after
`- Static export deployed to S3 via CloudFront`:

```markdown
- Get-resume modal (`components/GetResume/`): a native `<dialog>` offering the PDF download and delivery by email through the send_resume API
```

- [ ] **Step 12: Full check, build, and bundle check**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check:fix && __incident_guard_run corepack yarn check && __incident_guard_run corepack yarn test && __incident_guard_run corepack yarn build
echo "real URL in bundle: $(grep -rl 'qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests' out/_next/static | wc -l | tr -d ' ')"
echo "test URL in bundle: $(grep -rl 'resume-requests.invalid' out | wc -l | tr -d ' ')"
```

Expected:
- every command exits 0
- `yarn test` reports 33 passed (20 + 3 hook + 9 EmailOption + 1 GetResume)
- the real URL appears in at least 1 file
- the test URL appears in 0 files

Both counts are printed, so an empty `out/` cannot read as a pass.

- [ ] **Step 13: Commit**

```bash
git -C /Users/zack/Projects/portfolio add projects/resume/components/GetResume projects/resume/test projects/resume/app/globals.css CLAUDE.md
git -C /Users/zack/Projects/portfolio status --short
git -C /Users/zack/Projects/portfolio commit -F - <<'EOF'
feat(resume): email the resume from the get-resume modal

The modal's email section posts the address to the send_resume API and
reports one of seven states in a live region. A ref-based in-flight
guard keeps a double submit to one request. Light-mode error text gets
its own token, because the destructive red measures 3.6:1 on the card.

Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>
EOF
```

---

### Task 6: Live verification, the GitHub variable, and PR readiness

No new code. Any defect found here gets fixed in the task that owns the file, with a test
first, and then this task resumes. The browser steps need Zack at the keyboard. Claude reads
the backend side.

**Files:** none, unless a defect is found.

**Interfaces:**
- Consumes: the whole branch.
- Produces: evidence for the PR body, and the `RESUME_REQUEST_API_URL` repository variable.

- [ ] **Step 1: Fresh build and serve on port 3000**

```bash
export PATH="$HOME/.nvm/versions/node/v24.20.0/bin:$PATH"
cd /Users/zack/Projects/portfolio/projects/resume
__incident_guard_run corepack yarn check && __incident_guard_run corepack yarn test && __incident_guard_run corepack yarn build
lsof -nP -iTCP:3000 -sTCP:LISTEN || echo "port 3000 free"
```

Then start `python3 -m http.server 3000 --directory /Users/zack/Projects/portfolio/projects/resume/out`
in the background. Zack opens `http://localhost:3000`, and no other port works.

- [ ] **Step 2: Confirm the AWS identity and today's rate-limit budget**

```bash
AWS_PROFILE=personal aws sts get-caller-identity --query Account --output text
AWS_PROFILE=personal aws dynamodb scan --table-name SendResumeStack-RequestsTable419243C7-1LM3XK4BXAWC1 --region us-east-1 --output json --query 'Items[].requestKey.S'
```

Expected: `654654426829`, then today's counter keys. If
`email:success@simulator.amazonses.com#<today>` is already present, step 4 will return 429.
Use a labeled simulator address from step 3 instead. Don't delete counters without asking
Zack.

- [ ] **Step 3: Confirm labeled simulator addresses before relying on them**

Fetch the SES mailbox simulator documentation (WebFetch,
`https://docs.aws.amazon.com/ses/latest/dg/send-an-email-from-console.html`, or search
"SES mailbox simulator labels"). Confirm that addresses like
`success+label@simulator.amazonses.com` are accepted. If they aren't, the mid-request and
post-deploy checks each need a UTC day of their own, or a counter reset that Zack approves.

- [ ] **Step 4: Browser checks (Zack), backend checks (Claude)**

For each check, Zack reports what the page showed, and Claude confirms the backend side.

| # | Action on http://localhost:3000 | Expected on the page | Backend confirmation |
|---|---|---|---|
| a | Click `$ ./get_resume.sh`, then submit `not-an-email` | the invalid message, a red field border, focus in the field | Network tab: POST `/resume-requests` returns 400, with an `access-control-allow-origin` header |
| b | Submit `success@simulator.amazonses.com` | "One moment" with moving dots, then the success message | `aws stepfunctions list-executions --state-machine-arn arn:aws:states:us-east-1:654654426829:stateMachine:SendResumeStateMachine0C80FCCA-JBcSdLnTDiTl --max-results 3` (profile `personal`) shows a new `SUCCEEDED` execution |
| c | Reload, then submit the same address | the limited message; the form stays | Network: 429; no new execution |
| d | Devtools Network set to Offline, then submit any simulator address | the network-error message | the Network tab shows the POST failed with no response |
| e | Back online. Submit `success+close@simulator.amazonses.com` (only if step 3 confirmed labels) and press Escape at once, then reopen | the success message is shown after reopening | a new `SUCCEEDED` execution |
| f | Double-click `$ ./get_resume.sh`, in Chrome and in Safari | the modal opens and stays open | none |
| g | Keyboard only, in light and dark: Tab to the trigger, press Enter, Tab through, Escape | focus lands inside; Tab cycles inside; Escape closes; focus returns to the trigger; the input's focus ring is visible in both themes | none |
| h | VoiceOver (Cmd+F5): open the modal, go to the field, submit an empty value, then a valid one | hears "Get the resume, dialog", "Your email address", then each status message | none |
| i | Only if Zack wants the real email: submit `zkups56@gmail.com` | success, and the email arrives with the PDF attached | uses that address's slot for the UTC day |

Record each result as pass or fail, with what was seen. A fail stops this task. Go back to the
owning task, fix it test-first, then redo the failed rows.

- [ ] **Step 5: Stop the local server**

Kill the background `http.server` process started in step 1.

- [ ] **Step 6: Create the GitHub repository variable (only on Zack's word)**

Ask Zack. On a yes:

```bash
gh variable set RESUME_REQUEST_API_URL --body 'https://qp11fvbq77.execute-api.us-east-1.amazonaws.com/resume-requests'
gh variable list
```

Expected: `gh variable list` shows `RESUME_REQUEST_API_URL` with that value. The variable has
to exist before merge, because otherwise the deploy build fails at the guard, which is safe
but blocks the deploy.

- [ ] **Step 7: Final review, push and PR (only on Zack's word)**

1. Run a whole-branch review against `origin/main`, for example the `fresh-eyes-review` skill.
   Address its findings before pushing.
2. Push, and open the PR:
   - Its body summarizes the change, links the spec and the plan, and includes the Task 6
     results table.
   - It lists the follow-ups: the QR section next, the SMS spike, Tasks 2 and 3.
   - It ends with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
3. Tell Zack that merging deploys kups.me immediately. After the deploy run succeeds, make one
   request from `https://kups.me` with a labeled simulator address, and confirm a `SUCCEEDED`
   execution.
