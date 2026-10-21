import {
  PERSON_FAMILY_NAME,
  PERSON_GIVEN_NAME,
  PERSON_NAME,
  SITE_DESCRIPTION,
  SITE_TITLE,
  SITE_URL,
} from '@/data/identity'

import type { Metadata } from 'next'

const CANONICAL_PATH = '/'

/**
 * What search engines and link previews read about the site. It lives outside
 * `layout.tsx` so tests can import it without loading `next/font`.
 *
 * The share image is not listed here. Next adds it from `opengraph-image.png`.
 *
 * The root layout applies this to every route, the canonical address included.
 * Any page but the home page must set its own `alternates.canonical`, or it tells
 * search engines the home page is the real copy and drops out of results. The
 * household assistant's pages do, through `buildSmsProgramPageMetadata`.
 */
export const siteMetadata: Metadata = {
  alternates: { canonical: CANONICAL_PATH },
  authors: [{ name: PERSON_NAME, url: SITE_URL }],
  creator: PERSON_NAME,
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    description: SITE_DESCRIPTION,
    firstName: PERSON_GIVEN_NAME,
    lastName: PERSON_FAMILY_NAME,
    siteName: PERSON_NAME,
    title: SITE_TITLE,
    type: 'profile',
    url: SITE_URL,
  },
  title: SITE_TITLE,
  twitter: {
    card: 'summary_large_image',
    description: SITE_DESCRIPTION,
    title: SITE_TITLE,
  },
}
