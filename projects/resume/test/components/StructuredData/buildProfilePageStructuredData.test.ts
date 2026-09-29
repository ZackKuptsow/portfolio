import { describe, expect, it } from 'vitest'

import {
  buildProfilePageStructuredData,
  serializeStructuredData,
} from '@/components/StructuredData/buildProfilePageStructuredData'

const MODIFIED_ON = new Date('2026-09-29T12:00:00.000Z')

describe('buildProfilePageStructuredData', () => {
  it('describes the page as a profile of one person, under both forms of the name', () => {
    const structuredData = buildProfilePageStructuredData(MODIFIED_ON)

    expect(structuredData['@context']).toBe('https://schema.org')
    expect(structuredData['@type']).toBe('ProfilePage')
    expect(structuredData.mainEntity).toMatchObject({
      '@id': 'https://kups.me/#person',
      '@type': 'Person',
      alternateName: 'Zachary Kuptsow',
      familyName: 'Kuptsow',
      givenName: 'Zachary',
      jobTitle: 'Full-Stack Software Engineer',
      name: 'Zack Kuptsow',
      url: 'https://kups.me',
    })
  })

  it('ties the person to the public profiles, so search engines merge them into one identity', () => {
    const structuredData = buildProfilePageStructuredData(MODIFIED_ON)

    expect(structuredData.mainEntity.sameAs).toEqual([
      'https://github.com/ZackKuptsow',
      'https://www.linkedin.com/in/zack-kuptsow/',
    ])
  })

  it('publishes the city and the school', () => {
    const { mainEntity } = buildProfilePageStructuredData(MODIFIED_ON)

    expect(mainEntity.address).toEqual({
      '@type': 'PostalAddress',
      addressCountry: 'US',
      addressLocality: 'Philadelphia',
      addressRegion: 'PA',
    })
    expect(mainEntity.alumniOf).toEqual({
      '@type': 'CollegeOrUniversity',
      name: 'University of Delaware',
    })
  })

  it('publishes no way to contact him, at any depth', () => {
    // The whole block is searched as text, so a contact nested inside another
    // object, such as a contactPoint, is caught as well as a top-level field.
    const published = JSON.stringify(buildProfilePageStructuredData(MODIFIED_ON))
    const contactTraces = ['"email"', '"telephone"', 'zkups56', '@gmail', '685-9908']

    expect(contactTraces.filter((trace) => published.includes(trace))).toEqual([])
  })

  it('stamps the page with the date it was built', () => {
    expect(buildProfilePageStructuredData(MODIFIED_ON).dateModified).toBe(
      '2026-09-29T12:00:00.000Z',
    )
  })
})

describe('serializeStructuredData', () => {
  it('escapes "<", so text inside the data can never close the script tag', () => {
    const serialized = serializeStructuredData({ description: '</script><script>alert(1)' })

    expect(serialized).toBe('{"description":"\\u003c/script>\\u003cscript>alert(1)"}')
  })
})
