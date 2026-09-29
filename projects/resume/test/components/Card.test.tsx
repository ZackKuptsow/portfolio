import { isInaccessible, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import Card from '@/components/Card'

const HIGHLIGHTS = [
  'Set architecture and technical direction for an AI-powered mortgage lead-conversion platform.',
  'Redesigned the customer dashboard in seven flag-gated phases with no disruption to live users.',
]
const SUBTITLE = 'Founding Lead Engineer · March 2026 - September 2026 · Remote'
const TITLE = 'Low Rate Co.'

describe('Card', () => {
  it('lists each highlight as its own list item, in the order given', () => {
    render(<Card highlights={HIGHLIGHTS} subtitle={SUBTITLE} title={TITLE} />)

    const highlightItems = within(screen.getByRole('list')).getAllByRole('listitem')

    expect(highlightItems.map((item) => within(item).getByText(/\w/).textContent)).toEqual(
      HIGHLIGHTS,
    )
  })

  it('renders no list when there are no highlights', () => {
    render(<Card description="Built an anomaly detection system." title="Qlik" />)

    expect(screen.queryByRole('list')).toBeNull()
    expect(screen.getByText('Built an anomaly detection system.')).toBeTruthy()
  })

  it('keeps the title as the only heading, so the subtitle is not announced as one', () => {
    render(<Card highlights={HIGHLIGHTS} subtitle={SUBTITLE} title={TITLE} />)

    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([TITLE])
    expect(isInaccessible(screen.getByText(SUBTITLE))).toBe(false)
  })

  it('prefixes the file name in the prompt, so two cards with one title read as two files', () => {
    render(
      <Card description="Advanced degree." fileNamePrefix="cyber" title="University of Delaware" />,
    )

    expect(screen.getByText(/^cat cyber_university_of_delaware\.txt$/)).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'University of Delaware' })).toBeTruthy()
  })

  it('hides the decorative terminal text from assistive technology', () => {
    render(<Card highlights={HIGHLIGHTS} subtitle={SUBTITLE} title={TITLE} />)

    const decorativeElements = [
      screen.getByText(/cat low_rate_co\.txt$/),
      ...screen.getAllByText('→'),
      screen.getByText('[EOF]'),
    ]

    // One arrow per highlight, so an empty or shortened list cannot pass unexamined.
    expect(decorativeElements).toHaveLength(4)
    expect(decorativeElements.filter((element) => !isInaccessible(element))).toEqual([])
  })
})
