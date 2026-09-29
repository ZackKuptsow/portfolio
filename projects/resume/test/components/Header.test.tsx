import { isInaccessible, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Header from '@/components/Header'

const NAME_LINE = 'Zack Kuptsow · Full-Stack Software Engineer · Philadelphia, PA'

describe('Header', () => {
  it('has exactly one top-level heading, and it leads with the name people search for', () => {
    render(<Header />)

    expect(
      screen.getAllByRole('heading', { level: 1 }).map((heading) => heading.textContent),
    ).toEqual([NAME_LINE])
  })

  it('hides the decorative handle, path and prompt from assistive technology', () => {
    render(<Header />)

    const decorativeElements = [
      screen.getByText('~/root/portfolio'),
      screen.getByText('zachary.kuptsow'),
      screen.getByText('$'),
    ]

    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })

  it('keeps the tagline readable by assistive technology', () => {
    render(<Header />)

    expect(isInaccessible(screen.getByText('./tech.polyglot'))).toBe(false)
  })
})
