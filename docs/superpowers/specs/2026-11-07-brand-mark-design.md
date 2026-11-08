# The Bracket cup on kups.me: design

Date: 2026-11-07. Status: draft, waiting for Zack's approval. Built on the branch
`worktree-brand-mark`, from `origin/main` at 2aa3f71.

## Intent

Zack ran four rounds of logo design (`/designer brand`) and two pages placing the finalists. He
chose one mark for every place it appears:

> "Now that I am seeing it I want unity. I want to go with Bracket Cup. Please make sure the "zk"
> is centered between the brackets. I want to keep the other two on file for if I ever change my
> mind."

The Bracket cup is a pair of square brackets drawn as a cup, with a handle on the right and a
lowercase `zk` inside, green on a near-black tile. It hints at "kups" (cups) for a second look,
which is what he asked for in round one: "I would love to somehow hint at cups for kups."

The other two finalists, the Terminal mug and the zk monogram, stay in the repository. Switching to
one of them is one word and one command (his pick, 2026-11-07: "One-word switch").

## Goals

1. The Bracket cup in the nine places listed under "Where it goes", and nowhere else.
2. The `zk` centered between the brackets, both ways, measured from the letters' ink.
3. Every shipped file draws the letters as outlines, so no place depends on a font loading.
4. One constant names the active mark. Changing it and running one command remakes every file that
   shows the mark, and a test fails when the committed files do not match the constant.
5. The outcome written into the `## Brand and style` section of `projects/resume/DESIGN.md`.

## Non-goals

- No gallery page for comparing marks. Zack chose the switch without one.
- No mark on: the first screen, the prompt (keeps `$`), the menu, the footer, the resume window,
  the projects page's back link, the household assistant's SMS pages, or the resume PDF.
- LinkedIn keeps his photo. Nothing to build.
- His GitHub profile picture is uploaded by him: GitHub has no API for it. The PNG is made for him
  (already done once, outside the repo) and the generator makes it again on a switch.
- No change to the terminal's scroll distances or animation times, which he set by feel.

## Anti-goals

These would make it a failure even if it technically works:

- Letters drawn in a fallback font anywhere: favicon, phone icon, README, share image, email.
- Two different marks visible at once. "Unity" is the point.
- A line of visitor-facing text that Zack has not approved. See "New copy".
- A network connection needed by `yarn build`.
- The email pointing at an image the live site does not serve yet.

## The mark

The approved drawing, on a 64 by 64 grid:

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <rect width="64" height="64" rx="14" fill="#121212"/>
  <g stroke="#00ff00" stroke-width="4.5" stroke-linejoin="round" fill="none">
    <path d="M21 15 H14 V50 H21"/>
    <path d="M39 15 H46 V50 H39"/>
    <path d="M46 22 C 60 22, 60 44, 46 44" stroke-linecap="round"/>
  </g>
  <text x="29.55" y="39.44" text-anchor="middle" font-family="JetBrains Mono"
        font-weight="700" font-size="19" fill="#00ff00">zk</text>
</svg>
```

- **Centering (Zack's pick: "Centered both ways"):** measured in Chrome with the committed
  `app/fonts/jetbrains-mono/latin.woff2` at weight 700. At the earlier anchor (30, 40) the ink ran
  from x 20.09 to 40.82 and y 26.13 to 40.00. The space inside the brackets runs from x 16.25 to
  43.75 and y 17.25 to 47.75, so its middle is (30, 32.5). Moving the anchor to (29.55, 39.44)
  puts the ink's middle there. A 1024 pixel render confirmed it: the ink and the inside of the
  brackets are both centered on pixel 480 across and 520 down.
- **Outlines:** the `<text>` above is the reference. Every shipped file replaces it with path
  data for the same glyphs: JetBrains Mono from the committed file, weight 700, size 19, ink
  centered on (30, 32.5). The font is variable, so the outlines must come from its weight 700
  instance, not from the default master.
- **Tile:** near-black `#121212` with rounded corners, in both site themes. Zack, round one: "On the
  near-black tile everywhere". In dark mode the tile matches the page and the cup seems to float.
  In light mode it is a dark square.
