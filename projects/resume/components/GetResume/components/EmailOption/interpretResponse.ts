import type { ResumeRequestOutcome } from './types'

const ACCEPTED_STATUS = 202
const INVALID_REQUEST_STATUS = 400
const TOO_MANY_REQUESTS_STATUS = 429

/**
 * Map the intake API's HTTP status to what the visitor is told.
 *
 * Only the status decides. The body is never read, so a malformed body cannot
 * change the outcome, and the API's raw validation issues never reach the
 * page. The API returns:
 * - 202: accepted
 * - 400: invalid
 * - 429: rate limited, by the handler or by the API Gateway throttle
 * - 500: internal error
 *
 * Only 202 promises an email. Any other status, including another 2xx, came
 * from something other than the intake handler's accept path, so the visitor
 * is sent to the download instead of waiting for mail that may not come.
 */
export function interpretResumeRequestResponse(status: number): ResumeRequestOutcome {
  switch (status) {
    case ACCEPTED_STATUS:
      return 'success'
    case INVALID_REQUEST_STATUS:
      return 'invalid'
    case TOO_MANY_REQUESTS_STATUS:
      return 'limited'
    default:
      return 'server-error'
  }
}
