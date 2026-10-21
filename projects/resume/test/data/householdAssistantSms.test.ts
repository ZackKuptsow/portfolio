import { describe, expect, it } from 'vitest'

import * as householdAssistantSms from '@/data/householdAssistantSms'
import { CONTACT_EMAIL } from '@/data/identity'

// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/
// GSM-7's basic set, the alphabet a text is sent in at 160 characters a segment. One
// character outside it sends the whole message in UCS-2, at 70 a segment.
const GSM_7_BASIC_CHARACTERS = new Set(
  '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡' +
    'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà',
)
const SINGLE_SEGMENT_MAX_LENGTH = 160

const {
  SMS_BRAND_NAME,
  SMS_HELP_MESSAGE,
  SMS_OPT_IN_KEYWORD,
  SMS_OPT_IN_MESSAGE,
  SMS_OPT_OUT_MESSAGE,
} = householdAssistantSms

const TWILIO_MESSAGES = {
  help: SMS_HELP_MESSAGE,
  optIn: SMS_OPT_IN_MESSAGE,
  optOut: SMS_OPT_OUT_MESSAGE,
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectStrings)
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).flatMap(collectStrings)
  }
  return []
}

describe('the household assistant text', () => {
  it('has no em or en dashes in any string a visitor sees', () => {
    const visibleStrings = collectStrings({ ...householdAssistantSms })

    // Anchors the check: an empty list would pass it unexamined.
    expect(visibleStrings).toHaveLength(18)
    expect(visibleStrings.filter((text) => EM_OR_EN_DASH.test(text))).toEqual([])
  })

  it('names the brand as the portfolio names the person', () => {
    expect(SMS_BRAND_NAME).toBe('Zack Kuptsow')
  })
})

describe('the messages Twilio sends', () => {
  it.each(Object.entries(TWILIO_MESSAGES))(
    'sends the %s message as one GSM-7 segment',
    (_messageName, message) => {
      const charactersOutsideGsm7 = [...message].filter(
        (character) => !GSM_7_BASIC_CHARACTERS.has(character),
      )

      expect(charactersOutsideGsm7).toEqual([])
      expect(message.length).toBeLessThanOrEqual(SINGLE_SEGMENT_MAX_LENGTH)
    },
  )

  it.each(Object.entries(TWILIO_MESSAGES))(
    'begins the %s message with the brand',
    (_name, message) => {
      expect(message.startsWith(SMS_BRAND_NAME)).toBe(true)
    },
  )

  // Twilio error 30896: "The opt_in_message includes the brand name, confirmation of
  // enrollment, message frequency, and opt-out instructions."
  it('confirms the enrollment with the frequency, the rates, HELP and STOP', () => {
    expect(SMS_OPT_IN_MESSAGE).toContain('enrolled in recurring texts')
    expect(SMS_OPT_IN_MESSAGE).toContain('frequency varies')
    expect(SMS_OPT_IN_MESSAGE).toContain('rates may apply')
    expect(SMS_OPT_IN_MESSAGE).toContain('HELP')
    expect(SMS_OPT_IN_MESSAGE).toContain('STOP')
  })

  it('gives a person to reach and the way out in the help message', () => {
    expect(SMS_HELP_MESSAGE).toContain(CONTACT_EMAIL)
    expect(SMS_HELP_MESSAGE).toContain('STOP')
  })

  it('confirms the opt-out and names the keyword that rejoins', () => {
    expect(SMS_OPT_OUT_MESSAGE).toContain('no more messages')
    expect(SMS_OPT_OUT_MESSAGE).toContain(`Reply ${SMS_OPT_IN_KEYWORD} to rejoin`)
  })
})
