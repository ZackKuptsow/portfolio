import { RESUME_REQUEST_API_URL } from './constants'
import { interpretResumeRequestResponse } from './interpretResponse'

import type { ResumeRequestOutcome } from './types'

/**
 * Send one resume request and report how it ended. This never rejects, so
 * the caller can always leave the submitting state.
 *
 * A `TypeError` from fetch means no response reached the page: the visitor is
 * offline, CORS blocked the request, or the API Gateway throttle answered
 * without CORS headers. The browser cannot tell those apart, so they share one
 * outcome. Any other error is unexpected. It is logged, and the visitor is sent
 * to the download.
 */
export async function requestResume(email: string): Promise<ResumeRequestOutcome> {
  try {
    const response = await fetch(RESUME_REQUEST_API_URL, {
      body: JSON.stringify({ email }),
      // The API allows the site's origin without `allow-credentials`, so CORS
      // would block a credentialed request.
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
    return interpretResumeRequestResponse(response.status)
  } catch (error) {
    if (error instanceof TypeError) {
      return 'network-error'
    }
    console.error('Resume request failed unexpectedly', error)
    return 'server-error'
  }
}
