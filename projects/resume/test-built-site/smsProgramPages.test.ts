import { describe, expect, it } from 'vitest'

import { SMS_PAGE_PATHS } from '@/data/householdAssistantSms'
import { SITE_URL } from '@/data/identity'

import { listBuiltPaths, readBuiltFile } from './builtSite'

const PAGE_TITLES = {
  privacy: 'Privacy Policy',
  signUp: 'Text OTIS to sign up',
  terms: 'Terms & Conditions',
}

function parseBuiltPage(sitePath: string): Document {
  return new DOMParser().parseFromString(readBuiltFile(sitePath.slice(1)), 'text/html')
}

describe.each(Object.entries(SMS_PAGE_PATHS))(
  'the household assistant %s page, as built',
  (pageName, sitePath) => {
    // The campaign links these exact addresses, and CloudFront serves a file only by its name.
    it(`is a file at ${sitePath}`, () => {
      expect(listBuiltPaths()).toContain(sitePath)
    })

    it('is titled with its own name first', () => {
      const pageTitle = PAGE_TITLES[pageName as keyof typeof PAGE_TITLES]

      expect(parseBuiltPage(sitePath).title.startsWith(`${pageTitle} | `)).toBe(true)
    })

    it('names itself as canonical and asks to stay out of search results', () => {
      const page = parseBuiltPage(sitePath)
      const canonicalLinks = [...page.querySelectorAll('link[rel="canonical"]')].map((link) =>
        link.getAttribute('href'),
      )
      const robotsContents = [...page.querySelectorAll('meta[name="robots"]')].map((tag) =>
        tag.getAttribute('content'),
      )

      expect(canonicalLinks).toEqual([`${SITE_URL}${sitePath}`])
      expect(robotsContents).toEqual(['noindex, follow'])
    })
  },
)
