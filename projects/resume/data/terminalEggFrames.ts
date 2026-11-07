/**
 * Prebuilt animations for the typed shell, as plain frames of text. Nothing here reads what a
 * visitor typed or touches the page: `shell/Shell.ts` plays the frames on the terminal's clock.
 */

/** One picture, and how long it stays before the next. */
export type AnimationFrame = {
  holdMilliseconds: number
  rows: readonly string[]
}

export type EggAnimation = {
  /** What a screen reader hears, and all a window too narrow for the frames gets. */
  finalLine: string
  /** Every frame has the same number of rows, so the layout never jumps under them. */
  frames: readonly AnimationFrame[]
}

/** A blank row holds a space: a trailing empty line in a <pre> has no height. */
const BLANK_ROW = ' '
const RUN_OF_DOTS = /\.{2,}/
const DOT = '.'
/** A dot slipping, just before it goes. */
const SAGGING_DOT = ','

/** How far the dot falls, and how long it spends at each row on the way down, speeding up. */
const FLOOR_ROWS = 4
const FALL_HOLDS_MILLISECONDS = [240, 170, 120, 80] as const
const READ_THE_LINE_MILLISECONDS = 1400
const SAGS_MILLISECONDS = [300, 220, 200] as const
const BOUNCE_MILLISECONDS = 90
const LANDED_MILLISECONDS = 600
const RISE_START_MILLISECONDS = 900
const RISE_STEP_MILLISECONDS = 150

/** The line with its last dot taken out of the run, in each state it passes through. */
function dotStates(line: string) {
  const run = RUN_OF_DOTS.exec(line)
  if (!run) {
    throw new Error(`There is no run of dots to lose in: "${line}"`)
  }
  const column = run.index + run[0].length - 1
  const swapDot = (replacement: string) =>
    line.slice(0, column) + replacement + line.slice(column + 1)
  return {
    closed: swapDot(''),
    column,
    gap: swapDot(' '),
    sagging: swapDot(SAGGING_DOT),
  }
}

function withDotOnRow(topRow: string, column: number, dotRow: number | null): readonly string[] {
  const floor = Array.from({ length: FLOOR_ROWS }, (_, index) =>
    index + 1 === dotRow ? ' '.repeat(column) + DOT : BLANK_ROW,
  )
  return [topRow, ...floor]
}

function losingADotFrames(line: string): readonly AnimationFrame[] {
  const { closed, column, gap, sagging } = dotStates(line)
  return [
    { holdMilliseconds: READ_THE_LINE_MILLISECONDS, rows: withDotOnRow(line, column, null) },
    { holdMilliseconds: SAGS_MILLISECONDS[0], rows: withDotOnRow(sagging, column, null) },
    { holdMilliseconds: SAGS_MILLISECONDS[1], rows: withDotOnRow(line, column, null) },
    { holdMilliseconds: SAGS_MILLISECONDS[2], rows: withDotOnRow(sagging, column, null) },
    ...FALL_HOLDS_MILLISECONDS.map((holdMilliseconds, index) => ({
      holdMilliseconds,
      rows: withDotOnRow(gap, column, index + 1),
    })),
    { holdMilliseconds: BOUNCE_MILLISECONDS, rows: withDotOnRow(gap, column, FLOOR_ROWS - 1) },
    { holdMilliseconds: LANDED_MILLISECONDS, rows: withDotOnRow(gap, column, FLOOR_ROWS) },
    { holdMilliseconds: 0, rows: withDotOnRow(closed, column, FLOOR_ROWS) },
  ]
}

/** The last dot of a run comes loose, falls to the floor with a small bounce, and the gap closes. */
export function losingADot(line: string): EggAnimation {
  return { finalLine: dotStates(line).closed, frames: losingADotFrames(line) }
}

/** The same film run backwards: the dot rises off the floor and goes back in its place. */
export function gettingADotBack(line: string): EggAnimation {
  const backwards = [...losingADotFrames(line)].reverse()
  return {
    finalLine: line,
    frames: backwards.map(({ rows }, index) => ({
      holdMilliseconds:
        index === 0
          ? RISE_START_MILLISECONDS
          : index === backwards.length - 1
            ? 0
            : RISE_STEP_MILLISECONDS,
      rows,
    })),
  }
}