- **The other two marks** are kept in the same form. Their source drawings are in
  `.superpowers/brand-mark/` (`terminal-mug.svg`, `zk.svg`, `bracket-cup.svg`, with the two
  decision pages), which git ignores. Copying them into the repository is the build's first step.
  My call: when the zk monogram's letters are outlined, they are centered in its tile the same way.

## Where it goes

| # | Place | What ships | Details |
|---|---|---|---|
| 1 | Browser tab | `app/favicon.ico` at 16, 32 and 48 pixels, replacing today's green uppercase ZK | Rounded tile, transparent corners |
| 2 | Phone home screen | `app/apple-icon.png`, 180 by 180 | Square tile with no transparency, because iOS rounds the corners itself and fills transparent ones with black. My call |
| 3 | Share image | `app/opengraph-image.png`, rendered again from `share-image/opengraph-image.html` | The mark beside his name, about as tall as the name, the rest of today's card unchanged |
| 4 | GitHub picture | A 1024 pixel PNG for him to upload | Square tile with no transparency. GitHub crops it to a circle, which clears the handle |
| 5 | Repository README | The root `README.md` heading, and the GIF below it | The mark before `kups.me` in the heading, about 30 pixels tall. The GIF is recorded again, see "The README GIF" |
| 6 | Title bar | `components/Terminal/components/TitleBar.tsx` | After the three dots, before `zack@kups: <path>`, about 18 pixels, inside the decoration that is already `aria-hidden` |
| 7 | Typed command | A file `logo.txt` in `~/portfolio` in the typed shell | `cat logo.txt` prints the drawing below. `ls` lists it |
| 8 | 404 page | `app/not-found.tsx` | Above `404`, about 48 pixels, hidden from screen readers |
| 9 | Resume email | `projects/send_resume/functions/send_email/email_content.ts` | In the signature, beside "Best, Zack", shown at 36 pixels. Plain text part unchanged |

### The typed drawing

