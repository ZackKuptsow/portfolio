import type { ResumeRequestStatus } from './types'

/** Decorative command text before the email field. It is hidden from screen readers. */
export const COMMAND_PREFIX = 'mail --to'

/** Accessible name of the email field. The field has no visible label. */
export const EMAIL_INPUT_LABEL = 'Your email address'

export const EMAIL_INPUT_PLACEHOLDER = 'you@company.com'

/** Visible line under the section heading. */
export const EMAIL_SECTION_HINT = 'have it emailed to you'

/**
 * The send_resume intake endpoint, which is the `ResumeRequestApiUrl` output of
 * SendResumeStack. Next inlines it at build time, and next.config.ts fails the
 * build when it is missing or malformed. Read it only in this literal form,
 * because Next does not inline `process.env` accessed any other way.
 */
export const RESUME_REQUEST_API_URL = process.env.NEXT_PUBLIC_RESUME_REQUEST_API_URL

/**
 * How long a request may take before the visitor is sent to the download. The
 * intake Lambda gives up after 10 s, so a request still open at 15 s is stuck
 * on the network, and "One moment" would otherwise stay on screen indefinitely.
 */
export const RESUME_REQUEST_TIMEOUT_MILLISECONDS = 15_000

export const SEND_BUTTON_TEXT = 'send'

/**
 * What the status region says in each state. The copy was approved by Zack,
 * with no em or en dashes. `submitting` gets animated dots from CSS.
 */
export const STATUS_MESSAGE: Record<ResumeRequestStatus, string> = {
  idle: '',
  invalid:
    "That email address doesn't look right. Check it and try again, or use the download button.",
  limited:
    'This address or network already requested the resume today. Check your inbox, or try again tomorrow. The download button works any time.',
  'network-error': "Couldn't reach the server. Try again in a moment, or use the download button.",
  'server-error': 'Something went wrong on my end. Please use the download button instead.',
  submitting: 'One moment',
  success:
    'Got it. Look for an email from resume@kups.me titled "Zack Kuptsow Resume". It can take a minute, and it may land in spam.',
}

/** Text color per state: red for errors, muted for waiting and limits, plain for success. */
export const STATUS_TEXT_CLASS_NAME: Record<ResumeRequestStatus, string> = {
  idle: '',
  invalid: 'text-error-text',
  limited: 'text-muted-foreground',
  'network-error': 'text-error-text',
  'server-error': 'text-error-text',
  submitting: 'text-muted-foreground',
  success: 'text-foreground',
}
