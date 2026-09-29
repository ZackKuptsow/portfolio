'use client'

import { useEffect, useId, useRef, useState } from 'react'

import {
  COMMAND_PREFIX,
  EMAIL_INPUT_LABEL,
  EMAIL_INPUT_PLACEHOLDER,
  EMAIL_SECTION_HINT,
  SEND_BUTTON_TEXT,
  STATUS_MESSAGE,
  STATUS_TEXT_CLASS_NAME,
} from './constants'
import { useResumeRequest } from './hooks'

import type { FormEvent } from 'react'

/**
 * The email delivery option: one address field that asks the send_resume API
 * to email the PDF, and a status line that reports how the request went.
 *
 * The status line is a live region that stays mounted outside the form, so it
 * still announces the result after a success removes the form.
 */
export function EmailOption() {
  const inputId = useId()
  const statusId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const statusRef = useRef<HTMLParagraphElement>(null)
  const [email, setEmail] = useState('')
  const { status, submitEmail } = useResumeRequest()

  const isInvalid = status === 'invalid'
  const isSubmitting = status === 'submitting'
  const isSuccess = status === 'success'

  // Move focus to where the visitor needs it next: back to the field to fix
  // the address, or onto the message once the form it was in is gone.
  useEffect(() => {
    if (status === 'invalid') {
      inputRef.current?.focus()
    }
    if (status === 'success') {
      statusRef.current?.focus()
    }
  }, [status])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitEmail(email)
  }

  return (
    <div>
      <p className="mb-2 font-mono text-xs text-muted-foreground">{EMAIL_SECTION_HINT}</p>

      {!isSuccess && (
        <form
          noValidate
          onSubmit={handleSubmit}
          // The `!` is needed: globals.css sets `* { border-color }` outside any
          // cascade layer, which beats Tailwind's layered border utilities.
          className={`flex items-center gap-2 rounded border bg-muted px-3 py-2 font-mono text-sm ${
            isInvalid ? 'border-error-text!' : 'border-border'
          }`}
        >
          <span aria-hidden="true" className="flex shrink-0 items-center gap-2">
            <span className="command-prompt">$</span>
            <span className="text-muted-foreground">{COMMAND_PREFIX}</span>
          </span>
          <label htmlFor={inputId} className="sr-only">
            {EMAIL_INPUT_LABEL}
          </label>
          <input
            ref={inputRef}
            id={inputId}
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder={EMAIL_INPUT_PLACEHOLDER}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            readOnly={isSubmitting}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? statusId : undefined}
            className="min-w-0 flex-1 bg-transparent text-foreground caret-primary
                       placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            aria-disabled={isSubmitting}
            className="shrink-0 cursor-pointer rounded border border-primary! px-2 py-0.5 text-primary
                       transition-colors hover:bg-primary hover:text-background
                       aria-disabled:cursor-wait aria-disabled:opacity-50"
          >
            {SEND_BUTTON_TEXT} <span aria-hidden="true">⏎</span>
          </button>
        </form>
      )}

      <p
        ref={statusRef}
        id={statusId}
        role="status"
        tabIndex={-1}
        className={`mt-2 font-mono text-xs ${STATUS_TEXT_CLASS_NAME[status]}`}
      >
        {STATUS_MESSAGE[status]}
        {isSubmitting && <span aria-hidden="true" className="loading-dots" />}
      </p>
    </div>
  )
}
