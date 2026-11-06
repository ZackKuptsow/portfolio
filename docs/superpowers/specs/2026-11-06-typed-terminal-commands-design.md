# Typed commands at the terminal prompt: design

Date: 2026-11-06 · Branch: `typed-commands` (from `origin/main` @ 17c16ae)

**Status: approved by Zack on 2026-11-06 ("looks good"; copy "approved").**
Every decision below was made in conversation with Zack on 2026-11-06, with no decision pages. His
words are quoted; the calls that are Claude's are marked "Claude's call" so he can check them while
reading. The shell speaks as bash (his choice, 2026-11-06).

## Intent

The terminal on kups.me types commands for a visitor as they scroll. Some visitors know a
terminal, and will try to type. Today nothing happens. After this, what they type works, inside
the fiction the site already keeps: the fake filesystem under `~/portfolio`, the commands the
tour types, the folder the prompt is in.

It is for show. "It should not actually execute something but we should emulate the illusion
that they can run some commands." "We are prebuilding everything. I just want to make sure it is
clear we are not building a full shell because that introduces security nightmares." Every
command is an entry in a closed table, and every output exists before the visitor arrives.

Scrolling stays the main road. "The terminal prompt is almost an easter egg in and of itself."
A recruiter who only scrolls sees the tour exactly as approved on 2026-11-05.

## Goals

- A visitor with a hardware keyboard can type any command the site types itself, and it does
  what it says, true to the fake filesystem from wherever the prompt is.
- A closed list of further commands, each with prebuilt output, in the shell's own words where
  a real shell has words.
- Hiding places for easter eggs that are data, so Zack adds one by adding an entry and approving
  its lines. The first eggs he named: ASCII art (Triforce, Vault symbol), references to the works
  he loves, links (Rick Roll, calicocutpants, articles), hidden files, a flag file.
- The tour, its commands, its scroll distances and its times are unchanged.

## Non-goals

- Phones and touch: issue #27. Type-anywhere means a phone sees no change at all.
- A real shell: no evaluation, no pipes, redirects, variables or globs. Only `&&` joins commands,
  because the tour types `clear && cd ../education && ls`.
- The minigame, the fake website, the CTF chain and the eggs outside the terminal (console,
  view-source, `humans.txt`, `curl kups.me`): their own tickets, filed from this session.

## Anti-goals

- Typed text being executed, evaluated, sent anywhere, stored, or arriving through a URL.
- A visitor who only scrolls noticing anything: no hint, no banner, no change of pace.
- A line a visitor reads shipping without Zack's approval, or a joke written by Claude. "I will
  add them if I want them."
- An em dash or en dash in anything printed. `test/data/copy.test.ts` enforces it for data.

## Constraints

- `components/Terminal/constants.ts` keeps every scroll distance and time. Typed output prints
  at the pace the tour prints, through the same `streamOutput` and `commandClock`, so there is
  nothing new to tune.
- The engine's rule that it "writes no text of its own" is amended, not dropped: it writes into
  one session container, and everything in it is either a copy of markup React rendered or a
  string from the command table. The server HTML does not change, so search engines, the plain
  flow, print and `test-built-site/pageText.test.ts` see what they see today.
- `TerminalEngine.ts` is 506 lines. The shell is its own modules under `components/Terminal/`,
  and the engine gains a small surface for them, never the shell itself.
- No new network at build time. Fonts are in the repository, and so is everything the shell
  prints. `git log` reads the repository's own history at build, which needs the gates job to check
  out more than one commit (see decision 5); that is the one pipeline change, made under
  `docs/pipeline.md`'s rules.
- Every prompt symbol stays inside an `aria-hidden` element (`test/app/page.test.tsx`).

## Decisions

### 1. Typing: anywhere, on a hardware keyboard

Zack, on the proposal: "that makes sense."

- The scroller `<main tabIndex=0>` already holds focus and receives `keydown`
  (`engine/wireTerminalInput.ts`). A printable key (one character, no Ctrl, Meta or Alt) starts
  the command line. The characters appear in the prompt's `typed` span with the block cursor,
  as the tour's typing does.
- **Space with an empty line scrolls, as today. With text in the line it is a character.**
- **While a command runs** (`isBusy`), the first key fast-forwards it, as today, and is not
  typed. Claude's call: a real terminal would buffer it; here the visitor types again.
- **Keys reaching the scroller from a control inside it** (a link, the tour button) are the
  control's, not the shell's: `event.target !== scroller` means the shell ignores the key.
  Clicking the output or the prompt puts focus back on the scroller.
