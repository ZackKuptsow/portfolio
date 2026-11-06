import { PERSON_HANDLE } from '@/data/identity'

/**
 * The typed shell's fixed values. It is a closed table for show: nothing typed is evaluated. See
 * "Typed commands at the terminal prompt" in docs/superpowers/specs.
 */

/** The one way to join commands, because the tour types `clear && cd ../education && ls`. */
export const COMMAND_JOINER = '&&'

/** A pair of either groups words into one and is stripped. The whole of the quoting the shell knows. */
export const QUOTE_CHARACTERS = ['"', "'"] as const

/** Syntax a real shell would act on and this one refuses, each with bash's error line. */
export const REFUSED_TOKENS = ['|', ';', '>', '<', '`', '$('] as const

/** The shell speaks as bash (Zack's choice over zsh, 2026-11-06). */
export const SHELL_NAME = 'bash'

export const EXIT_STATUS = {
  failure: 1,
  notFound: 127,
  success: 0,
  syntaxError: 2,
} as const

/** The variables `echo` expands. `$PWD` is the folder and `$?` the last exit status. */
export const SHELL_VARIABLES = {
  HOME: '/home/zack',
  SHELL: '/bin/bash',
  USER: 'zack',
} as const

/** Where `which` says a command lives. */
export const COMMAND_DIRECTORY = '/usr/bin'

/** How many columns `history` gives its numbers. */
export const HISTORY_NUMBER_WIDTH = 5
export const HISTORY_SEPARATOR = '  '

/** What `wget` accepts: the address the tour types, with or without a scheme. */
export const RESUME_SCRIPT_ADDRESSES = [
  'kups.me/get_resume.sh',
  'http://kups.me/get_resume.sh',
  'https://kups.me/get_resume.sh',
] as const
export const RESUME_SCRIPT_NAMES = ['get_resume.sh', './get_resume.sh'] as const
export const RESUME_SCRIPT_RUNNER = './get_resume.sh'

/** The names `open` knows, each to a fixed address in `data/identity.ts`. */
export const OPEN_TARGETS = ['github', 'linkedin'] as const

export const THEME_NAMES = { dark: 'dark', light: 'light' } as const

/** Bash's own words, verbatim. Approved 2026-11-06. */
export const BASH_LINES = {
  catDirectory: (path: string) => `cat: ${path}: Is a directory`,
  catMissing: (path: string) => `cat: ${path}: No such file or directory`,
  cdMissing: (path: string) => `${SHELL_NAME}: cd: ${path}: No such file or directory`,
  cdNotDirectory: (path: string) => `${SHELL_NAME}: cd: ${path}: Not a directory`,
  commandNotFound: (word: string) => `${SHELL_NAME}: ${word}: command not found`,
  syntaxError: (token: string) => `${SHELL_NAME}: syntax error near unexpected token '${token}'`,
} as const

/** Lines Zack approved on 2026-11-06, verbatim. */
export const APPROVED_COPY = {
  openUsage: 'usage: open github | linkedin',
  uname: 'Linux',
  whoami: PERSON_HANDLE,
} as const

/**
 * Lines a visitor can read that Zack has not approved yet. Each is the real tool's own wording
 * where the tool has one. Listed in the pull request for his approval; none ships without it.
 */
// draft
export const DRAFT_COPY = {
  gitNotACommand: (word: string) => `git: '${word}' is not a git command. See 'git --help'.`,
  lsMissing: (path: string) => `ls: cannot access '${path}': No such file or directory`,
  manMissing: (word: string) => `No manual entry for ${word}`,
  scriptMissing: (interpreter: string, path: string) =>
    `${interpreter}: ${path}: No such file or directory`,
  scriptNotFound: (path: string) => `${SHELL_NAME}: ${path}: No such file or directory`,
  themeUsage: 'usage: theme dark | light',
  unameAll: 'Linux kups 6.1.0 #1 SMP x86_64 GNU/Linux',
  wgetUnresolved: (host: string) => `wget: unable to resolve host address '${host}'`,
} as const

/** What `help` lists and `man` answers with, one line per command. Tier 1 to 3 only, never an egg. */
// draft
export const HELP_LINES: readonly (readonly [command: string, description: string])[] = [
  ['cat <file>', 'print a file'],
  ['cd <folder>', 'change folder'],
  ['clear', 'clear the screen'],
  ['date', 'the date and time'],
  ['echo <text>', 'print text'],
  ['exit', 'back to the first screen'],
  ['git log', 'the last commits of this site'],
  ['help', 'this list'],
  ['history', 'what has been typed'],
  ['ls [-a] [folder]', 'list a folder'],
  ['mail', 'the address to write to'],
  ['man <command>', 'one line about a command'],
  ['open github | linkedin', 'open a profile in a new tab'],
  ['plain', 'the plain view'],
  ['pwd', 'the folder the prompt is in'],
  ['sh get_resume.sh', 'the resume'],
  ['theme dark | light', 'switch the theme'],
  ['uname', 'the system'],
  ['wget kups.me/get_resume.sh', 'fetch the resume script'],
  ['which <command>', 'where a command lives'],
  ['whoami', 'who this is'],
]
