import { describe, expect, it } from 'vitest'

import { interpretResumeRequestResponse } from '@/components/GetResume/components/EmailOption/interpretResponse'
import type { ResumeRequestOutcome } from '@/components/GetResume/components/EmailOption/types'

// The statuses the intake API and API Gateway actually return, plus unexpected
// ones that must never tell a visitor an email is coming. Only 202 means the
// request was received (Zack, 2026-09-29): any other 2xx comes from something
// other than the intake handler, so the visitor is sent to the download.
const EXPECTED_OUTCOMES: ReadonlyArray<[number, ResumeRequestOutcome]> = [
  [200, 'server-error'],
  [202, 'success'],
  [400, 'invalid'],
  [404, 'server-error'],
  [418, 'server-error'],
  [429, 'limited'],
  [500, 'server-error'],
  [503, 'server-error'],
]

describe('interpretResumeRequestResponse', () => {
  it.each(EXPECTED_OUTCOMES)('maps %i to %s', (status, expectedOutcome) => {
    expect(interpretResumeRequestResponse(status)).toBe(expectedOutcome)
  })
})
