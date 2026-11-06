import type { OutputLine } from '@/data/terminalEasterEggs'

/** Shared with the page's `FileListing`, so a typed `ls` looks like the tour's. */
const LISTING_CLASS = 'terminal-listing'
const LISTING_FILE_CLASS = 'terminal-listing-file'
const LISTING_WORD_SEPARATOR = '_'
const PROMPT_SYMBOL_CLASS = 'command-prompt'
const PROMPT_SYMBOL = '$'
const LINE_CLASS = 'terminal-session-line'
const ECHO_CLASS = 'terminal-session-echo'
const ART_CLASS = 'terminal-session-art'

/** React marks what a clone must not carry: a section's header, a card's controls. */
export const NOT_CLONED_ATTRIBUTE = 'data-not-cloned'
const STRIPPED_ATTRIBUTES = [
  'aria-labelledby',
  'data-block',
  'data-print-column',
  'data-scene',
  'id',
]
const STRIPPED_CLASSES = ['is-cleared']
/** A clone has no React behind it, so a control in it would be dead. */
const STRIPPED_SELECTOR = `[${NOT_CLONED_ATTRIBUTE}], button, dialog, video`

function hiddenSpan(text: string, className: string): HTMLSpanElement {
  const span = document.createElement('span')
  span.setAttribute('aria-hidden', 'true')
  span.className = className
  span.textContent = text
  return span
}

/**
 * One paragraph per line. Every string reaches the DOM through `textContent`, so typed text can
 * never become markup. A segment with an address is a real link to that fixed address.
 */
export function renderLines(lines: readonly OutputLine[]): readonly HTMLElement[] {
  return lines.map((line) => {
    const paragraph = document.createElement('p')
    paragraph.className = LINE_CLASS
    if (line.length === 0) {
      paragraph.append(document.createElement('br'))
    }
    for (const segment of line) {
      if (segment.href === undefined) {
        paragraph.append(document.createTextNode(segment.text))
        continue
      }
      const link = document.createElement('a')
      link.href = segment.href
      link.target = '_blank'
      link.rel = 'noreferrer'
      link.textContent = segment.text
      paragraph.append(link)
    }
    return paragraph
  })
}

/**
 * The listing markup the page uses: names on a row, each able to wrap after an underscore. Not
 * hidden from a screen reader as the page's is: that one repeats the headings, this repeats nothing.
 */
export function renderListing(names: readonly string[]): HTMLElement {
  const listing = document.createElement('p')
  listing.className = LISTING_CLASS
  for (const name of names) {
    const file = document.createElement('span')
    file.className = LISTING_FILE_CLASS
    name.split(LISTING_WORD_SEPARATOR).forEach((word, index) => {
      if (index > 0) {
        file.append(document.createTextNode(LISTING_WORD_SEPARATOR), document.createElement('wbr'))
      }
      file.append(document.createTextNode(word))
    })
    listing.append(file)
  }
  return listing
}

/** The typed line, as the prompt showed it, kept in the output as a terminal's scrollback keeps it. */
export function renderEchoedLine(path: string, line: string): HTMLElement {
  const paragraph = document.createElement('p')
  paragraph.className = `${LINE_CLASS} ${ECHO_CLASS}`
  paragraph.append(
    document.createTextNode(`${path} `),
    hiddenSpan(PROMPT_SYMBOL, PROMPT_SYMBOL_CLASS),
    document.createTextNode(` ${line}`),
  )
  return paragraph
}

/** A drawing, in a block that keeps its spaces. */
export function renderArt(lines: readonly string[]): HTMLElement {
  const art = document.createElement('pre')
  art.className = ART_CLASS
  art.textContent = lines.join('\n')
  return art
}

/**
 * A card as `cat` prints it: a copy of the block React rendered, without the section header that
 * prints with the first card, without any control (a clone has no React behind it), and without
 * the ids and data attributes the engine finds blocks by, since `querySelector` would find a copy
 * sitting before the original.
 */
export function cloneCard(block: HTMLElement): HTMLElement {
  const clone = block.cloneNode(true) as HTMLElement
  for (const element of clone.querySelectorAll(STRIPPED_SELECTOR)) {
    element.remove()
  }
  for (const element of [clone, ...clone.querySelectorAll<HTMLElement>('*')]) {
    for (const attribute of STRIPPED_ATTRIBUTES) {
      element.removeAttribute(attribute)
    }
    element.classList.remove(...STRIPPED_CLASSES)
  }
  return clone
}
