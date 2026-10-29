import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import * as identity from '@/data/identity'
import * as profile from '@/data/profile'
import * as projects from '@/data/projects'

// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/
// Search results commonly cut a description off near this length.
const SEARCH_SNIPPET_MAX_LENGTH = 160
const SHARE_IMAGE_ALT_TEXT_PATH = path.resolve(__dirname, '../../app/opengraph-image.alt.txt')

/** Every string reachable from a value, however deeply it is nested. */
function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings)
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

function countStringsByExport(moduleExports: Record<string, unknown>): Record<string, number> {
  return Object.fromEntries(
    Object.entries(moduleExports).map(([exportName, value]) => [
      exportName,
      collectStrings(value).length,
    ]),
  )
}

describe('resume content', () => {
  it('has no em or en dashes in any string a visitor sees', () => {
    const visibleStrings = [
      ...collectStrings({ ...identity }),
      ...collectStrings({ ...profile }),
      ...collectStrings({ ...projects }),
    ]

    expect(visibleStrings.filter((text) => EM_OR_EN_DASH.test(text))).toEqual([])
  })

  // The counts below anchor the check above: a list that came back empty or
  // short would otherwise pass it without having been examined.
  it('examines every identity string', () => {
    expect(countStringsByExport({ ...identity })).toEqual({
      CONTACT_EMAIL: 1,
      HERO_NAME_LINE: 1,
      JOB_TITLE: 1,
      LOCATION: 3,
      LOCATION_LABEL: 1,
      PERSON_FAMILY_NAME: 1,
      PERSON_FORMAL_NAME: 1,
      PERSON_GIVEN_NAME: 1,
      PERSON_HANDLE: 1,
      PERSON_NAME: 1,
      PROFILE_LINKS: 2,
      SITE_DESCRIPTION: 1,
      SITE_TITLE: 1,
      SITE_URL: 1,
    })
  })

  it('examines every profile string', () => {
    expect(countStringsByExport({ ...profile })).toEqual({
      about: 14,
      education: 8,
      skillGroups: 21,
      workExperience: 28,
    })
  })

  it('examines every project string', () => {
    expect(countStringsByExport({ ...projects })).toEqual({
      PROJECTS_PAGE_PATH: 1,
      SAVE_STATE_TOUR: 6,
      // A function holds no visible string.
      buildProjects: 0,
      projects: 27,
    })
  })

  it('describes the site in a line that fits a search result and carries both name forms', () => {
    expect(identity.SITE_DESCRIPTION.length).toBeLessThanOrEqual(SEARCH_SNIPPET_MAX_LENGTH)
    expect(identity.SITE_DESCRIPTION).toContain('Zack Kuptsow')
    expect(identity.SITE_DESCRIPTION).toContain('Zachary Kuptsow')
  })

  it('shows the same city to visitors as it reports to search engines', () => {
    expect(identity.LOCATION_LABEL).toBe('Philadelphia, PA')
    expect([identity.LOCATION.locality, identity.LOCATION.region]).toEqual(['Philadelphia', 'PA'])
  })
})

describe('share image alt text', () => {
  const altText = readFileSync(SHARE_IMAGE_ALT_TEXT_PATH, 'utf8')

  it('has no line break or stray space at either end, because Next copies the file into the page as it is', () => {
    expect(altText).toBe(altText.trim())
    expect(altText).toBe('Zack Kuptsow, full-stack software engineer. kups.me')
  })

  it('has no em or en dash', () => {
    expect(altText.match(EM_OR_EN_DASH)).toBeNull()
  })
})
