import { existsSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { buildProjects, projects } from '@/data/projects'

const PUBLIC_DIRECTORY = path.resolve(__dirname, '../../public')
// A file this site serves: one slash, then a path. `//host/path` is another site.
const SITE_PATH = /^\/(?!\/)/
const LIVE_SITE_URL = 'https://example.com/save-state'

describe('projects', () => {
  it('gives every project somewhere to go: a link, or a recording to open', () => {
    const nowhere = projects.filter((project) => project.links.length === 0 && !project.video)

    expect(nowhere).toEqual([])
  })

  it('links only to pages that exist: https elsewhere, or a file this site serves', () => {
    const hrefs = projects.flatMap((project) => project.links.map((link) => link.href))

    // Without this, a list of projects with no links at all would pass.
    expect(hrefs.length).toBeGreaterThanOrEqual(1)
    const broken = hrefs.filter(
      (href) =>
        !href.startsWith('https://') &&
        !(SITE_PATH.test(href) && existsSync(path.join(PUBLIC_DIRECTORY, href))),
    )
    expect(broken).toEqual([])
  })

  it('ships the file behind every demo, so no player opens on a missing recording', () => {
    const videos = projects.flatMap((project) => (project.video ? [project.video] : []))
    const demoPaths = videos.flatMap((video) => [video.posterPath, video.sourcePath])

    expect(videos.length).toBeGreaterThanOrEqual(1)
    expect(demoPaths.filter((demoPath) => !SITE_PATH.test(demoPath))).toEqual([])
    expect(
      demoPaths.filter((demoPath) => !existsSync(path.join(PUBLIC_DIRECTORY, demoPath))),
    ).toEqual([])
  })

  it('gives every project its own title, so no two cards read as one file', () => {
    const titles = projects.map((project) => project.title)

    expect(new Set(titles).size).toBe(titles.length)
  })

  describe('the Save State live link', () => {
    function findSaveStateLinks(saveStateLiveUrl?: string) {
      const saveState = buildProjects({ saveStateLiveUrl }).find(
        (project) => project.title === 'Save State',
      )
      if (!saveState) {
        throw new Error('no Save State project')
      }
      return saveState.links
    }

    it('is left out until a build names the site, so no card points at an open write path', () => {
      expect(findSaveStateLinks(undefined)).toEqual([])
      expect(findSaveStateLinks('')).toEqual([])
    })

    it('is the one link once a build names the site; the code link waits on the repository', () => {
      expect(findSaveStateLinks(LIVE_SITE_URL)).toEqual([
        { href: LIVE_SITE_URL, label: 'live site' },
      ])
    })

    it('changes nothing else about the list', () => {
      const withoutLiveSite = buildProjects({})
      const withLiveSite = buildProjects({ saveStateLiveUrl: LIVE_SITE_URL })

      expect(withLiveSite.map((project) => project.title)).toEqual(
        withoutLiveSite.map((project) => project.title),
      )
      expect(withLiveSite.filter((project) => project.title !== 'Save State')).toEqual(
        withoutLiveSite.filter((project) => project.title !== 'Save State'),
      )
    })
  })
})
