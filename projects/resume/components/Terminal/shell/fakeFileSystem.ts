import { toTerminalFileName } from '@/components/terminalFileName'
import { skillGroups } from '@/data/profile'
import type { EasterEgg, FilePassword, OutputLine } from '@/data/terminalEasterEggs'

import { INITIAL_PATH } from '../constants'
import { FORTUNE_COMMAND, GAMES_DIRECTORY } from './constants'

import type { TerminalSection } from '../types'

/** What `cat` prints for a file. */
export type FileContent =
  /** A card on the page, cloned from its block. */
  | { blockId: string; kind: 'card' }
  /** Fixed lines, from the eggs or the approved copy, maybe behind a question. */
  | {
      exitStatus: number
      kind: 'lines'
      lines: readonly OutputLine[]
      password?: FilePassword
    }
  /** One skill, inside its group's folder. */
  | { kind: 'skill'; skill: string }

export type FileSystemNode =
  | { entries: ReadonlyMap<string, FileSystemNode>; kind: 'folder' }
  | { content: FileContent; kind: 'file' }

type FolderNode = Extract<FileSystemNode, { kind: 'folder' }>
type MutableFolder = { entries: Map<string, FileSystemNode>; kind: 'folder' }

export const HOME_DIRECTORY = '/home/zack'
const HOME_SHORTHAND = '~'
const ROOT_PATH = '/'
const PATH_SEPARATOR = '/'
const FOLDER_SUFFIX = '/'
const CURRENT_FOLDER = '.'
const PARENT_FOLDER = '..'
const HIDDEN_PREFIX = '.'
const PROFILE_FILE = 'developer.profile'
const RESUME_SCRIPT_FILE = 'get_resume.sh'
const TEXT_FILE_EXTENSION = '.txt'
const SKILLS_DIRECTORY = 'skills'

/** What `cat get_resume.sh` prints: a script that does what the site's command does. Approved 2026-11-06. */
const RESUME_SCRIPT_LINES: readonly OutputLine[] = [
  [{ text: '#!/bin/sh' }],
  [{ text: 'open https://kups.me/Zachary_Kuptsow_Resume.pdf' }],
]

function splitSegments(absolutePath: string): string[] {
  return absolutePath.split(PATH_SEPARATOR).filter((segment) => segment.length > 0)
}

function joinSegments(segments: readonly string[]): string {
  return ROOT_PATH + segments.join(PATH_SEPARATOR)
}

/** `~` and `~/x` expand to the home folder; everything else is already absolute. */
export function toAbsolutePath(path: string): string {
  if (path === HOME_SHORTHAND) {
    return HOME_DIRECTORY
  }
  if (path.startsWith(`${HOME_SHORTHAND}${PATH_SEPARATOR}`)) {
    return HOME_DIRECTORY + path.slice(HOME_SHORTHAND.length)
  }
  return path
}

/** The form the prompt shows: `~` inside the home folder, absolute outside it. */
function toDisplayPath(absolutePath: string): string {
  if (absolutePath === HOME_DIRECTORY) {
    return HOME_SHORTHAND
  }
  if (absolutePath.startsWith(`${HOME_DIRECTORY}${PATH_SEPARATOR}`)) {
    return HOME_SHORTHAND + absolutePath.slice(HOME_DIRECTORY.length)
  }
  return absolutePath
}

/**
 * Where a typed path leads from the current folder, as a shell would read it: `~`, `.`, `..`,
 * absolute and relative. Climbing above `/` stays at `/`.
 */
export function resolvePath(cwd: string, input: string): string {
  const startsAbsolute = input.startsWith(ROOT_PATH) || input.startsWith(HOME_SHORTHAND)
  const base = startsAbsolute ? [] : splitSegments(toAbsolutePath(cwd))
  const resolved = [...base]
  for (const segment of splitSegments(toAbsolutePath(input))) {
    if (segment === CURRENT_FOLDER) {
      continue
    }
    if (segment === PARENT_FOLDER) {
      resolved.pop()
      continue
    }
    resolved.push(segment)
  }
  return toDisplayPath(joinSegments(resolved))
}

export function findNode(root: FileSystemNode, path: string): FileSystemNode | null {
  let node: FileSystemNode = root
  for (const segment of splitSegments(toAbsolutePath(path))) {
    if (node.kind !== 'folder') {
      return null
    }
    const next = node.entries.get(segment)
    if (!next) {
      return null
    }
    node = next
  }
  return node
}

