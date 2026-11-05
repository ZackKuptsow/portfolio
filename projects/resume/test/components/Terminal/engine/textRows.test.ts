import { describe, expect, it } from 'vitest'

import {
  clipToWholeRows,
  formatRowClip,
  mergeIntoRows,
} from '@/components/Terminal/engine/textRows'

const LINE_HEIGHT = 23
const ROWS = Array.from({ length: 40 }, (_, index) => ({
  bottom: 32 + (index + 1) * LINE_HEIGHT,
  top: 32 + index * LINE_HEIGHT,
}))

describe('mergeIntoRows', () => {
  it('makes one row of columns whose lines overlap on the way down', () => {
    expect(
      mergeIntoRows([
        { bottom: 23, top: 0 },
        { bottom: 25, top: 2 },
      ]),
    ).toEqual([{ bottom: 25, top: 0 }])
  })

  it('keeps lines apart when nothing overlaps them, whatever order they came in', () => {
    expect(
      mergeIntoRows([
        { bottom: 46, top: 23 },
        { bottom: 23, top: 0 },
      ]),
    ).toEqual([
      { bottom: 23, top: 0 },
      { bottom: 46, top: 23 },
    ])
  })
})

describe('clipToWholeRows', () => {
  it('leaves out a row the bottom edge would cut through', () => {
    expect(clipToWholeRows(ROWS, 0, ROWS[10].top + 5).bottomEdge).toBe(ROWS[10].top)
  })

  it('leaves out a row the top edge would cut through', () => {
    expect(clipToWholeRows(ROWS, ROWS[3].top + 5, 800).topEdge).toBe(ROWS[3].bottom)
  })

  it('keeps a row that lands exactly on the edge', () => {
    expect(clipToWholeRows(ROWS, ROWS[3].top, ROWS[10].bottom)).toEqual({
      bottomEdge: ROWS[10].bottom,
      topEdge: ROWS[3].top,
    })
  })

  it('never cuts a row, at any scroll position through the scene', () => {
    const usableHeight = 455
    const cutRows: string[] = []

    for (let offset = 0; offset < 500; offset += 1) {
      const { bottomEdge, topEdge } = clipToWholeRows(ROWS, offset, offset + usableHeight)
      for (const row of ROWS) {
        const isWhollyOut = row.bottom <= topEdge || row.top >= bottomEdge
        const isWhollyIn = row.top >= topEdge && row.bottom <= bottomEdge
        if (!isWhollyOut && !isWhollyIn) {
          cutRows.push(`${row.top} at ${offset}`)
        }
      }
    }

    expect(cutRows).toEqual([])
  })
})

describe('formatRowClip', () => {
  // A scene can grow after it was measured, when a line wraps. An inset measured up from the
  // bottom would then move down with it, into a line.
  it('places the bottom edge from the top of the scene, whatever height the scene has', () => {
    expect(formatRowClip({ bottomEdge: 455, topEdge: 32 })).toBe(
      'inset(32px 0 calc(100% - 455px) 0)',
    )
  })
})
