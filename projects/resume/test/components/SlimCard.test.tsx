import { isInaccessible, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import SlimCard from '@/components/SlimCard'

const SKILLS = ['Python (Django, Quart/Flask)', 'Terraform (HCL)']
const TITLE = 'Languages & Frameworks'

describe('SlimCard', () => {
  it('keeps the heading and every skill readable by assistive technology', () => {
    render(<SlimCard list={SKILLS} title={TITLE} />)

    expect(screen.getByRole('heading', { level: 3, name: TITLE })).toBeTruthy()
    expect(SKILLS.map((skill) => isInaccessible(screen.getByText(skill)))).toEqual([false, false])
  })

  it('hides the decorative terminal text from assistive technology', () => {
    render(<SlimCard list={SKILLS} title={TITLE} />)

    const decorativeElements = [
      screen.getByText('./languages_frameworks'),
      screen.getByText(/ls -la languages_frameworks$/),
      ...screen.getAllByText('→'),
      screen.getByText('2 items'),
      screen.getByText('drwxr-xr-x'),
    ]

    // One arrow per skill, so an empty or shortened list cannot pass unexamined.
    expect(decorativeElements).toHaveLength(6)
    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })
})
