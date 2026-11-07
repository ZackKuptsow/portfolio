import { describe, expect, it } from 'vitest'

import { terminalEasterEggs } from '@/data/terminalEasterEggs'
import {
  gettingADotBack,
  losingADot,
  pictureSequence,
  progressThenLine,
  timedLines,
  wipingFiles,
} from '@/data/terminalEggFrames'
import type { EggAnimation } from '@/data/terminalEggFrames'

const FOUR_DOTS = 'every single detail is....perfect,'
const THREE_DOTS = 'every single detail is...perfect,'

function rowsOf(animation: EggAnimation, frameIndex: number): readonly string[] {
  return animation.frames[frameIndex].rows
}

function lastRows(animation: EggAnimation): readonly string[] {
  return animation.frames[animation.frames.length - 1].rows
}

describe('losingADot', () => {
  const animation = losingADot(FOUR_DOTS)

  it('starts whole, and ends a dot short with the dot on the floor below it', () => {
    expect(rowsOf(animation, 0)[0]).toBe(FOUR_DOTS)
    const rows = lastRows(animation)
    expect(rows[0].trimEnd()).toBe(THREE_DOTS)
    expect(rows[rows.length - 1].trim()).toBe('.')
    expect(animation.finalLine).toBe(THREE_DOTS)
  })

  it('drops the last of the dots straight down, one row at a time', () => {
    const column = FOUR_DOTS.indexOf('perfect') - 1
    const rowOfDot = (rows: readonly string[]) =>
      rows.findIndex((row, index) => index > 0 && row[column] === '.')
    const falling = animation.frames.map(({ rows }) => rowOfDot(rows)).filter((row) => row > 0)

    expect(falling.length).toBeGreaterThanOrEqual(4)
    expect(falling.slice(0, 4)).toEqual([1, 2, 3, 4])
  })

  it('gathers speed as it falls', () => {
    const column = FOUR_DOTS.indexOf('perfect') - 1
    const holds = animation.frames
      .filter(({ rows }) => rows.some((row, index) => index > 0 && row[column] === '.'))
      .map(({ holdMilliseconds }) => holdMilliseconds)

    expect(holds[1]).toBeLessThan(holds[0])
    expect(holds[2]).toBeLessThan(holds[1])
  })
})

describe('gettingADotBack', () => {
  const animation = gettingADotBack(FOUR_DOTS)

  it('starts a dot short, and ends whole with nothing left on the floor', () => {
    expect(rowsOf(animation, 0)[0].trimEnd()).toBe(THREE_DOTS)
    const rows = lastRows(animation)
    expect(rows[0].trimEnd()).toBe(FOUR_DOTS)
    expect(rows.slice(1).every((row) => row.trim() === '')).toBe(true)
    expect(animation.finalLine).toBe(FOUR_DOTS)
  })
})

describe('progressThenLine', () => {
  it('counts down on one row, and then prints the line under it', () => {
    const animation = progressThenLine({
      finalLine: '42',
      labels: ['3 left', '2 left', '1 left'],
      stepMilliseconds: 10,
    })

    expect(animation.frames.map(({ rows }) => rows[0])).toEqual([
      '3 left',
      '2 left',
      '1 left',
      '1 left',
    ])
    expect(lastRows(animation)[1]).toBe('42')
    expect(rowsOf(animation, 0)[1].trim()).toBe('')
    expect(animation.finalLine).toBe('42')
  })
})

describe('wipingFiles', () => {
  const animation = wipingFiles({
    barWidth: 4,
    finalLine: 'nothing left',
    paths: ['one', 'two', 'three', 'four'],
    stepMilliseconds: 10,
    title: 'Running',
    windowRows: 2,
  })

  it('starts with an empty list and an empty bar', () => {
    expect(rowsOf(animation, 0).map((row) => row.trim())).toEqual([
      'Running',
      '',
      '',
      '[    ] 0%',
      '',
    ])
  })

  it('scrolls the files through a window of its height, oldest going first', () => {
    expect(rowsOf(animation, 3).slice(1, 3)).toEqual(["removed 'two'", "removed 'three'"])
    expect(rowsOf(animation, 3)[3]).toBe('[=== ] 75%')
  })

  it('ends with a full bar and the last line', () => {
    expect(lastRows(animation)).toEqual([
      'Running',
      "removed 'three'",
      "removed 'four'",
      '[====] 100%',
      'nothing left',
    ])
    expect(animation.finalLine).toBe('nothing left')
  })
})

describe('pictureSequence', () => {
  const animation = pictureSequence({
    finalLine: 'the end',
    pictures: [
      { holdMilliseconds: 5, rows: ['small'] },
      { holdMilliseconds: 7, rows: ['tall', 'picture'] },
    ],
  })

  it('stands every picture on the same floor, with room for the line under it', () => {
    expect(rowsOf(animation, 0).map((row) => row.trim())).toEqual(['', 'small', ''])
    expect(rowsOf(animation, 1).map((row) => row.trim())).toEqual(['tall', 'picture', ''])
  })

  it('holds each picture for its own time, and adds the line under the last', () => {
    expect(animation.frames.map(({ holdMilliseconds }) => holdMilliseconds)).toEqual([5, 7, 0])
    expect(lastRows(animation)).toEqual(['tall', 'picture', 'the end'])
    expect(animation.finalLine).toBe('the end')
  })
})

describe('timedLines', () => {
  it('adds a line per frame, holding each for its own time', () => {
    const animation = timedLines([
      { holdMilliseconds: 5, line: 'one' },
      { holdMilliseconds: 7, line: 'two' },
    ])

    expect(rowsOf(animation, 0).map((row) => row.trim())).toEqual(['one', ''])
    expect(animation.frames[0].holdMilliseconds).toBe(5)
    expect(lastRows(animation)).toEqual(['one', 'two'])
    expect(animation.finalLine).toBe('two')
  })
})

describe('every animation the shell can play', () => {
  const animated = terminalEasterEggs.flatMap((egg) =>
    egg.kind === 'command' && egg.animation ? [[egg.name, egg.animation] as const] : [],
  )

  it('is there to check', () => {
    expect(animated.map(([name]) => name).sort()).toEqual([
      'breach',
      'chest',
      'decrypt',
      'deepthought',
      'encrypt',
      'fuxsocy',
      'ping',
      'sl',
    ])
  })

  it.each(animated)('%s keeps one height, so the layout never jumps under it', (_, animation) => {
    const heights = new Set(animation.frames.map(({ rows }) => rows.length))

    expect(heights.size).toBe(1)
    expect(animation.frames.length).toBeGreaterThan(1)
  })

  // A trailing blank line in a <pre> has no height, so a blank row has to hold a space.
  it.each(animated)('%s never leaves a row truly empty', (_, animation) => {
    for (const { rows } of animation.frames) {
      expect(rows.every((row) => row.length > 0)).toBe(true)
    }
  })
})
