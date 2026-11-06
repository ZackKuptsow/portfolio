import type { EasterEgg } from '@/data/terminalEasterEggs'

import { buildCommandTable } from './commandTable'

/** No em or en dash in anything a visitor reads. See "Content" in the README. */
const EM_OR_EN_DASH = /[–—]/
const ABSOLUTE_PREFIXES = ['/', '~'] as const
const PATH_SEPARATOR = '/'

function nameOf(egg: EasterEgg): string {
  return egg.kind === 'file' ? egg.path : egg.name
}

function stringsOf(egg: EasterEgg): readonly string[] {
  if (egg.kind === 'art') {
    return [...egg.lines, egg.narrowLine]
  }
  return egg.lines.flatMap((line) => line.map((segment) => segment.text))
}

/**
 * The rules the shell relies on, as problems to list, so a bad egg is caught by the data test
 * and by the shell at start, never by a visitor. An empty list is a clean one.
 */
export function checkEasterEggs(eggs: readonly EasterEgg[]): readonly string[] {
  const tableNames = new Set(buildCommandTable([]).keys())
  const seenNames = new Set<string>()
  const seenPaths = new Set<string>()
  const problems: string[] = []

  for (const egg of eggs) {
    if (egg.kind !== 'file') {
      if (tableNames.has(egg.name)) {
        problems.push(`The egg command "${egg.name}" shadows a command of the table`)
      }
      if (seenNames.has(egg.name)) {
        problems.push(`The egg name "${egg.name}" is used twice`)
      }
      seenNames.add(egg.name)
    } else {
      if (!ABSOLUTE_PREFIXES.some((prefix) => egg.path.startsWith(prefix))) {
        problems.push(`The egg path "${egg.path}" must start with / or ~`)
      }
      const fileName = egg.path
        .split(PATH_SEPARATOR)
        .filter((segment) => segment.length > 0)
        .pop()
      if (fileName === undefined || fileName === '~') {
        problems.push(`The egg path "${egg.path}" has no file name`)
      }
      if (seenPaths.has(egg.path)) {
        problems.push(`The egg path "${egg.path}" is used twice`)
      }
      seenPaths.add(egg.path)
    }
    if (stringsOf(egg).some((text) => EM_OR_EN_DASH.test(text))) {
      problems.push(`The egg "${nameOf(egg)}" holds an em or en dash`)
    }
    if (egg.kind === 'art') {
      const widest = Math.max(0, ...egg.lines.map((line) => line.length))
      if (widest > egg.columns) {
        problems.push(
          `The art "${egg.name}" says ${egg.columns} columns but a line is ${widest} wide`,
        )
      }
    }
  }
  return problems
}

/** The shell refuses to start on a bad list, so the fault is loud where a developer sees it. */
export function assertEasterEggsValid(eggs: readonly EasterEgg[]): void {
  const problems = checkEasterEggs(eggs)
  if (problems.length > 0) {
    throw new Error(`The easter eggs break the shell's rules:\n${problems.join('\n')}`)
  }
}
