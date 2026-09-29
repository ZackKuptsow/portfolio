import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useResumeRequest } from '@/components/GetResume/components/EmailOption/hooks'

const TEST_API_URL = 'https://resume-requests.invalid/resume-requests'

describe('useResumeRequest', () => {
  it('trims the address before sending it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('  you@company.com  ')
    })

    await waitFor(() => expect(result.current.status).toBe('success'))
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      TEST_API_URL,
      expect.objectContaining({ body: '{"email":"you@company.com"}' }),
    )
  })

  it('treats an address of only spaces as invalid and sends nothing', () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('   ')
    })

    expect(result.current.status).toBe('invalid')
    expect(fetchMock).toHaveBeenCalledTimes(0)
  })

  it('sends a new request when the visitor retries after a network error', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const { result } = renderHook(() => useResumeRequest())

    act(() => {
      result.current.submitEmail('you@company.com')
    })
    await waitFor(() => expect(result.current.status).toBe('network-error'))
    act(() => {
      result.current.submitEmail('you@company.com')
    })
    await waitFor(() => expect(result.current.status).toBe('success'))

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
})
