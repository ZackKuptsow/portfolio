import type { OutputLine } from '@/data/terminalEasterEggs'

import { EXIT_STATUS } from './constants'

import type { CommandOutcome } from './types'

/** A plain line of output, with no link in it. */
export function text(line: string): OutputLine {
  return [{ text: line }]
}

export function succeed(
  lines: readonly string[] = [],
  extra: Partial<CommandOutcome> = {},
): CommandOutcome {
  return { exitStatus: EXIT_STATUS.success, lines: lines.map(text), ...extra }
}

export function fail(
  line: string | null,
  exitStatus: number = EXIT_STATUS.failure,
): CommandOutcome {
  return { exitStatus, lines: line === null ? [] : [text(line)] }
}
