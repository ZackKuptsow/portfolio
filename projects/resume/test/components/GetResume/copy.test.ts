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
  CLOSE_BUTTON_LABEL,
  CLOSE_BUTTON_TEXT,
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TRIGGER_COMMAND,
} from '@/components/GetResume/constants'

// Writing Voice hard rule for anything a visitor reads.
const EM_OR_EN_DASH = /[–—]/
// 7 strings in GetResume/constants.ts and 12 in EmailOption/constants.ts.
const VISIBLE_STRING_COUNT = 19

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
    ]

    // Assert the exact count, so an empty or shortened list cannot pass unexamined.
    expect(visibleStrings).toHaveLength(VISIBLE_STRING_COUNT)
    expect(visibleStrings.filter((text) => EM_OR_EN_DASH.test(text))).toEqual([])
  })
})
