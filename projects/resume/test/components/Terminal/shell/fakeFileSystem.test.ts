import { describe, expect, it } from 'vitest'

import { buildSections } from '@/components/Terminal/buildSections'
import {
  HOME_DIRECTORY,
  buildFileSystem,
  findNode,
  listFolder,
  relativePathBetween,
  resolvePath,
  toAbsolutePath,
} from '@/components/Terminal/shell/fakeFileSystem'
import type { FileSystemNode } from '@/components/Terminal/shell/fakeFileSystem'
import { toTerminalFileName } from '@/components/terminalFileName'
import { skillGroups } from '@/data/profile'

const root = buildFileSystem(buildSections(), [])

function folderAt(node: FileSystemNode, path: string) {
  const found = findNode(node, path)
  if (!found || found.kind !== 'folder') {
    throw new Error(`${path} is not a folder in the fake filesystem`)
  }
  return found
}

describe('the fake filesystem', () => {
  it('mirrors the tour: every section folder and file exists', () => {
    expect(listFolder(folderAt(root, '~/portfolio'), { showHidden: false })).toEqual([
      'developer.profile',
      'education/',
      'get_resume.sh',
      'projects/',
      'skills/',
      'work_experience/',
    ])
    expect(findNode(root, '~/portfolio/work_experience/teampay.txt')).toEqual({
      content: { blockId: 'work-2', kind: 'card' },
      kind: 'file',
    })
    expect(findNode(root, '~/portfolio/developer.profile')).toEqual({
      content: { blockId: 'about-0', kind: 'card' },
      kind: 'file',
    })
  })

  it('gives get_resume.sh the approved two-line script', () => {
    expect(findNode(root, '~/portfolio/get_resume.sh')).toEqual({
      content: {
        exitStatus: 0,
        kind: 'lines',
        lines: [
          [{ text: '#!/bin/sh' }],
          [{ text: 'open https://kups.me/Zachary_Kuptsow_Resume.pdf' }],
        ],
      },
      kind: 'file',
    })
  })

  it('resolves ~, ., .., absolute and relative paths', () => {
    expect(HOME_DIRECTORY).toBe('/home/zack')
    expect(resolvePath('~/portfolio/skills', '../education')).toBe('~/portfolio/education')
    expect(resolvePath('~/portfolio', '/home/zack')).toBe('~')
    expect(resolvePath('~', 'portfolio/./projects/')).toBe('~/portfolio/projects')
    expect(resolvePath('~/portfolio', '~')).toBe('~')
    expect(resolvePath('~/portfolio', '/')).toBe('/')
    expect(resolvePath('/', 'home')).toBe('/home')
    expect(toAbsolutePath('~/portfolio')).toBe('/home/zack/portfolio')
    expect(toAbsolutePath('/home')).toBe('/home')
  })

  it('never climbs above the root', () => {
    expect(resolvePath('/', '../../../..')).toBe('/')
    expect(resolvePath('~/portfolio', '../../../../..')).toBe('/')
  })

  it('shows a dotfile from the eggs only when asked', () => {
    const withEgg = buildFileSystem(buildSections(), [
      { kind: 'file', lines: [[{ text: 'x' }]], path: '~/portfolio/.secret' },
    ])
    const portfolio = folderAt(withEgg, '~/portfolio')
    expect(listFolder(portfolio, { showHidden: false })).not.toContain('.secret')
    expect(listFolder(portfolio, { showHidden: true })).toEqual([
      '.',
      '..',
      '.secret',
      'developer.profile',
      'education/',
      'get_resume.sh',
      'projects/',
      'skills/',
      'work_experience/',
    ])
    expect(findNode(withEgg, '~/portfolio/.secret')).toEqual({
      content: { exitStatus: 0, kind: 'lines', lines: [[{ text: 'x' }]] },
      kind: 'file',
    })
  })

  it('puts an egg file outside the tree, folders and all, with its exit status', () => {
    const withEgg = buildFileSystem(buildSections(), [
      { exitStatus: 42, kind: 'file', lines: [[{ text: 'root:x:0:0' }]], path: '/etc/passwd' },
    ])
    expect(findNode(withEgg, '/etc/passwd')).toEqual({
      content: { exitStatus: 42, kind: 'lines', lines: [[{ text: 'root:x:0:0' }]] },
      kind: 'file',
    })
    expect(listFolder(folderAt(withEgg, '/'), { showHidden: false })).toEqual(['etc/', 'home/'])
  })

  it('lists the root and home as a real machine would, and nothing else exists', () => {
    expect(listFolder(folderAt(root, '/'), { showHidden: false })).toEqual(['home/'])
    expect(listFolder(folderAt(root, '/home'), { showHidden: false })).toEqual(['zack/'])
    expect(findNode(root, '/etc/passwd')).toBeNull()
    expect(findNode(root, '~/portfolio/nope.txt')).toBeNull()
  })

  it('makes a skill group a folder whose files are its skills', () => {
    const group = folderAt(root, '~/portfolio/skills/languages_frameworks')
    // `ls` sorts, here as everywhere, so the page's order is not the listing's.
    expect(listFolder(group, { showHidden: false })).toEqual(
      [...skillGroups[0].list.map(toTerminalFileName)].sort(),
    )
    expect(
      findNode(
        root,
        `~/portfolio/skills/languages_frameworks/${toTerminalFileName(skillGroups[0].list[0])}`,
      ),
    ).toEqual({
      content: { kind: 'skill', skill: skillGroups[0].list[0] },
      kind: 'file',
    })
  })

  it('types the relative path a shell would', () => {
    expect(relativePathBetween('~/portfolio/skills', '~/portfolio/education')).toBe('../education')
    expect(relativePathBetween('/home', '~/portfolio/education')).toBe('zack/portfolio/education')
    expect(relativePathBetween('/', '~/portfolio')).toBe('home/zack/portfolio')
    expect(relativePathBetween('~/portfolio/skills/languages_frameworks', '~/portfolio')).toBe(
      '../..',
    )
    expect(relativePathBetween('~/portfolio', '~/portfolio')).toBe('.')
  })
})
