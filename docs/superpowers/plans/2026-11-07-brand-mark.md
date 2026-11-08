# The Bracket cup on kups.me Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Bracket cup in the nine places the design lists, with a one-word switch between the three marks.

**Architecture:** One data module (`projects/resume/brand/marks.ts`) holds each mark's shapes, with the letters already outlined, and its typed drawing, plus `ACTIVE_MARK`. React draws the active mark inline (title bar, 404), the typed shell prints its drawing, and a Node script renders every image file from it and writes a record that a test checks.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Vitest, Playwright with the installed Chrome, Node 24 type stripping for the generator, `uv` for the one-off outline script, AWS SES (send_resume).

**Spec:** `docs/superpowers/specs/2026-11-07-brand-mark-design.md`

## Global Constraints

- Mark geometry: tile `#121212` with `rx="14"` on a 64 grid, ink `#00ff00`, brackets `M21 15 H14 V50 H21` and `M39 15 H46 V50 H39`, handle `M46 22 C 60 22, 60 44, 46 44` (round cap), stroke 4.5, round joins.
- Letters are path data from `brand/outline_letters.py`: JetBrains Mono `app/fonts/jetbrains-mono/latin.woff2`, weight 700. Bracket cup: size 19, ink centered on (30, 32.5). zk monogram: size 34, ink centered on (32, 32). No shipped SVG contains `<text>`.
- No new npm dependency. `yarn build` needs no network.
- No visitor-facing words beyond `logo.txt`, its drawing, and the egg-style fallback `logo.txt: window too narrow`. Marks are `aria-hidden` or `alt=""`.
- No em or en dash in anything a visitor reads. No comments or jokes in output.
- Leave every scroll distance and animation time in `components/Terminal/constants.ts` alone.
- Node commands: `PATH=/Users/zack/.nvm/versions/node/v24.20.0/bin:/usr/bin:/bin:/opt/homebrew/bin __incident_guard_run corepack yarn <script>`, run from the project folder. Written below as `yarn <script>`.
- Every new guard is seen failing once before it is trusted.
- Merging deploys kups.me, and send_resume is deployed separately after it. Both wait for Zack.

## Review Focus

- **Light theme:** the title bar and 404 marks stay a dark tile with green ink, crisp, at their size. Checked in Task 7's browser pass in both themes.
- **Phone width (320 pixels):** the title bar mark does not push the plain-view or menu controls off screen, and `cat logo.txt` prints whole. Task 3 tests the narrow fallback. Task 7 checks the title bar at 320.
- **A switch without regenerating:** changing `ACTIVE_MARK`, or one mark's shapes, without running the generator turns `generatedFiles.test.ts` red. Task 4 watches it fail both ways.
- **Plain view and no script:** the title bar mark is decoration and adds nothing a screen reader reads. `page.test.tsx` already checks `aria-hidden` decoration; Task 2 adds the mark to it.
- **A mail app blocking images:** the signature keeps its layout, because the image has width and height, and the plain-text part is unchanged. Task 5 pins both.

---

### Task 1: Mark data, outlines and the SVG writer