/** The names `ls` prints, sorted as it sorts them, with a `/` after each folder. */
export function listFolder(
  folder: FolderNode,
  options: { showHidden: boolean },
): readonly string[] {
  const names = [...folder.entries.entries()]
    .filter(([name]) => options.showHidden || !name.startsWith(HIDDEN_PREFIX))
    .map(([name, node]) => (node.kind === 'folder' ? `${name}${FOLDER_SUFFIX}` : name))
    .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0))
  return options.showHidden ? [CURRENT_FOLDER, PARENT_FOLDER, ...names] : names
}

/** The shortest relative path from a folder to a path, as a shell would type it. */
export function relativePathBetween(fromFolder: string, toPath: string): string {
  const from = splitSegments(toAbsolutePath(fromFolder))
  const to = splitSegments(toAbsolutePath(toPath))
  let shared = 0
  while (shared < from.length && shared < to.length && from[shared] === to[shared]) {
    shared += 1
  }
  const steps = [...Array<string>(from.length - shared).fill(PARENT_FOLDER), ...to.slice(shared)]
  return steps.length === 0 ? CURRENT_FOLDER : steps.join(PATH_SEPARATOR)
}

function newFolder(): MutableFolder {
  return { entries: new Map(), kind: 'folder' }
}

/** The folder at a path, making every folder on the way. */
function ensureFolder(root: MutableFolder, absolutePath: string): MutableFolder {
  let folder = root
  for (const segment of splitSegments(absolutePath)) {
    const existing = folder.entries.get(segment)
    if (existing && existing.kind === 'folder') {
      folder = existing as MutableFolder
      continue
    }
    const made = newFolder()
    folder.entries.set(segment, made)
    folder = made
  }
  return folder
}

function cardFile(blockId: string): FileSystemNode {
  return { content: { blockId, kind: 'card' }, kind: 'file' }
}

function linesFile(
  lines: readonly OutputLine[],
  exitStatus: number,
  password?: FilePassword,
): FileSystemNode {
  return { content: { exitStatus, kind: 'lines', lines, password }, kind: 'file' }
}

/**
 * The tree behind the prompt, from the same data as the tour, so a card and its file never
 * disagree: `/`, `/home`, `~`, then `~/portfolio` with the profile, the script, one folder per
 * section with one file per card, and the skill groups as folders of skills. Egg files are added
 * wherever their path says, folders and all.
 */
export function buildFileSystem(
  sections: readonly TerminalSection[],
  eggs: readonly EasterEgg[],
): FileSystemNode {
  const root = newFolder()
  const portfolio = ensureFolder(root, toAbsolutePath(INITIAL_PATH))
  portfolio.entries.set(PROFILE_FILE, cardFile('about-0'))
  portfolio.entries.set(RESUME_SCRIPT_FILE, linesFile(RESUME_SCRIPT_LINES, 0))

  for (const section of sections) {
    if (!section.directory) {
      continue
    }
    const folder = newFolder()
    portfolio.entries.set(section.directory, folder)
    section.fileNames.forEach((fileName, index) => {
      folder.entries.set(`${fileName}${TEXT_FILE_EXTENSION}`, cardFile(`${section.id}-${index}`))
    })
  }

  const skills = portfolio.entries.get(SKILLS_DIRECTORY) as MutableFolder | undefined
  if (skills) {
    for (const group of skillGroups) {
      const groupFolder = newFolder()
      skills.entries.set(toTerminalFileName(group.title), groupFolder)
      for (const skill of group.list) {
        groupFolder.entries.set(toTerminalFileName(skill), {
          content: { kind: 'skill', skill },
          kind: 'file',
        })
      }
    }
  }

  // Where Unix keeps its games, listing every hidden command but the surprises.
  const games = eggs.flatMap((egg) => (egg.kind === 'command' && !egg.isNotAGame ? [egg.name] : []))
  if (games.length > 0) {
    const gamesFolder = ensureFolder(root, GAMES_DIRECTORY)
    for (const name of [FORTUNE_COMMAND, ...games]) {
      gamesFolder.entries.set(name, linesFile([], 0))
    }
  }

  for (const egg of eggs) {
    if (egg.kind !== 'file') {
      continue
    }
    const segments = splitSegments(toAbsolutePath(egg.path))
    const fileName = segments.pop()
    if (!fileName) {
      throw new Error(`An egg file needs a name: "${egg.path}"`)
    }
    ensureFolder(root, joinSegments(segments)).entries.set(
      fileName,
      linesFile(egg.lines, egg.exitStatus ?? 0, egg.password),
    )
  }

  return root
}
