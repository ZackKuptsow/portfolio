# Design brief

The brief for kups.me's interface, kept at the project root and committed with the code. People
read the prose; the designer checks read the tables. Each table sits under a level-3 heading with
its exact name and keeps its column headers as written: a renamed header or a missing table stops
a check with exit 2, never a pass. Edit the values and the prose freely; keep the headings and the
headers.

**Status: built.** This describes the site. The terminal direction was reached with Zack over nine
rounds of live prototypes on 2026-11-04 and built the same day (`components/Terminal/`, and see
"The terminal" in the README for how). "Page N" below means the decision page of that round. The
prototypes are throwaway, so this brief carries everything they decided.

## Brand and style

Brand: partial conversation, 2026-11-07

The answers come from the short form, 2026-11-04, and the conversation that chose the mark,
2026-11-07, which covered references, feeling and the mark, not all six areas.

- **For, and when:** Hiring managers, recruiters and the like, and "the first introduction of
  myself to some people". "kups.me is just a portfolio site that includes my resume-type info and
  projects."
- **Feeling:** "It should be explanatory of my experience with demonstrable examples." "It is
  supposed to have a hacker/terminal feel with slight glowing and neon affects. It should still be
  easy on the eyes and have contrast that helps read clearly because there is a decent amount of
  text on the page." "We still want everything to be smooth including the animation." "I want to
  maintain the terminal feel but can add some new colors or elements to make it more user-friendly
  or welcoming."
- **Loved and hated:**
  - The site today: a founder "loved the feel of it", asked whether he does design work, and "liked
    the little faux windows and hacker feel. It gave a theme versus just being a resume site." So
    "I don't want to change the feel too much." The faux windows themselves went on his own call,
    because a window in a window "doesn't make sense" once the whole screen is the terminal.
  - posthog.com: "I LOVE posthog's site. The retro feel is really cool."
  - strml.net, "my favorite site ever": "I love seeing 'under the hood' and it progressively kinda
    explaining what is going on. The humor in the comments is amazing." "Watching the plane be
    built while it was flying is also really cool."
  - atmos.leeroy.ca and HubSpot's list of best personal websites, as sites he has saved. "We don't
    have to take much from these."
  - For the mark, Linear's among four references: "Linear is probably the coolest and simpliest and
    easiest to derive from. Any terminal marks would be good too. I would love to somehow hint at
    cups for kups."
  - No site was named as hated.
- **Never:** "corporate and stiff". "Just being a resume site." Things that "look crammed and blend
  together" (issue #7).
- **Voice:** "playful, should speak kinda like I am a hacker communicating with you over terminal
  (there are secret agent-ish hacker apps that do this storyline well)." Rules, as he stated them:
  "You should never talk about comp, why I left jobs." "Each new copy line (even outside this)
  should be run by me." No comment lines: shown six drafts, "Let's not do funny comments. I will add
  them if I want them."
- **Recognisable by:** The terminal look, "the site's identity" (issue #7), and `./tech.polyglot`:
  "I couldn't think of anything else that makes it seem like I experiment with all tech (i.e. smart
  home, local llm, hermes, text assistant, productivity and tooling)."
  - **The mark**, chosen 2026-11-07 over four rounds: the Bracket cup, a pair of square brackets
    drawn as a cup with a handle, lowercase `zk` inside, green on a near-black tile. The cup is "a
    hint that rewards a second look", and the tile stays "On the near-black tile everywhere".
    Placed, then: "Now that I am seeing it I want unity. I want to go with Bracket Cup. Please make
    sure the "zk" is centered between the brackets. I want to keep the other two on file for if I
    ever change my mind." It is in the tab, the phone icon, the share image, the GitHub picture,
    the repository README, the title bar, `cat logo.txt`, the 404 page and the resume email. The
    Terminal mug and the zk monogram are kept in `brand/marks.ts`, one word away (see "The mark"
    in the README). On 2026-11-09, of the tab and the title bar: "the logo looks quite small and
    almost unreadable. Is there a way to make the initials more clear?" Those two now show a small
    cut, with thicker brackets, shorter arms and bigger, bolder letters, and the title bar shows it
    at 26 points.

