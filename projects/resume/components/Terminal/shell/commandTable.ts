import { CONTACT_EMAIL, PROFILE_LINKS } from '@/data/identity'
import type { EasterEgg, OutputLine } from '@/data/terminalEasterEggs'

import {
  APPROVED_COPY,
  BASH_LINES,
  COMMAND_DIRECTORY,
  DRAFT_COPY,
  EXIT_STATUS,
  HELP_LINES,
  HISTORY_NUMBER_WIDTH,
  HISTORY_SEPARATOR,
  OPEN_TARGETS,
  RESUME_SCRIPT_ADDRESSES,
  RESUME_SCRIPT_NAMES,
  RESUME_SCRIPT_RUNNER,
  SHELL_VARIABLES,
  THEME_NAMES,
} from './constants'
import { findNode, listFolder, resolvePath, toAbsolutePath } from './fakeFileSystem'

import type { CommandHandler, CommandOutcome, ShellContext, ShellState } from './types'

/** What counts as yes to a `[y/N]`. Anything else, Enter alone included, is no. */
const YES_ANSWER = /^y(es)?$/i
const FLAG_PREFIX = '-'
const SHOW_HIDDEN_FLAG = 'a'
const VARIABLE_PATTERN = /\$(\?|[A-Za-z_][A-Za-z0-9_]*)/g
const PROFILE_LINK_BY_TARGET: Record<(typeof OPEN_TARGETS)[number], string> = {
  github: PROFILE_LINKS.gitHub,
  linkedin: PROFILE_LINKS.linkedIn,
}
const DATE_LOCALE = 'en-US'
const DAY_WIDTH = 2

function text(line: string): OutputLine {
  return [{ text: line }]
}

function succeed(
  lines: readonly string[] = [],
  extra: Partial<CommandOutcome> = {},
): CommandOutcome {
  return { exitStatus: EXIT_STATUS.success, lines: lines.map(text), ...extra }
}

function fail(line: string | null, exitStatus: number = EXIT_STATUS.failure): CommandOutcome {
  return { exitStatus, lines: line === null ? [] : [text(line)] }
}

function splitFlags(words: readonly string[]): { flags: string; paths: readonly string[] } {
  const flagWords = words.filter((word) => word.startsWith(FLAG_PREFIX))
  return {
    flags: flagWords.map((word) => word.slice(FLAG_PREFIX.length)).join(''),
    paths: words.filter((word) => !word.startsWith(FLAG_PREFIX)),
  }
}

const list: CommandHandler = ([, ...words], state, context) => {
  const { flags, paths } = splitFlags(words)
  const target = paths[0] ?? state.cwd
  const node = findNode(context.root, resolvePath(state.cwd, target))
  if (!node) {
    return fail(DRAFT_COPY.lsMissing(target), EXIT_STATUS.syntaxError)
  }
  if (node.kind === 'file') {
    return succeed([], { listing: [target] })
  }
  return succeed([], {
    listing: listFolder(node, { showHidden: flags.includes(SHOW_HIDDEN_FLAG) }),
  })
}

const changeFolder: CommandHandler = ([, target], state, context) => {
  const cwd = resolvePath(state.cwd, target ?? '~')
  const node = findNode(context.root, cwd)
  if (!node) {
    return fail(BASH_LINES.cdMissing(target ?? cwd))
  }
  if (node.kind === 'file') {
    return fail(BASH_LINES.cdNotDirectory(target ?? cwd))
  }
  return succeed([], { cwd })
}

