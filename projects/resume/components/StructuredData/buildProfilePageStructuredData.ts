import {
  JOB_TITLE,
  LOCATION,
  PERSON_FAMILY_NAME,
  PERSON_FORMAL_NAME,
  PERSON_GIVEN_NAME,
  PERSON_NAME,
  PROFILE_LINKS,
  SITE_DESCRIPTION,
  SITE_URL,
} from '@/data/identity'
import { about, education } from '@/data/profile'

import type { ProfilePageStructuredData } from './types'

const ESCAPED_LESS_THAN = '\\u003c'
const LESS_THAN = /</g
const PERSON_FRAGMENT = '#person'

/**
 * Describe the page to search engines as a profile of one person.
 *
 * Both forms of the name are given, and the public profiles are listed as the
 * same person, so a search for either name can be tied back to this site.
 * Email and phone are left out on purpose. This block exists to be merged into
 * profiles that search engines keep about a person, and a contact published
 * here becomes part of that profile. The footer links the email for people.
 */
export function buildProfilePageStructuredData(modifiedOn: Date): ProfilePageStructuredData {
  const [mostRecentDegree] = education

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    dateModified: modifiedOn.toISOString(),
    mainEntity: {
      '@id': `${SITE_URL}/${PERSON_FRAGMENT}`,
      '@type': 'Person',
      address: {
        '@type': 'PostalAddress',
        addressCountry: LOCATION.country,
        addressLocality: LOCATION.locality,
        addressRegion: LOCATION.region,
      },
      alternateName: PERSON_FORMAL_NAME,
      alumniOf: {
        '@type': 'CollegeOrUniversity',
        name: mostRecentDegree.title,
      },
      description: SITE_DESCRIPTION,
      familyName: PERSON_FAMILY_NAME,
      givenName: PERSON_GIVEN_NAME,
      jobTitle: JOB_TITLE,
      knowsAbout: about.coreTechnologies,
      name: PERSON_NAME,
      sameAs: Object.values(PROFILE_LINKS),
      url: SITE_URL,
    },
  }
}

/**
 * Serialize structured data for an inline script tag. "<" is escaped, so no
 * text inside the data can close the tag early.
 */
export function serializeStructuredData(structuredData: unknown): string {
  return JSON.stringify(structuredData).replace(LESS_THAN, ESCAPED_LESS_THAN)
}
