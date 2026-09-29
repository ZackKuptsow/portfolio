import { isInaccessible, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Footer from '@/components/Footer'

describe('Footer', () => {
  it('links to the public profiles', () => {
    render(<Footer />)

    const profileLinks = ['LinkedIn', 'GitHub'].map((linkName) =>
      screen.getByRole('link', { name: linkName }).getAttribute('href'),
    )

    expect(profileLinks).toEqual([
      'https://www.linkedin.com/in/zack-kuptsow/',
      'https://github.com/ZackKuptsow',
    ])
  })

  it('offers a way to write to him directly, without opening a new tab', () => {
    render(<Footer />)

    const emailLink = screen.getByRole('link', { name: 'Email' })

    expect(emailLink.getAttribute('href')).toBe('mailto:zkups56@gmail.com')
    expect(emailLink.hasAttribute('target')).toBe(false)
  })

  it('hides the decorative prompt and arrows from assistive technology', () => {
    render(<Footer />)

    const decorativeElements = [
      screen.getByText(/ls -la \.\/contact\/$/),
      ...screen.getAllByText('→'),
    ]

    // One arrow per link row: LinkedIn, GitHub, Email and the projects placeholder.
    expect(decorativeElements).toHaveLength(5)
    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })
})
