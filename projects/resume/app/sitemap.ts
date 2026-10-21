import { SITE_URL } from '@/data/identity'

import type { MetadataRoute } from 'next'

const HIGHEST_PRIORITY = 1

/**
 * With `output: 'export'`, Next refuses to build a route that does not declare
 * itself static. The route Next generates for this file takes that declaration
 * from here.
 */
export const dynamic = 'force-static'

/**
 * Serves `/sitemap.xml`: the home page, stamped with the time of the build. The household
 * assistant's pages ask search engines to leave them out, so they are not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      changeFrequency: 'monthly',
      lastModified: new Date(),
      priority: HIGHEST_PRIORITY,
      url: SITE_URL,
    },
  ]
}
