import type { NextConfig } from 'next'

const REQUIRED_PROTOCOL = 'https:'
const RESUME_REQUEST_API_PATH = '/resume-requests'
const RESUME_REQUEST_API_URL_VARIABLE = 'NEXT_PUBLIC_RESUME_REQUEST_API_URL'

/**
 * Fail the build unless the resume request API URL has exactly the shape the
 * deployed API accepts. Next inlines the value into the browser bundle, so a
 * typo would otherwise ship and surface only as a failed request on the live
 * site. Next loads `.env*` files before it evaluates this config.
 */
function assertResumeRequestApiUrl(value: string | undefined): void {
  if (!value) {
    throw new Error(
      `${RESUME_REQUEST_API_URL_VARIABLE} is not set. Put it in .env.local (see README.md).`,
    )
  }

  let url: URL
  try {
    url = new URL(value)
  } catch (error) {
    throw new Error(`${RESUME_REQUEST_API_URL_VARIABLE} is not a URL: ${value}`, { cause: error })
  }

  const problems = [
    url.protocol !== REQUIRED_PROTOCOL && `use ${REQUIRED_PROTOCOL}`,
    url.pathname !== RESUME_REQUEST_API_PATH &&
      `end in exactly ${RESUME_REQUEST_API_PATH}, with no trailing slash`,
    (url.search !== '' || url.hash !== '') && 'have no query string or fragment',
  ].filter((problem) => problem !== false)

  if (problems.length > 0) {
    throw new Error(`${RESUME_REQUEST_API_URL_VARIABLE} must ${problems.join(', ')}. Got: ${value}`)
  }
}

assertResumeRequestApiUrl(process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL)

const nextConfig: NextConfig = {
  output: 'export',
}

export default nextConfig