/** One row counting down, then the line under it. */
export function progressThenLine({
  finalLine,
  labels,
  stepMilliseconds,
}: {
  finalLine: string
  labels: readonly string[]
  stepMilliseconds: number
}): EggAnimation {
  return {
    finalLine,
    frames: [
      ...labels.map((label) => ({
        holdMilliseconds: stepMilliseconds,
        rows: [label, BLANK_ROW],
      })),
      { holdMilliseconds: 0, rows: [labels[labels.length - 1], finalLine] },
    ],
  }
}

/** A title, and a bar filling under it. */
export function progressBar({
  barWidth,
  stepMilliseconds,
  title,
}: {
  barWidth: number
  stepMilliseconds: number
  title: string
}): EggAnimation {
  return {
    finalLine: title,
    frames: Array.from({ length: barWidth + 1 }, (_, filled) => ({
      holdMilliseconds: filled === barWidth ? 0 : stepMilliseconds,
      rows: [
        title,
        `[${'='.repeat(filled)}${' '.repeat(barWidth - filled)}] ${Math.round(
          (filled / barWidth) * 100,
        )}%`,
      ],
    })),
  }
}

/** Lines arriving one at a time, each holding for its own time before the next. */
export function timedLines(
  lines: readonly { holdMilliseconds: number; line: string }[],
): EggAnimation {
  return {
    finalLine: lines[lines.length - 1].line,
    frames: lines.map(({ holdMilliseconds }, shown) => ({
      holdMilliseconds,
      rows: lines.map(({ line }, index) => (index <= shown ? line : BLANK_ROW)),
    })),
  }
}

/** A grid with one cell lit at a time, in order, and a last line once the path is done. */
export function gridPath({
  finalLine,
  grid,
  path,
  startMilliseconds,
  stepMilliseconds,
}: {
  finalLine: string
  grid: readonly (readonly string[])[]
  path: readonly (readonly [row: number, column: number])[]
  startMilliseconds: number
  stepMilliseconds: number
}): EggAnimation {
  const drawGrid = (lit: readonly (readonly [number, number])[]) =>
    grid.map((cells, row) =>
      cells
        .map((cell, column) =>
          lit.some(([litRow, litColumn]) => litRow === row && litColumn === column)
            ? `[${cell}]`
            : ` ${cell} `,
        )
        .join(''),
    )
  return {
    finalLine,
    frames: [
      { holdMilliseconds: startMilliseconds, rows: [...drawGrid([]), BLANK_ROW] },
      ...path.map((_, index) => ({
        holdMilliseconds: stepMilliseconds,
        rows: [...drawGrid(path.slice(0, index + 1)), BLANK_ROW],
      })),
      { holdMilliseconds: 0, rows: [...drawGrid(path), finalLine] },
    ],
  }
}

/** A drawing crossing a window of a fixed width from right to left, and off the far side. */
export function crossingTheScreen({
  finalLine,
  sprite,
  stepColumns,
  stepMilliseconds,
  windowColumns,
}: {
  finalLine: string
  sprite: readonly string[]
  stepColumns: number
  stepMilliseconds: number
  windowColumns: number
}): EggAnimation {
  const spriteColumns = Math.max(...sprite.map((row) => row.length))
  const frames: AnimationFrame[] = []
  for (let offset = windowColumns; offset >= -spriteColumns; offset -= stepColumns) {
    frames.push({
      holdMilliseconds: stepMilliseconds,
      rows: sprite.map((row) => {
        const placed =
          offset >= 0 ? ' '.repeat(offset) + row : row.slice(Math.min(-offset, row.length))
        return placed.slice(0, windowColumns) || BLANK_ROW
      }),
    })
  }
  frames.push({ holdMilliseconds: 0, rows: sprite.map(() => BLANK_ROW) })
  return { finalLine, frames }
}
