import { act, isInaccessible, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { applyTheme } from '@/components/applyTheme'
import { Terminal } from '@/components/Terminal'

// jsdom has no layout, so these check the plain flow's markup and the controls' wiring. What the
// terminal does on top of it is checked in a real browser, in `test-browser/terminal.spec.ts`.
describe('Terminal, as the plain flow', () => {
  it('links to the public profiles in new tabs', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    const profileLinks = ['LinkedIn', 'GitHub'].map((name) => screen.getByRole('link', { name }))

    expect(profileLinks.map((link) => link.getAttribute('href'))).toEqual([
      'https://www.linkedin.com/in/zack-kuptsow/',
      'https://github.com/ZackKuptsow',
    ])
    expect(profileLinks.map((link) => link.getAttribute('target'))).toEqual(['_blank', '_blank'])
  })

  it('offers a way to write to him directly, without opening a new tab', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    const emailLink = screen.getByRole('link', { name: 'Email' })

    expect(emailLink.getAttribute('href')).toBe('mailto:zkups56@gmail.com')
    expect(emailLink.hasAttribute('target')).toBe(false)
  })

  // Zack, on the first build: "we should probably remove projects here." Projects is a section of
  // the terminal, with its place in the menu, and the rest of the footer leads off the site.
  it('keeps the footer to the ways of reaching him', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    const footerLinks = within(screen.getByRole('contentinfo')).getAllByRole('link')

    expect(footerLinks.map((link) => link.textContent)).toEqual(['→LinkedIn', '→GitHub', '→Email'])
  })

  it('names what the site is built with and whose it is, this year', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    const footer = screen.getByRole('contentinfo')

    expect(footer.textContent).toContain(
      'Built with Next.js, deployed via AWS CDK, automated through GitHub Actions',
    )
    expect(footer.textContent).toContain(`© ${new Date().getFullYear()} zachary.kuptsow`)
  })

  it('keeps the profile words that make it this site', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    expect(screen.getByText('Last updated:')).toBeTruthy()
    expect(screen.getByText(/echo "Let's build something amazing together"/)).toBeTruthy()
    expect(screen.getByText(/echo "Let's build something together"/)).toBeTruthy()
    expect(document.querySelectorAll('.terminal-hero-rule')).toHaveLength(1)
    expect(document.querySelectorAll('.terminal-hero-path.text-terminal')).toHaveLength(1)
  })

  it('shows the handle once, without the second one the old About card carried', () => {
    const { container } = render(<Terminal gitLog={[]} startSectionId="hero" />)

    expect(container.querySelectorAll('.terminal-hero-handle')).toHaveLength(1)
    expect(container.querySelector('[data-scene="about"]')?.textContent).not.toContain(
      'zachary.kuptsow',
    )
  })

  it('offers the resume as a button, which opens the window from the root of the page', async () => {
    const user = userEvent.setup()
    const { container } = render(<Terminal gitLog={[]} startSectionId="hero" />)

    await user.click(screen.getByRole('button', { name: './get_resume.sh' }))

    const dialog = screen.getByRole('dialog', { name: 'Get the resume' })
    expect(dialog.hasAttribute('open')).toBe(true)
    // A dialog in a section the terminal may hide would show nothing when it opens.
    expect(dialog.closest('[data-scene]')).toBeNull()
    expect(dialog.parentElement).toBe(container.querySelector('.terminal-root'))
  })

  it('renders every prompt line as decoration', () => {
    render(<Terminal gitLog={[]} startSectionId="hero" />)

    const prompt = document.querySelector('.terminal-prompt') as HTMLElement

    expect(isInaccessible(prompt)).toBe(true)
  })

  it('never says what it will not say: no comment lines, and nothing about comp', () => {
    const { container } = render(<Terminal gitLog={[]} startSectionId="hero" />)
    const text = container.textContent ?? ''

    expect(container.querySelectorAll('.terminal-comment')).toHaveLength(0)
    expect(text).not.toMatch(/\b(salary|compensation|laid off|resigned|fired)\b/i)
  })
})

describe('the menu', () => {
  it('opens and closes from its button, and says which it is', async () => {
    const user = userEvent.setup()
    render(<Terminal gitLog={[]} startSectionId="hero" />)
    const menuButton = screen.getByRole('button', { name: 'Menu' })

    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
    await user.click(menuButton)
    expect(menuButton.getAttribute('aria-expanded')).toBe('true')
    await user.click(menuButton)
    expect(menuButton.getAttribute('aria-expanded')).toBe('false')
  })

  it('switches the theme and remembers it', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')
    localStorage.clear()
    render(<Terminal gitLog={[]} startSectionId="hero" />)
    const drawer = screen.getByRole('navigation', { hidden: true, name: 'Menu' })

    await user.click(within(drawer).getByRole('button', { hidden: true, name: 'light mode' }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
    expect(within(drawer).getByRole('button', { hidden: true, name: 'dark mode' })).toBeTruthy()
  })

  // A typed `theme light` goes through `applyTheme`, so the menu's label has to follow it.
  it('shows the menu label following a theme change made elsewhere', () => {
    document.documentElement.classList.add('dark')
    render(<Terminal gitLog={[]} startSectionId="hero" />)
    const drawer = screen.getByRole('navigation', { hidden: true, name: 'Menu' })
    expect(within(drawer).getByRole('button', { hidden: true, name: 'light mode' })).toBeTruthy()

    act(() => applyTheme(false))

    expect(within(drawer).getByRole('button', { hidden: true, name: 'dark mode' })).toBeTruthy()
  })

  it('keeps the switch working when the choice cannot be stored, and says so', async () => {
    const user = userEvent.setup()
    document.documentElement.classList.add('dark')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('storage is blocked')
    })
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(<Terminal gitLog={[]} startSectionId="hero" />)
    const drawer = screen.getByRole('navigation', { hidden: true, name: 'Menu' })

    await user.click(within(drawer).getByRole('button', { hidden: true, name: 'light mode' }))

    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(warn).toHaveBeenCalledOnce()
  })
})

describe('Terminal, on the projects page', () => {
  it('holds every section once the script has run, and only one main heading', () => {
    render(<Terminal gitLog={[]} startSectionId="projects" />)

    expect(document.querySelector('[data-scene="hero"]')).not.toBeNull()
    expect(document.querySelector('[data-scene="work"]')).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 }).map((h) => h.textContent)).toEqual([
      '# Projects',
    ])
  })
})
