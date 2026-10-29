import { describe, expect, it } from 'vitest'

import {
  COMMAND_PREFIX,
  EMAIL_INPUT_LABEL,
  EMAIL_INPUT_PLACEHOLDER,
  EMAIL_SECTION_HINT,
  SEND_BUTTON_TEXT,
  STATUS_MESSAGE,
} from '@/components/GetResume/components/EmailOption/constants'
import {
  QR_CODE_ALT_TEXT,
  QR_CODE_HINT,
} from '@/components/GetResume/components/QrCodeOption/constants'
import {
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TRIGGER_COMMAND,
} from '@/components/GetResume/constants'
import { CLOSE_BUTTON_LABEL, CLOSE_BUTTON_TEXT } from '@/components/TerminalDialog/constants'

// Writing Voice hard rule for anything a visitor reads.
const EM_OR_EN_DASH = /[–—]/
// 6 strings in GetResume/constants.ts, 2 in TerminalDialog/constants.ts, 12 in
// EmailOption/constants.ts and 2 in QrCodeOption/constants.ts.
const VISIBLE_STRING_COUNT = 22

describe('visible copy', () => {
  it('has no em or en dashes in any string a visitor sees', () => {
    const visibleStrings = [
      CLOSE_BUTTON_LABEL,
      CLOSE_BUTTON_TEXT,
      DIALOG_HEADER_PATH,
      DIALOG_TITLE,
      TRIGGER_COMMAND,
      ...Object.values(SECTION_TITLE),
      COMMAND_PREFIX,
      EMAIL_INPUT_LABEL,
      EMAIL_INPUT_PLACEHOLDER,
      EMAIL_SECTION_HINT,
      SEND_BUTTON_TEXT,
      ...Object.values(STATUS_MESSAGE),
      QR_CODE_ALT_TEXT,
      QR_CODE_HINT,
    ]

    // Assert the exact count, so an empty or shortened list cannot pass unexamined.
    expect(visibleStrings).toHaveLength(VISIBLE_STRING_COUNT)
    expect(visibleStrings.filter((text) => EM_OR_EN_DASH.test(text))).toEqual([])
  })
})
