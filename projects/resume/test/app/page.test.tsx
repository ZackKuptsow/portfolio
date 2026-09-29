import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Home from '@/app/page'

// Writing Voice hard rule for anything a visitor reads.
const EM_OR_EN_DASH = /[–—]/
// Four jobs and two degrees.
const CARD_COUNT = 6
// The hero line, the about section, four jobs, two degrees and three skill
// columns are well past this. A page that rendered nothing would not be.
const MINIMUM_VISIBLE_CHARACTERS = 5000

function visibleText(): string {
  return document.body.textContent ?? ''
}

describe('Home', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe(): void {}
        unobserve(): void {}
        disconnect(): void {}
      },
    )
  })

  it('shows both forms of the name in the text a visitor reads', () => {
    render(<Home />)

    expect(visibleText()).toContain('Zack Kuptsow')
    expect(visibleText()).toContain('Zachary Kuptsow')
  })

  it('has no em or en dashes anywhere on the page', () => {
    render(<Home />)

    expect(visibleText().match(EM_OR_EN_DASH)).toBeNull()
    // Assert there was a page to examine, so an empty render cannot pass.
    expect(visibleText().length).toBeGreaterThan(MINIMUM_VISIBLE_CHARACTERS)
  })

  it('lists the jobs most recent first', () => {
    render(<Home />)

    const jobTitles = ['Low Rate Co.', 'DrayNow', 'Teampay', 'Qlik']
    const cardHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(cardHeadings.filter((heading) => jobTitles.includes(heading ?? ''))).toEqual(jobTitles)
  })

  it('shows a different file in every card prompt, so no two cards read as one file', () => {
    render(<Home />)

    const cardPrompts = screen.getAllByText(/^cat .+\.txt$/).map((prompt) => prompt.textContent)

    expect(cardPrompts).toHaveLength(CARD_COUNT)
    expect(new Set(cardPrompts).size).toBe(CARD_COUNT)
  })
})