- **Enter** runs the line. **Backspace** deletes. **Escape**, **Ctrl+C** and **Ctrl+U** clear
  the line. The line is edited at its end only: Left, Right, Home and End with text in the line
  do nothing (Claude's call). There is no Ctrl+L: Chrome and Firefox on Windows and Linux take it
  for the address bar before the page sees it, so `clear` is the one way to clear.
- **Tab** completes command names and the entries of the folder named, only when the line has
  text. With an empty line Tab moves focus as it does today. Dotfiles complete only when the
  typed name starts with `.`, as in a real shell.
- **Up and Down** recall the history only when the line has text. With an empty line they
  scroll, as today.
- **A scroll past the end of a section, or the menu, while a line is half typed** drops the line
  and types the tour's command. Scrolling is the main road.
- **The line's length** is capped at the characters that fit the rows the prompt already
  reserves (`TerminalLayout.measurePromptReserve`), so typing never covers a line of output and
  never resizes the prompt.
- In plain view there is no prompt, so there is no shell. The dialog and the drawer hold focus
  while open, so keys never reach the shell then.

### 2. The shell is a table

Zack: "it should appear like a real shell but should not actually execute anything. It is for
show only."

- **Parsing.** Trim the line, split on `&&`, split each part on whitespace into words. A pair of
  double or single quotes groups words and is stripped, so the About card's own
  `echo "Let's build something amazing together"` prints without its quotes; that is the whole of
  the quoting the tokenizer knows. The first word is looked up in the table; the rest are resolved
  as paths against the fake filesystem or matched against the entry's fixed arguments. A part that
  fails ends the line there, as `&&` does. A line holding `|`, `;`, `>`, `<`, `` ` `` or `$(`
  prints the shell's parse error and nothing else.
- **Nothing is evaluated.** No `eval`, no `Function`, no `innerHTML`, `outerHTML` or
  `insertAdjacentHTML` anywhere under `components/Terminal/`. An ESLint rule forbids them, and the
  rule is seen red before it ships.
- **Every output is prebuilt.** It is a clone of markup React rendered (a card, a listing), or
  lines built from data with `createElement` and `textContent`, each line a list of segments that
  are plain text or a link with a fixed `href`. Typed text is echoed back in exactly two places,
  `echo` and the "not found" line, both through `textContent`.
- **Nothing leaves the browser and nothing persists.** No request, no storage. The history lives
  in memory for the page's life.
- **No command comes from a link.** There is no address that pre-fills or runs a command.
- **`open` opens only addresses from data** (`data/identity.ts` profile links, egg links), never
  one a visitor typed.
- **An exit status** is kept for `echo $?`: 0 on success, 127 for "command not found", 1 for a
  `cat` or `cd` that failed, and whatever a data entry says (Zack wants 42 somewhere).

### 3. The fake filesystem

Built from the same data the tour uses (`buildSections.ts`, `toTerminalFileName`), so a card
and its file can never disagree:

```
/
└── home/
    └── zack/                      ~
        └── portfolio/             where the session starts, as today
            ├── developer.profile
            ├── education/
            │   ├── cyber_university_of_delaware.txt
            │   └── eleg_university_of_delaware.txt
            ├── get_resume.sh
            ├── projects/
            │   ├── akin.txt  awty.txt  hermes_imessage_shortcuts.txt  household_assistant.txt
            │   └── save_state.txt  smaller_tools.txt  this_site.txt
            ├── skills/
            │   ├── infrastructure_tooling/
            │   ├── languages_frameworks/
            │   └── practices_systems/
            └── work_experience/
                ├── draynow.txt  low_rate_co.txt  qlik.txt  teampay.txt
```

- Paths resolve as a shell resolves them: `~`, `.`, `..`, absolute, relative. `/`, `/home` and
  `/home/zack` exist and list what is under them. Anything else is "No such file or directory"
  unless an egg entry claims that exact path (so `cat /etc/passwd` can be a hiding place).
- Dotfiles come from egg data and show only with `ls -a`.
- `pwd` prints `/home/zack/portfolio` (Claude's call, accepted by Zack 2026-11-06). The hero's
  `~/root/portfolio` stays as decoration.
- A skill group is a folder. `ls` in one lists the group's skills, from `skillGroups` in
  `data/profile.ts`. What `cat` of a skill prints is the builder's call, with one rule: never
  "No such file" for a name `ls` just listed.
- **The tour must stay true from wherever the visitor left the prompt.** `buildCommand.ts` works
  out `cd` from three known folders today. It learns to compute the relative path from any folder
  in the tree, and the straight-read table in `DESIGN.md` stays word for word
  (`test/components/Terminal/buildCommand.test.ts` already checks it).

### 4. Where typed output prints

Zack: "it should appear like a real shell." Output prints under what is on screen, in order,
and only what was asked for.

- The engine inserts one session container as the next sibling of the current step's block (the
  furthest card reached), never inside it: the hero block is a centered flex box a full screen
  high (`terminal.css`, `.terminal-hero`), and a child there would re-center the handle as output
  grew. `TerminalLayout.measure()` reads each block's box live; it learns one thing, that a step's
  bottom is the bottom of its block or of the container that follows it, whichever is lower. The
  scroll track lengthens on the re-measure, the scroll moves to the step's new end so the new
  output is in view, and it prints top down in whole rows through `streamOutput`, busy while it
  prints, so a swipe or a click fast-forwards it.
- The next card printed by the tour (`cat <next>.txt`, no `clear`) lands after the container,
  so the order on screen is the order things happened. A card typed and later printed by the tour
  appears twice, as it would in a terminal where `cat` ran twice (Claude's call).
- **Typed commands never move the tour's step.** The one exception is `exit`, which is today's
  landing on the hero. `sh get_resume.sh` opens the window without moving. The round-trip check in
  "Checks" asserts that the parser resolves every tour line to the folder and file the tour meant,
  not that typing one navigates.
- **Removed, all of it:** on the tour's next `clear && …` command, on an upward command (the
  screen shows another section), on switching to plain view.
- **A typed `clear`** appends a screen's height of blank to the container and scrolls to it, so
  the screen is empty and the next output appears above the prompt. Everything printed stays in
  the scrollback above, as Terminal.app's `clear` leaves it. Claude's call: the site's own rule is
  that what is printed stays printed, and `.is-cleared` is `visibility: hidden`, which keeps a
  block's space, so hiding cards above the current one would leave blank gaps and move the clear
  point into the scroll map that Zack has approved.
- **Clones are stripped** of `data-block`, `data-scene`, `data-print-column`, `id` and
  `aria-labelledby`, and of every control: `cloneNode` drops React's handlers, so a project card's
  "watch the tour" button, its dialog and its video do not come along (links, which are plain
  anchors, do). `TerminalLayout.blockOf()` uses `querySelector`, which returns the first match in
  document order, and a clone carrying `data-block` would be found before the card it copies. The
  elements to strip carry one data attribute React renders, so the list lives in the markup.
- **Typed lines are echoed into the output** (Zack's choice, 2026-11-06): before its result, a
  typed line prints as the prompt showed it, `~/portfolio $ ls -a`, so several commands in a row
  read as one session, as a terminal's scrollback does. The tour's own commands are not echoed:
  `DESIGN.md`'s rule, "No command lines appear in the output. The prompt shows them", still holds
  for the tour. The echoed line is built with `textContent` like everything else, and its prompt
  symbol sits in an `aria-hidden` span like every other.
- **Width.** Cloned cards wrap as they do on the page. ASCII art is `white-space: pre` and prints
  only when `measureColumns()` reports at least the columns the drawing needs; otherwise the
  entry's narrow line prints instead. Every entry with art carries a narrow line.
- **Phones** are out of scope, so no layout work is done for a keyboard on screen (#27).

### 5. The command table

A closed list. Anything not in it prints "command not found". Flags not listed are ignored
where a real `ls` would still run, and refused where listed as refused.

**Tier 1: true today, no new words.** Each is what the tour already types, or what a shell
prints for the fake filesystem.

| Command | Output |
| --- | --- |
| `ls [-a] [-l] [-la] [-al] [path]` | The folder's entries, sorted as `ls` sorts, in the `FileListing` style. `-a` adds `.`, `..` and the dotfiles. |
| `cd [path]` | Changes the folder; the prompt and the title bar follow (`onLocationChange`). `cd` alone goes to `~`. |
| `cat <file>` | The card's block, cloned without its section header. `developer.profile` is the About block. `get_resume.sh` prints the two-line script in "New copy" (approved 2026-11-06). |
| `pwd` | The absolute folder. |
| `whoami` | `zachary.kuptsow`, the handle (`PERSON_HANDLE`). Claude's call: the tour's `whoami` prints the whole hero, which is a screen, not a line. |
| `clear` | See decision 4. |
| `exit` | What scrolling up from the first screen does today: the hero reprints, folder `~/portfolio`. |
| `wget kups.me/get_resume.sh` | The fake download, as `playDownload` plays it, printed in the session container. |
| `sh get_resume.sh`, `./get_resume.sh`, `bash get_resume.sh` | Opens the resume window. Closing it returns to where the visitor was; the tour's "closing loads Projects" applies only when the tour opened it (`handleResumeWindowClosed` already checks the current section). |
| `history` | Every command typed at the prompt this page, the tour's included, numbered as `history` numbers them. |
| `a && b` | Runs in turn; stops at the first failure. |

**Tier 2: real commands with factual output.** Lines for Zack's approval are in "New copy".

| Command | Output |
| --- | --- |
| `echo <text>` | The text. `$?` is the exit status; `$HOME` is `/home/zack`, `$USER` is `zack`, `$SHELL` is `/bin/bash`, `$PWD` is the folder; any other `$name` is empty. |
| `date` | The visitor's current time in `date`'s format, built from `Date`. |
| `which <cmd>` | `/usr/bin/<cmd>` for a table entry. Otherwise nothing, with exit status 1, as GNU `which` does. |
| `man <cmd>`, `help` | A short page per command, from data. `help` lists the Tier 1 to 3 commands and none of the eggs. |
| `git log` | The repository's last commits in `git log --oneline` form, read at build (Zack's choice, 2026-11-06: keep it). The gates job's checkout gains the depth it needs in `.github/workflows/gates.yml`; the build fails loudly if the history cannot be read, never ships an empty log. How the commits reach the client code is the builder's call. |
| `uname [-a]` | A fixed line, from data. |
| anything else | The shell's "command not found" line. |

**Tier 3: the site's controls.** Invented names, so each is copy for approval.

| Command | Does |
| --- | --- |
| `open github`, `open linkedin` | Opens the profile link from `data/identity.ts` in a new tab. `open` alone prints a usage line. |
| `mail`, `email` | Prints `CONTACT_EMAIL` as a `mailto:` link. Nothing navigates. |
| `theme`, `theme dark`, `theme light` | Prints the current theme, or switches it as the menu does. |
| `plain` | Plain view, as the menu does. The menu is the way back. |

**Tier 4: hiding places for eggs.** Mechanisms only; the lines are Zack's. An egg is an entry in
`data/terminalEasterEggs.ts` of one of these kinds:

- **A file** at a path, dotfile or not, with lines (`cat` prints it, `ls -a` or `ls` shows it).
- **A command** with a fixed response, optionally taking any argument (`sudo <anything>`,
  `rm -rf <anything>`, `vim <anything>`, `ssh <anything>`, `make`).
- **Art**: lines of a drawing, the columns it needs, and a narrow line for when it does not fit.
- **A link**: segments in any output can carry a fixed `href`; `open <name>` can open one.
- **An exit status** on any entry, for `echo $?`.

The first batch of eggs is chosen on a decision page after this design is approved: the art
candidates render as the terminal would print them, each spot has a write-in for his line, and
nothing ships without his `yes`. Zack on the symbols (2026-11-06): "I am willing to take the risk
on the symbols. I doubt anyone is finding those."

### 6. New copy, for approval

Drafts. Where a real shell has words, these are bash's words (Zack's choice over zsh,
2026-11-06). Nothing here ships until Zack approves the exact strings.

| Where | Draft |
| --- | --- |
| Unknown command | `bash: <word>: command not found` |
| Unsupported syntax | `bash: syntax error near unexpected token '<character>'` |
| `cd` to nothing | `bash: cd: <path>: No such file or directory` |
| `cd` to a file | `bash: cd: <path>: Not a directory` |
| `cat` of nothing | `cat: <path>: No such file or directory` |
| `cat` of a folder | `cat: <path>: Is a directory` |
| `which` miss | nothing printed, exit status 1 |
| `open` alone | `usage: open github | linkedin` |
| `theme` alone | `dark` or `light` |
| `whoami` | `zachary.kuptsow` |
| `cat get_resume.sh` | `#!/bin/sh` then `open https://kups.me/Zachary_Kuptsow_Resume.pdf`: a script that does what the site's `sh get_resume.sh` does. Approved 2026-11-06. |
| `uname` | `Linux` |
| `uname -a` | Zack's line |
| `help`, `man <cmd>` | One line per command, Zack's lines or Claude's drafts labelled as drafts |
| Tier 3 names | `open`, `mail`, `email`, `theme`, `plain` |

### 7. Accessibility

- The prompt stays `aria-hidden`: the visitor typed those characters and needs no announcement.
- The session container is `aria-live="polite"`, so what a command prints is read as it prints,
  eggs included. Links in it are real links and take focus.
- Tab completes only with text in the line, so keyboard navigation is untouched otherwise.
- Nothing here changes the plain flow, which is what reduced motion and no script get.

### 8. Checks

Unit (Vitest, `test/components/Terminal/`):

- **Round trip:** every line of `listPromptLines()` parses, from the folder it was typed in, to
  the folder and file the tour meant by it. The table and the tour cannot drift apart.
- A clone of a project card with a recording holds no button, dialog or video, and no `id` or
  `data-block`; `blockOf()` still finds the original.
- A typed `clear` leaves every card reachable by scrolling up.
- `buildCommand` is true from every folder in the tree, and the straight read still gives
  `DESIGN.md`'s table word for word.
- The table is closed: an unknown word, a known word with an unknown argument, and each
  unsupported character each print their line and nothing else. `&&` stops at the first failure.
- Path resolution: `~`, `.`, `..`, absolute, relative, a dotfile with and without `-a`.
- Rendering: output nodes are built with `textContent`; a typed `<img onerror>` comes out as
  text. `fetch` and `XMLHttpRequest` are never called; `localStorage` is never written.
- The ESLint rule against `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval` and `Function`
  under `components/Terminal/` has been seen red on a planted line.

jsdom (`test/components/Terminal/Terminal.test.tsx`): a printable key with an empty line starts
the line; Space with an empty line does not; Enter on `ls` appends output; `clear` appends a blank
screen; Escape clears the line; a key while busy fast-forwards and is not typed; typing on the
hero leaves the hero block's children as they were.

Browser (Playwright, `test-browser/`): from About, `cat work_experience/teampay.txt` prints the
card under the profile in whole rows, with the prompt still visible; scrolling on prints the next
section and the session output is gone; `cd projects && ls` then a scroll types a `cd` that is true
from `projects`; Tab with an empty line moves focus; the drawer and the dialog receive keys, the
shell does not; plain view has no shell; every existing check stays green, `wholeRows` with the
scrollbar showing above all.

Zack's hands: "only his hands found" the two faults the checks missed in the terminal build. The
pull request is not merged until he has typed at it on his machine.

### 9. Documents to change in the same pull request

- `projects/resume/README.md`, "The terminal": how typing works, the table, the session
  container, the security rules.
- `projects/resume/DESIGN.md`: a "Typing" subsection under "The terminal direction", the new copy
  table, and the amendment to "the engine writes no text of its own".
- Root `CLAUDE.md`: one bullet under the resume site.
- `.eslintrc` for the new rule, named in the README.

## Left to the builder

- Module layout under `components/Terminal/` (a `shell/` folder is the obvious shape: parsing,
  the filesystem, the table, rendering, the session container, the key handling), and how the
  engine exposes what the shell needs (current step, cwd, busy, the clock, navigate, the theme and
  plain-view toggles).
- Tab completion's behaviour on several matches (common prefix, cycle, or list).
- How `git log` is baked in, within the open question below.
- What `cat` of a skill prints, within the rule in decision 3.
- What Ctrl+C shows, if anything, before the line clears.
- The container's own styles: left-aligned, in the output's type, whatever block it follows.
- The order and wording of `help`, as drafts for Zack.

## Open questions for Zack

Settled 2026-11-06 in one round after the builder check, and written back above: bash wording
(decisions 2 and 6), typed lines echoed into the output (decision 4), `git log` kept with the
checkout depth change (decision 5), and `cat get_resume.sh` printing the two-line script
(decision 6). The copy table in decision 6 was approved the same day, with the error lines then
rewritten from zsh's wording to bash's at his choice; the bash strings were shown to him in chat
with the filed issues.

## Calls made after the builder check (2026-11-06)

A reviewer read the document cold and asked seven questions. Four were answered from the
conversation or the code and written in above; three were settled as Claude's calls, marked
where they land: the session container as the block's sibling with one line in `measure()`
(decision 4), `clear` as scrollback rather than hiding cards (decision 4), and clones without
controls (decision 4). Ctrl+L went (decision 1) and the tokenizer learned quotes (decision 2).

## Related issues

- #27: typed commands on phones, deferred.
- #28 and its children #29 to #33: the eggs beyond the shell (page eggs, `curl -L kups.me`, and
  design passes for the CTF chain, the minigame and the fake website).
