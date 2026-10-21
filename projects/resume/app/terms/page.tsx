import { buildSmsProgramPageMetadata } from '@/components/SmsProgram/buildSmsProgramPageMetadata'
import ProgramSection from '@/components/SmsProgram/ProgramSection'
import SmsProgramPage from '@/components/SmsProgram/SmsProgramPage'
import {
  SMS_MESSAGE_FREQUENCY,
  SMS_MESSAGE_KINDS_PHRASE,
  SMS_OPT_IN_KEYWORD,
  SMS_PAGE_PATHS,
  SMS_POLICY_LAST_UPDATED,
  SMS_PROGRAM_NAME,
  SMS_RATES_DISCLOSURE,
} from '@/data/householdAssistantSms'
import { CONTACT_EMAIL } from '@/data/identity'

import type { Metadata } from 'next'

/** Twilio's form asks for a page titled "Terms & Conditions" or "Terms of Service". */
const PAGE_TITLE = 'Terms & Conditions'

export const metadata: Metadata = buildSmsProgramPageMetadata({
  description: `The terms of ${SMS_PROGRAM_NAME}'s text messages.`,
  path: SMS_PAGE_PATHS.terms,
  title: PAGE_TITLE,
})

/** The terms the campaign links, with the SMS Terms its reviewers look for. */
export default function TermsPage() {
  return (
    <SmsProgramPage lastUpdated={SMS_POLICY_LAST_UPDATED} title={PAGE_TITLE}>
      <ProgramSection title="What these cover">
        <p>
          These terms cover {SMS_PROGRAM_NAME}, a private text-message assistant for the two adults
          of one household. By texting {SMS_OPT_IN_KEYWORD} to its number you agree to them.
        </p>
      </ProgramSection>

      <ProgramSection title="SMS Terms">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            {SMS_PROGRAM_NAME} sends {SMS_MESSAGE_KINDS_PHRASE}.
          </li>
          <li>
            You join by texting {SMS_OPT_IN_KEYWORD} to the assistant&apos;s number from your own
            phone, after being invited in person, as the{' '}
            <a href={SMS_PAGE_PATHS.signUp}>sign-up page</a> shows. Joining is optional.
          </li>
          <li>{SMS_MESSAGE_FREQUENCY}</li>
          <li>{SMS_RATES_DISCLOSURE}</li>
          <li>
            Text STOP at any time to stop all messages. You get one message confirming it and
            nothing after. Text {SMS_OPT_IN_KEYWORD} to join again.
          </li>
          <li>
            Text HELP for help, or write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </li>
          <li>Carriers are not liable for delayed or undelivered messages.</li>
          <li>
            How your information is handled is in the{' '}
            <a href={SMS_PAGE_PATHS.privacy}>Privacy Policy</a>.
          </li>
        </ul>
      </ProgramSection>

      <ProgramSection title="Use">
        <p>
          The assistant is provided as is, for the household&apos;s own use, free of charge and with
          no promise that a message arrives on time.
        </p>
      </ProgramSection>

      <ProgramSection title="Contact and changes">
        <p>
          Questions go to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A change to these
          terms is posted on this page with a new date.
        </p>
      </ProgramSection>
    </SmsProgramPage>
  )
}
