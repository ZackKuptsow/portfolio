import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Terminal } from '@/components/Terminal'
import {
  cloneCard,
  renderArt,
  renderEchoedLine,
  renderLines,
  renderListing,
} from '@/components/Terminal/shell/renderOutput'

function blockOnPage(blockId: string): HTMLElement {
  render(<Terminal startSectionId="hero" />)
  const block = document.querySelector<HTMLElement>(`[data-block="${blockId}"]`)
  if (!block) {
    throw new Error(`The page has no block "${blockId}"`)
  }
  return block
}

describe('renderOutput', () => {
  it('writes typed text as text, never as markup', () => {
    const [line] = renderLines([[{ text: '<img src=x onerror=alert(1)>' }]])

    expect(line.querySelector('img')).toBeNull()
    expect(line.textContent).toBe('<img src=x onerror=alert(1)>')
    expect(line.className).toBe('terminal-session-line')
  })

  it('renders a link segment as a real link to its fixed address, in a new tab', () => {
    const [line] = renderLines([[{ text: 'see ' }, { href: 'https://example.com/', text: 'go' }]])
    const link = line.querySelector('a')

    expect(link?.getAttribute('href')).toBe('https://example.com/')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noreferrer')
    expect(line.textContent).toBe('see go')
  })

  it('keeps an empty line as a line, so blank output has height', () => {
    const [line] = renderLines([[]])

    expect(line.textContent).toBe('')
    expect(line.childNodes.length).toBeGreaterThan(0)
  })

  it('puts the echoed prompt symbol in an aria-hidden span', () => {
    const echoed = renderEchoedLine('~/portfolio', 'ls -a')

    expect(echoed.querySelector('.command-prompt')?.getAttribute('aria-hidden')).toBe('true')
    expect(echoed.textContent).toBe('~/portfolio $ ls -a')
  })

  it('draws a listing with the markup the page uses for one', () => {
    const listing = renderListing(['draynow.txt', 'low_rate_co.txt'])

    expect(listing.className).toBe('terminal-listing')
    expect(listing.getAttribute('aria-hidden')).toBe('true')
    expect(
      [...listing.querySelectorAll('.terminal-listing-file')].map((file) => file.textContent),
    ).toEqual(['draynow.txt', 'low_rate_co.txt'])
    expect(listing.querySelectorAll('wbr')).toHaveLength(2)
  })

  it('draws art in a pre, line by line', () => {
    const art = renderArt(['  /\\  ', ' /__\\ '])

    expect(art.tagName).toBe('PRE')
    expect(art.className).toBe('terminal-session-art')
    expect(art.textContent).toBe('  /\\  \n /__\\ ')
  })

  it('clones a card without its header, ids and cleared state, and leaves the page alone', () => {
    const original = blockOnPage('work-0')
    original.classList.add('is-cleared')

    const clone = cloneCard(original)

    expect(clone.hasAttribute('data-block')).toBe(false)
    expect(
      clone.querySelector('h2, .terminal-listing, [id], [data-block], [aria-labelledby]'),
    ).toBeNull()
    expect(clone.classList.contains('is-cleared')).toBe(false)
    expect(clone.textContent).toContain('Low Rate Co.')
    expect(clone.textContent).not.toContain('Work Experience')
    expect(document.querySelectorAll('[data-block="work-0"]')).toHaveLength(1)
    expect(original.querySelector('h2')).not.toBeNull()
  })

  it('clones a card with a recording without its button, dialog or video', () => {
    const original = blockOnPage('projects-2')
    expect(original.querySelector('button')).not.toBeNull()

    const clone = cloneCard(original)

    expect(clone.textContent).toContain('Save State')
    expect(clone.querySelector('button, dialog, video')).toBeNull()
  })

  it('keeps the links of a card, which are plain anchors', () => {
    const clone = cloneCard(blockOnPage('projects-0'))

    expect(clone.querySelector('a')?.getAttribute('href')).toContain('github.com')
  })
})
