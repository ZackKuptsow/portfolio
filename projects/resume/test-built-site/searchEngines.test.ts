import { readFileSync } from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import {
  PERSON_FORMAL_NAME,
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/data/identity'

import { listBuiltPaths, parseHomePage, readBuiltFile } from './builtSite'

const SHARE_IMAGE_ALT_TEXT = readFileSync(
  path.resolve(__dirname, '../app/opengraph-image.alt.txt'),
  'utf8',
)
const SHARE_IMAGE_PATH = '/opengraph-image.png'

/** The `content` of each meta tag that carries the attribute, in page order. */
function readMetaContents(page: Document, attribute: 'name' | 'property', value: string) {
  return [...page.querySelectorAll(`meta[${attribute}="${value}"]`)].map((tag) =>
    tag.getAttribute('content'),
  )
}

describe('what a search engine reads in the built page', () => {
  const page = parseHomePage()

  it('has the title and the description', () => {
    expect(page.title).toBe(SITE_TITLE)
    expect(readMetaContents(page, 'name', 'description')).toEqual([SITE_DESCRIPTION])
  })

  it('names one canonical address', () => {
    const canonicalLinks = [...page.querySelectorAll('link[rel="canonical"]')].map((link) =>
      link.getAttribute('href'),
    )

    expect(canonicalLinks).toEqual([SITE_URL])
  })

  it('does not ask to be left out of search results', () => {
    expect(readMetaContents(page, 'name', 'robots')).toEqual([])
  })

  it('has one main heading', () => {
    expect(page.querySelectorAll('h1')).toHaveLength(1)
  })

  it('describes a profile page of the person, under both forms of the name', () => {
    const structuredDataScripts = [...page.querySelectorAll('script[type="application/ld+json"]')]
    expect(structuredDataScripts).toHaveLength(1)

    const structuredData = JSON.parse(structuredDataScripts[0].textContent ?? '')
    expect(structuredData).toMatchObject({
      '@type': 'ProfilePage',
      mainEntity: { '@type': 'Person', alternateName: PERSON_FORMAL_NAME, name: PERSON_NAME },
    })
  })
})

describe('what a link preview reads in the built page', () => {
  const page = parseHomePage()

  it('has the title, the description and the address of a profile', () => {
    expect(readMetaContents(page, 'property', 'og:title')).toEqual([SITE_TITLE])
    expect(readMetaContents(page, 'property', 'og:description')).toEqual([SITE_DESCRIPTION])
    expect(readMetaContents(page, 'property', 'og:url')).toEqual([SITE_URL])
    expect(readMetaContents(page, 'property', 'og:type')).toEqual(['profile'])
  })

  it('points at a share image that the build wrote', () => {
    const [imageAddress] = readMetaContents(page, 'property', 'og:image')
    const imageUrl = new URL(imageAddress ?? '')

    expect(imageUrl.origin).toBe(SITE_URL)
    expect(imageUrl.pathname).toBe(SHARE_IMAGE_PATH)
    expect(listBuiltPaths()).toContain(SHARE_IMAGE_PATH)
  })

  // The build cache does not notice a change to the alt text file alone. See "Search
  // engines" in the README.
  it('describes the share image with the text in opengraph-image.alt.txt', () => {
    expect(readMetaContents(page, 'property', 'og:image:alt')).toEqual([SHARE_IMAGE_ALT_TEXT])
    expect(readMetaContents(page, 'name', 'twitter:image:alt')).toEqual([SHARE_IMAGE_ALT_TEXT])
  })

  it('asks for the large image card', () => {
    expect(readMetaContents(page, 'name', 'twitter:card')).toEqual(['summary_large_image'])
  })
})

describe('the files a crawler asks for', () => {
  it('has a robots.txt that blocks nothing and names the sitemap', () => {
    const robots = readBuiltFile('robots.txt')

    expect(robots).toContain('Allow: /')
    expect(robots).not.toMatch(/Disallow/i)
    expect(robots).toContain(`Sitemap: ${SITE_URL}/sitemap.xml`)
  })

  it('has a sitemap that lists the page', () => {
    expect(readBuiltFile('sitemap.xml')).toContain(`<loc>${SITE_URL}</loc>`)
  })
})
