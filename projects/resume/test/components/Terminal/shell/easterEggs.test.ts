import { describe, expect, it } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { checkEasterEggs } from '@/components/Terminal/shell/checkEasterEggs'
import { buildFileSystem } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { ShellContext, ShellState } from '@/components/Terminal/shell/types'
import type { EasterEgg, OutputLine } from '@/data/terminalEasterEggs'

const sections = buildSections()
const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
const context: ShellContext = {
  columns: 80,
  eggs: [],
  gitLog: [],
  isDark: () => true,
  now: () => new Date(2026, 10, 6),
  root: buildFileSystem(sections, []),
}

const DRAWING = ['  /\\  ', ' /__\\ '] as const
const DRAWING_COLUMNS = 6

const drawnWithLine: EasterEgg = {
  drawing: DRAWING,
  kind: 'command',
  lines: [[{ text: 'under it' }]],
  name: 'drawn',
}
const drawnAlone: EasterEgg = { drawing: DRAWING, kind: 'command', lines: [], name: 'alone' }

function textOf(line: OutputLine): string {
  return line.map((segment) => segment.text).join('')
}

describe('easter eggs in the shell', () => {
  it('prints a drawing with its line under it when the window holds the widest row', () => {
    const fits = runCommandLine('drawn', state, {
      ...context,
      columns: DRAWING_COLUMNS,
      eggs: [drawnWithLine],
    })

    expect(fits.outcomes[0].art).toEqual(DRAWING)
    expect(fits.outcomes[0].lines.map(textOf)).toEqual(['under it'])
  })

  it('leaves the drawing out of a narrower window, and keeps the line', () => {
    const narrow = runCommandLine('drawn', state, {
      ...context,
      columns: DRAWING_COLUMNS - 1,
      eggs: [drawnWithLine],
    })

    expect(narrow.outcomes[0].art).toBeUndefined()
    expect(narrow.outcomes[0].lines.map(textOf)).toEqual(['under it'])
  })

  it('says so when a drawing is all there is and the window cannot hold it', () => {
    const narrow = runCommandLine('alone', state, {
      ...context,
      columns: DRAWING_COLUMNS - 1,
      eggs: [drawnAlone],
    })

    expect(narrow.outcomes[0].art).toBeUndefined()
    expect(narrow.outcomes[0].lines.map(textOf)).toEqual(['alone: window too narrow'])
  })

  it("opens an egg's fixed address, prints its lines and reports its exit status", () => {
    const egg: EasterEgg = {
      exitStatus: 42,
      kind: 'command',
      lines: [[{ text: 'ok' }]],
      name: 'answer',
      opens: 'https://example.com/',
    }
    const run = runCommandLine('answer', state, { ...context, eggs: [egg] })

    expect(run.outcomes[0].effect).toEqual({ href: 'https://example.com/', kind: 'open-url' })
    expect(textOf(run.outcomes[0].lines[0])).toBe('ok')
    expect(run.state.lastExitStatus).toBe(42)
    expect(textOf(runCommandLine('echo $?', run.state, context).outcomes[0].lines[0])).toBe('42')
    expect(
      runCommandLine('open answer', state, { ...context, eggs: [egg] }).outcomes[0].effect,
    ).toEqual({
      href: 'https://example.com/',
      kind: 'open-url',
    })
  })

  it('cats an egg file at an absolute path outside the tree, with a link in it', () => {
    const file: EasterEgg = {
      kind: 'file',
      lines: [[{ text: 'root:x:0:0 ' }, { href: 'https://example.com/', text: 'more' }]],
      path: '/etc/passwd',
    }
    const run = runCommandLine('cat /etc/passwd', state, {
      ...context,
      root: buildFileSystem(sections, [file]),
    })

    expect(run.outcomes[0].lines).toEqual(file.lines)
    expect(run.state.lastExitStatus).toBe(0)
  })
})

describe('checkEasterEggs', () => {
  it('passes a well-formed list', () => {
    expect(
      checkEasterEggs([
        drawnWithLine,
        { kind: 'command', lines: [[{ text: 'no' }]], name: 'sudo' },
        { kind: 'file', lines: [[{ text: 'x' }]], path: '~/portfolio/.secret' },
      ]),
    ).toEqual([])
  })

  it('names an egg that shadows a command of the table', () => {
    expect(checkEasterEggs([{ kind: 'command', lines: [], name: 'ls' }])).toEqual([
      'The egg command "ls" shadows a command of the table',
    ])
  })

  it('names a duplicate name or path', () => {
    expect(
      checkEasterEggs([
        { kind: 'command', lines: [], name: 'sudo' },
        { ...drawnAlone, name: 'sudo' },
        { kind: 'file', lines: [], path: '/etc/passwd' },
        { kind: 'file', lines: [], path: '/etc/passwd' },
      ]),
    ).toEqual(['The egg name "sudo" is used twice', 'The egg path "/etc/passwd" is used twice'])
  })

  it('names an em or en dash in anything a visitor reads', () => {
    expect(
      checkEasterEggs([{ kind: 'command', lines: [[{ text: 'a – b' }]], name: 'dash' }]),
    ).toEqual(['The egg "dash" holds an em or en dash'])
  })

  it('reads every word a visitor can reach for a dash, the question and the pause included', () => {
    expect(
      checkEasterEggs([
        { confirm: 'loud – sure?', kind: 'command', lines: [], name: 'one' },
        {
          kind: 'command',
          lines: [],
          name: 'two',
          pausedEnding: { afterMilliseconds: 1, text: ' – dary' },
        },
        {
          kind: 'file',
          lines: [],
          password: { doubts: ['sure – really?'], ending: 'fine', label: 'Password:' },
          path: '/three',
        },
        {
          kind: 'file',
          lines: [],
          password: { doubts: [], ending: 'joking – joking', label: 'Password:' },
          path: '/four',
        },
        { drawing: ['– –'], kind: 'command', lines: [], name: 'five' },
      ]),
    ).toEqual([
      'The egg "one" holds an em or en dash',
      'The egg "two" holds an em or en dash',
      'The egg "/three" holds an em or en dash',
      'The egg "/four" holds an em or en dash',
      'The egg "five" holds an em or en dash',
    ])
  })

  it('names a file path that is not absolute or under home, or has no name', () => {
    expect(
      checkEasterEggs([
        { kind: 'file', lines: [], path: 'relative/secret' },
        { kind: 'file', lines: [], path: '/' },
      ]),
    ).toEqual([
      'The egg path "relative/secret" must start with / or ~',
      'The egg path "/" has no file name',
    ])
  })
})
