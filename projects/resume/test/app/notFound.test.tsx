import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import NotFound from '@/app/not-found'

describe('NotFound', () => {
  it('shows the mark above the 404, as decoration', () => {
    const { container } = render(<NotFound />)

    const heading = screen.getByRole('heading', { level: 1, name: '404' })
    const marks = container.querySelectorAll('svg[aria-hidden="true"][viewBox="0 0 64 64"]')
    expect(marks).toHaveLength(1)
    expect(marks[0].compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('still says only the status and the message', () => {
    render(<NotFound />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('404')
    expect(screen.getByText('This page could not be found.')).toBeTruthy()
  })
})
