import { SITE_URL } from '@/data/identity'

import type { MetadataRoute } from 'next'

/**
 * With `output: 'export'`, Next refuses to build a route that does not declare
 * itself static. The route Next generates for this file takes that declaration
 * from here.
 */
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
