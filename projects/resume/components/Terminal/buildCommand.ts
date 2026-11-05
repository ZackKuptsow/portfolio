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
  /** The section the reader is coming from, which decides `cat` within a section or across. */
  cameFromSectionId: SectionId
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

function buildUpCommand({
  cameFromSectionId,
  cwd,
  section,
  step,
}: CommandRequest): TerminalCommand {
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
  const fileName = step.fileName as string
  if (cameFromSectionId === section.id) {
    return { command: `cat ${fileFrom(cwd, directory, fileName)}`, cwd }
  }
  return {
    command: `${changeToPortfolio(cwd)}cat ${directory}/${fileName}${FILE_EXTENSION}`,
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

/**
 * The longest line the prompt can hold, in characters, so the room it needs when a command
 * wraps can be kept clear of the text ahead of time.
 */
export function measureLongestPromptLine(
  sections: readonly TerminalSection[],
  steps: readonly TerminalStep[],
): number {
  const routes: readonly CommandRoute[] = ['down', 'menu', 'up']
  const folders = [
    HOME_PATH,
    INITIAL_PATH,
    ...sections.flatMap((section) => (section.directory ? [directoryPath(section.directory)] : [])),
  ]
  const longestFolder = Math.max(...folders.map((folder) => folder.length))
  const sectionById = new Map(sections.map((section) => [section.id, section]))
  const longestCommand = Math.max(
    ...steps.flatMap((step) =>
      routes.flatMap((route) =>
        folders.flatMap((cwd) =>
          [step.sectionId, 'hero' as const].map(
            (cameFromSectionId) =>
              buildCommand({
                cameFromSectionId,
                cwd,
                route,
                section: sectionById.get(step.sectionId) as TerminalSection,
                step,
              }).command.length,
          ),
        ),
      ),
    ),
  )
  return longestFolder + PROMPT_SEPARATOR.length + longestCommand
}
