import { describe, expect, it } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import { buildFileSystem, findNode } from '@/components/Terminal/shell/fakeFileSystem'
import { runCommandLine } from '@/components/Terminal/shell/runCommandLine'
import type { ShellContext, ShellState } from '@/components/Terminal/shell/types'
import { terminalEasterEggs } from '@/data/terminalEasterEggs'
import type { EasterEgg, OutputLine } from '@/data/terminalEasterEggs'
import {
  EGG_REFERENCES,
  REFERENCES_BEYOND_THE_EGG_LIST,
  REFERENCES_FILE_PATH,
} from '@/data/terminalEggReferences'

const WIDE_WINDOW_COLUMNS = 95
const REFERENCES_FILE_COMMAND = `cat ${REFERENCES_FILE_PATH}`

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

function printed(line: string): readonly string[] {
  return runCommandLine(line, state, context).outcomes[0].lines.map(textOf)
}

/** How a visitor would reach an egg, which is how the list names it. */
function referenceNameOf(egg: EasterEgg): string {
  if (egg.kind === 'file') {
    return egg.path
  }
  return egg.onlyWithArgument ? `${egg.name} ${egg.onlyWithArgument.argument}` : egg.name
}

describe('the references file', () => {
  it('names every egg once, so a new egg cannot be added without saying where it is from', () => {
    const eggNames = terminalEasterEggs
      .filter((egg) => !(egg.kind === 'command' && egg.isNotAGame))
      .map(referenceNameOf)
      .filter((name) => name !== REFERENCES_FILE_PATH)
    const listedNames = EGG_REFERENCES.flatMap(({ references }) => references).filter(
      (name) => !(REFERENCES_BEYOND_THE_EGG_LIST as readonly string[]).includes(name),
    )

    expect([...listedNames].sort()).toEqual([...eggNames].sort())
  })

  it('leaves sudo out, so it stays a surprise', () => {
    expect(printed(REFERENCES_FILE_COMMAND).join('\n')).not.toContain('sudo')
  })

  it('prints one line per work, saying what kind of work it is', () => {
    const lines = printed(REFERENCES_FILE_COMMAND)

    expect(lines).toHaveLength(EGG_REFERENCES.length)
    expect(lines).toContain('Borderlands (video game): claptrap, guns, loot, stairs')
    expect(lines).toContain(
      "The Hitchhiker's Guide to the Galaxy (book): deepthought, echo $?, logout, panic, whatis",
    )
    expect(lines).toContain('The Expanse (show): amos, beltalowda, cant, miller, ping ceres')
  })

  it('goes by the name of a work, in order, so a visitor can find one', () => {
    const works = EGG_REFERENCES.map(({ work }) => work)

    expect(works).toEqual([...works].sort())
  })

  it('is listed with the games, and is a file, not a command to be offered', () => {
    expect(runCommandLine('ls /usr/games', state, context).outcomes[0].listing).toContain(
      'references.txt',
    )
    expect(findNode(context.root, REFERENCES_FILE_PATH)?.kind).toBe('file')
    expect(printed('which references.txt')).toEqual([])
  })

  it('reads the same from inside the folder', () => {
    const inGames = { ...state, cwd: '/usr/games' }
    const { lines } = runCommandLine('cat references.txt', inGames, context).outcomes[0]

    expect(lines.map(textOf)).toEqual(printed(REFERENCES_FILE_COMMAND))
  })
})
