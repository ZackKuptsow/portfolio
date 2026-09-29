import { describe, expect, it, vi } from 'vitest'

import { requestResume } from '@/components/GetResume/components/EmailOption/requestResume'

// Set in vitest.config.ts. It deliberately differs from the real URL, so this
// proves the value comes from the environment.
const TEST_API_URL = 'https://resume-requests.invalid/resume-requests'

describe('requestResume', () => {
  it('posts the address as JSON to the configured URL, without credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)

    await requestResume('you@company.com')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(TEST_API_URL, {
      body: '{"email":"you@company.com"}',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    })
  })

  it('reports success for a 202 whose body is not JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>not json</html>', { status: 202 })),
    )

    await expect(requestResume('you@company.com')).resolves.toBe('success')
  })

  it('reports a network error when fetch rejects with a TypeError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    await expect(requestResume('you@company.com')).resolves.toBe('network-error')
  })

  it('reports a server error and logs it when anything else goes wrong', async () => {
    const unexpectedError = new Error('unexpected')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(unexpectedError))
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(requestResume('you@company.com')).resolves.toBe('server-error')

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Resume request failed unexpectedly',
      unexpectedError,
    )
  })
})
