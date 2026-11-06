import { describe, expect, it } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { checkEasterEggs } from '@/components/Terminal/shell/checkEasterEggs'
import { buildFileSystem } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { ShellContext, ShellState } from '@/components/Terminal/shell/types'
import { FRESH_SHELL_EXIT_STATUS, terminalEasterEggs } from '@/data/terminalEasterEggs'
import type { OutputLine } from '@/data/terminalEasterEggs'

const RICK_ROLL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
const WIDE_WINDOW_COLUMNS = 95
const NARROW_WINDOW_COLUMNS = 18

const state: ShellState = { cwd: '~/portfolio', history: [], lastExitStatus: 0 }
const context: ShellContext = {
  columns: WIDE_WINDOW_COLUMNS,
  eggs: terminalEasterEggs,
  gitLog: [],
  isDark: () => true,
  now: () => new Date(2026, 10, 6),
  root: buildFileSystem(buildSections(), terminalEasterEggs),
}

function textOf(line: OutputLine): string {
  return line.map((segment) => segment.text).join('')
}

describe('the easter eggs', () => {
  // Whatever is added keeps to the rules the shell relies on: no name of the table's, no duplicate,
  // no em or en dash, art that fits its columns, files with a place to live.
  it('follow the rules the shell relies on', () => {
    expect(checkEasterEggs(terminalEasterEggs)).toEqual([])
  })

  it.each(['triforce', 'vault'])('draws %s by name, and hides from help', (name) => {
    const { outcomes } = runCommandLine(name, state, context)

    expect(outcomes[0].art?.length).toBeGreaterThan(5)
    expect(outcomes[0].lines).toEqual([])
    const help = runCommandLine('help', state, context).outcomes[0].lines.map(textOf).join('\n')
    expect(help).not.toContain(name)
  })

  it.each(['triforce', 'vault'])('says %s needs a wider window, in a tool error shape', (name) => {
    const { outcomes } = runCommandLine(name, state, { ...context, columns: NARROW_WINDOW_COLUMNS })

    expect(outcomes[0].art).toBeUndefined()
    expect(outcomes[0].lines.map(textOf)).toEqual([`${name}: window too narrow`])
  })

  it('answers sudo as plain bash would, whatever follows it, and opens the Rick Roll', () => {
    const { outcomes, state: next } = runCommandLine('sudo rm -rf /', state, context)

    expect(outcomes[0].lines.map(textOf)).toEqual(['bash: sudo: command not found'])
    expect(outcomes[0].effect).toEqual({ href: RICK_ROLL, kind: 'open-url' })
    expect(next.lastExitStatus).toBe(127)
  })

  it('starts a fresh shell at 42', () => {
    expect(FRESH_SHELL_EXIT_STATUS).toBe(42)
  })
})
