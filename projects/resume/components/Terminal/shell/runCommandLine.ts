import { buildCommandTable } from './commandTable'
import { BASH_LINES, DRAFT_COPY, EXIT_STATUS, GAMES_DIRECTORY } from './constants'
import { resolvePath, toAbsolutePath } from './fakeFileSystem'
import { tokenizeCommandLine } from './tokenizeCommandLine'

import type { CommandOutcome, RunResult, ShellContext, ShellState } from './types'

const PATH_COMMAND_PREFIXES = ['./', '/'] as const

/** `/usr/games/panic`, or `./panic` from inside it, is `panic`. */
function gameNameAtPath(word: string, cwd: string): string | null {
  if (!word.includes('/')) {
    return null
  }
  const path = toAbsolutePath(resolvePath(cwd, word))
  return path.startsWith(`${GAMES_DIRECTORY}/`) ? path.slice(GAMES_DIRECTORY.length + 1) : null
}

function notFound(word: string): CommandOutcome {
  const isPath = PATH_COMMAND_PREFIXES.some((prefix) => word.startsWith(prefix))
  return {
    exitStatus: EXIT_STATUS.notFound,
    lines: [
      [{ text: isPath ? DRAFT_COPY.scriptNotFound(word) : BASH_LINES.commandNotFound(word) }],
    ],
  }
}

/**
 * Runs one typed line through the closed table: each command in turn, stopping at the first
 * failure as `&&` does, and never evaluating anything. The line joins the history first, as bash
 * records it before running it, so `history` lists itself.
 */
export function runCommandLine(line: string, state: ShellState, context: ShellContext): RunResult {
  const table = buildCommandTable(context.eggs)
  const tokenized = tokenizeCommandLine(line)
  let current: ShellState = { ...state, history: [...state.history, line] }

  if (tokenized.kind === 'syntax-error') {
    current = { ...current, lastExitStatus: EXIT_STATUS.syntaxError }
    return {
      outcomes: [
        {
          exitStatus: EXIT_STATUS.syntaxError,
          lines: [[{ text: BASH_LINES.syntaxError(tokenized.token) }]],
        },
      ],
      state: current,
    }
  }

  const outcomes: CommandOutcome[] = []
  for (const words of tokenized.commands) {
    const handler = table.get(gameNameAtPath(words[0], current.cwd) ?? words[0])
    const outcome = handler ? handler(words, current, context) : notFound(words[0])
    outcomes.push(outcome)
    current = {
      ...current,
      cwd: outcome.cwd ?? current.cwd,
      lastExitStatus: outcome.exitStatus,
    }
    if (outcome.exitStatus !== EXIT_STATUS.success) {
      break
    }
  }
  return { outcomes, state: current }
}
