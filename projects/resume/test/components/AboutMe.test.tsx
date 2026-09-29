import { isInaccessible, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import AboutMe from '@/components/AboutMe'

describe('AboutMe', () => {
  it('opens the bio with both forms of the name, so either search finds the page', () => {
    render(<AboutMe />)

    const bio = screen.getByText(/^Zack Kuptsow \(Zachary Kuptsow\) is a full-stack engineer/)

    expect(isInaccessible(bio)).toBe(false)
  })

  it('says where he is based', () => {
    render(<AboutMe />)

    expect(screen.getByText('Philadelphia, PA')).toBeTruthy()
  })

  it('lists the core technologies, including the cloud and infrastructure ones', () => {
    render(<AboutMe />)

    const technologies = ['TypeScript', 'Python', 'GCP', 'Terraform']

    expect(technologies.map((technology) => screen.queryByText(technology) !== null)).toEqual([
      true,
      true,
      true,
      true,
    ])
  })

  it('hides the decorative terminal text from assistive technology', () => {
    render(<AboutMe />)

    const decorativeElements = [
      screen.getByText('~/portfolio/about.sh'),
      screen.getByText('cat developer.profile'),
      screen.getByText('zachary.kuptsow'),
      screen.getByText('// About'),
    ]

    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })
})
