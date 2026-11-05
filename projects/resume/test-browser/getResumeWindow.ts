import { expect } from '@playwright/test'

import { QR_CODE_ALT_TEXT } from '@/components/GetResume/components/QrCodeOption/constants'
import { TRIGGER_COMMAND } from '@/components/GetResume/constants'
import { CLOSE_BUTTON_LABEL } from '@/components/TerminalDialog/constants'

import { enterPlainView } from './terminal'

import type { Locator, Page } from '@playwright/test'

/** The parts of the get-resume window that the checks look at. */
export interface GetResumeWindow {
  closeButton: Locator
  qrCode: Locator
  /** The part that scrolls when the window is taller than the screen. */
  scrollArea: Locator
  trigger: Locator
}

/**
 * Opens the get-resume window from its button, which is the way in on the plain flow. The
 * terminal has no button: scrolling types the command, and `terminal.spec.ts` checks that route.
 */
export async function openGetResumeWindow(page: Page): Promise<GetResumeWindow> {
  await enterPlainView(page)
  const trigger = page.getByRole('button', { name: TRIGGER_COMMAND })
  const dialog = page.getByRole('dialog')
  await trigger.click()
  await expect(dialog).toBeVisible()

  return {
    closeButton: dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL }),
    qrCode: dialog.getByRole('img', { includeHidden: true, name: QR_CODE_ALT_TEXT }),
    scrollArea: dialog.locator('.terminal-window'),
    trigger,
  }
}
