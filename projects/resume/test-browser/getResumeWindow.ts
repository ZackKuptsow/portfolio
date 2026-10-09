import { QR_CODE_ALT_TEXT } from '@/components/GetResume/components/QrCodeOption/constants'
import { CLOSE_BUTTON_LABEL, TRIGGER_COMMAND } from '@/components/GetResume/constants'

import type { Locator, Page } from '@playwright/test'

/** The parts of the get-resume window that the checks look at. */
export interface GetResumeWindow {
  closeButton: Locator
  qrCode: Locator
  /** The part that scrolls when the window is taller than the screen. */
  scrollArea: Locator
  trigger: Locator
}

/** Opens the get-resume window the way a visitor does, with a click on its button. */
export async function openGetResumeWindow(page: Page): Promise<GetResumeWindow> {
  const trigger = page.getByRole('button', { name: TRIGGER_COMMAND })
  await trigger.click()

  const dialog = page.getByRole('dialog')
  return {
    closeButton: dialog.getByRole('button', { name: CLOSE_BUTTON_LABEL }),
    qrCode: dialog.getByRole('img', { includeHidden: true, name: QR_CODE_ALT_TEXT }),
    scrollArea: dialog.locator('.terminal-window'),
    trigger,
  }
}
