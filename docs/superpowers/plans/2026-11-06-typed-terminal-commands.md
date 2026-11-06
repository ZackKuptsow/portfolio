# Typed terminal commands: implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A visitor with a hardware keyboard types at the kups.me prompt and a closed table of prebuilt commands answers under what is on screen, true to the fake filesystem, while a visitor who only scrolls sees the tour unchanged.

**Architecture:** A `shell/` folder beside the engine holds pure modules (tokenizer, fake filesystem, command table, output rendering) and two DOM classes (the typed line, the session container). `TerminalEngine` gains a small host surface the shell calls (busy, clock, current block, re-measure, land on the hero, open the window) and hands it every key first. Every output is a clone of markup React rendered or lines built with `createElement` and `textContent`; nothing typed is evaluated, sent or stored.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript, Vitest with jsdom and Testing Library, Playwright in the installed Chrome, ESLint.

**Spec:** `docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md`

## Global Constraints

- `projects/resume/components/Terminal/constants.ts` keeps every scroll distance and time as it is. Typed output prints through `streamOutput` and `commandClock` at the tour's pace.
- Nothing typed is evaluated, sent or stored: no `eval`, `Function`, `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `fetch`, `XMLHttpRequest` or `localStorage` writes in the shell. Typed text reaches the DOM only through `textContent`.
- The shell speaks as bash. Error lines, verbatim: `bash: <word>: command not found`, `bash: syntax error near unexpected token '<character>'`, `bash: cd: <path>: No such file or directory`, `bash: cd: <path>: Not a directory`, `cat: <path>: No such file or directory`, `cat: <path>: Is a directory`. `which` on a miss prints nothing and exits 1.
- Approved copy, verbatim: `whoami` prints `zachary.kuptsow`; `uname` prints `Linux`; `open` alone prints `usage: open github | linkedin`; `theme` alone prints `dark` or `light`; `cat get_resume.sh` prints `#!/bin/sh` then `open https://kups.me/Zachary_Kuptsow_Resume.pdf`; the Tier 3 names are `open`, `mail`, `email`, `theme`, `plain`. `uname -a`, `help` and `man` pages are Zack's lines: ship them as drafts marked `// draft` in `shell/constants.ts` and list them in the pull request for his approval.
- No em dash or en dash in any string a visitor reads.
- `$HOME` is `/home/zack`, `$USER` is `zack`, `$SHELL` is `/bin/bash`, `$PWD` is the folder. Exit statuses: 0 success, 127 command not found, 1 a failed `cd`, `cat` or `which`, 2 a syntax error.
- Every prompt symbol the shell writes sits in a `<span aria-hidden="true" class="command-prompt">`. The prompt element itself stays `aria-hidden`.
- The typed shell never moves the tour's step, except `exit`.
- A file over 500 lines is split before it grows; `TerminalEngine.ts` is at 506 and gains only the host surface.
- Names are explicit and self-documenting; constants are named; object keys, imports and props are alphabetized where order carries no meaning.
- Each commit message ends with `Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>`.

## Review Focus

Inputs the spec implies and no task's tests would exercise without these lines. Each has its test in the task named.

1. `cd ../../../..` from anywhere stays at `/` and never throws (Task 2).
2. A line of several hundred characters, or one that is only spaces, is capped or ignored and never reaches the output or the prompt's reserve (Task 7).
3. A font loading or the window resizing while session output is on screen re-measures with the container counted and leaves the reader at the same line (Task 12).
4. `cat` of a card in a hidden section clones it without `is-cleared`, so the clone is visible (Task 5).
5. `echo $?` after `ls && cat missing.txt && pwd` prints `1`, and `pwd` never ran (Task 4).

---

### Task 0: Branch, and commit the design

**Files:**
- Commit: `docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md`, `docs/superpowers/plans/2026-11-06-typed-terminal-commands.md`

- [ ] **Step 1: Create the branch `typed-commands` from `origin/main` in a worktree (superpowers:using-git-worktrees), with `git config core.hooksPath .githooks` run in it**

- [ ] **Step 2: Commit the two documents**

```bash
git add docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md docs/superpowers/plans/2026-11-06-typed-terminal-commands.md
git commit -m "docs(resume): design and plan for typed commands at the terminal prompt"
```

---

### Task 1: The tokenizer

**Files:**
- Create: `projects/resume/components/Terminal/shell/tokenizeCommandLine.ts`
- Create: `projects/resume/components/Terminal/shell/constants.ts`
- Test: `projects/resume/test/components/Terminal/shell/tokenizeCommandLine.test.ts`

