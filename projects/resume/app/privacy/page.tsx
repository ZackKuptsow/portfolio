import { buildSmsProgramPageMetadata } from '@/components/SmsProgram/buildSmsProgramPageMetadata'
import ProgramSection from '@/components/SmsProgram/ProgramSection'
import SmsProgramPage from '@/components/SmsProgram/SmsProgramPage'
import {
  SMS_BRAND_NAME,
  SMS_MESSAGE_FREQUENCY,
  SMS_NON_SHARING_STATEMENT,
  SMS_OPT_IN_KEYWORD,
  SMS_PAGE_PATHS,
  SMS_POLICY_LAST_UPDATED,
  SMS_PROGRAM_DESCRIPTION,
  SMS_PROGRAM_NAME,
  SMS_RATES_DISCLOSURE,
} from '@/data/householdAssistantSms'
import { CONTACT_EMAIL } from '@/data/identity'

import type { Metadata } from 'next'

/** Twilio's form asks for a page titled exactly this. */
const PAGE_TITLE = 'Privacy Policy'

export const metadata: Metadata = buildSmsProgramPageMetadata({
  description: `What ${SMS_PROGRAM_NAME} collects, how it is used, and that it is never shared for marketing.`,
  path: SMS_PAGE_PATHS.privacy,
  title: PAGE_TITLE,
})

/** The privacy policy the campaign links. */
export default function PrivacyPolicyPage() {
  return (
    <SmsProgramPage lastUpdated={SMS_POLICY_LAST_UPDATED} title={PAGE_TITLE}>
      <ProgramSection title="What this covers">
        <p>
          This policy covers {SMS_PROGRAM_NAME}, {SMS_PROGRAM_DESCRIPTION}, and its{' '}
          <a href={SMS_PAGE_PATHS.signUp}>sign-up page</a>. {SMS_BRAND_NAME}, the brand its messages
          are registered under, runs it. It does not cover the rest of kups.me.
        </p>
      </ProgramSection>

      <ProgramSection title="What is collected">
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Your mobile number, so the assistant knows which member of the household is texting.
          </li>
          <li>
            The date and time you texted {SMS_OPT_IN_KEYWORD}, kept as the record of your consent.
          </li>
          <li>What you ask it to keep: shopping lists, to-dos, reminders and your settings.</li>
          <li>A count of the messages sent each month, to keep the cost under a fixed limit.</li>
        </ul>
      </ProgramSection>

      <ProgramSection title="How it is used">
        <p>
          Only to answer your texts, to send the reminders and the daily summary you asked for, and
          to send a one-time code when you sign in to the household app. The text of a message is
          read to answer it, and is neither stored nor logged.
        </p>
      </ProgramSection>

      <ProgramSection title="Who handles it">
        <p>
          Messages are carried by Twilio, the messaging provider, and handled by software in an
          Amazon Web Services account that {SMS_BRAND_NAME} controls. Each handles your information
          only to deliver and answer messages.
        </p>
      </ProgramSection>

      <ProgramSection title="Sharing">
        <p>{SMS_NON_SHARING_STATEMENT}</p>
        <p>
          Mobile numbers and opt-in data are not shared with third parties or affiliates for
          marketing or promotional purposes, and they are never sold, rented or transferred.
        </p>
      </ProgramSection>

      <ProgramSection title="Text messages">
        <p>
          {SMS_MESSAGE_FREQUENCY} You get a reply to each text you send, the reminders set for you,
          and at most one summary a day if you turn it on. {SMS_RATES_DISCLOSURE} Reply STOP to stop
          all messages and HELP for help.
        </p>
      </ProgramSection>

      <ProgramSection title="Keeping and deleting">
        <p>
          Your information is kept while you use the assistant. To have your number and everything
          kept for you deleted, write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </ProgramSection>

      <ProgramSection title="Contact and changes">
        <p>
          Questions go to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. A change to this
          policy is posted on this page with a new date.
        </p>
      </ProgramSection>
    </SmsProgramPage>
  )
}
