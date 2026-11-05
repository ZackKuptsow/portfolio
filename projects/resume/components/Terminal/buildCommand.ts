import { INITIAL_PATH, RESUME_COMMAND } from './constants'

import type { SectionId, TerminalSection, TerminalStep } from './types'

const HOME_PATH = '~'
const PROFILE_FILE = 'developer.profile'
const FILE_EXTENSION = '.txt'
/** What stands between the path and the typed command. */
const PROMPT_SEPARATOR = ' $ '

/** How the reader got here: scrolling down, scrolling up, or from the menu. */
export type CommandRoute = 'down' | 'menu' | 'up'

/** What to type, and the folder the prompt is left in afterwards. */
export type TerminalCommand = {
  command: string
  cwd: string
}

type CommandRequest = {
  cwd: string
  route: CommandRoute
  section: TerminalSection
  step: TerminalStep
}

function directoryPath(directory: string): string {
  return `${INITIAL_PATH}/${directory}`
}

/** The `cd` that gets from `cwd` into a section's folder, or nothing when already there. */
function changeInto(cwd: string, directory: string): string {
  if (cwd === directoryPath(directory)) {
    return ''
  }
  if (cwd === INITIAL_PATH) {
    return `cd ./${directory} && `
  }
  if (cwd === HOME_PATH) {
    return `cd portfolio/${directory} && `
  }
  return `cd ../${directory} && `
}

/** The `cd` that gets from `cwd` up to the portfolio, or nothing when already there. */
function changeToPortfolio(cwd: string): string {
  if (cwd === INITIAL_PATH) {
    return ''
  }
  return cwd === HOME_PATH ? 'cd portfolio && ' : 'cd .. && '
}

/** The file's name as seen from `cwd`. */
function fileFrom(cwd: string, directory: string, fileName: string): string {
  const file = `${fileName}${FILE_EXTENSION}`
  if (cwd === directoryPath(directory)) {
    return file
  }
  return cwd === INITIAL_PATH ? `${directory}/${file}` : `${directoryPath(directory)}/${file}`
}

function listing(section: TerminalSection): string {
  return section.id === 'skills' ? 'ls -la' : 'ls'
}

function buildDownCommand({ cwd, section, step }: CommandRequest): TerminalCommand {
  if (section.id === 'hero') {
    return { command: 'whoami', cwd }
  }
  if (section.id === 'about') {
    return {
      command: `clear && ${changeToPortfolio(cwd)}cat ${PROFILE_FILE}`,
      cwd: INITIAL_PATH,
    }
  }
  if (section.id === 'resume') {
    return { command: RESUME_COMMAND, cwd }
  }
  const directory = section.directory as string
  if (step.clearsBefore) {
    return {
      command: `clear && ${changeInto(cwd, directory)}${listing(section)}`,
      cwd: directoryPath(directory),
    }
  }
  return { command: `cat ${fileFrom(cwd, directory, step.fileName as string)}`, cwd }
}

/** Going up only ever crosses into a section: inside one, what is printed is still on screen. */
function buildUpCommand({ cwd, section, step }: CommandRequest): TerminalCommand {
  if (section.id === 'hero') {
    return { command: `clear && cd ${HOME_PATH} && whoami`, cwd: HOME_PATH }
  }
  if (section.id === 'about') {
    return { command: `${changeToPortfolio(cwd)}cat ${PROFILE_FILE}`, cwd: INITIAL_PATH }
  }
  if (section.id === 'resume') {
    return { command: RESUME_COMMAND, cwd }
  }
  const directory = section.directory as string
  if (section.id === 'skills') {
    return { command: `${changeToPortfolio(cwd)}ls -la ${directory}/`, cwd: INITIAL_PATH }
  }
  return {
    command: `${changeToPortfolio(cwd)}cat ${directory}/${step.fileName as string}${FILE_EXTENSION}`,
    cwd: INITIAL_PATH,
  }
}

/** The menu spells out whole paths, so it reads the same from anywhere. */
function buildMenuCommand({ cwd, section }: CommandRequest): TerminalCommand {
  if (section.id === 'hero') {
    return { command: `clear && cd ${HOME_PATH} && whoami`, cwd: HOME_PATH }
  }
  if (section.id === 'about') {
    return { command: `clear && cat ${INITIAL_PATH}/${PROFILE_FILE}`, cwd }
  }
  if (section.id === 'resume') {
    return { command: RESUME_COMMAND, cwd }
  }
  const path = directoryPath(section.directory as string)
  return { command: `clear && cd ${path} && ${listing(section)}`, cwd: path }
}

/**
 * The command for a move, worked out from where the prompt is, so it is true of the fake
 * filesystem by any route. A straight read down from the top gives the commands in DESIGN.md's
 * table word for word. Going up, the table's `cd ..` is true only for the first hop out of a
 * folder: after it the prompt is in the portfolio, so the next hop is `cat education/x.txt`.
 */
export function buildCommand(request: CommandRequest): TerminalCommand {
  if (request.route === 'menu') {
    return buildMenuCommand(request)
  }
  return request.route === 'up' ? buildUpCommand(request) : buildDownCommand(request)
}

/** The folder a page opens in: where its first section's commands read true. */
export function initialCwd(section: TerminalSection): string {
  return section.directory ? directoryPath(section.directory) : INITIAL_PATH
}

/** The last folder of a path, as the prompt shows it on a phone: `~/portfolio/skills` is `~/skills`. */
export function shortenPromptPath(path: string): string {
  return path === HOME_PATH ? path : `${HOME_PATH}/${path.split('/').pop()}`
}

/**
 * What the prompt holds on a read of the site, down through it, back up, and from the menu. A
 * line is its folder and command together, because a long folder never comes with the longest
 * command: a read of Projects only ever types its long file names from inside `projects`.
 */
export function listPromptLines(
  sections: readonly TerminalSection[],
  steps: readonly TerminalStep[],
  formatPath: (path: string) => string,
): readonly string[] {
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const lines: string[] = []
  let cwd = INITIAL_PATH

  const type = (step: TerminalStep, route: CommandRoute) => {
    const result = buildCommand({
      cwd,
      route,
      section: sectionById.get(step.sectionId) as TerminalSection,
      step,
    })
    lines.push(`${formatPath(cwd)}${PROMPT_SEPARATOR}${result.command}`)
    cwd = result.cwd
  }

  for (const step of steps.slice(1)) {
    type(step, 'down')
  }
  // Going up lands on the last card of each section above, and passes over the resume.
  const lastStepsOfSections = steps.filter((_, index) => steps[index + 1]?.clearsBefore ?? true)
  for (const step of [...lastStepsOfSections].reverse().slice(1)) {
    if (step.sectionId !== 'resume') {
      type(step, 'up')
    }
  }
  for (const section of sections) {
    const firstStep = steps.find((step) => step.sectionId === section.id) as TerminalStep
    type(firstStep, 'menu')
  }
  return lines
}

/** The length of the longest of those lines, for keeping room for it clear of the text. */
export function measureLongestPromptLine(
  sections: readonly TerminalSection[],
  steps: readonly TerminalStep[],
  formatPath: (path: string) => string,
): number {
  return Math.max(...listPromptLines(sections, steps, formatPath).map((line) => line.length))
}
