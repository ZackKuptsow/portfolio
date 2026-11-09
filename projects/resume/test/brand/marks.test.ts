import { describe, expect, it } from 'vitest'

import { ACTIVE_MARK, MARKS } from '@/brand/marks'
import type { MarkShape } from '@/brand/marks'
import { pathBounds } from '@/brand/pathBounds'

// The drawings Zack saw on the decision pages, 2026-11-07, written out here and not imported,
// so a changed drawing fails by name. The Bracket cup's is the one he picked for `cat logo.txt`.
const BRACKET_CUP_DRAWING = [
  '+--          --+',
  '|       _      |',
  '|   ___| | __  |--.',
  '|  |_  / |/ /  |  |',
  '|   / /|   <   |  |',
  "|  /___|_|\\_\\  |--'",
  '+--          --+',
]
const TERMINAL_MUG_DRAWING = [
  '.----------.',
  '|----------|--.',
  '| >_       |  |',
  "|          |--'",
  "'----------'",
]
const ZK_MONOGRAM_DRAWING = ['     _', ' ___| | __', '|_  / |/ /', ' / /|   <', '/___|_|\\_\\']

// Zack's pick: the letters' ink centered between the brackets, both ways. The space inside the
// brackets runs from 16.25 to 43.75 across and 17.25 to 47.75 down.
const BRACKET_CUP_LETTERS_CENTRE = { x: 30, y: 32.5 }
// The small cut Zack picked on 2026-11-09 for the tab and the title bar: thicker brackets with
// shorter arms, so the space inside runs from 10.75 to 42.75 across and 14.5 to 49.5 down, and
// letters about a quarter taller than the full drawing's, where at 16 pixels they were 4 tall.
const BRACKET_CUP_SMALL_LETTERS_CENTRE = { x: 26.75, y: 32 }
const SMALL_LETTERS_MINIMUM_GROWTH = 1.25
const ZK_MONOGRAM_LETTERS_CENTRE = { x: 32, y: 32 }
const CENTRE_TOLERANCE = 0.01

function lettersBounds(shapes: readonly MarkShape[]): ReturnType<typeof pathBounds> {
  const letters = shapes.filter((shape) => shape.kind === 'fill')
  expect(letters).toHaveLength(1)
  return pathBounds(letters[0].d)
}

function lettersCentre(shapes: readonly MarkShape[]): { x: number; y: number } {
  const { bottom, left, right, top } = lettersBounds(shapes)
  return { x: (left + right) / 2, y: (top + bottom) / 2 }
}

describe('the marks', () => {
  it('uses the Bracket cup', () => {
    expect(ACTIVE_MARK).toBe('bracket-cup')
  })

  it('keeps the three drawings exactly as Zack saw them', () => {
    expect(MARKS['bracket-cup'].drawing).toEqual(BRACKET_CUP_DRAWING)
    expect(MARKS['terminal-mug'].drawing).toEqual(TERMINAL_MUG_DRAWING)
    expect(MARKS['zk-monogram'].drawing).toEqual(ZK_MONOGRAM_DRAWING)
  })

  it('ends no drawing line in a space', () => {
    for (const mark of Object.values(MARKS)) {
      for (const line of mark.drawing) {
        expect(line).toBe(line.trimEnd())
      }
    }
  })

  it('centers the Bracket cup letters between the brackets', () => {
    const centre = lettersCentre(MARKS['bracket-cup'].shapes.full)
    expect(centre.x).toBeCloseTo(BRACKET_CUP_LETTERS_CENTRE.x, 2)
    expect(Math.abs(centre.y - BRACKET_CUP_LETTERS_CENTRE.y)).toBeLessThanOrEqual(CENTRE_TOLERANCE)
  })

  it('centers the Bracket cup small cut letters between its brackets', () => {
    const centre = lettersCentre(MARKS['bracket-cup'].shapes.small)
    expect(Math.abs(centre.x - BRACKET_CUP_SMALL_LETTERS_CENTRE.x)).toBeLessThanOrEqual(
      CENTRE_TOLERANCE,
    )
    expect(Math.abs(centre.y - BRACKET_CUP_SMALL_LETTERS_CENTRE.y)).toBeLessThanOrEqual(
      CENTRE_TOLERANCE,
    )
  })

  it('draws the Bracket cup small cut letters at least a quarter taller', () => {
    const full = lettersBounds(MARKS['bracket-cup'].shapes.full)
    const small = lettersBounds(MARKS['bracket-cup'].shapes.small)
    expect((small.bottom - small.top) / (full.bottom - full.top)).toBeGreaterThanOrEqual(
      SMALL_LETTERS_MINIMUM_GROWTH,
    )
  })

  it('centers the zk monogram letters in its tile', () => {
    const centre = lettersCentre(MARKS['zk-monogram'].shapes.full)
    expect(Math.abs(centre.x - ZK_MONOGRAM_LETTERS_CENTRE.x)).toBeLessThanOrEqual(CENTRE_TOLERANCE)
    expect(Math.abs(centre.y - ZK_MONOGRAM_LETTERS_CENTRE.y)).toBeLessThanOrEqual(CENTRE_TOLERANCE)
  })
})

describe('pathBounds', () => {
  it('finds the box around an absolute path of moves, lines and straight runs', () => {
    expect(pathBounds('M1 2 H5 V7 L3 4 Z')).toEqual({ bottom: 7, left: 1, right: 5, top: 2 })
  })

  it('refuses a path with a command it does not read', () => {
    expect(() => pathBounds('M1 2 C 3 4, 5 6, 7 8')).toThrow(/C/)
  })
})