**Interfaces:**
- Produces: `type TokenizedLine = { commands: readonly (readonly string[])[]; kind: 'ok' } | { kind: 'syntax-error'; token: string }` and `tokenizeCommandLine(line: string): TokenizedLine`. In `constants.ts`: `REFUSED_TOKENS = ['|', ';', '>', '<', '`', '$('] as const` and `COMMAND_JOINER = '&&'`.

- [ ] **Step 1: Write the failing tests**

```ts
it('splits words and commands', () => {
  expect(tokenizeCommandLine('  clear && cd ./work_experience && ls ')).toEqual({
    commands: [['clear'], ['cd', './work_experience'], ['ls']], kind: 'ok' })
})
it('groups and strips a pair of double or single quotes', () => {
  expect(tokenizeCommandLine(`echo "Let's build something amazing together"`)).toEqual({
    commands: [['echo', "Let's build something amazing together"]], kind: 'ok' })
  expect(tokenizeCommandLine("echo 'a  b' c")).toEqual({ commands: [['echo', 'a  b', 'c']], kind: 'ok' })
})
it('refuses each unsupported token with the token named', () => {
  for (const token of ['|', ';', '>', '<', '`', '$(']) {
    expect(tokenizeCommandLine(`ls ${token} x`)).toEqual({ kind: 'syntax-error', token })
  }
})
it('treats an empty line and an unclosed quote as no commands', () => {
  expect(tokenizeCommandLine('   ')).toEqual({ commands: [], kind: 'ok' })
  expect(tokenizeCommandLine('echo "open')).toEqual({ commands: [['echo', 'open']], kind: 'ok' })
})
```

- [ ] **Step 2: Run them, expect FAIL on the missing module**

Run: `cd projects/resume && yarn test test/components/Terminal/shell/tokenizeCommandLine.test.ts`

- [ ] **Step 3: Implement `tokenizeCommandLine` in `shell/tokenizeCommandLine.ts`**

One pass over the characters: a quote opens a group until its match or the end, `&&` outside quotes ends a command, whitespace outside quotes ends a word. Check for refused tokens outside quotes before splitting.

- [ ] **Step 4: Run the tests, expect PASS**

- [ ] **Step 5: Commit**

```bash
git add projects/resume/components/Terminal/shell projects/resume/test/components/Terminal/shell
git commit -m "feat(resume): tokenize a typed command line"
```

---

### Task 2: The fake filesystem

**Files:**
- Create: `projects/resume/components/Terminal/shell/fakeFileSystem.ts`
- Create: `projects/resume/data/terminalEasterEggs.ts`
- Test: `projects/resume/test/components/Terminal/shell/fakeFileSystem.test.ts`

**Interfaces:**
- Consumes: `buildSections()` and `TerminalSection` from `components/Terminal/buildSections.ts` and `types.ts`; `skillGroups` from `data/profile.ts`; `toTerminalFileName`.
- Produces, in `data/terminalEasterEggs.ts`:
  ```ts
  export type OutputSegment = { href?: string; text: string }
  export type OutputLine = readonly OutputSegment[]
  export type EasterEgg =
    | { columns: number; kind: 'art'; lines: readonly string[]; name: string; narrowLine: string }
    | { acceptsAnyArguments: boolean; exitStatus?: number; kind: 'command'; lines: readonly OutputLine[]; name: string; opens?: string }
    | { exitStatus?: number; kind: 'file'; lines: readonly OutputLine[]; path: string }
  export const terminalEasterEggs: readonly EasterEgg[] = []
  ```
  A `path` is absolute or starts with `~`; a name starting with `.` is a dotfile.
- Produces, in `shell/fakeFileSystem.ts`:
  ```ts
  export type FileContent =
    | { blockId: string; kind: 'card' }
    | { exitStatus: number; kind: 'lines'; lines: readonly OutputLine[] }
    | { kind: 'skill-list'; skills: readonly string[] }
  export type FileSystemNode =
    | { entries: ReadonlyMap<string, FileSystemNode>; kind: 'folder' }
    | { content: FileContent; kind: 'file' }
  export const HOME_DIRECTORY = '/home/zack'
  export function buildFileSystem(sections: readonly TerminalSection[], eggs: readonly EasterEgg[]): FileSystemNode
  /** `~` form inside home (`~`, `~/portfolio/skills`), absolute outside it. Never ends in `/` except `/`. */
  export function resolvePath(cwd: string, input: string): string
  export function toAbsolutePath(path: string): string
  export function findNode(root: FileSystemNode, path: string): FileSystemNode | null
  /** Names sorted as `ls` sorts them, dotfiles only when asked, folders with a `/` suffix. */
  export function listFolder(folder: FileSystemNode & { kind: 'folder' }, options: { showHidden: boolean }): readonly string[]
  /** The shortest relative path from one folder to a path, as a shell would type it. */
  export function relativePathBetween(fromFolder: string, toPath: string): string
  ```

- [ ] **Step 1: Write the failing tests**

```ts
const root = buildFileSystem(buildSections(), [])
it('mirrors the tour: every section folder and file exists', () => {
  expect(listFolder(findNode(root, '~/portfolio'), { showHidden: false })).toEqual([
    'developer.profile', 'education/', 'get_resume.sh', 'projects/', 'skills/', 'work_experience/'])
  expect(findNode(root, '~/portfolio/work_experience/teampay.txt')).toEqual({
    content: { blockId: 'work-2', kind: 'card' }, kind: 'file' })
})
it('resolves ~, ., .., absolute and relative paths', () => {
  expect(resolvePath('~/portfolio/skills', '../education')).toBe('~/portfolio/education')
  expect(resolvePath('~/portfolio', '/home/zack')).toBe('~')
  expect(resolvePath('~', 'portfolio/./projects/')).toBe('~/portfolio/projects')
  expect(toAbsolutePath('~/portfolio')).toBe('/home/zack/portfolio')
})
it('never climbs above the root', () => {               // Review Focus 1
  expect(resolvePath('/', '../../../..')).toBe('/')
  expect(resolvePath('~/portfolio', '../../../../..')).toBe('/')
})
it('shows a dotfile from the eggs only when asked', () => {
  const withEgg = buildFileSystem(buildSections(), [
    { kind: 'file', lines: [[{ text: 'x' }]], path: '~/portfolio/.secret' }])
  const portfolio = findNode(withEgg, '~/portfolio')
  expect(listFolder(portfolio, { showHidden: false })).not.toContain('.secret')
  expect(listFolder(portfolio, { showHidden: true })).toEqual(['.', '..', '.secret', 'developer.profile', 'education/', 'get_resume.sh', 'projects/', 'skills/', 'work_experience/'])
})
it('lists the root and home as a real machine would, and nothing else exists', () => {
  expect(listFolder(findNode(root, '/'), { showHidden: false })).toEqual(['home/'])
  expect(findNode(root, '/etc/passwd')).toBeNull()
})
it('makes a skill group a folder whose files are its skills', () => {
  const group = findNode(root, '~/portfolio/skills/languages_frameworks')
  expect(group?.kind).toBe('folder')
  expect(listFolder(group, { showHidden: false })).toEqual(skillGroups[0].list.map(toTerminalFileName))
})
it('types the relative path a shell would', () => {
  expect(relativePathBetween('~/portfolio/skills', '~/portfolio/education')).toBe('../education')
  expect(relativePathBetween('/home', '~/portfolio/education')).toBe('zack/portfolio/education')
  expect(relativePathBetween('/', '~/portfolio')).toBe('home/zack/portfolio')
  expect(relativePathBetween('~/portfolio/skills/languages_frameworks', '~/portfolio')).toBe('../..')
})
```

- [ ] **Step 2: Run them, expect FAIL**

- [ ] **Step 3: Implement the module.** `get_resume.sh` is a `lines` file with the two approved lines and exit status 0. A skill inside a group folder is a `skill-list` file holding that one skill's name (`cat` prints the name: the builder's call, within the rule that a listed name is never "No such file").

- [ ] **Step 4: Run the tests, expect PASS**

- [ ] **Step 5: Commit** (`feat(resume): the fake filesystem behind the prompt`)

---

### Task 3: The tour stays true from any folder

**Files:**
- Modify: `projects/resume/components/Terminal/buildCommand.ts:31-60` (`changeInto`, `changeToPortfolio`, `fileFrom`)
- Test: `projects/resume/test/components/Terminal/buildCommand.test.ts`

**Interfaces:**
- Consumes: `relativePathBetween`, `resolvePath` from Task 2.
- Produces: the same `buildCommand` signature. The three known folders (`~/portfolio`, `~`, a section folder) keep their exact words; any other folder falls through to `relativePathBetween`.

- [ ] **Step 1: Write the failing tests, beside the existing ones**

```ts
it('still gives the straight read word for word', () => { /* the existing assertion over listPromptLines stays green */ })
it.each([
  ['/', 'education', 'clear && cd home/zack/portfolio/education && ls'],
  ['/home', 'education', 'clear && cd zack/portfolio/education && ls'],
  ['~/portfolio/skills/languages_frameworks', 'education', 'clear && cd ../../education && ls'],
])('types a true cd from %s', (cwd, directory, command) => {
  expect(buildCommand({ cwd, route: 'down', section: educationSection, step: firstEducationStep }).command).toBe(command)
})
it('cats a card by a true path from the root', () => {
  expect(buildCommand({ cwd: '/', route: 'up', section: workSection, step: lastWorkStep }).command)
    .toBe('cd home/zack/portfolio && cat work_experience/qlik.txt')
})
```

- [ ] **Step 2: Run, expect the new cases to FAIL with `cd ../education`**

- [ ] **Step 3: Replace the blind fallbacks in `changeInto`, `changeToPortfolio` and `fileFrom` with `relativePathBetween(cwd, target)`**, keeping the three literal branches first.

- [ ] **Step 4: Run `yarn test test/components/Terminal`, expect PASS, the straight-read table included**

- [ ] **Step 5: Commit** (`fix(resume): the tour's commands are true from any folder`)