const print: CommandHandler = ([, target], state, context) => {
  if (target === undefined) {
    return succeed()
  }
  const node = findNode(context.root, resolvePath(state.cwd, target))
  if (!node) {
    return fail(BASH_LINES.catMissing(target))
  }
  if (node.kind === 'folder') {
    return fail(BASH_LINES.catDirectory(target))
  }
  const { content } = node
  if (content.kind === 'card') {
    return succeed([], { cardBlockId: content.blockId })
  }
  if (content.kind === 'skill') {
    return succeed([content.skill])
  }
  const { exitStatus, lines, password } = content
  if (password) {
    // A fake lock: every guess gets in. The guess is not looked at, and the shell does not keep it.
    return succeed([], {
      asks: {
        answer: () => ({ exitStatus, lines: [text(password.reply), ...lines] }),
        isSecret: true,
        label: password.label,
      },
    })
  }
  return { exitStatus, lines }
}

const echo: CommandHandler = ([, ...words], state) => {
  const values: Record<string, string> = {
    ...SHELL_VARIABLES,
    '?': String(state.lastExitStatus),
    PWD: toAbsolutePath(state.cwd),
  }
  const expanded = words.map((word) =>
    word.replace(VARIABLE_PATTERN, (_, name: string) => values[name] ?? ''),
  )
  return succeed([expanded.join(' ')])
}

const history: CommandHandler = (_, state) =>
  succeed(
    state.history.map(
      (line, index) =>
        `${String(index + 1).padStart(HISTORY_NUMBER_WIDTH)}${HISTORY_SEPARATOR}${line}`,
    ),
  )

