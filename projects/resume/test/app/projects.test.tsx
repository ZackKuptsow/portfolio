import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import ProjectsPage, { metadata } from '@/app/projects/page'
import { SITE_TITLE } from '@/data/identity'
import { PROJECTS_PAGE_PATH, projects } from '@/data/projects'

// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/

describe('projects page', () => {
  it('names itself for search engines, and as its own canonical address', () => {
    expect(metadata.alternates?.canonical).toBe(PROJECTS_PAGE_PATH)
    expect(metadata.title).toBe(`Projects | ${SITE_TITLE}`)
    expect(metadata.robots).toBeUndefined()
  })

  it('has one main heading, then one card per project in the order given', () => {
    render(<ProjectsPage />)

    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      '# Projects',
    ])
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      projects.map((project) => project.title),
    )
  })

  it('opens every outside link in a new tab, and the way back home in this one', () => {
    render(<ProjectsPage />)

    const outsideLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href')?.startsWith('https://'))
    const homeLink = screen.getByRole('link', { name: 'kups.me' })
    const projectsWithLinks = projects.filter((project) => project.links.length > 0)

    // One per linked project at least, so a page whose cards lost their links cannot pass.
    expect(projectsWithLinks.length).toBeGreaterThanOrEqual(1)
    expect(outsideLinks.length).toBeGreaterThanOrEqual(projectsWithLinks.length)
    expect(outsideLinks.filter((link) => link.getAttribute('target') !== '_blank')).toEqual([])
    expect(
      outsideLinks.filter((link) => !link.getAttribute('rel')?.split(' ').includes('noreferrer')),
    ).toEqual([])
    expect(homeLink.getAttribute('href')).toBe('/')
    expect(homeLink.hasAttribute('target')).toBe(false)
  })

  it('puts the tour behind a control in the Save State card, not a link out', () => {
    render(<ProjectsPage />)

    const saveStateCard = screen
      .getByRole('heading', { level: 3, name: 'Save State' })
      .closest('.terminal-card') as HTMLElement
    const trigger = within(saveStateCard).getByRole('button', { name: /watch the tour/ })

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(within(saveStateCard).queryByRole('link', { name: /tour/ })).toBeNull()
  })

  it('says why where the code is private, as text and not a link', () => {
    render(<ProjectsPage />)

    const privateProjects = projects.filter((project) => project.privateBecause)
    const notes = screen.getAllByText(/^private: /)

    expect(privateProjects.length).toBeGreaterThanOrEqual(1)
    expect(notes.map((note) => note.textContent)).toEqual(
      privateProjects.map((project) => `private: ${project.privateBecause}`),
    )
    expect(notes.filter((note) => note.closest('a') !== null)).toEqual([])
  })

  it('has no em or en dash anywhere a visitor reads', () => {
    const { container } = render(<ProjectsPage />)

    expect(container.textContent ?? '').not.toMatch(EM_OR_EN_DASH)
  })
})
