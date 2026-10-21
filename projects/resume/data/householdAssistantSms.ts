import { CONTACT_EMAIL, PERSON_NAME } from '@/data/identity'

/**
 * The household assistant's text messages: a private assistant the two adults of one
 * household text, sent under a Twilio A2P 10DLC Sole Proprietor campaign. The campaign's
 * registration links the three pages built from this file. The sign-up page is its opt-in
 * proof, and the other two are its privacy policy and its terms.
 *
 * The three messages below are the ones configured in Twilio, word for word, so the page a
 * reviewer reads and the phone a member holds show the same text. Change Twilio first.
 */

/** The brand as registered with Twilio. A Sole Proprietor brand is the person's own name. */
export const SMS_BRAND_NAME = PERSON_NAME

/** What every page and every message calls the assistant. Each begins with the brand. */
export const SMS_PROGRAM_NAME = `${SMS_BRAND_NAME}'s household assistant`

/** The word a member texts to join. Twilio answers it with the opt-in message. */
export const SMS_OPT_IN_KEYWORD = 'OTIS'

/** Where each page is served. The export writes `privacy.html`, and CloudFront serves files as named. */
export const SMS_PAGE_PATHS = {
  privacy: '/privacy.html',
  signUp: '/sms.html',
  terms: '/terms.html',
} as const

/** Shown at the top of the privacy policy and the terms. */
export const SMS_POLICY_LAST_UPDATED = 'October 20, 2026'

/** Every kind of message the assistant sends, as the consent text and the terms list them. */
export const SMS_MESSAGE_KINDS = [
  'replies to the texts you send it',
  'reminders you or the other member of the household set for you',
  'one summary of your day each morning if you turn it on',
  'a one-time code when you sign in to the household app',
] as const

/** The kinds as one phrase, for the sentences that list them. */
export const SMS_MESSAGE_KINDS_PHRASE = `${SMS_MESSAGE_KINDS.slice(0, -1).join(', ')}, and ${SMS_MESSAGE_KINDS.at(-1)}`

/** The frequency as the consent text, the privacy policy and the terms state it. */
export const SMS_MESSAGE_FREQUENCY = 'Message frequency varies.'

/** The rates disclosure every page carries, in the words Twilio's form quotes. */
export const SMS_RATES_DISCLOSURE = 'Message and data rates may apply.'

/** The statement Twilio's form asks the privacy policy to carry, as the form words it. */
export const SMS_NON_SHARING_STATEMENT =
  'We do not sell or share your SMS opt-in data or personal information with third parties for marketing purposes.'

/** Twilio's reply to the keyword: the brand, the enrollment, the frequency, the rates, HELP and STOP. */
export const SMS_OPT_IN_MESSAGE = `${SMS_PROGRAM_NAME}: you're enrolled in recurring texts. Msg frequency varies. Msg&data rates may apply. Reply HELP for help, STOP to opt out.`

/** Twilio's reply to HELP: the brand and a way to reach a person. */
export const SMS_HELP_MESSAGE = `${SMS_PROGRAM_NAME}. Help: ${CONTACT_EMAIL}. Msg&data rates may apply. Reply STOP to opt out.`

/** Twilio's reply to STOP, the last message a member gets until they text the keyword again. */
export const SMS_OPT_OUT_MESSAGE = `${SMS_PROGRAM_NAME}: you are opted out and will get no more messages. Reply ${SMS_OPT_IN_KEYWORD} to rejoin.`
