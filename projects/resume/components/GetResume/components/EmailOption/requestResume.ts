import { RESUME_REQUEST_API_URL, RESUME_REQUEST_TIMEOUT_MILLISECONDS } from './constants'
import { interpretResumeRequestResponse } from './interpretResponse'

import type { ResumeRequestOutcome } from './types'

const TIMEOUT_ERROR_NAME = 'TimeoutError'

/** `AbortSignal.timeout` rejects fetch with a DOMException of this name. */
function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === TIMEOUT_ERROR_NAME
}

/**
 * Send one resume request and report how it ended. This never rejects, so
 * the caller can always leave the submitting state.
 *
 * A `TypeError` from fetch means no response reached the page: the visitor is
 * offline, CORS blocked the request, or the API Gateway throttle answered
 * without CORS headers. A timeout means the same thing from the visitor's
 * side. The browser cannot tell those apart, so they share one outcome. Any
 * other error is unexpected. It is logged, and the visitor is sent to the
 * download.
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
      signal: AbortSignal.timeout(RESUME_REQUEST_TIMEOUT_MILLISECONDS),
    })
    return interpretResumeRequestResponse(response.status)
  } catch (error) {
    if (error instanceof TypeError || isTimeoutError(error)) {
      return 'network-error'
    }
    console.error('Resume request failed unexpectedly', error)
    return 'server-error'
  }
}
