import { buildCommandTable } from './commandTable'
import { BASH_LINES, DRAFT_COPY, EXIT_STATUS } from './constants'
import { tokenizeCommandLine } from './tokenizeCommandLine'

import type { CommandOutcome, RunResult, ShellContext, ShellState } from './types'

const PATH_COMMAND_PREFIXES = ['./', '/'] as const

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
    const handler = table.get(words[0])
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
