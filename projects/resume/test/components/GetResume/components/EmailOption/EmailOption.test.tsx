import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EmailOption } from '@/components/GetResume/components/EmailOption'

import type { UserEvent } from '@testing-library/user-event'

const EMAIL_LABEL = 'Your email address'
const INVALID_MESSAGE =
  "That email address doesn't look right. Check it and try again, or use the download button."
const LIMITED_MESSAGE =
  'This address or network already requested the resume today. Check your inbox, or try again tomorrow. The download button works any time.'
const NETWORK_ERROR_MESSAGE =
  "Couldn't reach the server. Try again in a moment, or use the download button."
const SERVER_ERROR_MESSAGE =
  'Something went wrong on my end. Please use the download button instead.'
const SUCCESS_MESSAGE =
  'Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam.'

// A fetch whose response the test releases when it chooses, so the submitting
// state can be observed and more submits attempted while it lasts.
function stubPendingFetch() {
  let resolveLatestResponse: (response: Response) => void = () => undefined
  const fetchMock = vi.fn(
    () =>
      new Promise<Response>((resolve) => {
        resolveLatestResponse = resolve
      }),
  )
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, resolveLatest: (response: Response) => resolveLatestResponse(response) }
}

async function typeAndSend(user: UserEvent, email: string): Promise<void> {
  await user.type(screen.getByRole('textbox', { name: EMAIL_LABEL }), email)
  await user.click(screen.getByRole('button', { name: 'send' }))
}

describe('EmailOption', () => {
  it('labels the field and renders an empty status region before any submit', () => {
    render(<EmailOption />)
    const input = screen.getByRole('textbox', { name: EMAIL_LABEL })

    expect(input.getAttribute('type')).toBe('email')
    expect(input.getAttribute('autocomplete')).toBe('email')
    expect(screen.getByRole('status').textContent).toBe('')
  })

  it('shows the invalid message, sends nothing, and focuses the field when it is empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<EmailOption />)

    await user.click(screen.getByRole('button', { name: 'send' }))

    const input = screen.getByRole('textbox', { name: EMAIL_LABEL })
    expect(fetchMock).toHaveBeenCalledTimes(0)
    expect(screen.getByRole('status').textContent).toBe(INVALID_MESSAGE)
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(document.activeElement).toBe(input)
  })

  it('marks the field invalid on a 400, keeps the address, and returns focus to it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 400 })))
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'a@b')

    const status = await screen.findByText(INVALID_MESSAGE)
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    expect(input.value).toBe('a@b')
    expect(input.getAttribute('aria-invalid')).toBe('true')
    expect(input.getAttribute('aria-describedby')).toBe(status.id)
    expect(document.activeElement).toBe(input)
  })

  it('replaces the form with the success message on a 202 and moves focus to it', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }))
    vi.stubGlobal('fetch', fetchMock)
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    const status = await screen.findByText(SUCCESS_MESSAGE)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(document.activeElement).toBe(status)
  })

  it.each([
    ['a 429', () => Promise.resolve(new Response(null, { status: 429 })), LIMITED_MESSAGE],
    ['a 500', () => Promise.resolve(new Response(null, { status: 500 })), SERVER_ERROR_MESSAGE],
    ['a TypeError', () => Promise.reject(new TypeError('Failed to fetch')), NETWORK_ERROR_MESSAGE],
  ])('after %s, shows its message and keeps the form', async (_label, respond, message) => {
    vi.stubGlobal('fetch', vi.fn(respond))
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    await screen.findByText(message)
    expect(screen.getByRole('textbox', { name: EMAIL_LABEL })).not.toBeNull()
  })

  it('shows the waiting message while a request is in flight and ignores more submits', async () => {
    const { fetchMock, resolveLatest } = stubPendingFetch()
    const user = userEvent.setup()
    render(<EmailOption />)

    await typeAndSend(user, 'you@company.com')

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    const sendButton = screen.getByRole('button', { name: 'send' })
    expect(screen.getByRole('status').textContent).toBe('One moment')
    expect(sendButton.getAttribute('aria-disabled')).toBe('true')
    expect(input.readOnly).toBe(true)

    await user.click(sendButton)
    await user.click(sendButton)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveLatest(new Response(null, { status: 202 }))
    })
    await screen.findByText(SUCCESS_MESSAGE)
  })

  it('sends exactly one request when two submits land before React re-renders', () => {
    const { fetchMock } = stubPendingFetch()
    render(<EmailOption />)
    const input = screen.getByRole<HTMLInputElement>('textbox', { name: EMAIL_LABEL })
    fireEvent.change(input, { target: { value: 'you@company.com' } })
    const form = input.form
    if (!form) {
      throw new Error('The email field is not inside a form')
    }

    act(() => {
      form.requestSubmit()
      form.requestSubmit()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