Words that stay as they are (from `data/profile.ts` and issue #7): job highlights, skills and the
bio are copied from the public resume. A design change alters how they are shown, never what they
say.

## The terminal direction

The whole screen is one stationary terminal, and scrolling drives it: "it kinda looks stationary on
a terminal screen and prints out each piece." Approved on page 7 ("Yes, write it in") and page 8,
with later notes folded in below.

### Scrolling and commands

- Each section is plain formatted output, with no windows inside it. The only windows are the resume
  window and the tour, which open over the terminal.
- Reading scroll is 1:1. Scrolling past the end of a section triggers a command, which then types at
  its own time-based pace, not at the speed of the scroll.
- The screen clears between sections, and a section's output streams top-down in whole rows, whichever
  way the reader arrives.
- Cards print one at a time within Work Experience, Education and Projects, with no clearing inside
  a section. Skills is one cluster with one command: what is above the columns, then column 1, then
  2, then 3, each line by line ("It should type out column 1 and then 2 then 3"). Stacked on a phone,
  that is simply top down.
- What is printed stays printed. Inside a section, scrolling back up is a plain 1:1 scroll, with no
  command and nothing reprinted, and the cards below stay where they are ("if the entry is already
  present it shouldn't have to redraw the whole page"), because no terminal reprints its scrollback.
  Coming back down is the same, until past the last line printed, where the next card's `cat` types.
  Only going past the top of a section types a command, because `clear` really did wipe the one above.
- No command lines appear in the output. The prompt shows them.
- One swipe does one thing, momentum included: it starts a command, finishes one, or stops at the
  edge of the output, its last line going down and the top of the section going up. What is left of
  it does nothing, until the input goes quiet. So a flick moves one step at most, however hard, and
  no section is ever skipped by scrolling.
- A new swipe while a command runs, or clicking, fast-forwards it.
- A swipe that stops short of a command is forgotten a moment later, so swipes a while apart never
  add up to one.
- Scrolling up from the first screen types `exit` and reprints the hero. There is no logout screen.

### Commands

Upward commands read as the reverse trip. `tac` was rejected ("That doesn't make sense"). Going up
types only on arriving in a section from the one below, and lands on its last card, with its earlier
cards there to scroll back through.

These are the commands of a straight read, and a command must be true of the fake filesystem by
any route, so `components/Terminal/buildCommand.ts` works each one out from the folder the prompt
is in. Going up, the table's `cd ..` is true only for the first hop out of a folder: after it the
prompt is in the portfolio, so the next hop is `cat education/<file>.txt`. The session starts in
`~/portfolio`, which makes the first command true as typed.

| Section         | Scrolling down types                                                  | Scrolling up types                                 | Menu types                                       |
| --------------- | --------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| Hero            | `whoami`                                                              | `clear && cd ~ && whoami`                          | `clear && cd ~ && whoami`                        |
| About           | `clear && cat developer.profile`                                      | `cd .. && cat developer.profile`                   | `clear && cat ~/portfolio/developer.profile`     |
| Work Experience | `clear && cd ./work_experience && ls`, then `cat <file>.txt` per card | `cd .. && cat work_experience/<last file>.txt`     | `clear && cd ~/portfolio/work_experience && ls`  |
| Education       | `clear && cd ../education && ls`, then `cat <file>.txt` per card      | `cd .. && cat education/<last file>.txt`           | `clear && cd ~/portfolio/education && ls`        |
| Skills          | `clear && cd ../skills && ls -la`                                     | `cd .. && ls -la skills/`                          | `clear && cd ~/portfolio/skills && ls -la`       |
| Resume          | `wget kups.me/get_resume.sh && sh get_resume.sh`                      | skipped: going up never opens the window           | `wget kups.me/get_resume.sh && sh get_resume.sh` |
| Projects        | `clear && cd ../projects && ls`, then `cat <file>.txt` per card       | nothing: there is no section below it to come from | `clear && cd ~/portfolio/projects && ls`         |

### Typing

Decided with Zack on 2026-11-06; the design is
`docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md`. "The terminal prompt is
almost an easter egg in and of itself."

- A visitor with a hardware keyboard can type at the prompt. Type-anywhere: a printable key starts
  the line. With an empty line, Space scrolls, the arrows scroll and Tab moves focus, as before.
  With text in it, Space is a character, Tab completes, Up and Down recall, Enter runs, Escape
  clears. Scrolling past the end of a section drops a half-typed line and types the tour's command:
  scrolling stays the main road. A key pressed while the tour's command runs hurries it and is kept,
  as a terminal keeps typing it has not got to yet.
- It is for show. "We are prebuilding everything." Every command is an entry in a closed table over
  the same fake filesystem the tour uses, and every output exists before the visitor arrives:
  a copy of a card on the page, or fixed lines. Nothing typed is evaluated, sent anywhere, stored,
  or arrives through a link. `open` opens only the site's own addresses.
- Output prints under what is on screen, after the current card, in order, with the typed line
  echoed before its result as a terminal's scrollback keeps it (his choice; the tour's own commands
  are still never printed). The tour's next `clear && …` wipes it, as a real terminal would. A typed
  `clear` scrolls the screen blank and leaves everything above in the scrollback.
- The shell speaks as bash (his choice over zsh). Typed lines print at the tour's pace, through the
  same clock, so nothing new is tuned.
- Easter eggs are data (`data/terminalEasterEggs.ts`): a file, a command with a fixed response, a
  drawing with a narrow-screen line, a link, an exit status, a question the next line answers, and
  a real pause in a line. The words are his or the works' own, chosen on two decision pages on
  2026-11-06. He accepts the risk of drawing the Triforce and the Vault symbol.
- A song plays in the output, from its official upload, in a small player that exists only once
  someone has typed the command, and goes when the screen changes (his choice, 2026-11-06). The site
  hosts no audio: copying a track onto it would be distributing someone's work. Some browsers need
  one press on the player to start.
- Animations are frames of plain text (`data/terminalEggFrames.ts`), played on the terminal's clock,
  so a key or a click goes straight to the last. Every frame is one height, so nothing jumps.
- `encrypt` loses a dot off his text, which falls to a floor below it, and `decrypt` runs it backwards.
- Scrolling stays what people do first, so the prompt is bare on arrival. If someone has not scrolled
  after 6 seconds, `scroll, or try: help` fades in over 2. It goes at the first scroll, and does not
  come back. At the end of the tour, with nothing left to scroll, `try: help` fades in the same way.
  Nothing shows while reading a section, or at all once a line has been typed (his choices, 2026-11-06).
  It is in the arrows' colour, quieter than the footer links. On the prompt's `card` that is 5.69 to 1
  dark and 3.54 light, under the 4.5 for text, which he accepted: it is a nudge, and repeats nothing
  a visitor needs. The menu has a `help` entry that types it. Neither shows on a phone. `help` ends by pointing at
  `/usr/games`, which lists the hidden commands, and `hint` names one not tried yet. In the same folder,
  `references.txt` says what each egg comes from (`data/terminalEggReferences.ts`), and a test fails if
  an egg is missing from it. `sudo` stays out of all of them, so it stays a surprise.
- A password is for show, and any guess gets in. A visitor may still type a real one, so what is
  typed never shows, is never echoed, and joins neither history. Only a yes opens what a `[y/N]`
  guards, and the answer runs inside the key press, so the new tab is not blocked as a popup.
- A drawing's line height is 1.35, the least at which its rows stay apart. At 1.2 they overlap, the
  engine reads them as one row, and a short window shows none of it.
- Phones and other touch-only devices are out: issue #27.

### The resume

Reaching the end of Skills types the `wget` command, clears the screen, runs a fake download with a
progress bar that hesitates in the middle, and opens the resume window, about 6.5 seconds from the
scroll point (slowed at his word on page 8, and again on trying the build). A new swipe or a click
skips it to under 0.1 seconds. Closing the window, by any route, types the Projects command and
loads Projects under it.

`get_resume.sh` is decoration, and `kups.me/get_resume.sh` stays a 404 (his choice, page 8).

### Projects

Projects is a section of the terminal, after the resume. `/projects.html` keeps working, stays
indexed, and opens the same terminal already at Projects, with the whole list in its HTML (his
choice, 2026-11-04). Today's card page goes away in the build. The tour opens from a control in its
project, as `components/ProjectDemo/` does today.

### Controls and footer

- Title bar: three dots, the mark, the path (`zack@kups:` before it, hidden on phones), then plain
  view and the hamburger. Plain view moves into the menu on phones. The mark gives way before the
  path wraps: it hides when the bar cannot hold it and the longest tour path,
  `~/portfolio/work_experience`, on one line, which is below 15rem, a width that grows with the
  text size (under 355 points wide, or text much larger than the default).
- Hamburger at the far right on every width, with the drawer opening from the right. Choosing a
  section closes the drawer and types that section's command.
- The menu holds the sections, plain view and the theme switch, then whatever the footer could not
  fit.
- The footer stays pinned under the prompt at all times: LinkedIn, GitHub and Email, then the
  built-with line and the copyright where they fit. Projects is not in it ("we should probably remove
  projects here"): it is a section, with its place in the menu.
- Hero: free-floating `~/root/portfolio`, the glowing handle, the `./tech.polyglot` tagline and the
  pulsing line. The visible name line is gone, as he found it redundant, and the `<h1>` stays in the
  page, visually hidden. About keeps `Last updated: 2026` and the `echo` line.
- The theme opens dark for everyone, whatever the system prefers. The menu switches it, and a stored
  choice wins (page 8).

### Who gets the plain flow

Reduced motion, no JavaScript and plain view all get every section in one reading column, nothing
cleared, no prompt. Print does too. `./get_resume.sh` shows there as a button, because there is no
prompt to type it into. The hero fills the first screen under the title bar, and About starts below
the fold ("let's make sure in plain view the hero page still fits the screen properly").

### Timing

The prototype's values read trackpad momentum as the reader scrolling on. On trying the build (Zack,
2026-11-04): "The scroll sensitivity and thresholds needs A LOT more grace. It's spazzing out. The
animations need to be slowed down a lot as well." These are the values after that, all in
`components/Terminal/constants.ts`, and they are his to set by feel. On trying them (2026-11-05): "The
speed is absolutely perfect." So leave them alone unless he says otherwise.

| What                                                     | Value                                              |
| -------------------------------------------------------- | -------------------------------------------------- |
| Scroll past the end of a section that triggers a command | 300 points                                         |
| A new swipe while a command runs that fast-forwards it   | 500 points, 160 by touch                           |
| Scroll up on the first screen that types `exit`          | 400 points, 240 by touch                           |
| Input this far apart is two swipes                       | 200 ms                                             |
| A swipe short of a command is forgotten after            | 700 ms                                             |
| Typing a command                                         | 1800 ms in all, 40 to 120 ms a character, jittered |
| Pause after Enter                                        | 320 ms                                             |
| Printing a section's output                              | 70 ms a line, 1500 ms at most                      |
| Download: pauses before each of its five lines           | 270, 540, 510, 450, 210 ms                         |
| Download: progress tick                                  | 130 ms, 360 ms between 55% and 75%                 |
| Download: after saved, then before the window            | 360 ms, then 800 ms                                |
| Drawer closes                                            | 190 ms                                             |
| The prompt's hint: wait, then fade in                    | 6000 ms, then 2000 ms                              |

### New copy

Each line approved by Zack on 2026-11-04.

- Download: `--<date> <time>--  https://kups.me/get_resume.sh`, `Resolving kups.me... done.`,
  `Connecting to kups.me:443... connected.`, `HTTP request sent, awaiting response... 200 OK`,
  `Saving to: 'get_resume.sh'`, `get_resume.sh  62%[====>   ] 1.3K`, `'get_resume.sh' saved`,
  `Opening the resume...`
- Menu: `$ ls ~/portfolio`, `light mode`, `dark mode`, `plain view`, `terminal view`, and the section
  entries `~/whoami`, `developer.profile`, `work_experience/`, `education/`, `skills/`,
  `get_resume.sh`, `projects/`

The typed shell's lines, approved by Zack on 2026-11-06 (`components/Terminal/shell/constants.ts`):

- Bash's own words: `bash: <word>: command not found`, `bash: syntax error near unexpected token
'<character>'`, `bash: cd: <path>: No such file or directory`, `bash: cd: <path>: Not a directory`,
  `cat: <path>: No such file or directory`, `cat: <path>: Is a directory`. `which` on a miss prints
  nothing and exits 1.
- `whoami` prints `zachary.kuptsow`; `uname` prints `Linux`; `open` alone prints
  `usage: open github | linkedin`; `theme` alone prints `dark` or `light`; `cat get_resume.sh` prints
  `#!/bin/sh` then `open https://kups.me/Zachary_Kuptsow_Resume.pdf`.
- The site's controls as commands: `open`, `mail`, `email`, `theme`, `plain`.
- The eggs' words, as he chose them, are in `data/terminalEasterEggs.ts`, and
  `test/data/terminalEasterEggs.test.ts` holds each one word for word.
- Tried in the preview and approved on 2026-11-06 ("Everything else looks good"), in the eggs:
  `Warning: this is loud. Play it? [y/N]`, `ALERT: the price of Bitcoin has changed.`,
  `There's more in /usr/games`, `Try: <command>`, `You found them all.`, `+30 lives`,
  `Computing... <n> years remaining`, `A steam train goes by.`, `0 files remain.`,
  `Broadcast message from ceres: Oye, beratna! Taki for the ping. Sasa ke?`, the `loot` lines, and the
  commands `bitcoin`, `news`, `qwerty` (which draws a fish) and `rare`.
- Approved the same way, in `TOOL_COPY` in the constants: the `help` and `man` lines, `uname -a`, and the real-tool lines for `ls` on a missing path, `man` with no entry,
  `git` alone or with another subcommand, `man` alone, `theme` with another word, `wget` of another address, `sh` or `bash`
  of a missing script, and `./x` that does not exist.

## Colours

Every colour is a token with a value in each scheme. The site opens dark, and light is the menu's
other choice, kept as the site's light theme today with no colour added (his choice, page 9). The
schemes are named once, here:

Schemes: light, dark

### Thresholds

The smallest contrast ratio each kind of pairing may have. `body` is body text, `text` is large or
secondary text, `boundary` is a border, icon or control edge. All three rows are required. The
template's values, which Zack kept on 2026-11-04.

| Kind     | Minimum |
| -------- | ------- |
| body     | 7.0     |
| text     | 4.5     |
| boundary | 3.0     |

### Palette

One row per colour token, written `#rrggbb`, one column for each scheme named above. The names are
the project's own CSS variables, so a later build can use them as they are. `text-body`, `arrow` and
`control-edge` have no variable of their own, and each says where it comes from.

| Token                  | light   | dark    | Use                                                                                                                                                      |
| ---------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| background             | #ffffff | #121212 | The terminal screen, and the text on a filled button (from app/globals.css)                                                                              |
| foreground             | #262626 | #b3ffb3 | Typed commands, hero text, field text, success status (from app/globals.css)                                                                             |
| text-body              | #262626 | #93d093 | Output: highlights, descriptions, bio. Dark is foreground at 80% over background (from components/Card.tsx:118). Light is foreground, as drawn on page 9 |
| card                   | #fafafa | #0a0a0a | Title bar, prompt, footer, drawer, resume window (from app/globals.css)                                                                                  |
| primary                | #333333 | #00ff00 | Headings, prompt symbol, links, filled button (from app/globals.css)                                                                                     |
| primary-foreground     | #ffffff | #000000 | Text on primary where a component asks for it (from app/globals.css)                                                                                     |
| arrow                  | #858585 | #07a007 | List arrows and the prompt's hint, drawn as primary at 60% over background (from components/Card.tsx:130)                                                |
| muted                  | #ebebeb | #141414 | The email field (from app/globals.css)                                                                                                                   |
| muted-foreground       | #666666 | #a3c2a3 | Subtitles, listings, footer links, placeholder (from app/globals.css)                                                                                    |
| border                 | #cccccc | #004d00 | Dividers and decoration, which carry no meaning (from app/globals.css)                                                                                   |
| control-edge           | #858585 | #07a007 | The edge of a control. Light as drawn on page 9. Dark is the arrow's colour, his pick: #004d00 measured 1.94                                             |
| error-text             | #b81e1e | #ef4444 | Email errors (from app/globals.css)                                                                                                                      |
| ring                   | #333333 | #00ff00 | Keyboard focus (from app/globals.css)                                                                                                                    |
| destructive            | #ef4444 | #ef4444 | Kept from the theme, used by nothing the direction draws (from app/globals.css)                                                                          |
| destructive-foreground | #ffffff | #ffffff | Kept from the theme, used by nothing the direction draws (from app/globals.css)                                                                          |
| secondary              | #d9d9d9 | #1f1f1f | Today's skill tags, which the direction replaces with plain text (from app/globals.css)                                                                  |
| secondary-foreground   | #404040 | #b3ffb3 | Today's skill tags (from app/globals.css)                                                                                                                |
| accent                 | #e6e6e6 | #1a1a1a | Today's skill tag on hover (from app/globals.css)                                                                                                        |
| accent-foreground      | #333333 | #00ff00 | Today's skill tag on hover (from app/globals.css)                                                                                                        |
| input                  | #d9d9d9 | #1f1f1f | Kept from the theme, used by nothing the direction draws (from app/globals.css)                                                                          |
| popover                | #ffffff | #0a0a0a | Kept from the theme, used by nothing the direction draws (from app/globals.css)                                                                          |

### Pairings

Every foreground and background that appear together, with the kind of pair and the ratio in each
scheme, as `contrast.py` computes it. Read from `components/Card.tsx`, `components/Section.tsx`,
`components/Footer.tsx`, `components/GetResume/` and the prototype that page 8 approved.

| Foreground       | Background | Kind     | light ratio | dark ratio |
| ---------------- | ---------- | -------- | ----------- | ---------- |
| text-body        | background | body     | 15.13       | 10.42      |
| foreground       | background | body     | 15.13       | 15.94      |
| primary          | background | text     | 12.63       | 13.65      |
| muted-foreground | background | text     | 5.74        | 9.64       |
| foreground       | card       | text     | 14.5        | 16.85      |
| primary          | card       | text     | 12.1        | 14.43      |
| muted-foreground | card       | text     | 5.5         | 10.18      |
| foreground       | muted      | text     | 12.69       | 15.68      |
| muted-foreground | muted      | text     | 4.82        | 9.48       |
| background       | primary    | text     | 12.63       | 13.65      |
| error-text       | card       | text     | 6.2         | 5.26       |
| arrow            | background | boundary | 3.69        | 5.39       |
| control-edge     | card       | boundary | 3.54        | 5.69       |
| ring             | background | boundary | 12.63       | 13.65      |

## Typography

### Type styles

Each style once: the size and line height in points, the family, the colour token and where the
style is used. The terminal's sizes are the prototype's, which page 8 approved. The SMS row is the
site's today (from components/SmsProgram/SmsProgramPage.tsx).

Long text in the terminal is mono, which departs from the site today: `app/layout.tsx` gives long copy
to IBM Plex Sans "where a monospace face would hurt readability". Every prototype drew it in mono, so
that each line reads as terminal output, and Zack left the choice to that recommendation on 2026-11-04.
The cost is length: Low Rate Co.'s seven highlights take 46 lines in mono and 37 in Plex on a 360 wide
phone, and 17 and 15 at the terminal's widest. The build changes that comment with the font.

| Style                | Size/line | Family                         | Colour           | Use                                                       |
| -------------------- | --------- | ------------------------------ | ---------------- | --------------------------------------------------------- |
| Hero handle, narrow  | 34/37     | JetBrains Mono 700             | primary          | `zachary.kuptsow`, below 640 wide                         |
| Hero handle          | 60/66     | JetBrains Mono 700             | primary          | `zachary.kuptsow`, from 640 wide                          |
| Tagline              | 18/29     | JetBrains Mono                 | muted-foreground | `$ full-stack-engineer & ./tech.polyglot`                 |
| Hero path            | 14/18     | JetBrains Mono, 0.1em tracking | primary          | `~/root/portfolio`                                        |
| Section heading      | 24/32     | JetBrains Mono 700             | primary          | `# Work Experience`                                       |
| Entry title          | 18/28     | JetBrains Mono 600             | primary          | A job, degree, project or skill group                     |
| Window title         | 20/28     | JetBrains Mono 700             | primary          | `Get the resume`                                          |
| Body                 | 14/23     | JetBrains Mono                 | text-body        | Highlights, descriptions, bio                             |
| Secondary            | 14/23     | JetBrains Mono                 | muted-foreground | Role and dates, `[EOF]` line                              |
| Listing and download | 13/21     | JetBrains Mono                 | muted-foreground | `low_rate_co.txt   draynow.txt`, the fake download        |
| Prompt               | 13/20     | JetBrains Mono                 | foreground       | The path, `$` and the typed command                       |
| Button               | 14/20     | JetBrains Mono 600             | background       | The terminal button                                       |
| Footer and title bar | 12/18     | JetBrains Mono                 | muted-foreground | Footer links, the title bar's path                        |
| Built-with line      | 11/15     | JetBrains Mono                 | muted-foreground | Footer and menu                                           |
| SMS body             | 16/26     | IBM Plex Sans                  | foreground       | The three SMS pages, which a reviewer reads word for word |

### Font sources

A custom font is allowed when its source and licence are written down. Both are committed in
`app/fonts/` and loaded with `next/font/local`, and ESLint forbids `next/font/google` (from
app/fonts/README.md).

| Family         | Source                                                                                                   | Licence                   |
| -------------- | -------------------------------------------------------------------------------------------------------- | ------------------------- |
| JetBrains Mono | Google Fonts' Latin subset, committed at app/fonts/jetbrains-mono/latin.woff2 (from app/fonts/README.md) | SIL Open Font License 1.1 |
| IBM Plex Sans  | Google Fonts' Latin subset, committed at app/fonts/ibm-plex-sans/latin.woff2 (from app/fonts/README.md)  | SIL Open Font License 1.1 |

## Layout and spacing

### Spacing scale

The only spacing values the project uses. A step is a Tailwind step (4 points each); the half steps
are for frames and tight stacks only. The template's scale, which Zack kept on 2026-11-04.

| Step | Points | Use                          |
| ---- | ------ | ---------------------------- |
| 0.5  | 2      | frames                       |
| 1    | 4      | icon and label               |
| 1.5  | 6      | tight stacks                 |
| 2    | 8      | inside a group               |
| 3    | 12     | between related controls     |
| 4    | 16     | between groups               |
| 5    | 20     | screen edge on small phones  |
| 6    | 24     | screen edge, section padding |
| 8    | 32     | between sections             |

### Gaps

The space between things that belong together, and between groups. The gap between groups is at
least twice the gap inside one, so a group reads as a group. The template's values, which Zack kept
on 2026-11-04.

| Kind           | Points |
| -------------- | ------ |
| inside a group | 8      |
| between groups | 16     |

### Widths

The widths in points the rendered check opens each screen at. The web branch's four, plus 360, which
`test-browser/constants.ts` and issue #7 already use (Zack, 2026-11-04).

| Points | Platform | Layout rule                                                                       |
| ------ | -------- | --------------------------------------------------------------------------------- |
| 360    | phone    | one column; title bar shows dots, mark, path and hamburger; plain view in menu    |
| 375    | phone    | one column; as at 360                                                             |
| 402    | phone    | one column; as at 360                                                             |
| 768    | web      | one reading column; Skills in three columns; plain view in the title bar          |
| 1280   | web      | one reading column, 864 wide at most; built-with line and copyright in the footer |

### Text sizes

The text sizes every screen must survive, as whole percentages of the root font size. The web
branch's values, which Zack kept on 2026-11-04.

| Platform | Sizes      |
| -------- | ---------- |
| web      | 100%, 200% |

### Budget

What a screen may ask of the person. The resume sits at the end of the scroll by design, so its
action does not have to be visible without scrolling. These pages are read top to bottom, so there
is no limit on the blocks above the action (both Zack, 2026-11-04).

| Rule                                                        | Value |
| ----------------------------------------------------------- | ----- |
| main actions per screen                                     | 1     |
| main action visible without scrolling at the smallest width | no    |
| blocks above the main action                                | no    |

## Elevation and shape

- **Corners:** 4 points everywhere (`--radius`, from app/globals.css), 8 on the terminal buttons
  (`rounded-lg`, from components/GetResume/constants.ts).
- **Edges:** 1 point. The terminal's outer edge is `primary`; dividers are `border`; controls are
  `control-edge`.
- **What lifts:** only the resume window and the tour, over a backdrop of black at 70% in dark and 35%
  in light, with a 2 point blur (from app/globals.css). Nothing in the output lifts, so today's
  `hover:-translate-y-1` on cards goes with the cards.
- **Dark glow:** the hero's path and handle, `0 0 15px` primary at 90% and `0 0 30px` primary at 40%
  (from app/globals.css). The prompt symbol, `0 0 12px` primary at 80%. A heading or link on hover
  takes the same glow as the handle, and section headings rest at `0 0 12px` primary at 35%.
- **Light glow:** paper gives off no light, so glow is a soft halo: `#33333366` at rest on the handle
  and prompt symbol, `#333333b3` on hover (page 9).
- **Pointer glow:** a soft circle that follows the pointer, from 768 wide on a device with a pointer,
  and never with reduced motion. In dark it blends with `screen`, primary at 40%. In light it blends
  with `multiply`, primary at 20% (from components/GlowCursor.tsx and app/globals.css).
- **Pulsing line:** under the hero's tagline, 128 wide and 1 high, a gradient through `primary` in dark
  and `arrow` in light, pulsing over 2 seconds (from components/Header.tsx, page 9).

## Components

Each with its states. The browser's own controls, with a visible focus: 2 points of `ring`, offset by
3, and in dark a `0 0 12px` glow (from app/globals.css).

- **Title bar:** dots, mark, path, plain view, hamburger, on `card`. Hover: edge and text go
  `primary`. The mark is the active one from `brand/marks.ts`, its small cut at 26 points, on its
  own near-black tile in both themes, and decoration (`aria-hidden`).
  Focus: ring. Disabled and error: not applicable.
- **Prompt:** path, `$`, typed command and a block cursor, on `card`, pinned above the footer. The
  cursor blinks at rest and holds still while a command runs. Not a control.
- **Footer:** arrows and links on `card`, pinned under the prompt. Hover: `primary`. Focus: ring.
- **Drawer:** entries on `card`, from the right, 240 wide and at most 80% of the screen. Hover: a tint of
  `primary`. Current section: `primary` with glow. Focus: ring. Opening it moves nothing behind it.
- **Output:** heading, listing, entry title, subtitle, list with arrows and `[EOF]`, on `background`.
  Headings glow on hover. Links: `primary`, underlined with glow on hover, focus ring.
- **Terminal button:** filled `primary` with `background` text. Hover: transparent with `primary` text
  and glow. Pressed: as hover. Focus: ring. Its quieter twin is outlined and fills on hover (from
  components/GetResume/constants.ts).
- **Resume window:** a native `<dialog>`, with download, open, email and QR code. Escape, the close
  button and the backdrop close it, and closing loads Projects. It opens with the keyboard on the window
  itself, which draws no ring, and nothing on it lit up ("the esc is focused on open"): Tab reaches the
  close button first, with its ring. The QR code hides below `sm`, because a phone cannot scan its own
  screen (from components/GetResume/GetResume.tsx).
- **Email field:** on `muted`. Default: `border` edge with `muted-foreground` placeholder. Submitting:
  read-only, with animated dots and the send button at half strength. Invalid: `error-text` edge and
  message, focus back on the field. Success: the form goes and a `foreground` message takes focus. Rate
  limited: `muted-foreground` message. Network or server error: `error-text` message that points back
  to the download (from components/GetResume/components/EmailOption/).
- **Theme switch:** an entry in the menu, `light mode` or `dark mode`. Hover and focus as the drawer.
  Replaces today's fixed corner button.
- **Tour:** a link-styled control that opens the recording in a terminal window. Nothing plays until
  pressed, and closing it pauses (from components/ProjectDemo/ProjectDemo.tsx).

## Screens

One row per screen. Render is what the rendered check opens. `/` and `/projects.html` are one terminal
at two starting points, and Home owns the projects. The three SMS pages stay plain reading pages, in
the site's colours, at their exact `.html` addresses, because the Twilio campaign links them. Not found
has no main action today, so its cell is empty, and with both of the Budget's action rules off the check
does not ask for one.

### Screens

| Screen      | Route          | One job                                                                                                                                                                | Owns                                                                           | Main action             | Render         |
| ----------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------- | -------------- |
| Home        | /              | Introduce Zack to a hiring manager or recruiter and show his experience with demonstrable examples, in one terminal driven by scrolling (from issue #7, pages 7 and 8) | Hero, profile, work experience, education, skills, the resume window, projects | $./get_resume.sh        | /              |
| Projects    | /projects.html | Let a search result or a shared link land on the projects: the Home terminal, already at Projects (Zack, 2026-11-04)                                                   | Nothing of its own: it shows Home's projects, from data/projects.ts            | → watch the tour (1:31) | /projects.html |
| SMS sign-up | /sms.html      | Show a carrier reviewer how a member opts in, and the messages exchanged (from CLAUDE.md, app/sms/page.tsx)                                                            | The opt-in text and the message exchange                                       | Privacy Policy          | /sms.html      |
| SMS privacy | /privacy.html  | State the assistant's privacy policy for the campaign (from CLAUDE.md)                                                                                                 | The privacy policy                                                             | Sign up                 | /privacy.html  |
| SMS terms   | /terms.html    | State the assistant's terms for the campaign (from CLAUDE.md)                                                                                                          | The terms and conditions                                                       | Sign up                 | /terms.html    |
| Not found   | /404.html      | Tell a visitor the address does not exist (from CLAUDE.md)                                                                                                             | Nothing                                                                        |                         | /404.html      |

## Do's and don'ts

**Keep, from issue #7 and the repository's own checks:**

- Do keep the name in the `<h1>`, with the role and city, and both name forms visible somewhere in the
  page. It is how the site is found by name. The hero's line is hidden visually, never removed.
- Do keep every prompt symbol, arrow and `[EOF]` inside an `aria-hidden` element, because
  `test/app/page.test.tsx` checks them. Typed commands are decoration for the same reason.
- Don't use an em dash or en dash in anything a visitor reads, because `test/data/copy.test.ts` enforces
  it.
- Do keep sections a visitor never scrolled to in the printout: print gets the plain flow.

**The direction:**

- Don't put a window inside the terminal, because "that doesn't make sense". The resume window and the
  tour are the only ones. A song's player is printed as output and scrolls away with it, his choice on
  2026-11-06, knowing it bends this.
- Don't print the tour's command lines in the output, because the prompt already shows them. A line
  the visitor typed is the exception: it is echoed before its result, as scrollback (2026-11-06).
- Don't add a logout screen. "I just want it to go back to the hero page."
- Don't add colour to the light theme, because he chose it as it is, on page 9.
- Don't make `kups.me/get_resume.sh` real, because he chose decoration on page 8.
- Don't ship a new line of copy without his approval, or mention comp or why he left a job. Don't add
  comment lines or jokes: "I will add them if I want them."
- Do write a project card like a launch page: what it does, then what makes it worth a look. Don't lead
  with what it refuses, count anything, mention decision records, or state a default as a feature: "We
  don't need to state obvious facts. That should be a default."

**Traps the prototypes found, each measured in Chrome:**

- Do map scroll to steps, not to an element reaching a line. A section's last line must stay reachable,
  and the first version left the last section hidden.
- Don't read which card the reader has reached from the scroll position alone. Cards share the track
  inside a section, and cards that fit on screen together end in one place: reading past the end of one
  as past the end of the next skipped a degree, and the screen went on to Skills.
- Do clip lines whole at every scroll position, and check every position with a real scrollbar showing.
  Playwright hides scrollbars by default, which hid this: with one showing, 363 of 557 phone positions
  cut a line through the middle. Remove `--hide-scrollbars` and assert the scrollbar's width.
- Do measure after the fonts load, after scrollbars appear, and on rotation.
- Do make End and Home jump, because each command landing cancels a running smooth scroll.
- Don't let the code's own scroll moves read as the reader scrolling on. It made the menu skip the
  download and its printing, and only a timing gave it away.
- Do keep the text in the HTML for search, screen readers and find in page. A scene hidden with
  `display: none` is invisible to all three. A hidden section carries `hidden="until-found"`, and find
  in page reaching one changes the page to the plain flow.
- Do make the commands true of the fake filesystem, by any route. `buildCommand.ts` tracks the folder.
- Do test touch and pull-to-refresh on a real phone before this ships. No prototype has been on one.
- Do fit the email placeholder at phone width: the prototype clipped it to `you@company.c`.
- Do give the hamburger, plain view and footer links a target of 44 by 44. The prototype's bars were only
  30 and 32 high, and the rendered check holds every control to 44 on every width.
- Do check the terminal at 200% text. The prototypes never were.