---

### Task 4: The command table and the runner

**Files:**
- Create: `projects/resume/components/Terminal/shell/types.ts`
- Create: `projects/resume/components/Terminal/shell/commandTable.ts`
- Create: `projects/resume/components/Terminal/shell/runCommandLine.ts`
- Modify: `projects/resume/components/Terminal/shell/constants.ts` (the copy)
- Test: `projects/resume/test/components/Terminal/shell/runCommandLine.test.ts`

**Interfaces:**
- Consumes: Task 1 and Task 2.
- Produces, in `shell/types.ts`:
  ```ts
  export type ShellEffect =
    | { kind: 'clear' } | { kind: 'download' } | { kind: 'exit' } | { kind: 'open-resume' }
    | { href: string; kind: 'open-url' } | { kind: 'plain-view' } | { isDark: boolean; kind: 'theme' }
  export type CommandOutcome = {
    /** A drawing, printed in a <pre>. */
    art?: readonly string[]
    /** A card to clone from the page. */
    cardBlockId?: string
    effect?: ShellEffect
    exitStatus: number
    lines: readonly OutputLine[]
    /** Names for the listing markup, as `ls` prints them. */
    listing?: readonly string[]
  }
  export type ShellState = { cwd: string; history: readonly string[]; lastExitStatus: number }
  export type ShellContext = {
    columns: number
    eggs: readonly EasterEgg[]
    gitLog: readonly string[]
    isDark: () => boolean
    now: () => Date
    root: FileSystemNode
  }
  export type CommandHandler = (words: readonly string[], state: ShellState, context: ShellContext) => CommandOutcome
  export type RunResult = { outcomes: readonly CommandOutcome[]; state: ShellState }
  ```
- Produces: `buildCommandTable(eggs: readonly EasterEgg[]): ReadonlyMap<string, CommandHandler>` in `commandTable.ts` with Tier 1 to 3 and the egg commands; `runCommandLine(line: string, state: ShellState, context: ShellContext): RunResult` in `runCommandLine.ts`, which tokenizes, runs each command in turn, stops at the first non-zero exit status, appends the line to `history`, and sets `lastExitStatus`. `cd` and `theme` change state through the outcome; `history` prints `  1  <line>` with right-aligned numbers.

- [ ] **Step 1: Write the failing tests**

