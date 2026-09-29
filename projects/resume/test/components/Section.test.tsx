import { isInaccessible, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Section from '@/components/Section'

describe('Section', () => {
  it('names its heading by the title alone, without the decorative "#"', () => {
    render(<Section title="Work Experience">content</Section>)

    expect(screen.getByRole('heading', { level: 2, name: 'Work Experience' })).toBeTruthy()
  })

  it('hides the decorative prompt from assistive technology', () => {
    render(<Section title="Work Experience">content</Section>)

    expect(isInaccessible(screen.getByText(/cd \.\/work_experience/))).toBe(true)
  })

  it('drops punctuation from the path in the prompt', () => {
    render(<Section title="Skills & Tools">content</Section>)

    expect(screen.getByText(/cd \.\/skills_tools$/)).toBeTruthy()
  })
})
