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

  it('hides the decorative prompt and arrows from assistive technology', () => {
    render(<Footer />)

    const decorativeElements = [
      screen.getByText(/ls -la \.\/contact\/$/),
      ...screen.getAllByText('→'),
    ]

    // One arrow per link row: LinkedIn, GitHub and the projects placeholder.
    expect(decorativeElements).toHaveLength(4)
    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })
})
