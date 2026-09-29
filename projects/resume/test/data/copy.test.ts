import { describe, expect, it } from 'vitest'

import * as identity from '@/data/identity'
import * as profile from '@/data/profile'

// Writing Voice hard rule for anything a visitor reads.
const EM_OR_EN_DASH = /[–—]/
// identity.ts: 12 single strings, 3 in LOCATION, 2 in PROFILE_LINKS.
const IDENTITY_STRING_COUNT = 17
// profile.ts: 28 in workExperience, 8 in education, 21 in skillGroups, 14 in about.
const PROFILE_STRING_COUNT = 71
// Search results cut a description off near this length.
const SEARCH_SNIPPET_MAX_LENGTH = 160

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

describe('resume content', () => {
  it('has no em or en dashes in any string a visitor sees', () => {
    const identityStrings = collectStrings({ ...identity })
    const profileStrings = collectStrings({ ...profile })

    expect(
      [...identityStrings, ...profileStrings].filter((text) => EM_OR_EN_DASH.test(text)),
    ).toEqual([])
    // Assert the exact counts, so an empty or shortened list cannot pass unexamined.
    expect(identityStrings).toHaveLength(IDENTITY_STRING_COUNT)
    expect(profileStrings).toHaveLength(PROFILE_STRING_COUNT)
  })

  it('describes the site in a line that fits a search result and carries both name forms', () => {
    expect(identity.SITE_DESCRIPTION.length).toBeLessThanOrEqual(SEARCH_SNIPPET_MAX_LENGTH)
    expect(identity.SITE_DESCRIPTION).toContain('Zack Kuptsow')
    expect(identity.SITE_DESCRIPTION).toContain('Zachary Kuptsow')
  })
})
