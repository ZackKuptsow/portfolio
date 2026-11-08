import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ACTIVE_MARK, MARKS } from '@/brand/marks'
import { BrandMark } from '@/components/BrandMark'

describe('BrandMark', () => {
  it('draws the active mark on its rounded tile, with no live text', () => {
    const { container } = render(<BrandMark />)

    const svg = container.querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg?.getAttribute('viewBox')).toBe('0 0 64 64')
    expect(svg?.querySelector('rect')?.getAttribute('rx')).toBe('14')
    expect(svg?.querySelectorAll('path')).toHaveLength(MARKS[ACTIVE_MARK].shapes.length)
    expect(svg?.querySelector('text')).toBeNull()
  })

  it('is decoration, hidden from assistive technology and from the tab order', () => {
    const { container } = render(<BrandMark />)

    const svg = container.querySelector('svg')
    expect(svg?.getAttribute('aria-hidden')).toBe('true')
    expect(svg?.getAttribute('focusable')).toBe('false')
  })

  it('passes its class name to the svg', () => {
    const { container } = render(<BrandMark className="somewhere" />)

    expect(container.querySelector('svg')?.getAttribute('class')).toBe('somewhere')
  })
})
