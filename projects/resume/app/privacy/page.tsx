import { buildSmsProgramPageMetadata } from '@/components/SmsProgram/buildSmsProgramPageMetadata'
import ProgramSection from '@/components/SmsProgram/ProgramSection'
import SmsProgramPage from '@/components/SmsProgram/SmsProgramPage'
import {
  GOOGLE_USER_DATA_POLICY_URL,
  SMS_BRAND_NAME,
  SMS_MESSAGE_FREQUENCY,
  SMS_NON_SHARING_STATEMENT,
  SMS_OPT_IN_KEYWORD,
  SMS_PAGE_PATHS,
  SMS_PRIVACY_LAST_UPDATED,
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
    <SmsProgramPage lastUpdated={SMS_PRIVACY_LAST_UPDATED} title={PAGE_TITLE}>
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

      <ProgramSection title="Google data">
        <p>
          With the permission of the household&apos;s shared Google account, the assistant reads
          that account&apos;s Google Calendar to answer a question such as &quot;what is on
          today&quot;. It reads the events of the day asked about, at the time it is asked, and
          keeps no copy of them. The permission also allows adding events, which a later version may
          do when a member of the household asks it to.
        </p>
        <p>
          One time only, it copies the titles of the account&apos;s open Google Tasks to its own
          list of to-dos, under a separate permission that is withdrawn as soon as the copy is made.
          Their notes and due dates are not copied.
        </p>
        <p>
          The token Google issues for this access is kept encrypted in the Amazon Web Services
          account that {SMS_BRAND_NAME} controls, and is used for nothing else. Google data is never
          sold, used for advertising or used to train AI models, and is shared only as far as
          delivering a reply to the household&apos;s phones requires.
        </p>
        <p>
          The assistant&apos;s use and transfer of information received from Google APIs adheres to
          the <a href={GOOGLE_USER_DATA_POLICY_URL}>Google API Services User Data Policy</a>,
          including the Limited Use requirements. The permission can be withdrawn at any time from
          the Google Account&apos;s &quot;Third-party apps &amp; services&quot; page.
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
