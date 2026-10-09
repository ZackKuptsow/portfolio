import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Home from '@/app/page'

// Four jobs and two degrees.
const CARD_COUNT = 6
// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/
// Header 1, About 2, three section headings, six cards, three skill columns,
// four in the resume dialog, and Footer 2.
const PROMPT_SYMBOL_COUNT = 21
// One phrase that only its own region renders. A region that stopped rendering
// would otherwise go unnoticed by every check that scans the whole page.
const REGION_SENTINELS = {
  about: 'Core Technologies:',
  education: 'Master of Science - Cybersecurity',
  footer: 'Built with Next.js',
  header: './tech.polyglot',
  resumeDialog: 'Get the resume',
  skills: 'Terraform (HCL)',
  workExperience: 'Founding Lead Engineer',
}

/** All text on the page, including decoration and the closed dialog. Both are shown to someone. */
function pageText(): string {
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

  it('renders every region of the page', () => {
    render(<Home />)

    const missingRegions = Object.entries(REGION_SENTINELS)
      .filter(([, sentinel]) => !pageText().includes(sentinel))
      .map(([region]) => region)

    expect(missingRegions).toEqual([])
  })

  it('shows both forms of the name', () => {
    render(<Home />)

    expect(pageText()).toContain('Zack Kuptsow')
    expect(pageText()).toContain('Zachary Kuptsow')
  })

  it('has no em or en dashes anywhere on the page', () => {
    render(<Home />)

    expect(pageText().match(EM_OR_EN_DASH)).toBeNull()
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

  it('hides every prompt symbol from assistive technology, wherever it appears', () => {
    render(<Home />)

    const promptSymbols = [...document.querySelectorAll('.command-prompt')]
    const exposedPromptSymbols = promptSymbols
      .filter((promptSymbol) => promptSymbol.closest('[aria-hidden="true"]') === null)
      .map((promptSymbol) => promptSymbol.parentElement?.textContent)

    expect(promptSymbols).toHaveLength(PROMPT_SYMBOL_COUNT)
    expect(exposedPromptSymbols).toEqual([])
  })
})
