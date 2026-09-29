import { SITE_URL } from '@/data/identity'

import type { MetadataRoute } from 'next'

/** The static export can only emit a metadata route that is fully static. */
export const dynamic = 'force-static'

/**
 * Serves `/robots.txt`. Nothing is blocked, the resume PDF included: a crawler
 * has to fetch the PDF to see the noindex header that keeps it out of results.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { allow: '/', userAgent: '*' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
