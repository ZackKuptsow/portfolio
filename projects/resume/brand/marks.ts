/**
 * The site's marks, as data: each one's shapes on a 64 by 64 grid and the drawing `cat logo.txt`
 * prints. Zack picked the Bracket cup for every place on 2026-11-07 and kept the other two "on
 * file for if I ever change my mind", so switching is the one word in `ACTIVE_MARK`, then
 * `yarn brand` to make the image files again (see "The mark" in the resume README).
 *
 * The letters are path data from `brand/outline_letters.py`, never live text, so a favicon, the
 * README and the email draw them without the font. This file imports nothing, because
 * `brand/generate.ts` loads it through Node's type stripping.
 */

export type MarkName = 'bracket-cup' | 'terminal-mug' | 'zk-monogram'

/** A filled shape, or a stroked one. Every stroke has round joins. */
export type MarkShape =
  | { d: string; kind: 'fill' }
  | { d: string; kind: 'stroke'; lineCap?: 'round'; width: number }

export type Mark = {
  /** What `cat logo.txt` prints, in plain ASCII, drawn for the shell's 1.35 row height. */
  drawing: readonly string[]
  /** Drawn in order, in the ink color, over the tile. */
  shapes: readonly MarkShape[]
}

export const MARK_GRID_SIZE = 64
export const MARK_TILE_CORNER_RADIUS = 14
export const MARK_TILE_COLOR = '#121212'
export const MARK_INK_COLOR = '#00ff00'

const BRACKET_STROKE_WIDTH = 4.5
const MUG_OUTLINE_STROKE_WIDTH = 5
const MUG_RULE_STROKE_WIDTH = 4

export const MARKS: Record<MarkName, Mark> = {
  'bracket-cup': {
    drawing: [
      '+--          --+',
      '|       _      |',
      '|   ___| | __  |--.',
      '|  |_  / |/ /  |  |',
      '|   / /|   <   |  |',
      "|  /___|_|\\_\\  |--'",
      '+--          --+',
    ],
    shapes: [
      { d: 'M21 15 H14 V50 H21', kind: 'stroke', width: BRACKET_STROKE_WIDTH },
      { d: 'M39 15 H46 V50 H39', kind: 'stroke', width: BRACKET_STROKE_WIDTH },
      {
        d: 'M46 22 C 60 22, 60 44, 46 44',
        kind: 'stroke',
        lineCap: 'round',
        width: BRACKET_STROKE_WIDTH,
      },
      // zk, JetBrains Mono 700 at 19, ink centered on (30, 32.5) between the brackets.
      {
        d: 'M19.64 39.44V37.28L25.09 31.08H19.81V28.99H27.85V31.14L22.35 37.34H28.06V39.44ZM31.06 39.44V25.57H33.44V33.09H35.1L37.64 28.99H40.31L37.15 34.04L40.36 39.44H37.65L35.1 35.1H33.44V39.44Z',
        kind: 'fill',
      },
    ],
  },
  'terminal-mug': {
    drawing: [
      '.----------.',
      '|----------|--.',
      '| >_       |  |',
      "|          |--'",
      "'----------'",
    ],
    shapes: [
      {
        d: 'M15 13 H37 A6 6 0 0 1 43 19 V45 A6 6 0 0 1 37 51 H15 A6 6 0 0 1 9 45 V19 A6 6 0 0 1 15 13 Z',
        kind: 'stroke',
        width: MUG_OUTLINE_STROKE_WIDTH,
      },
      { d: 'M9 23 H43', kind: 'stroke', width: MUG_RULE_STROKE_WIDTH },
      {
        d: 'M18 30 L24 36 L18 42',
        kind: 'stroke',
        lineCap: 'round',
        width: BRACKET_STROKE_WIDTH,
      },
      { d: 'M28 42 H36', kind: 'stroke', lineCap: 'round', width: BRACKET_STROKE_WIDTH },
      {
        d: 'M43 26 C 58 26, 58 44, 43 44',
        kind: 'stroke',
        lineCap: 'round',
        width: MUG_OUTLINE_STROKE_WIDTH,
      },
    ],
  },
  'zk-monogram': {
    drawing: ['     _', ' ___| | __', '|_  / |/ /', ' / /|   <', '/___|_|\\_\\'],
    shapes: [
      // zk, JetBrains Mono 700 at 34, ink centered on (32, 32).
      {
        d: 'M13.45 44.41V40.55L23.21 29.45H13.77V25.71H28.15V29.57L18.31 40.67H28.53V44.41ZM33.9 44.41V19.59H38.16V33.05H41.12L45.67 25.71H50.44L44.79 34.76L50.55 44.41H45.68L41.12 36.66H38.16V44.41Z',
        kind: 'fill',
      },
    ],
  },
}

/** The mark every place shows. */
export const ACTIVE_MARK: MarkName = 'bracket-cup'