/** `date`'s own format: `Fri Nov  6 14:42:07 EST 2026`. */
function formatDate(now: Date): string {
  const part = (options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(DATE_LOCALE, options).format(now)
  const zone = new Intl.DateTimeFormat(DATE_LOCALE, { timeZoneName: 'short' })
    .formatToParts(now)
    .find((piece) => piece.type === 'timeZoneName')
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((value) => String(value).padStart(2, '0'))
    .join(':')
  return [
    part({ weekday: 'short' }),
    part({ month: 'short' }),
    String(now.getDate()).padStart(DAY_WIDTH),
    time,
    zone?.value ?? '',
    String(now.getFullYear()),
  ].join(' ')
}

const date: CommandHandler = (_, __, context) => succeed([formatDate(context.now())])

const fetchScript: CommandHandler = ([, address]) => {
  if ((RESUME_SCRIPT_ADDRESSES as readonly string[]).includes(address ?? '')) {
    return succeed([], { effect: { kind: 'download' } })
  }
  return fail(DRAFT_COPY.wgetUnresolved(address ?? ''))
}

function runScript(interpreter: string): CommandHandler {
  return ([, script]) => {
    if ((RESUME_SCRIPT_NAMES as readonly string[]).includes(script ?? '')) {
      return succeed([], { effect: { kind: 'open-resume' } })
    }
    return fail(DRAFT_COPY.scriptMissing(interpreter, script ?? ''), EXIT_STATUS.notFound)
  }
}

const manual: CommandHandler = ([, name]) => {
  if (name === undefined) {
    return fail(DRAFT_COPY.manUsage)
  }
  const entry = HELP_LINES.find(([command]) => command.split(' ')[0] === name)
  if (!entry) {
    return fail(DRAFT_COPY.manMissing(name ?? ''))
  }
  return succeed([`${entry[0]}: ${entry[1]}`])
}

const help: CommandHandler = () => {
  const width = Math.max(...HELP_LINES.map(([command]) => command.length))
  return succeed(
    HELP_LINES.map(([command, description]) => `${command.padEnd(width)}  ${description}`),
  )
}

const git: CommandHandler = ([, subcommand], _, context) => {
  if (subcommand === 'log') {
    return succeed(context.gitLog)
  }
  if (subcommand === undefined) {
    return fail(DRAFT_COPY.gitUsage)
  }
  return fail(DRAFT_COPY.gitNotACommand(subcommand ?? ''))
}

const uname: CommandHandler = ([, flag]) =>
  succeed([flag === '-a' ? DRAFT_COPY.unameAll : APPROVED_COPY.uname])

function openTarget(eggs: readonly EasterEgg[]): CommandHandler {
  return ([, target]) => {
    const profile = OPEN_TARGETS.find((name) => name === target)
    if (profile) {
      return succeed([], { effect: { href: PROFILE_LINK_BY_TARGET[profile], kind: 'open-url' } })
    }
    const egg = eggs.find(
      (entry) => entry.kind === 'command' && entry.name === target && entry.opens,
    )
    if (egg && egg.kind === 'command' && egg.opens) {
      return succeed([], { effect: { href: egg.opens, kind: 'open-url' } })
    }
    return fail(APPROVED_COPY.openUsage)
  }
}

const mail: CommandHandler = () => ({
  exitStatus: EXIT_STATUS.success,
  lines: [[{ href: `mailto:${CONTACT_EMAIL}`, text: CONTACT_EMAIL }]],
})

const theme: CommandHandler = ([, name], _, context) => {
  if (name === undefined) {
    return succeed([context.isDark() ? THEME_NAMES.dark : THEME_NAMES.light])
  }
  if (name === THEME_NAMES.dark || name === THEME_NAMES.light) {
    return succeed([], { effect: { isDark: name === THEME_NAMES.dark, kind: 'theme' } })
  }
  return fail(DRAFT_COPY.themeUsage)
}

const effectOnly =
  (effect: CommandOutcome['effect']): CommandHandler =>
  () =>
    succeed([], { effect })

function eggHandler(egg: EasterEgg): CommandHandler {
  if (egg.kind === 'art') {
    return (_, __, context) =>
      context.columns >= egg.columns ? succeed([], { art: egg.lines }) : succeed([egg.narrowLine])
  }
  if (egg.kind === 'command') {
    const run = (): CommandOutcome => ({
      effect: egg.opens ? { href: egg.opens, kind: 'open-url' } : undefined,
      exitStatus: egg.exitStatus ?? EXIT_STATUS.success,
      lines: egg.lines,
      pausedEnding: egg.pausedEnding,
    })
    const { confirm } = egg
    if (!confirm) {
      return run
    }
    return () =>
      succeed([], {
        asks: {
          answer: (line) => (YES_ANSWER.test(line.trim()) ? run() : succeed()),
          isSecret: false,
          label: confirm,
        },
      })
  }
  throw new Error(`An egg file is not a command: "${egg.path}"`)
}

/** Every command the shell knows. Anything else is "command not found". */
export function buildCommandTable(eggs: readonly EasterEgg[]): ReadonlyMap<string, CommandHandler> {
  const table = new Map<string, CommandHandler>([
    [RESUME_SCRIPT_RUNNER, effectOnly({ kind: 'open-resume' })],
    ['bash', runScript('bash')],
    ['cat', print],
    ['cd', changeFolder],
    ['clear', effectOnly({ kind: 'clear' })],
    ['date', date],
    ['echo', echo],
    ['email', mail],
    ['exit', effectOnly({ kind: 'exit' })],
    ['git', git],
    ['help', help],
    ['history', history],
    ['ls', list],
    ['mail', mail],
    ['man', manual],
    ['open', openTarget(eggs)],
    ['plain', effectOnly({ kind: 'plain-view' })],
    ['pwd', (_, state) => succeed([toAbsolutePath(state.cwd)])],
    ['sh', runScript('sh')],
    ['theme', theme],
    ['uname', uname],
    ['wget', fetchScript],
    ['whoami', () => succeed([APPROVED_COPY.whoami])],
  ])
  table.set('which', ([, ...names]) => {
    const found = names.filter((name) => table.has(name))
    return found.length === names.length
      ? succeed(found.map((name) => `${COMMAND_DIRECTORY}/${name}`))
      : {
          exitStatus: EXIT_STATUS.failure,
          lines: found.map((name) => text(`${COMMAND_DIRECTORY}/${name}`)),
        }
  })
  for (const egg of eggs) {
    if (egg.kind !== 'file') {
      table.set(egg.name, eggHandler(egg))
    }
  }
  return table
}

export type { ShellContext, ShellState }
