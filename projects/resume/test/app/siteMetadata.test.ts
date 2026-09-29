import { describe, expect, it } from 'vitest'

import { siteMetadata } from '@/app/siteMetadata'

describe('siteMetadata', () => {
  it('names one canonical address, so copies of the page are not ranked against each other', () => {
    expect(siteMetadata.metadataBase?.href).toBe('https://kups.me/')
    expect(siteMetadata.alternates?.canonical).toBe('/')
  })

  it('titles the page with the name people search for', () => {
    expect(siteMetadata.title).toBe('Zack Kuptsow | Full-Stack Software Engineer')
  })

  it('shares as the profile of a person, under the formal first and last name', () => {
    expect(siteMetadata.openGraph).toMatchObject({
      firstName: 'Zachary',
      lastName: 'Kuptsow',
      type: 'profile',
      url: 'https://kups.me',
    })
  })

  it('shares with a large image card', () => {
    expect(siteMetadata.twitter).toMatchObject({ card: 'summary_large_image' })
  })
})
