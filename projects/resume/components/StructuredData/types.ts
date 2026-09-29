/** A schema.org `Person`, limited to the fields this site publishes. */
export type PersonStructuredData = {
  '@id': string
  '@type': 'Person'
  address: {
    '@type': 'PostalAddress'
    addressCountry: string
    addressLocality: string
    addressRegion: string
  }
  alternateName: string
  alumniOf: {
    '@type': 'CollegeOrUniversity'
    name: string
  }
  description: string
  familyName: string
  givenName: string
  jobTitle: string
  knowsAbout: readonly string[]
  name: string
  sameAs: readonly string[]
  url: string
}

/** A schema.org `ProfilePage` whose subject is one person. */
export type ProfilePageStructuredData = {
  '@context': 'https://schema.org'
  '@type': 'ProfilePage'
  dateModified: string
  mainEntity: PersonStructuredData
}
