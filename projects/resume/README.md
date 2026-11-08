# resume

The portfolio site behind **[kups.me](https://kups.me)** — a Next.js 15 app exported to static HTML and served from S3 + CloudFront (provisioned by the [`infrastructure`](../infrastructure) project).

## Stack

- **Next.js 15** (App Router) + **React 19**
- **Tailwind CSS 4** with CSS-variable theming, dark by default, and a light theme from the menu
- **Static export** — the build emits `out/`, which the infrastructure project deploys
- One stationary terminal that scrolling drives, on top of a plain page (see "The terminal")

## Structure

```
app/              # App Router entry (layout, page, global styles), plus what search engines read
app/fonts/        # The two font files the site serves, with their licenses and source
brand/            # The marks as data, the script that makes every image of the active one, and its output
components/       # UI components (Terminal, GetResume, ThemeToggle, GlowCursor, ...)
data/identity.ts  # Who the site is about: name forms, role, location, email, profile links, site URL
data/profile.ts   # Resume content: work experience, education, skills, about copy
data/projects.ts  # The projects: side projects and open source, each with its links and any demo
data/householdAssistantSms.ts  # The household assistant's SMS pages: brand, keyword, the three Twilio replies
data/terminalEasterEggs.ts     # What the typed shell hides: files, commands, drawings and links, as data
demo/             # The GIF at the top of the repository's README, and the storyboard that films it
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

## The terminal

`components/Terminal/` is the home page and the projects page: one stationary screen, and
scrolling drives it. `DESIGN.md` holds what it should do, with Zack's reasons. This is how it does
it.

**The plain flow comes first.** React renders every section as plain output in one reading column,
in the server's HTML. A visitor without a script, or with reduced motion, or printing, reads that,
and so does a search engine. `engine/TerminalEngine.ts` is an upgrade on top: it moves, clips and
hides what React rendered, and writes no text of its own, so every word stays in the HTML. The one
exception is what a visitor types at the prompt (see "Typing" below), which prints into containers
of its own and is gone at the next clear.
`test-built-site/pageText.test.ts` reads the file with its scripts stripped and checks every job,
degree, skill and project is there.

**Two scripts decide.** `app/prePaintScript.ts` runs before the first paint. It sets the theme and
adds `terminal-on` to `<html>`, so a visitor never sees every section stacked up. If the script
bundle has not taken over within 6 seconds it takes the class off again, and the visitor gets the
plain flow instead of one stranded screen. The engine starts only if the class is there.

**Scroll maps to steps, not to elements.** `buildSections.ts` makes one step per card, or one for a
section with no cards. `engine/scrollMap.ts` puts each on a virtual track, and a step's length is
exactly the output that does not fit on screen, so its last line can always be reached.
`engine/textRows.ts` clips whole rows at every position. A command runs on its own clock
(`typeCommand`, `streamOutput`, `playDownload`, all through `commandClock`), so a new swipe or a
click fast-forwards it. `streamOutput` prints a list of runs in turn, which is how Skills prints
what is above its columns, then column 1, then 2, then 3 (`data-print-column`).

**What is printed stays printed.** Inside a section the scroll is the output's own position, 1:1, so
going back up through its cards is a plain scroll, like a terminal's scrollback: no command, nothing
reprinted, and the cards below stay. Coming back down is the same until past the last line printed.
So cards share the track, and a scroll position cannot say which of them the reader has reached:
cards that fit on screen together all end in one place. The engine's current step says that, and the
scroll says only which section it has left for (`countStepsOutsideSection`).

**One swipe does one thing.** macOS goes on sending wheel events for seconds after the fingers lift,
so distance alone reads momentum as the reader scrolling on: one flick used to run five commands
into the download. `engine/scrollGesture.ts` tells one swipe from the next by the input going quiet,
and `engine/ScrollDriver.ts` spends a swipe once it has started a command, finished one, or reached
the edge of the output: its last line going down, and the top of the section going up. What is left
of it is held in place. A dragged scrollbar is no gesture, and still jumps.

**Commands are worked out, not listed.** `buildCommand.ts` tracks the fake folder the prompt is in,
so a command is true by any route. A straight read down gives the table in `DESIGN.md` word for
word. Going up, its `cd ..` is true only for the first hop out of a folder, so the next hop reads
`cat education/x.txt`.

**Measuring.** The layout measures after the fonts load, and again when the terminal's size, the
scroller's width or the root font size change. A re-measure keeps the reader on the same step at
the same point: a phone's address bar changes the size on every scroll. The prompt reserves room
for the longest command it can wrap to, at every width and text size.

**The resume.** `GetResume` is mounted at the root of the terminal, never in a section: `showModal`
on a dialog inside a hidden section shows nothing. It stays mounted, so an email request survives
closing it. Closing it, by any route, types the Projects command.

**Find in page.** Hidden sections carry `hidden="until-found"`. When the browser finds a match in
one, the page changes to the plain flow, which can show it. In a browser without that attribute,
plain view is the way to search.

**The scrollbar is hidden.** The screen does not move, so a scrollbar would only measure the virtual
track. `test-browser/wholeRowsWithScrollbar.spec.ts` shows a real one anyway, because Playwright
hides them by default and that once hid 363 cut lines out of 557 positions.

**Typing.** A visitor with a hardware keyboard can type at the prompt (`components/Terminal/shell/`;
the design is `docs/superpowers/specs/2026-11-06-typed-terminal-commands-design.md`). It is
type-anywhere: a printable key starts the line, and while the line is empty every key is the engine's,
so Space and the arrows scroll and Tab moves focus as before (`shell/TypedInput.ts`). With text in
the line, Space is a character, Tab completes command names and the entries of the folder named, Up
and Down recall, Enter runs. Scrolling past the end of a section drops a half-typed line and types the
tour's command.

The shell is a closed table, for show. `tokenizeCommandLine.ts` splits a line on `&&` and strips a
pair of quotes, and refuses `|`, `;`, `>`, `<`, a backtick and `$(`. `fakeFileSystem.ts` builds the
tree behind the prompt from the same data as the tour, so a card and its file never disagree, and
`buildCommand.ts` uses its `relativePathBetween` to type a true `cd` from wherever a typed `cd` left
the prompt. `commandTable.ts` holds every command the shell knows and `runCommandLine.ts` runs a
line through it, stopping at the first failure as `&&` does; anything else is bash's
`command not found`. The shell speaks as bash, and its fixed lines are in `shell/constants.ts`.

Output prints into a container after the current card, one per card typed on (`shell/SessionOutput.ts`), which
`TerminalLayout.measure()` counts as part of the step, so it is on the scroll track like everything
else. The typed line is echoed before its result, as scrollback; the tour's own commands are not.
The tour's next `clear && …`, an upward command and plain view remove the container. A typed `clear`
appends a blank the height of the screen, so what was printed stays reachable above. `cat` prints a
copy of the card (`renderOutput.ts`, `cloneCard`), stripped of its header, its controls and the ids
and data attributes the engine finds blocks by.

Nothing typed is evaluated, sent or stored. Every string reaches the DOM through `textContent`, and
an ESLint override in `.eslintrc.js` forbids `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `eval`
and `Function` under `components/Terminal/` (seen red on a planted line before it shipped). `open`
opens only the site's own addresses, and no command comes from a link. The easter eggs are data in
`data/terminalEasterEggs.ts`, checked by `shell/checkEasterEggs.ts` against the rules the shell
relies on; the words are Zack's or the works' own, and the data test holds each one word for word.
An egg can ask a question the next typed line answers, which is never run (`ShellQuestion`). A secret
answer never shows, is never echoed and joins neither history, because a visitor may type a real
password into the fake one. Animations are frames of plain text in `data/terminalEggFrames.ts`, played
on the terminal's clock, and the drawings are in `data/terminalEggDrawings.ts`. A song plays from its
official upload in a player printed as output (`renderPlayer`), which exists only once the command is
typed and goes when the screen changes; the site hosts no audio. `help` points at `/usr/games`, which
lists the hidden commands, and `hint` names one not tried yet. `git log` prints the
repository's last commits, read at build by `app/readGitLog.ts`, which is why the gates job checks
out 20 commits, with any em or en dash in a subject printed as a hyphen.
Phones and other touch-only devices are out: issue #27.

## The projects page

`/projects.html` (`app/projects/page.tsx`) is the same terminal, opened at Projects, from
`data/projects.ts`. As with the household assistant's pages, the `.html` is part of the address.
Unlike them, it names itself as canonical and is in the sitemap: the point of the page is to be
found. Nothing on the home page links to it, because the home page holds Projects itself, so the
sitemap and links from elsewhere are how it is found.

Its server HTML holds only the Projects section, with its own `h1` and title. The other sections
arrive with the script, so the resume text has one home for search engines, the home page, and a
visitor without a script gets the list and a link home.

Every project gives a visitor somewhere to go: a link, a recording to open, or, where the code
is private, the reason in a few words shown where the link would be (`privateBecause`, rendered
as `private: <reason>`). A project with none of the three is only a claim, so `ProjectEntry` does
not compile without one, and `test/data/projects.test.ts` checks that each link is `https://` or a
file in `public/`, that each reason is a phrase and not a sentence, and that the mobile app's
legacy name never appears. The private products are described at the level of their public pages
and no further. A project may carry a recording (`video`). Its link row then ends with a control
that opens the recording in a `TerminalDialog`, the same window as the resume. Only the poster and
the file's metadata load with the page; closing the window pauses the recording.

Each card reads like a launch page: what the thing does and who it is for, then what makes it worth
a look. Three rules came from Zack's review on 2026-11-06. No counts, because a count on a site that
deploys rarely goes stale within days. Nothing about decision records. And nothing a reader would
assume anyway: "We don't need to state obvious facts. That should be a default." A working 404 page,
a browser test or a green gate is a default. `test/data/projects.test.ts` checks the first two.

The Save State entry shows a `live site` link only when `NEXT_PUBLIC_SAVE_STATE_LIVE_URL` is set
at build time (see Environment). Leave it unset until the site is behind a login, so it offers no
way to a site anyone could write to. Its code link waits on the repository being public.

`test/data/projects.typecheck.ts` holds the values that must not compile, such as a project with
no links, no recording and no reason.

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
`share-image/opengraph-image.html` and run `yarn brand`, which renders it with the mark beside the
name (see "The mark"). The page loads the committed JetBrains Mono, so no network is needed, and
`yarn brand` stops rather than save a picture drawn in a fallback font or missing the mark.

## Fonts

`app/fonts/` holds the two files the site serves, and `app/layout.tsx` loads them with
`next/font/local`, so `yarn build` needs no network. ESLint forbids importing `next/font/google`,
which downloads during the build. `app/fonts/README.md` records each file's source, version and
license.

Both files are variable, so `layout.tsx` gives each weight as a range. With one number the browser
draws bold by smearing the regular weight.

`next/font` computes a `… Fallback` rule for each font from its file: Arial, scaled to match. The
rule does more than hold the text in place until the font arrives. `→` and `←` are in neither file,
so every arrow on the page is drawn through that rule for good, and its `size-adjust` sets their
width. A change to a font file can therefore move the text beside the arrows and change where lines
wrap, so look at the page at 360x640 afterwards.

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

## The mark

The site's mark is the Bracket cup: square brackets drawn as a cup with a handle, `zk` inside,
green on a near-black tile in both themes. `brand/marks.ts` holds it, and the two marks Zack kept
on file, the Terminal mug and the zk monogram, as data: each one's shapes on a 64 by 64 grid and
the drawing `cat logo.txt` prints. `ACTIVE_MARK` names the one every place shows.

| Place                  | From                                                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Browser tab            | `app/favicon.ico`, at 16, 32 and 48 pixels                                                 |
| Phone home screen      | `app/apple-icon.png`, square, because iOS rounds the corners itself                        |
| Share image            | `app/opengraph-image.png`, from `share-image/opengraph-image.html`, which shows `mark.svg` |
| GitHub profile picture | `brand/github-picture.png`, uploaded by hand, because GitHub has no API for it             |
| The repository README  | `brand/mark.svg`                                                                           |
| Title bar and 404 page | `components/BrandMark/`, drawn inline and `aria-hidden`                                    |
| `cat logo.txt`         | The active mark's drawing, a file in `~/portfolio` (`shell/fakeFileSystem.ts`)             |
| Resume email           | `public/email-mark.png`, which send_resume's `email_content.ts` links to on kups.me        |

The letters are outlines, never live text, so the favicon, the README and the email draw them
without the font. `brand/outline_letters.py` writes them from `app/fonts/jetbrains-mono/latin.woff2`
at weight 700, with the letters' ink, not their spacing, centered on the point given. It runs with
uv, which installs its two packages for that script alone, from the hashes in
`outline_letters.py.lock`:

```bash
uv run --locked brand/outline_letters.py app/fonts/jetbrains-mono/latin.woff2 zk 19 30 32.5 700
```

To switch marks:

1. Change `ACTIVE_MARK` in `brand/marks.ts`. The title bar, the 404 page and `cat logo.txt` follow.
   Change the pin in `test/brand/marks.test.ts` to match: it is there so a switch is never an
   accident.
2. Run `yarn brand`. It renders every file in the table in the installed Chrome and writes
   `brand/generated.json`.
3. Record the GIF again (see "The GIF in the repository's README"), because it films the title bar.
4. Rename the mark where the docs name it: this section, "The mark" in `DESIGN.md`'s Brand
   section, and the line in the repository's `CLAUDE.md`.
5. Deploy the site, then send_resume, so the email never links to a picture the site does not
   serve yet. Upload the new GitHub picture by hand.

`test/brand/generatedFiles.test.ts` fails when the committed files were made from another mark, or
from this one as it was drawn before, so step 2 cannot be skipped by accident. It checks that the
files are the ones the generator wrote, not that they look right: look at each one after a run,
the small ones enlarged. The Terminal mug's and the zk monogram's drawings were shown to Zack when
he picked the Bracket cup's, so a switch shows him its drawing again before it ships.

## Checks that need a build

`yarn test` reads the source. Two more suites read what `yarn build` wrote to `out/`, so run
the build first. CI runs both on every pull request and before every deploy.

`yarn test:built-site` (in `test-built-site/`) reads the files: the tags a search engine and a
link preview read in the built page, `robots.txt`, `sitemap.xml`, the PDF, the 404 page, whether
every script, stylesheet and font the page asks for was written, and whether every word of the
resume is in the home page's HTML and every project in the projects page's.

`yarn test:browser` (in `test-browser/`) opens the site in Chrome with Playwright, for what
jsdom cannot see:

- Every line can be read whole at every scroll position (`wholeRows*.spec.ts`), back through what is
  printed included, checked every 5 points: on a laptop, on a phone, on a phone at twice the text
  size, and on a phone with a real scrollbar showing. These take a few minutes, on purpose.
- A straight read down types the commands in `DESIGN.md` word for word, lands on every card in turn,
  also on a screen tall enough to fit whole sections, and the commands stay true going back up. The
  screen clears between sections, End and Home jump, and up from the first screen types `exit`.
- Going back through what is printed is a plain scroll, with no command and every card still there,
  and only going past the top of a section types one (`scrollback.spec.ts`).
- What a visitor types prints under the current card in whole rows and clear of the prompt, a
  scroll or the screen changing takes it away and leaves the layout as if nothing was typed, the
  tour's commands stay true from wherever a typed `cd` left the prompt, and the menu, the resume
  window and plain view keep their keys (`typedCommands.spec.ts`).
- Skills prints its columns one at a time, in whole lines, and a click or plain view part way through
  leaves none half printed (`skillsColumns.spec.ts`).
- One swipe does one thing: played as a trackpad sends it, momentum and all, the hardest flick types
  one command in full and moves one step, a gentle swipe types nothing, and a flick stops on the last
  line of long output (`swipes.spec.ts`).
- The resume, from the terminal: the end of Skills opens the real window after about 6.5 seconds, a
  click skips that, the menu does not skip it, closing by any route loads Projects, going up never
  opens it, and an email request survives closing.
- Rotating a phone, or the address bar changing size, keeps the reader on the same step at the
  same point.
- The plain flow: reduced motion, no script, a script that never arrives, plain view and print all
  show every section. Find in page reaching a hidden section gets it. The hero fills the first screen
  and no more, without moving the name at the first paint of the terminal (`plainFlow.spec.ts`).
- The first paint shows the hero, not every section stacked up.
- The theme opens dark whatever the system prefers, a stored choice wins, and the pages without a
  terminal keep the corner switch.
- Nothing runs off the side at 15 widths from 320px to 1280px, in the terminal, in the plain flow
  and in the get-resume window. The email placeholder fits the field on a phone.
- The keyboard lands on the get-resume window itself with no ring showing, also when the window has
  to scroll, Tab reaches the close button first, and it lands on the output when the page opens.
- The QR code is shown at 640px wide and hidden at 639px.
- No script error, on load, down through the sections or when a window opens.
- On the projects page, the terminal opens at Projects with one main heading, and the Save State
  tour opens in a window that fits a phone and a laptop screen.

`test-browser/getResumeWindow.ts` opens the window from the plain flow's button, because the
terminal has none: the scroll route is checked on its own in `terminal.spec.ts`.

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

## The GIF in the repository's README

`demo/terminal.gif` is the picture at the top of the repository's README, and
`demo/storyboard.yaml` is what it films, in the format of the `demo-video` skill in Zack's dotfiles.
The clip stops before Projects, so a change to a project's copy does not make it stale. A change to
the profile, to the first job or to the mark does, because the clip films the title bar. It ends
on one typed egg, `logout`: Zack asked for "one easter egg that is subtle like the "logout" one".
To record it again, build, then from this folder:

```bash
python3 ~/dotfiles/hermes/skills/creative/demo-video/scripts/capture_web.py \
  --storyboard demo/storyboard.yaml --output <directory> --export-directory out \
  --repository <a repository whose Playwright has its browser cached>
ffmpeg -i <directory>/terminal.webm -filter_complex "fps=12,scale=800:-1:flags=lanczos,split[first][second];[first]palettegen=max_colors=64:stats_mode=diff[palette];[second][palette]paletteuse=dither=none:diff_mode=rectangle" demo/terminal.gif
```

`--repository` is there because the script launches Playwright's own Chromium, and this project has
none: its browser checks use the installed Chrome. Since the clip types `logout`, the skill's
scripts as they are refuse the storyboard, because they allow no Enter in typed text. The committed
GIF came from a copy with that check and one other line changed, which `notes` in the storyboard
spell out.

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

One more value is optional. When it is set, the Save State entry among the projects gets a
`live site` link to it; unset, it shows the code link only. Set it only once the site is behind a
login:

```bash
NEXT_PUBLIC_SAVE_STATE_LIVE_URL=https://dojo.kups.me
```

## Deployment

`yarn build` produces `out/`, which the **infrastructure** project uploads to S3 and serves through CloudFront. Pushing to `main` triggers the deploy workflow automatically. It deploys only when lint, format, typecheck, the tests and the build all pass (see "Checks" in the root README).
