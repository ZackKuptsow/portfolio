import { describe, expect, it } from 'vitest'

import { RESUME_PDF_PATH } from '@/components/GetResume/constants'
import { PROJECTS_PAGE_PATH, projects } from '@/data/projects'

import { listBuiltPaths, parseHomePage } from './builtSite'

const NOT_FOUND_PAGE_PATH = '/404.html'
// An address on this site: one slash, then a path. `//host/path` is another site.
const SITE_PATH = /^\/(?!\/)/

/** Every script, stylesheet, font, icon and image the page asks this site for. */
function readLocalAssetPaths(page: Document): string[] {
  const addresses = [...page.querySelectorAll('[src], link[href]')].map(
    (element) => element.getAttribute('src') ?? element.getAttribute('href') ?? '',
  )
  return addresses
    .filter((address) => SITE_PATH.test(address))
    .map((address) => new URL(address, 'https://site.invalid').pathname)
}

describe('the files of the built site', () => {
  const builtPaths = listBuiltPaths()

  it('holds the resume PDF at the path the links and the QR code point to', () => {
    expect(builtPaths).toContain(RESUME_PDF_PATH)
  })

  it('holds the page CloudFront answers a missing path with', () => {
    expect(builtPaths).toContain(NOT_FOUND_PAGE_PATH)
  })

  it('holds the projects page at the path the footer links', () => {
    expect(builtPaths).toContain(PROJECTS_PAGE_PATH)
  })

  it('holds every project demo and its poster, at the paths the cards play from', () => {
    const demoPaths = projects.flatMap((project) =>
      project.video ? [project.video.posterPath, project.video.sourcePath] : [],
    )

    // Without this, a page with no demos would pass.
    expect(demoPaths.length).toBeGreaterThan(0)
    expect(demoPaths.filter((demoPath) => !builtPaths.includes(demoPath))).toEqual([])
  })

  it('holds every script, stylesheet, font and icon the home page asks for', () => {
    const assetPaths = readLocalAssetPaths(parseHomePage())

    // Without this, a page that asked for nothing would pass.
    expect(assetPaths.length).toBeGreaterThan(0)
    expect(assetPaths.filter((assetPath) => !builtPaths.includes(assetPath))).toEqual([])
  })
})
