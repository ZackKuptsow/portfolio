import type { EasterEgg, OutputLine } from '@/data/terminalEasterEggs'

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

/** What one command printed and asked for. */
export type CommandOutcome = {
  /** A drawing, printed in a <pre>. */
  art?: readonly string[]
  /** A card to clone from the page. */
  cardBlockId?: string
  /** The folder the prompt is in afterwards, when the command moved it. */
  cwd?: string
  effect?: ShellEffect
  exitStatus: number
  lines: readonly OutputLine[]
  /** Names for the listing markup, as `ls` prints them. */
  listing?: readonly string[]
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
