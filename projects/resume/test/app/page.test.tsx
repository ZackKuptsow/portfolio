import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import Home from '@/app/page'
import { education, skillGroups, workExperience } from '@/data/profile'
import { projects } from '@/data/projects'

// The page reads the repository's commits at build. Here the lines are fixed, so the test needs no git.
vi.mock('@/app/readGitLog', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/app/readGitLog')>()),
  readGitLog: () => ['abc1234 test: a fixed commit line'],
}))

// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/
// The hero 1, the `echo` line 1, the prompt 1, and four for the resume button and its dialog.
const PROMPT_SYMBOL_COUNT = 7
// One phrase that only its own region renders. A region that stopped rendering
// would otherwise go unnoticed by every check that scans the whole page.
const REGION_SENTINELS = {
  about: 'Core Technologies:',
  education: 'Master of Science - Cybersecurity',
  footer: 'Built with Next.js',
  header: './tech.polyglot',
  projects: 'hermes-imessage-shortcuts',
  resumeDialog: 'Get the resume',
  skills: 'Terraform (HCL)',
  workExperience: 'Founding Lead Engineer',
}

/** All text on the page, including decoration and the closed dialog. Both are shown to someone. */
function pageText(): string {
  return document.body.textContent ?? ''
}

/** The file names one section's `ls` prints. */
function readListing(sectionId: string): string[] {
  const section = document.querySelector(`[data-scene="${sectionId}"]`)
  return [...(section?.querySelectorAll('.terminal-listing-file') ?? [])].map(
    (file) => file.textContent ?? '',
  )
}

describe('Home', () => {
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

  it('keeps the name, the role and the city in the one main heading', () => {
    render(<Home />)

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      'Zack Kuptsow · Full Stack Software Engineer · Philadelphia, PA',
    ])
  })

  it('has no em or en dashes anywhere on the page', () => {
    render(<Home />)

    expect(pageText().match(EM_OR_EN_DASH)).toBeNull()
  })

  it('lists the jobs most recent first', () => {
    render(<Home />)

    const jobTitles = workExperience.map((job) => job.title)
    const cardHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((heading) => heading.textContent)

    expect(jobTitles).toEqual(['Low Rate Co.', 'DrayNow', 'Teampay', 'Qlik'])
    expect(cardHeadings.filter((heading) => jobTitles.includes(heading ?? ''))).toEqual(jobTitles)
  })

  it('gives every card its own file in the listing, so no two cards read as one file', () => {
    render(<Home />)

    expect(readListing('work')).toEqual([
      'low_rate_co.txt',
      'draynow.txt',
      'teampay.txt',
      'qlik.txt',
    ])
    expect(readListing('education')).toEqual([
      'cyber_university_of_delaware.txt',
      'eleg_university_of_delaware.txt',
    ])
    expect(readListing('skills')).toHaveLength(skillGroups.length)
    expect(new Set(readListing('projects')).size).toBe(projects.length)
    expect(education).toHaveLength(2)
  })

  it('prints no command in the output, because the prompt shows them', () => {
    render(<Home />)

    const output = [...document.querySelectorAll('[data-scene]')].map(
      (scene) => scene.textContent ?? '',
    )

    expect(output.filter((text) => /\bcat [a-z_]+\.txt\b/.test(text))).toEqual([])
  })

  it('hides every prompt symbol, arrow and [EOF] from assistive technology', () => {
    render(<Home />)

    const promptSymbols = [...document.querySelectorAll('.command-prompt')]
    const decoration = [
      ...promptSymbols,
      ...document.querySelectorAll('.terminal-arrow'),
      ...document.querySelectorAll('.terminal-eof'),
      ...document.querySelectorAll('.terminal-footer-arrow'),
    ]
    const exposed = decoration
      .filter((element) => element.closest('[aria-hidden="true"]') === null)
      .map((element) => element.parentElement?.textContent)

    expect(promptSymbols).toHaveLength(PROMPT_SYMBOL_COUNT)
    expect(exposed).toEqual([])
  })

  it('shows the mark in the title bar, after the dots and before the path, as decoration', () => {
    render(<Home />)

    const marks = document.querySelectorAll('.terminal-title-bar svg')
    expect(marks).toHaveLength(1)
    const [mark] = marks
    expect(mark.getAttribute('aria-hidden')).toBe('true')
    expect(mark.previousElementSibling?.classList.contains('terminal-dots')).toBe(true)
    expect(mark.nextElementSibling?.classList.contains('terminal-title')).toBe(true)
  })
})
