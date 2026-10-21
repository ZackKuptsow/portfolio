import { SMS_PROGRAM_NAME } from '@/data/householdAssistantSms'

import type { Metadata } from 'next'

interface SmsProgramPageMetadataOptions {
  description: string
  /** The page's own path, as served: `/privacy.html`. */
  path: string
  title: string
}

/**
 * What a household assistant page tells search engines. Each names itself as canonical, so
 * the root layout's canonical does not claim it for the home page, and each asks to stay out
 * of results: the pages exist for the campaign's reviewers and the household, and a search
 * for the name should find the portfolio.
 */
export function buildSmsProgramPageMetadata({
  description,
  path,
  title,
}: SmsProgramPageMetadataOptions): Metadata {
  return {
    alternates: { canonical: path },
    description,
    robots: { follow: true, index: false },
    title: `${title} | ${SMS_PROGRAM_NAME}`,
  }
}
