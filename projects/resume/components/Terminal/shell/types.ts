import type { EasterEgg, OutputLine, PausedEnding } from '@/data/terminalEasterEggs'

import type { FileSystemNode } from './fakeFileSystem'

/** What a command asks the terminal to do besides print. */
export type ShellEffect =
  | { kind: 'clear' }
  | { kind: 'download' }
  | { kind: 'exit' }
  | { kind: 'open-resume' }
  | { href: string; kind: 'open-url' }
  | { kind: 'plain-view' }
  | { isDark: boolean; kind: 'theme' }

/** A question the shell waits on: the next line typed answers it, and is never run. */
export type ShellQuestion = {
  answer: (line: string) => CommandOutcome
  /** True for a password: what is typed is not shown, not echoed, and not kept in the history. */
  isSecret: boolean
  /** Printed on a line of its own. The answer is typed at the prompt below. */
  label: string
}

/** What one command printed and asked for. */
export type CommandOutcome = {
  /** A drawing, printed in a <pre>. */
  art?: readonly string[]
  /** What follows waits on an answer. */
  asks?: ShellQuestion
  /** A card to clone from the page. */
  cardBlockId?: string
  /** The folder the prompt is in afterwards, when the command moved it. */
  cwd?: string
  effect?: ShellEffect
  exitStatus: number
  lines: readonly OutputLine[]
  /** Names for the listing markup, as `ls` prints them. */
  listing?: readonly string[]
  /** Text that joins the last line after a real pause. */
  pausedEnding?: PausedEnding
}

/** What the shell remembers between lines. Nothing here leaves the page. */
export type ShellState = {
  cwd: string
  history: readonly string[]
  lastExitStatus: number
}

/** What the commands read: the page's data and the terminal's state, never the network. */
export type ShellContext = {
  /** Characters across the output, for drawings that need room. */
  columns: number
  eggs: readonly EasterEgg[]
  gitLog: readonly string[]
  isDark: () => boolean
  now: () => Date
  root: FileSystemNode
}

export type CommandHandler = (
  words: readonly string[],
  state: ShellState,
  context: ShellContext,
) => CommandOutcome

export type RunResult = {
  outcomes: readonly CommandOutcome[]
  state: ShellState
}
