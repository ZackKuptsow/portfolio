import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { GetResume } from '@/components/GetResume'

import type { UserEvent } from '@testing-library/user-event'

const CLOSE_NAME = 'Close (esc)'
const DIALOG_NAME = 'Get the resume'
const TRIGGER_NAME = './get_resume.sh'

async function renderAndOpenDialog(user: UserEvent): Promise<HTMLElement> {
  render(<GetResume />)
  await user.click(screen.getByRole('button', { name: TRIGGER_NAME }))
  return screen.getByRole('dialog', { name: DIALOG_NAME })
}

describe('GetResume', () => {
  it('opens a dialog named "Get the resume" from the trigger', async () => {
    const user = userEvent.setup()
    render(<GetResume />)
    const trigger = screen.getByRole('button', { name: TRIGGER_NAME })

    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog')
    expect(screen.getByRole('dialog', { hidden: true }).hasAttribute('open')).toBe(false)

    await user.click(trigger)

    expect(screen.getByRole('dialog', { name: DIALOG_NAME }).hasAttribute('open')).toBe(true)
  })

  it('closes from the close button', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    await user.click(within(dialog).getByRole('button', { name: CLOSE_NAME }))

    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('closes on a click that starts and ends on the backdrop', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog, { detail: 1 })

    expect(dialog.hasAttribute('open')).toBe(false)
  })

  it('stays open on a click inside the window', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    await user.click(within(dialog).getByRole('heading', { name: DIALOG_NAME }))

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('stays open when a press inside the window is released on the backdrop', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    fireEvent.pointerDown(within(dialog).getByRole('heading', { name: DIALOG_NAME }))
    fireEvent.click(dialog, { detail: 1 })

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('stays open when the second click of a double-click on the trigger lands on the backdrop', () => {
    render(<GetResume />)
    fireEvent.click(screen.getByRole('button', { name: TRIGGER_NAME }), { detail: 1 })
    const dialog = screen.getByRole('dialog', { name: DIALOG_NAME })

    fireEvent.pointerDown(dialog)
    fireEvent.click(dialog, { detail: 2 })

    expect(dialog.hasAttribute('open')).toBe(true)
  })

  it('offers the PDF download inside the dialog', async () => {
    const user = userEvent.setup()
    const dialog = await renderAndOpenDialog(user)

    const downloadLink = within(dialog).getByRole('link', { name: /wget resume\.pdf/ })

    expect(downloadLink.getAttribute('href')).toBe('/Zachary_Kuptsow_Resume.pdf')
    expect(downloadLink.getAttribute('download')).toBe('Zachary_Kuptsow_Resume.pdf')
  })
})