**Files:**
- Create: `projects/resume/brand/outline_letters.py` (written and checked: 0.1% of inked pixels differ from Chrome's rendering at 1024 pixels, 26% at the wrong weight)
- Create: `projects/resume/brand/marks.ts`, `projects/resume/brand/markSvg.ts`, `projects/resume/brand/pathBounds.ts`
- Test: `projects/resume/test/brand/marks.test.ts`, `projects/resume/test/brand/markSvg.test.ts`

**Interfaces:**
- Produces:
  - `type MarkName = 'bracket-cup' | 'terminal-mug' | 'zk-monogram'`
  - `type MarkShape = { d: string; kind: 'fill' } | { d: string; kind: 'stroke'; lineCap?: 'round'; width: number }` (every stroke has round joins)
  - `type Mark = { drawing: readonly string[]; shapes: readonly MarkShape[] }`
  - `MARKS: Record<MarkName, Mark>`, `ACTIVE_MARK: MarkName = 'bracket-cup'`
  - `MARK_GRID_SIZE = 64`, `MARK_TILE_CORNER_RADIUS = 14`, `MARK_TILE_COLOR = '#121212'`, `MARK_INK_COLOR = '#00ff00'`
  - `toMarkSvg(mark: Mark, tileShape: 'rounded' | 'square'): string`, a standalone SVG document with `xmlns`
  - `pathBounds(d: string): { bottom: number; left: number; right: number; top: number }` for absolute `M L H V Z` paths
- `marks.ts` has no imports, so Node's type stripping can load it.

- [ ] **Step 1: Write the failing tests.** `marks.test.ts`: `ACTIVE_MARK` is `'bracket-cup'`. The bracket cup's drawing equals the design's seven lines exactly. The other two drawings equal the design's. No drawing line ends in a space. The bracket cup's fill shape's `pathBounds` centre is (30, 32.5) and the zk monogram's is (32, 32), each within 0.01. `markSvg.test.ts`: `toMarkSvg` output contains no `<text`, contains `rx="14"` for `'rounded'` and no `rx` on the tile for `'square'`, and every shape's `d` appears in it.
- [ ] **Step 2: Run `yarn test test/brand`.** Expected: FAIL, the modules do not exist.
- [ ] **Step 3: Outline the letters.** `uv run brand/outline_letters.py app/fonts/jetbrains-mono/latin.woff2 zk 19 30 32.5 700` and `... zk 34 32 32 700`. Paste each `d` into `marks.ts`. Terminal mug shapes from `.superpowers/brand-mark/terminal-mug.svg`, with its rect and lines written as paths: rect `M15 13 H37 A6 6 0 0 1 43 19 V45 A6 6 0 0 1 37 51 H15 A6 6 0 0 1 9 45 V19 A6 6 0 0 1 15 13 Z` width 5, line `M9 23 H43` width 4, chevron `M18 30 L24 36 L18 42` width 4.5 round cap, underscore `M28 42 H36` width 4.5 round cap, handle `M43 26 C 58 26, 58 44, 43 44` width 5 round cap.
- [ ] **Step 4: Implement `marks.ts`, `markSvg.ts` and `pathBounds.ts`.**
- [ ] **Step 5: Run `yarn test test/brand`.** Expected: PASS. Then move the bracket cup's letters 0.5 right in a scratch copy and watch the centring test fail.
- [ ] **Step 6: Commit** `feat(resume): the three marks as data, with outlined letters`.

### Task 2: The mark in the title bar and on the 404 page

**Files:**
- Create: `projects/resume/components/BrandMark/BrandMark.tsx`
- Modify: `projects/resume/components/Terminal/components/TitleBar.tsx`, `projects/resume/components/Terminal/terminal.css`, `projects/resume/app/not-found.tsx`
- Test: `projects/resume/test/components/BrandMark/BrandMark.test.tsx`, `projects/resume/test/app/page.test.tsx`, `projects/resume/test/app/notFound.test.tsx`

**Interfaces:**
- Consumes: `MARKS`, `ACTIVE_MARK`, the `MARK_*` constants from Task 1.
- Produces: `BrandMark({ className }: { className?: string }): JSX.Element`, an inline `<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">` of the active mark on the rounded tile.

- [ ] **Step 1: Write the failing tests.** `BrandMark.test.tsx`: the svg is `aria-hidden="true"`, has no `<text>`, and has one path per shape of `MARKS[ACTIVE_MARK]`. `page.test.tsx`: the title bar holds exactly one `svg` and it sits after `.terminal-dots` and before `.terminal-title`. `notFound.test.tsx`: the 404 page renders one `aria-hidden` svg before the `404` heading, and its accessible text is still only `404` and the message.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** Title bar: `<BrandMark className="terminal-title-mark" />` between the dots and the title. CSS: 18 pixels square, `flex-shrink: 0`, `margin-left: 0.5rem`, no glow. 404: the mark at 48 pixels above the heading, inside the existing column.
- [ ] **Step 4: Run `yarn test`.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(resume): the mark in the title bar and on the 404 page`.

### Task 3: `cat logo.txt`

**Files:**
- Modify: `projects/resume/components/Terminal/shell/fakeFileSystem.ts`, `projects/resume/components/Terminal/shell/commandTable.ts`, `projects/resume/components/Terminal/shell/eggCommands.ts` (export `widestRow` and `WINDOW_TOO_NARROW`)
- Test: `projects/resume/test/components/Terminal/shell/fakeFileSystem.test.ts`, `projects/resume/test/components/Terminal/shell/runCommandLine.test.ts`, `projects/resume/test-browser/typedCommands.spec.ts`

**Interfaces:**
- Consumes: `MARKS`, `ACTIVE_MARK`.
- Produces: `FileContent` gains `{ kind: 'drawing'; lines: readonly string[] }`. `LOGO_FILE = 'logo.txt'` in `~/portfolio`.

- [ ] **Step 1: Write the failing tests.** `fakeFileSystem.test.ts`: the `~/portfolio` listing is `developer.profile, education/, get_resume.sh, logo.txt, projects/, skills/, work_experience/`, and the `-a` listing in the egg test gains `logo.txt` too. `findNode(root, '~/portfolio/logo.txt')` is `{ content: { kind: 'drawing', lines: MARKS[ACTIVE_MARK].drawing }, kind: 'file' }`. `runCommandLine.test.ts`: `cat logo.txt` at 80 columns gives `art` equal to the drawing, no lines, exit 0. At 10 columns it gives no `art` and the line `logo.txt: window too narrow`. `typedCommands.spec.ts`: typing `cat logo.txt` shows a `pre` whose text is the seven lines, readable whole.
- [ ] **Step 2: Run the unit tests.** Expected: FAIL.
- [ ] **Step 3: Implement.** `buildFileSystem` sets the file. `print` handles `'drawing'` the way `runEgg` handles a drawing with no lines.
- [ ] **Step 4: Run `yarn test`.** Expected: PASS. The browser test runs in Task 7, after a build.
- [ ] **Step 5: Commit** `feat(resume): cat logo.txt prints the mark`.

### Task 4: The generator and the switch record

**Files:**
- Create: `projects/resume/brand/generate.ts`, `projects/resume/brand/icoFile.ts`, `projects/resume/brand/generatedRecord.ts`, `projects/resume/brand/generated.json` (written by the script)
- Generated: `brand/mark.svg`, `brand/github-picture.png` (1024 square), `app/favicon.ico` (16, 32, 48), `app/apple-icon.png` (180 square), `app/opengraph-image.png` (1200 by 630), `public/email-mark.png` (72, rounded)
- Modify: `projects/resume/share-image/opengraph-image.html` (an `<img class="mark" src="../brand/mark.svg" alt="">` before the name, sized to the name), `projects/resume/package.json` (`"brand": "node brand/generate.ts"`), `projects/resume/tsconfig.json` (`allowImportingTsExtensions`, for the generator's `.ts` imports)
- Test: `projects/resume/test/brand/generatedFiles.test.ts`, `projects/resume/test/brand/icoFile.test.ts`

**Interfaces:**
- Consumes: Task 1.
- Produces: `GENERATED_FILES` (name to path, relative to `projects/resume`), `type GeneratedRecord = { files: Record<string, string>; mark: MarkName; markHash: string }`, `hashBytes(bytes: Uint8Array): string` (SHA-256 hex), `hashMark(mark: Mark): string`, `packIco(images: readonly { pixels: number; png: Uint8Array }[]): Uint8Array`.

- [ ] **Step 1: Write the failing tests.** `icoFile.test.ts`: a packed file starts `00 00 01 00`, counts its images, and each directory entry's size and offset point at that PNG's bytes. `generatedFiles.test.ts`: the record's `mark` is `ACTIVE_MARK`. Its `markHash` is `hashMark(MARKS[ACTIVE_MARK])`. Every file in `GENERATED_FILES` exists, and its hash matches the record. `brand/mark.svg` equals `toMarkSvg(MARKS[ACTIVE_MARK], 'rounded')`. `public/email-mark.png` is 72 by 72, read from its header.
- [ ] **Step 2: Run them.** Expected: FAIL.
- [ ] **Step 3: Implement.** The script renders each SVG in Chrome (Playwright, `channel: 'chrome'`) at its exact pixel size. Rounded files keep transparent corners, square ones are opaque. It renders the share image from the HTML file, and stops with an error when JetBrains Mono did not load, because the HTML loads it from Google Fonts and falls back silently. Then it writes the record.
- [ ] **Step 4: Run `yarn brand`, then `yarn test`.** Expected: PASS. Look at every generated image.
- [ ] **Step 5: Watch the guard fail.** Set `ACTIVE_MARK` to `'terminal-mug'`: red. Put it back. Change one bracket cup stroke width: red. Put it back. Both with targeted reverse edits.
- [ ] **Step 6: Commit** `feat(resume): generate every mark file from one constant`.

### Task 5: The resume email

**Files:**
- Modify: `projects/send_resume/functions/send_email/email_content.ts`
- Test: `projects/send_resume/test/send_email/email_content.test.ts`

- [ ] **Step 1: Write the failing test.** The HTML holds `<img src="https://kups.me/email-mark.png" width="36" height="36" alt=""`, before `Best,`. The plain text is unchanged, line for line.
- [ ] **Step 2: Run `yarn test` in send_resume.** Expected: FAIL.
- [ ] **Step 3: Implement.** The signature becomes a one-row presentation table: the image cell, then the existing `Best, Zack, email, phone` paragraph. Name the address and size as constants.
- [ ] **Step 4: Run `yarn test` and `yarn typecheck` in send_resume.** Expected: PASS.
- [ ] **Step 5: Commit** `feat(send_resume): the mark in the email signature`.

### Task 6: README, docs and the GIF

**Files:**
- Modify: `README.md` (heading: `# <img src="projects/resume/brand/mark.svg" alt="" width="30" height="30"> kups.me`), `projects/resume/DESIGN.md` (Brand section, as the design says), `projects/resume/README.md` (a section "The mark": the data, the switch, `yarn brand`, `uv run` for outlines, the GIF step; the share image section names `brand/mark.svg`), `CLAUDE.md` (one line under the resume site), `projects/resume/demo/storyboard.yaml` and `projects/resume/demo/terminal.gif`

- [ ] **Step 1: Write the docs.** No em or en dash. Keep his words verbatim in DESIGN.md.
- [ ] **Step 2: Add the egg to the storyboard.** After the Work Experience command finishes: `type: 'logout'`, then Enter, then a wait long enough to read the line. Update its notes: length, size, the egg.
- [ ] **Step 3: Build, then record.** `yarn build`, then the commands in the resume README, with `--repository /Users/zack/Projects/awty/awty-web`. Watch the clip: hero, About, Work Experience, `logout` and its line, and the mark in the title bar.
- [ ] **Step 4: Commit** `docs: the mark in the README, DESIGN.md and the switch steps; record the GIF again`.

### Task 7: Gates, browser checks and the preview

- [ ] **Step 1: Run the site's gates.** `yarn check`, `yarn test`, `yarn build`, `yarn test:built-site`, `yarn test:browser`. Expected: all pass, and the built `out/` holds `favicon.ico`, `apple-icon.png` with its link tag, and `opengraph-image.png`.
- [ ] **Step 2: Look in real Chrome.** The title bar in both themes at 1280 and 320, the 404 page in both themes, `cat logo.txt`, and the favicon in a tab.
- [ ] **Step 3: Open the pull request.** Do not merge.
- [ ] **Step 4: Serve `out/` locally** for Zack to try, and give him the address.
