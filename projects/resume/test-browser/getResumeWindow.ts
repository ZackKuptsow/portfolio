import { expect } from '@playwright/test'

import { QR_CODE_ALT_TEXT } from '@/components/GetResume/components/QrCodeOption/constants'
import { CLOSE_BUTTON_LABEL, TRIGGER_COMMAND } from '@/components/GetResume/constants'

import type { Locator, Page } from '@playwright/test'

// The window opens in the same instant as a click that lands, so this only has to outlast
// one repaint.
const OPENED_CHECK_MILLISECONDS = 1_000
const OPENING_LIMIT_MILLISECONDS = 10_000

/** The parts of the get-resume window that the checks look at. */
export interface GetResumeWindow {
  closeButton: Locator
  qrCode: Locator
  /** The part that scrolls when the window is taller than the screen. */
  scrollArea: Locator
  trigger: Locator
}

/**
 * Opens the get-resume window the way a visitor does, with a click on its button.
 *
 * The page can be read before its script has given the button something to do, and a click
 * in that gap does nothing. So the click is repeated until the window is open. Once it is
 * open, nothing clicks again.
 */
export async function openGetResumeWindow(page: Page): Promise<GetResumeWindow> {
  const trigger = page.getByRole('button', { name: TRIGGER_COMMAND })
  const dialog = page.getByRole('dialog')
  await expect(async () => {
    await trigger.click()
    await expect(dialog).toBeVisible({ timeout: OPENED_CHECK_MILLISECONDS })
  }).toPass({ timeout: OPENING_LIMIT_MILLISECONDS })

  return {
    closeButton: dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL }),
    qrCode: dialog.getByRole('img', { includeHidden: true, name: QR_CODE_ALT_TEXT }),
    scrollArea: dialog.locator('.terminal-window'),
    trigger,
  }
}
