import { describe, expect, it } from 'vitest'

import { MARKS } from '@/brand/marks'
import type { MarkCut, MarkName } from '@/brand/marks'
import { toMarkSvg } from '@/brand/markSvg'

const MARK_NAMES = Object.keys(MARKS) as MarkName[]
const CUTS: MarkCut[] = ['full', 'small']
const ROUNDED_TILE = '<rect width="64" height="64" rx="14" fill="#121212"/>'
const SQUARE_TILE = '<rect width="64" height="64" fill="#121212"/>'

describe('toMarkSvg', () => {
  it.each(MARK_NAMES.flatMap((name) => CUTS.map((cut) => [name, cut] as const)))(
    'writes %s, %s cut, as a standalone SVG with no live text',
    (name, cut) => {
      const svg = toMarkSvg(MARKS[name].shapes[cut], 'rounded')
      expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"')).toBe(
        true,
      )
      expect(svg).not.toContain('<text')
      for (const shape of MARKS[name].shapes[cut]) {
        expect(svg).toContain(`d="${shape.d}"`)
      }
    },
  )

  it('rounds the tile for a rounded mark and squares it for a square one', () => {
    expect(toMarkSvg(MARKS['bracket-cup'].shapes.full, 'rounded')).toContain(ROUNDED_TILE)
    expect(toMarkSvg(MARKS['bracket-cup'].shapes.full, 'square')).toContain(SQUARE_TILE)
  })

  it('draws strokes green with round joins and fills green', () => {
    const svg = toMarkSvg(MARKS['bracket-cup'].shapes.full, 'rounded')
    expect(svg).toContain('stroke="#00ff00" stroke-width="4.5" stroke-linejoin="round" fill="none"')
    expect(svg).toMatch(/<path d="[^"]+" fill="#00ff00"\/>/)
  })
})
