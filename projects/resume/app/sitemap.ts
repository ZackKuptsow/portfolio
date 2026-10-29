import { SITE_URL } from '@/data/identity'
import { PROJECTS_PAGE_PATH } from '@/data/projects'

import type { MetadataRoute } from 'next'

const HIGHEST_PRIORITY = 1
const PROJECTS_PRIORITY = 0.8

/**
 * With `output: 'export'`, Next refuses to build a route that does not declare
 * itself static. The route Next generates for this file takes that declaration
 * from here.
 */
export const dynamic = 'force-static'

/**
 * Serves `/sitemap.xml`: the home page and the projects page, stamped with the time of the
 * build. The household assistant's pages ask search engines to leave them out, so they are
 * not listed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()

  return [
    {
      changeFrequency: 'monthly',
      lastModified,
      priority: HIGHEST_PRIORITY,
      url: SITE_URL,
    },
    {
      changeFrequency: 'monthly',
      lastModified,
      priority: PROJECTS_PRIORITY,
      url: `${SITE_URL}${PROJECTS_PAGE_PATH}`,
    },
  ]
}
