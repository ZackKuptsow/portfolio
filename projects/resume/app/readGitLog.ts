import { execFileSync } from 'node:child_process'

/** How many commits a typed `git log` prints. The gates job checks out at least this many. */
export const GIT_LOG_LINES = 10
const GIT_LOG_ARGUMENTS = ['log', '-n', String(GIT_LOG_LINES), '--format=%h %s'] as const

/** No em or en dash in anything a visitor reads, and a commit subject can hold one. */
const EM_OR_EN_DASH = /[–—]/g
const PLAIN_HYPHEN = '-'

/** Runs git with arguments and returns what it printed. The real one is `execFileSync`. */
export type GitRunner = (gitArguments: readonly string[]) => string

const runGitForReal: GitRunner = (gitArguments) =>
  execFileSync('git', [...gitArguments], { encoding: 'utf8' })

/**
 * The repository's last commits, in `git log --oneline` form, read when the page is built: the
 * pages run on the server at build time and hand the lines to the terminal, where a typed
 * `git log` prints them. It fails loudly rather than ship an empty log: a build without git, or
 * with no history to read, is a build to look at.
 */
export function readGitLog(runGit: GitRunner = runGitForReal): readonly string[] {
  let output: string
  try {
    output = runGit(GIT_LOG_ARGUMENTS)
  } catch (error) {
    throw new Error(`The build could not run git log for the typed shell: ${String(error)}`)
  }
  const lines = output
    .split('\n')
    .filter((line) => line.length > 0)
    .map((line) => line.replace(EM_OR_EN_DASH, PLAIN_HYPHEN))
  if (lines.length === 0) {
    throw new Error('The build ran git log for the typed shell and got no commits')
  }
  return lines
}
