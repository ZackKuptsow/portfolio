import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import PrivacyPolicyPage from '@/app/privacy/page'
import SmsSignUpPage from '@/app/sms/page'
import TermsPage from '@/app/terms/page'
import {
  SMS_BRAND_NAME,
  SMS_HELP_MESSAGE,
  SMS_MESSAGE_KINDS,
  SMS_NON_SHARING_STATEMENT,
  SMS_OPT_IN_KEYWORD,
  SMS_OPT_IN_MESSAGE,
  SMS_OPT_OUT_MESSAGE,
  SMS_PAGE_PATHS,
} from '@/data/householdAssistantSms'

// No em or en dash in anything a visitor reads. See "Content" in the README.
const EM_OR_EN_DASH = /[–—]/
const RATES_DISCLOSURE = /message and data rates may apply/i

const PAGES = {
  privacy: PrivacyPolicyPage,
  signUp: SmsSignUpPage,
  terms: TermsPage,
}

/** All text on the page, as a reviewer reads it. */
function pageText(): string {
  return document.body.textContent ?? ''
}

function linkTargets(): string[] {
  return screen.getAllByRole('link').map((link) => link.getAttribute('href') ?? '')
}

describe.each(Object.entries(PAGES))('the %s page', (_pageName, Page) => {
  it('has one main heading', () => {
    render(<Page />)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  // Twilio's form: each page must mention the registered brand name.
  it('names the brand and discloses the rates', () => {
    render(<Page />)

    expect(pageText()).toContain(SMS_BRAND_NAME)
    expect(pageText()).toMatch(RATES_DISCLOSURE)
  })

  it('links the other two pages', () => {
    render(<Page />)

    expect(linkTargets()).toEqual(expect.arrayContaining(Object.values(SMS_PAGE_PATHS)))
  })

  it('has no em or en dashes', () => {
    render(<Page />)

    expect(pageText().match(EM_OR_EN_DASH)).toBeNull()
  })
})

describe('the privacy policy', () => {
  it('is titled as Twilio asks', () => {
    render(<PrivacyPolicyPage />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Privacy Policy')
  })

  // Twilio's form asks for this statement; error 30932 rejects a policy without it.
  it('carries the non-sharing statement word for word', () => {
    render(<PrivacyPolicyPage />)

    expect(pageText()).toContain(SMS_NON_SHARING_STATEMENT)
    expect(pageText()).toContain('not shared with third parties or affiliates for marketing')
  })

  // Twilio error 30896: a policy missing the frequency is rejected.
  it('states the message frequency', () => {
    render(<PrivacyPolicyPage />)

    expect(pageText()).toContain('Message frequency varies.')
  })
})

describe('the terms', () => {
  it('is titled as Twilio asks and has an SMS Terms section', () => {
    render(<TermsPage />)

    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Terms & Conditions')
    expect(screen.getByRole('heading', { level: 2, name: 'SMS Terms' })).toBeTruthy()
  })

  it('lists every kind of message and the way out', () => {
    render(<TermsPage />)

    expect(SMS_MESSAGE_KINDS.filter((messageKind) => !pageText().includes(messageKind))).toEqual([])
    expect(pageText()).toContain('Text STOP at any time')
  })
})

describe('the sign-up page', () => {
  // Twilio error 30924: the consent text sits at the call to action and names the kinds of
  // message, the frequency, the rates and how to stop.
  it('puts the full consent text beside the call to action', () => {
    render(<SmsSignUpPage />)

    const consentText = screen.getByRole('group', { name: 'Sign up by text' }).textContent ?? ''

    expect(consentText).toContain(`Text ${SMS_OPT_IN_KEYWORD} to the household assistant's number`)
    expect(consentText).toContain(`By texting ${SMS_OPT_IN_KEYWORD}, you agree`)
    expect(SMS_MESSAGE_KINDS.filter((messageKind) => !consentText.includes(messageKind))).toEqual(
      [],
    )
    expect(consentText).toContain('Message frequency varies.')
    expect(consentText).toMatch(RATES_DISCLOSURE)
    expect(consentText).toContain('STOP to cancel')
  })

  // Twilio's form: "include the exact messages sent back and forth".
  it('shows the keyword, HELP and STOP each answered word for word', () => {
    render(<SmsSignUpPage />)

    const exchangedMessages = screen.getAllByRole('listitem').map((item) => item.textContent)

    expect(exchangedMessages).toEqual(
      expect.arrayContaining([
        `You: ${SMS_OPT_IN_KEYWORD}`,
        `Assistant: ${SMS_OPT_IN_MESSAGE}`,
        'You: HELP',
        `Assistant: ${SMS_HELP_MESSAGE}`,
        'You: STOP',
        `Assistant: ${SMS_OPT_OUT_MESSAGE}`,
      ]),
    )
  })
})