```ts
const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
it('runs the tour\'s own commands', () => {
  const { outcomes, state: next } = runCommandLine('clear && cd ./work_experience && ls', state, context)
  expect(outcomes.map((outcome) => outcome.effect?.kind)).toEqual(['clear', undefined, undefined])
  expect(next.cwd).toBe('~/portfolio/work_experience')
  expect(outcomes[2].listing).toEqual(['draynow.txt', 'low_rate_co.txt', 'qlik.txt', 'teampay.txt'])
})
it('runs every line the tour types, from the folder it was typed in, to the folder it meant', () => {
  // The round trip of the spec: listPromptLines gives `<path> $ <command>`; the next line's path is where it lands.
  const lines = listPromptLines(sections, steps, (path) => path)
  lines.forEach((line, index) => {
    const [path, command] = line.split(' $ ')
    const { state: next } = runCommandLine(command, { ...state, cwd: path }, context)
    expect(next.lastExitStatus, line).toBe(0)
    const following = lines[index + 1]
    if (following && !command.startsWith('wget')) expect(next.cwd, line).toBe(following.split(' $ ')[0])
  })
})
it('answers in bash\'s words', () => {
  expect(firstLine(runCommandLine('foo', state, context))).toBe('bash: foo: command not found')
  expect(runCommandLine('foo', state, context).state.lastExitStatus).toBe(127)
  expect(firstLine(runCommandLine('ls | grep a', state, context))).toBe("bash: syntax error near unexpected token '|'")
  expect(firstLine(runCommandLine('cd nowhere', state, context))).toBe('bash: cd: nowhere: No such file or directory')
  expect(firstLine(runCommandLine('cd developer.profile', state, context))).toBe('bash: cd: developer.profile: Not a directory')
  expect(firstLine(runCommandLine('cat education', state, context))).toBe('cat: education: Is a directory')
  expect(firstLine(runCommandLine('cat nope.txt', state, context))).toBe('cat: nope.txt: No such file or directory')
})
it('stops a chain at the first failure and reports it', () => {   // Review Focus 5
  const { outcomes, state: next } = runCommandLine('ls && cat missing.txt && pwd', state, context)
  expect(outcomes).toHaveLength(2)
  expect(firstLine(runCommandLine('echo $?', next, context))).toBe('1')
})
it('cats a card by block id, and get_resume.sh by its lines', () => {
  expect(runCommandLine('cat work_experience/teampay.txt', state, context).outcomes[0].cardBlockId).toBe('work-2')
  expect(runCommandLine('cat get_resume.sh', state, context).outcomes[0].lines.map(textOf))
    .toEqual(['#!/bin/sh', 'open https://kups.me/Zachary_Kuptsow_Resume.pdf'])
})
it('prints pwd, whoami, echo with its variables, which, and history', () => {
  expect(firstLine(runCommandLine('pwd', state, context))).toBe('/home/zack/portfolio')
  expect(firstLine(runCommandLine('whoami', state, context))).toBe('zachary.kuptsow')
  expect(firstLine(runCommandLine('echo $HOME $USER $SHELL $PWD $NOPE', state, context))).toBe('/home/zack zack /bin/bash /home/zack/portfolio ')
  expect(firstLine(runCommandLine('which ls', state, context))).toBe('/usr/bin/ls')
  const miss = runCommandLine('which nope', state, context)
  expect(miss.outcomes[0].lines).toEqual([]); expect(miss.state.lastExitStatus).toBe(1)
  const after = runCommandLine('history', { ...state, history: ['whoami', 'ls -a'] }, context)
  expect(after.outcomes[0].lines.map(textOf)).toEqual(['    1  whoami', '    2  ls -a', '    3  history'])
})
it('maps the site\'s controls to effects with fixed addresses', () => {
  expect(runCommandLine('open github', state, context).outcomes[0].effect).toEqual({ href: 'https://github.com/ZackKuptsow', kind: 'open-url' })
  expect(firstLine(runCommandLine('open', state, context))).toBe('usage: open github | linkedin')
  expect(runCommandLine('open https://evil.example', state, context).outcomes[0].effect).toBeUndefined()
  expect(runCommandLine('mail', state, context).outcomes[0].lines[0]).toEqual([{ href: 'mailto:zkups56@gmail.com', text: 'zkups56@gmail.com' }])
  expect(runCommandLine('theme light', state, context).outcomes[0].effect).toEqual({ isDark: false, kind: 'theme' })
  expect(firstLine(runCommandLine('theme', state, { ...context, isDark: () => true }))).toBe('dark')
  expect(runCommandLine('sh get_resume.sh', state, context).outcomes[0].effect).toEqual({ kind: 'open-resume' })
  expect(runCommandLine('wget kups.me/get_resume.sh && sh get_resume.sh', state, context).outcomes.map((o) => o.effect?.kind)).toEqual(['download', 'open-resume'])
  expect(runCommandLine('exit', state, context).outcomes[0].effect).toEqual({ kind: 'exit' })
})
it('answers help with the Tier 1 to 3 names and none of the eggs', () => {
  const eggContext = { ...context, eggs: [{ acceptsAnyArguments: true, kind: 'command', lines: [[{ text: 'no' }]], name: 'sudo' }] }
  const help = runCommandLine('help', state, eggContext).outcomes[0].lines.map(textOf).join('\n')
  expect(help).toContain('cat'); expect(help).not.toContain('sudo')
  expect(firstLine(runCommandLine('sudo rm -rf /', state, eggContext))).toBe('no')
})
it('prints git log, date and uname from the context', () => {
  expect(runCommandLine('git log', state, { ...context, gitLog: ['abc1234 feat: x'] }).outcomes[0].lines.map(textOf)).toEqual(['abc1234 feat: x'])
  expect(firstLine(runCommandLine('uname', state, context))).toBe('Linux')
  expect(firstLine(runCommandLine('date', state, { ...context, now: () => new Date(2026, 10, 6, 14, 42, 7) }))).toMatch(/^Fri Nov  6 14:42:07/)
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `types.ts`, `commandTable.ts` and `runCommandLine.ts`.** `ls` accepts `-a`, `-l`, `-la`, `-al` and an optional path; `cd` with no argument goes to `~`; `echo` expands only the four variables and `$?`; `help` and `man` read their lines from `constants.ts` drafts; an egg `command` with `acceptsAnyArguments: false` matches only its bare name. `open` matches `github` and `linkedin` against `PROFILE_LINKS` and egg names with `opens`; anything else prints the usage line with exit status 1.

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit** (`feat(resume): the closed table of typed commands`)

---

### Task 5: Rendering output

**Files:**
- Create: `projects/resume/components/Terminal/shell/renderOutput.ts`
- Modify: `projects/resume/components/Terminal/components/EntryBlock.tsx` (mark the header and the action with `data-not-cloned`)
- Modify: `projects/resume/components/Terminal/components/FileListing.tsx` (export the class names it uses as constants, or move them to `components/Terminal/constants.ts`)
- Test: `projects/resume/test/components/Terminal/shell/renderOutput.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export function renderLines(lines: readonly OutputLine[]): readonly HTMLElement[]   // one <p class="terminal-session-line"> per line; a segment with href is an <a target="_blank" rel="noreferrer">
  export function renderListing(names: readonly string[]): HTMLElement             // the FileListing markup, built with createElement
  export function renderEchoedLine(path: string, line: string): HTMLElement        // `<path> <span aria-hidden class="command-prompt">$</span> <line>`
  export function renderArt(lines: readonly string[]): HTMLElement                 // <pre class="terminal-session-art">
  export function cloneCard(block: HTMLElement): HTMLElement
  ```
  `cloneCard` strips `data-block`, `data-scene`, `data-print-column`, `id`, `aria-labelledby`, the class `is-cleared`, and every element carrying `data-not-cloned`.

- [ ] **Step 1: Write the failing tests (jsdom)**

```ts
it('writes typed text as text, never as markup', () => {
  const [line] = renderLines([[{ text: '<img src=x onerror=alert(1)>' }]])
  expect(line.querySelector('img')).toBeNull()
  expect(line.textContent).toBe('<img src=x onerror=alert(1)>')
})
it('renders a link segment as a real link to its fixed address', () => {
  const [line] = renderLines([[{ href: 'https://example.com/', text: 'go' }]])
  const link = line.querySelector('a')
  expect(link?.getAttribute('href')).toBe('https://example.com/'); expect(link?.getAttribute('target')).toBe('_blank')
})
it('puts the echoed prompt symbol in an aria-hidden span', () => {
  const echoed = renderEchoedLine('~/portfolio', 'ls -a')
  expect(echoed.querySelector('.command-prompt')?.getAttribute('aria-hidden')).toBe('true')
  expect(echoed.textContent).toBe('~/portfolio $ ls -a')
})
it('clones a card without its header, controls, ids and cleared state', () => {
  render(<Terminal startSectionId="hero" />)
  const original = document.querySelector<HTMLElement>('[data-block="projects-2"]')   // Save State, which has a recording
  original.classList.add('is-cleared')
  const clone = cloneCard(original)
  expect(clone.hasAttribute('data-block')).toBe(false)
  expect(clone.querySelector('button, dialog, video, h2, .terminal-listing, [id]')).toBeNull()
  expect(clone.classList.contains('is-cleared')).toBe(false)                            // Review Focus 4
  expect(clone.querySelector('a')).not.toBeNull()
  expect(clone.textContent).toContain('Save State')
  expect(document.querySelectorAll('[data-block="projects-2"]')).toHaveLength(1)
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `renderOutput.ts`; add `data-not-cloned` to the header wrapper and the action item in `EntryBlock.tsx`**

- [ ] **Step 4: Run the shell tests and `test/components/Terminal/Terminal.test.tsx`, expect PASS**

- [ ] **Step 5: Commit** (`feat(resume): render typed output with textContent and cloned cards`)

---

### Task 6: The session container and the layout

**Files:**
- Create: `projects/resume/components/Terminal/shell/SessionOutput.ts`
- Modify: `projects/resume/components/Terminal/engine/TerminalLayout.ts:176-187` (`measure`) and `:258` (`planPrinting`)
- Modify: `projects/resume/components/Terminal/terminal.css` (styles for `.terminal-session`, `.terminal-session-line`, `.terminal-session-art`, `.terminal-session-blank`)
- Test: `projects/resume/test/components/Terminal/shell/SessionOutput.test.ts`

**Interfaces:**
- Produces, in `SessionOutput.ts`:
  ```ts
  export const SESSION_OUTPUT_ATTRIBUTE = 'data-session-output'
  export class SessionOutput {
    /** The container after this block, made if there is none. Moving blocks removes the old one. */
    ensureAfter(block: HTMLElement): HTMLElement
    append(nodes: readonly HTMLElement[]): void
    /** A typed `clear`: a blank of the given height, so the screen is empty. */
    appendBlankScreen(heightPixels: number): void
    remove(): void
    readonly element: HTMLElement | null
  }
  ```
  The container is `<div class="terminal-session" data-session-output aria-live="polite">`.
- Produces, in `TerminalLayout`: `measure()` takes a step's `bottom` as the lower of its block's bottom and the bottom of a `[data-session-output]` that is the block's next sibling; `planPrintingFrom(stepIndex: number, fromSceneHeight: number): PrintPlan` prints from a height in the scene to the bottom of what can show.

- [ ] **Step 1: Write the failing tests (jsdom, structure only)**

```ts
it('sits after the block as its next sibling, once', () => {
  const session = new SessionOutput()
  const first = session.ensureAfter(blockA); const second = session.ensureAfter(blockA)
  expect(first).toBe(second); expect(blockA.nextElementSibling).toBe(first)
  expect(first.getAttribute('aria-live')).toBe('polite')
})
it('moves to another block and leaves nothing behind', () => {
  session.ensureAfter(blockA); session.ensureAfter(blockB)
  expect(document.querySelectorAll('[data-session-output]')).toHaveLength(1)
  expect(blockB.nextElementSibling?.hasAttribute('data-session-output')).toBe(true)
})
it('appends a blank of the asked height for clear', () => {
  session.appendBlankScreen(640)
  expect(session.element?.lastElementChild?.getAttribute('style')).toContain('640px')
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `SessionOutput`, the `measure()` change and `planPrintingFrom`; add the four CSS classes in `terminal.css` (left-aligned, the output's type; `.terminal-session-art` is `white-space: pre`)**

- [ ] **Step 4: Run `yarn test test/components/Terminal`, expect PASS, `scrollMap.test.ts` and `textRows.test.ts` untouched**

- [ ] **Step 5: Commit** (`feat(resume): a session container the layout measures with its step`)

---

### Task 7: The typed line

**Files:**
- Create: `projects/resume/components/Terminal/shell/TypedInput.ts`
- Modify: `projects/resume/components/Terminal/shell/constants.ts` (`PRINTABLE_KEY_LENGTH = 1`)
- Test: `projects/resume/test/components/Terminal/shell/TypedInput.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type TypedInputHost = {
    complete: (prefix: string) => readonly string[]   // candidates for the last word, from the table and the folder named
    maxLength: () => number                            // characters that fit the prompt's reserved rows
    onSubmit: (line: string) => void
    typed: HTMLElement                                 // the prompt's span
  }
  export class TypedInput {
    constructor(host: TypedInputHost)
    /** True when the key was the shell's. False leaves it to the engine (scroll, jump, focus). */
    handleKey(event: KeyboardEvent): boolean
    recordHistory(line: string): void
    clearLine(): void
    readonly line: string
  }
  ```
  Rules, from the spec: a printable key (one character, no Ctrl, Meta or Alt) starts or extends the line; Space with an empty line is not the shell's; Enter submits and clears; Backspace deletes; Escape, Ctrl+C and Ctrl+U clear; Tab, Up and Down are the shell's only with text in the line; Left, Right, Home and End with text do nothing and are the shell's; everything else is not the shell's.

- [ ] **Step 1: Write the failing tests**

```ts
it('leaves Space, arrows and Tab to the engine while the line is empty', () => {
  for (const key of [' ', 'ArrowUp', 'ArrowDown', 'Tab', 'PageDown']) expect(input.handleKey(keyEvent(key))).toBe(false)
  expect(typed.textContent).toBe('')
})
it('types printable keys and shows them, Space included once there is text', () => {
  'ls'.split('').forEach((key) => expect(input.handleKey(keyEvent(key))).toBe(true))
  expect(input.handleKey(keyEvent(' '))).toBe(true)
  expect(typed.textContent).toBe('ls ')
})
it('ignores keys with Ctrl, Meta or Alt except Ctrl+C and Ctrl+U', () => {
  type('ls'); expect(input.handleKey(keyEvent('v', { metaKey: true }))).toBe(false)
  expect(input.handleKey(keyEvent('c', { ctrlKey: true }))).toBe(true); expect(input.line).toBe('')
})
it('submits on Enter and recalls with Up only when there is text', () => {
  type('pwd'); input.handleKey(keyEvent('Enter'))
  expect(onSubmit).toHaveBeenCalledWith('pwd'); expect(input.line).toBe('')
  input.recordHistory('pwd')
  expect(input.handleKey(keyEvent('ArrowUp'))).toBe(false)
  type('p'); input.handleKey(keyEvent('ArrowUp')); expect(input.line).toBe('pwd')
})
it('completes the last word and prevents the browser\'s Tab', () => {
  host.complete = () => ['work_experience/']
  type('cd wo'); const event = keyEvent('Tab'); input.handleKey(event)
  expect(event.defaultPrevented).toBe(true); expect(input.line).toBe('cd work_experience/')
})
it('caps the line at what the prompt can hold, and submits nothing for spaces', () => {   // Review Focus 2
  host.maxLength = () => 8
  type('abcdefghijkl'); expect(input.line).toBe('abcdefgh')
  input.clearLine(); type('   '); expect(input.handleKey(keyEvent(' '))).toBe(false)
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `TypedInput`.** Completion on several candidates fills the common prefix (the builder's call in the spec; this plan picks the common prefix).

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit** (`feat(resume): the typed line at the prompt`)

---

### Task 8: The shell in the engine

**Files:**
- Create: `projects/resume/components/Terminal/shell/Shell.ts`
- Create: `projects/resume/components/applyTheme.ts` (from `useTheme.ts`'s `toggleTheme` body)
- Modify: `projects/resume/components/useTheme.ts` (use `applyTheme`; refresh `isDark` on the `THEME_CHANGED_EVENT` it dispatches)
- Modify: `projects/resume/components/Terminal/engine/TerminalEngine.ts` (host surface; hand keys to the shell first; record tour commands; remove the container on `clear &&`, upward and plain)
- Modify: `projects/resume/components/Terminal/hooks.ts` and `Terminal.tsx` (pass `gitLog`)
- Modify: `projects/resume/components/Terminal/components/Prompt.tsx` (a click focuses the scroller)
- Test: `projects/resume/test/components/Terminal/Terminal.test.tsx`, `projects/resume/test/components/Terminal/shell/Shell.test.ts`

**Interfaces:**
- Produces, in `applyTheme.ts`: `export const THEME_CHANGED_EVENT = 'kups:theme-changed'` and `applyTheme(isDark: boolean): void` (class, meta, storage, event).
- Produces, in `TerminalEngine`:
  ```ts
  export type ShellHost = {
    blockOfCurrentStep: () => HTMLElement
    clock: CommandClock
    cwd: () => string
    isBusy: () => boolean
    landOnHero: (done: () => void) => void
    measureColumns: (element: HTMLElement) => number
    openResumeWindow: () => void
    printAppended: (fromSceneHeight: number, done: () => void) => void   // re-measure, scroll to the end, stream the new rows
    promptLineCapacity: () => number                                      // characters the prompt's reserved rows hold after the path and ` $ `
    requestPlainView: () => void
    runBusy: (work: (done: () => void) => void) => void                   // marks busy, resets the clock, finishes like a tour command
    setCwd: (cwd: string) => void
    usableHeight: () => number
  }
  ```
  `TerminalEngineOptions` gains `gitLog: readonly string[]`. `handleKeyDown` calls `this.shell.handleKey(event)` first and returns when it is true. `runCommand` calls `this.shell.recordTourCommand(command)`. `land()` calls `this.shell.onScreenChanged()` whenever the target's section differs or the step clears, and `setPlain(true)` calls `this.shell.remove()`.
- Produces, in `Shell.ts`: `class Shell { constructor(host: ShellHost, elements: { scroller: HTMLElement; typed: HTMLElement }, context: Omit<ShellContext, 'columns'>); handleKey(event: KeyboardEvent): boolean; recordTourCommand(command: string): void; onScreenChanged(): void; remove(): void }`. On submit it echoes the line, runs it, renders each outcome (lines, listing, clone, art), applies effects, appends, then `printAppended`.

- [ ] **Step 1: Write the failing tests**

```ts
// Shell.test.ts, with a fake host
it('echoes the typed line, then its output, into the container after the current block', () => {
  submit('pwd')
  const container = block.nextElementSibling
  expect(container?.getAttribute('data-session-output')).not.toBeNull()
  expect([...container.children].map((c) => c.textContent)).toEqual(['~/portfolio $ pwd', '/home/zack/portfolio'])
  expect(host.printAppended).toHaveBeenCalledOnce()
})
it('does not echo the tour\'s commands, and history holds both', () => {
  shell.recordTourCommand('whoami'); submit('history')
  expect(textOfContainer()).not.toContain('$ whoami'); expect(textOfContainer()).toContain('1  whoami')
})
it('applies effects to the host, never to the typed address', () => {
  submit('open github'); expect(windowOpen).toHaveBeenCalledWith('https://github.com/ZackKuptsow', '_blank', 'noopener,noreferrer')
  submit('sh get_resume.sh'); expect(host.openResumeWindow).toHaveBeenCalledOnce()
  submit('exit'); expect(host.landOnHero).toHaveBeenCalledOnce()
  submit('theme light'); expect(document.documentElement.classList.contains('dark')).toBe(false)
  submit('cd education'); expect(host.setCwd).toHaveBeenCalledWith('~/portfolio/education')
  submit('wget kups.me/get_resume.sh')
  expect(host.runBusy).toHaveBeenCalled(); expect(container().querySelector('.terminal-download')).not.toBeNull()   // playDownload prints into the container
})
it('renders a listing, a clone and art each in its own markup', () => {
  submit('ls'); expect(container().querySelector('.terminal-listing')).not.toBeNull()
  submit('cat developer.profile'); expect(container().textContent).toContain('Last updated:')
})
it('clears to a blank screen and removes everything when the screen changes', () => {
  submit('ls'); submit('clear')
  expect(container().lastElementChild?.classList.contains('terminal-session-blank')).toBe(true)
  shell.onScreenChanged(); expect(document.querySelector('[data-session-output]')).toBeNull()
})
it('sends nothing and stores nothing', () => {
  const fetchSpy = vi.spyOn(globalThis, 'fetch'); const storage = vi.spyOn(Storage.prototype, 'setItem')
  submit('echo hi && ls -a && cat developer.profile && foo')
  expect(fetchSpy).not.toHaveBeenCalled(); expect(storage).not.toHaveBeenCalled()
})
// Terminal.test.tsx additions
it('types nothing while a tour command runs, and nothing from a focused link', () => {
  // root has data-busy: a printable key leaves the typed span empty; with focus on a footer link, so does a key sent there
})
it('keeps every prompt symbol in the output aria-hidden after typing', () => {
  // every `.command-prompt` under `[data-session-output]` has an aria-hidden ancestor, as test/app/page.test.tsx checks for the page
})
it('shows the menu\'s theme label following applyTheme', () => {
  // applyTheme(false) then the drawer offers `dark mode`
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement `applyTheme.ts`, the `useTheme` change, the host surface in `TerminalEngine.ts`, `Shell.ts`, and the `gitLog` prop plumbing with `[]` as the pages' value for now (Task 9 fills it)**

- [ ] **Step 4: Run `yarn test`, expect PASS; run `yarn check`, expect clean; confirm `TerminalEngine.ts` stays under 600 lines, else move the host surface into `engine/shellHost.ts`**

- [ ] **Step 5: Commit** (`feat(resume): typed commands run at the prompt`)

---

### Task 9: `git log` at build

**Files:**
- Create: `projects/resume/app/readGitLog.ts`
- Modify: `projects/resume/app/page.tsx`, `projects/resume/app/projects/page.tsx` (pass `gitLog={readGitLog()}`)
- Modify: `.github/workflows/gates.yml:29-31` (`fetch-depth: 20` on the checkout of the job that builds), `docs/pipeline.md` (the reason)
- Test: `projects/resume/test/app/readGitLog.test.ts`; `test/app/page.test.tsx` mocks `@/app/readGitLog` with `importOriginal`

**Interfaces:**
- Produces: `readGitLog(): readonly string[]` in `app/readGitLog.ts`: `execFileSync('git', ['log', '-n', String(GIT_LOG_LINES), '--format=%h %s'])`, `GIT_LOG_LINES = 10`, throws with the command named when git fails or returns no lines.

- [ ] **Step 1: Write the failing tests**

```ts
it('returns one line per commit, short hash first', () => {
  const lines = readGitLog()
  expect(lines.length).toBeGreaterThan(0); expect(lines[0]).toMatch(/^[0-9a-f]{7,} \S/)
})
it('fails loudly when git has nothing to say', () => {
  vi.spyOn(childProcess, 'execFileSync').mockReturnValue('')
  expect(() => readGitLog()).toThrow(/git log/)
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement; read `docs/pipeline.md` first and change `gates.yml` under its rules (the action stays pinned to its SHA; only `with:` gains `fetch-depth: 20`)**

- [ ] **Step 4: Run `yarn test` and `yarn build`, expect PASS and `out/` built**

- [ ] **Step 5: Commit** (`feat(resume): git log reads the repository at build`)

---

### Task 10: Eggs as data, and art

**Files:**
- Modify: `projects/resume/components/Terminal/shell/commandTable.ts` (art entries; `open <egg>`; exit statuses)
- Modify: `projects/resume/components/Terminal/shell/Shell.ts` (render `art` with the column check and the narrow line)
- Test: `projects/resume/test/components/Terminal/shell/easterEggs.test.ts`, `projects/resume/test/data/terminalEasterEggs.test.ts`

- [ ] **Step 1: Write the failing tests, with fixture eggs, since `terminalEasterEggs` ships empty**

```ts
const art = { columns: 40, kind: 'art', lines: ['  /\\  ', ' /__\\ '], name: 'triforce', narrowLine: 'wider screen needed' }
it('prints art when the columns allow and the narrow line when they do not', () => {
  expect(runCommandLine('triforce', state, { ...context, columns: 80, eggs: [art] }).outcomes[0].art).toEqual(art.lines)
  const narrow = runCommandLine('triforce', state, { ...context, columns: 30, eggs: [art] }).outcomes[0]
  expect(narrow.art).toBeUndefined(); expect(textOf(narrow.lines[0])).toBe('wider screen needed')
})
it('opens an egg\'s fixed address and reports its exit status', () => {
  const egg = { acceptsAnyArguments: false, exitStatus: 42, kind: 'command', lines: [[{ text: 'ok' }]], name: 'answer', opens: 'https://example.com/' }
  const run = runCommandLine('answer', state, { ...context, eggs: [egg] })
  expect(run.outcomes[0].effect).toEqual({ href: 'https://example.com/', kind: 'open-url' }); expect(run.state.lastExitStatus).toBe(42)
})
it('cats an egg file at an absolute path outside the tree', () => {
  const file = { kind: 'file', lines: [[{ text: 'root:x:0:0' }]], path: '/etc/passwd' }
  expect(firstLine(runCommandLine('cat /etc/passwd', state, { ...context, root: buildFileSystem(buildSections(), [file]) }))).toBe('root:x:0:0')
})
// data test
it('holds no em or en dash and no duplicate name or path', () => { /* over terminalEasterEggs */ })
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run, expect PASS**

- [ ] **Step 5: Commit** (`feat(resume): easter eggs are data the shell reads`)

---

### Task 11: The lint guard and the documents

**Files:**
- Modify: `projects/resume/.eslintrc.js` (an `overrides` entry for `components/Terminal/**`: `no-eval`, `no-new-func`, `no-implied-eval`, and `no-restricted-properties` for `innerHTML`, `outerHTML`, `insertAdjacentHTML`, each with a message naming the design)
- Modify: `projects/resume/README.md` ("The terminal": a "Typing" paragraph, the table, the container, the security rules, the lint rule), `projects/resume/DESIGN.md` (a "Typing" subsection; the new copy table; the amendment to "writes no text of its own"), root `CLAUDE.md` (one bullet)

- [ ] **Step 1: Add the rule, then plant `element.innerHTML = line` in `shell/renderOutput.ts` and run `yarn lint`: expect it RED on that line. Remove the plant.**

- [ ] **Step 2: Run `yarn check`, expect clean**

- [ ] **Step 3: Write the three documents**

- [ ] **Step 4: Commit** (`docs(resume): how typing at the prompt works, and the rule that keeps it text`)

---

### Task 12: Browser checks

**Files:**
- Create: `projects/resume/test-browser/typedCommands.spec.ts`
- Modify: `projects/resume/test-browser/terminal.ts` (a `typeCommand(page, line)` helper: `page.keyboard.type(line)` then `Enter`, then `waitUntilIdle`)

- [ ] **Step 1: Write the checks**

```ts
test('from About, cat prints the card under the profile in whole rows, with the prompt visible', ...)
  // chooseFromMenu About; typeCommand 'cat work_experience/teampay.txt'; expect Teampay's title inside [data-session-output] and
  // the `wholeRows` helper's assertion over the scene at the final scroll; expect the prompt's box inside the viewport
test('scrolling on prints the next section and the session output is gone', ...)
  // wheelUntilNextCommand down; waitUntilIdle; expect [data-session-output] count 0 and the next section's heading visible
test('cd projects && ls, then a scroll, types a cd that is true from projects', ...)
  // recordCommands; typeCommand 'cd ../projects && ls' from Skills; wheelUntilNextCommand; readCommands last entry starts with the wget line
  // (the step after Skills is the resume); from Education instead, expect `clear && cd ../skills && ls -la`
test('Tab with an empty line moves focus; Space with an empty line scrolls', ...)
  // press Tab: document.activeElement is not the scroller; press Space: scrollTop grows
test('the drawer and the dialog take keys, the shell does not', ...)
  // open the menu, type 'ls': the typed span stays empty; open the resume window, type 'ls': the email field or the dialog has focus, the span stays empty
test('plain view has no shell', ...)
  // chooseFromMenu 'plain view'; type 'ls' + Enter; expect no [data-session-output]
test('a resize with session output on screen keeps the reader at the same line', ...)     // Review Focus 3
  // typeCommand 'ls -a'; read the first visible row's text; setViewportSize to the rotated phone; waitUntilIdle; same first visible row
test('typing while a tour command runs fast-forwards it and types nothing', ...)
  // wheelUntilBusy; keyboard.type('ls'); expect not busy within a second and the typed span empty
```

- [ ] **Step 2: `yarn build && yarn test:built-site && yarn test:browser`, expect every existing check green and the new ones green; `wholeRowsWithScrollbar.spec.ts` above all**

- [ ] **Step 3: Commit** (`test(resume): browser checks for typed commands`)

---

### Task 13: Hand over

- [ ] **Step 1: Push the branch and open the pull request.** Its body lists: every new visitor-readable string (bash lines, approved copy, the `// draft` lines for `uname -a`, `help` and `man`), the `fetch-depth` change, and that the phone is out (#27).
- [ ] **Step 2: Watch the gates run; a red step is read, not retried.**
- [ ] **Step 3: Zack types at it on his machine before the merge.** Only his hands found the two faults of the first terminal build.