`cat logo.txt` prints this, exactly (Zack's pick: "Block letters inside the cup"):

```
+--          --+
|       _      |
|   ___| | __  |--.
|  |_  / |/ /  |  |
|   / /|   <   |  |
|  /___|_|\_\  |--'
+--          --+
```

- It prints as an art block, like the eggs' drawings (`renderArt`): spaces kept, `aria-hidden`,
  drawn for the shell's 1.35 row height. The echoed `cat logo.txt` above it already names it for
  a screen reader, as with every egg drawing.
- `logo.txt` is a plain file in `~/portfolio`, so plain `ls` shows it between `get_resume.sh` and
  `projects/`. It is not in `help` (which lists commands), the menu or the scroll tour.
- Trailing spaces are trimmed from each line.
- On a switch, the file prints the active mark's drawing. The other two are the ones Zack saw on
  the places page, 2026-11-07, where he picked the Bracket cup instead. Switching is his decision,
  so he sees them again then. Terminal mug:

  ```
  .----------.
  |----------|--.
  | >_       |  |
  |          |--'
  '----------'
  ```

  zk monogram:

  ```
       _
   ___| | __
  |_  / |/ /
   / /|   <
  /___|_|\_\
  ```

### The email

- The image is a PNG the site serves from kups.me, at twice its shown size, with `width` and
  `height` set to 36. My call, over an inline attachment: kups.me is already the sender's domain,
  it is a small change to the HTML string, and a switch only has to touch the site. The other way,
  an inline attachment through SES's `Attachments` with a content ID, would change `handler.ts`,
  put a copy of the PNG in send_resume, and remove the deploy order below.
- `alt=""`, because the mark is decoration beside his name, and an empty alt adds no new words. A
  mail app that blocks images then shows nothing.
- **Order:** the site deploy that adds the PNG has to be live before send_resume is deployed with
  the new HTML. Both deploys wait for Zack's go-ahead.

## The README GIF

Zack, 2026-11-07: "Re-record and show one easter egg that is subtle like the "logout" one".

- `demo/terminal.gif` films the whole site, title bar included, so it is recorded again in this
  build with the commands in the resume README ("The GIF in the repository's README"). Its title
  bar then shows the Bracket cup, matching the README heading above it.
- The clip gains one typed egg. My reading: `logout` itself, which prints "So long, and thanks for
  all the fish." He gave it as the example, and he names another egg here if he meant a different
  one. The egg's line is already approved copy.
- The storyboard format has a `type` action (`capture_web_driver.mjs` in his dotfiles), so the
  storyboard needs no new tooling. Where in the clip the egg goes is left to the builder, as long
  as the opening hero, the About command and the Work Experience command still show.
- `demo/storyboard.yaml`'s notes are updated: the clip's length, the GIF's size, and the egg.

## The switch

- One constant, in one module, names the active mark: one of `bracket-cup`, `terminal-mug`,
  `zk-monogram`. It starts as `bracket-cup`.
- Every place reads it: the React mark (title bar, 404), the typed drawing, and the generator.
- The generator is one documented command in `projects/resume`. From the active mark it writes
  the favicon, the phone icon, the share image, the GitHub picture, the email PNG and the README's
  image. It runs in local Chrome through the Playwright the project already has. It is not part
  of `yarn build`, and its outputs are committed, like the share image and the QR code today.
- A test fails when the committed files were made from a different mark than the constant names,
  for example by checking a small record the generator writes beside them. As with every new
  guard, it has to be seen failing before it is trusted.
- Switching: change the word, run the command, record the GIF again, commit what changed, deploy.
  The GIF is the one manual step, because recording needs his dotfiles' script and ffmpeg.

## New copy

Every line a visitor reads goes past Zack. This build adds:

- The file name `logo.txt` and the seven lines of the drawing. Both approved on the page, 2026-11-07.
- `logo.txt` in the output of `ls`. Follows from the above.
- Nothing else. The title bar, 404 and README marks and the email image carry empty alt text or
  `aria-hidden`. My call: the share image's alt text (`opengraph-image.alt.txt`) stays as it is,
  because the mark is decoration and changing that line is new copy.

## DESIGN.md

The `## Brand and style` section of `projects/resume/DESIGN.md` gains the outcome. Every existing
answer stays.

- Status line: `Brand: partial conversation, 2026-11-07`. This conversation covered the mark,
  references and feeling, not all six areas. The answers from the 2026-11-04 short form stay.
- **Loved and hated** gains: "Linear is probably the coolest and simpliest and easiest to derive
  from. Any terminal marks would be good too. I would love to somehow hint at cups for kups."
- **Recognisable by** gains the mark: the Bracket cup, a hint "that rewards a second look", "On
  the near-black tile everywhere", and "Now that I am seeing it I want unity. I want to go with
  Bracket Cup." With where it goes, and that the Terminal mug and zk monogram are kept "on file for
  if I ever change my mind".

## Verification

- `yarn check`, `yarn test`, `yarn build`, `yarn test:built-site` and `yarn test:browser` for
  the site, and the send_resume tests, all green locally and in CI.
- The built `out/` folder holds the favicon, the phone icon with its link tag, and the share image
  at 1200 by 630.
- No shipped SVG contains a `<text>` element.
- In real Chrome: the title bar mark in both themes, the 404 mark, and `cat logo.txt` printing the
  drawing whole. `ls` in `~/portfolio` lists `logo.txt`.
- The email test pins the new HTML.
- Every new or changed guard seen failing once.
- A pull request. Merging deploys kups.me, so Zack says when. Then send_resume, which he also
  says when.

## Left to the builder

- Module and file layout, the generator's code, how the ICO file is packed, and how the outlines
  are made, as long as no runtime dependency is added and the outlines match Chrome's rendering of
  the committed font.
- The exact sizes within "about", matched to the mocks Zack approved.
- The README and email markup, and the email PNG's path on kups.me.
- How the switch record is stored and tested.
