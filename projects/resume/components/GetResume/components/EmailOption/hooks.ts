'use client'

import { useCallback, useRef, useState } from 'react'

import { requestResume } from './requestResume'

import type { ResumeRequestStatus } from './types'

/** What `useResumeRequest` hands to the form. */
export type ResumeRequestControls = {
  status: ResumeRequestStatus
  submitEmail: (email: string) => void
}

/**
 * Hold the email option's status, and send at most one request at a time.
 *
 * The in-flight flag is a ref, not state. A ref changes the moment it is set,
 * so an Enter and a click landing in the same tick still send one request. A
 * state flag would read as stale until the next render.
 */
export function useResumeRequest(): ResumeRequestControls {
  const [status, setStatus] = useState<ResumeRequestStatus>('idle')
  const isRequestInFlightRef = useRef(false)

  const submitEmail = useCallback((email: string) => {
    if (isRequestInFlightRef.current) {
      return
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail === '') {
      setStatus('invalid')
      return
    }

    isRequestInFlightRef.current = true
    setStatus('submitting')
    // requestResume never rejects, so this chain always ends by clearing the flag.
    void requestResume(trimmedEmail).then((outcome) => {
      isRequestInFlightRef.current = false
      setStatus(outcome)
    })
  }, [])

  return { status, submitEmail }
}
