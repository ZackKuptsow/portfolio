import { buildSmsProgramPageMetadata } from '@/components/SmsProgram/buildSmsProgramPageMetadata'
import ProgramSection from '@/components/SmsProgram/ProgramSection'
import SmsProgramPage from '@/components/SmsProgram/SmsProgramPage'
import {
  SMS_BRAND_NAME,
  SMS_HELP_MESSAGE,
  SMS_MESSAGE_FREQUENCY,
  SMS_MESSAGE_KINDS_PHRASE,
  SMS_OPT_IN_KEYWORD,
  SMS_OPT_IN_MESSAGE,
  SMS_OPT_OUT_MESSAGE,
  SMS_PAGE_PATHS,
  SMS_PROGRAM_NAME,
  SMS_RATES_DISCLOSURE,
} from '@/data/householdAssistantSms'

import type { Metadata } from 'next'

const PAGE_TITLE = `Text ${SMS_OPT_IN_KEYWORD} to sign up`

export const metadata: Metadata = buildSmsProgramPageMetadata({
  description: `How the two members of one household sign up for ${SMS_PROGRAM_NAME} by text.`,
  path: SMS_PAGE_PATHS.signUp,
  title: PAGE_TITLE,
})

/** The texts a member sends and the replies they get back, in the order they happen. */
const EXCHANGE = [
  { sender: 'You', text: SMS_OPT_IN_KEYWORD },
  { sender: 'Assistant', text: SMS_OPT_IN_MESSAGE },
  { sender: 'You', text: 'HELP' },
  { sender: 'Assistant', text: SMS_HELP_MESSAGE },
  { sender: 'You', text: 'STOP' },
  { sender: 'Assistant', text: SMS_OPT_OUT_MESSAGE },
] as const

/**
 * The opt-in proof the campaign links: how a member is invited, the consent text beside the
 * call to action, and the exact messages exchanged.
 */
export default function SmsSignUpPage() {
  return (
    <SmsProgramPage title={PAGE_TITLE}>
      <ProgramSection title="Who it is for">
        <p>
          {SMS_PROGRAM_NAME} is a private assistant for the two adults of one household. They text
          it to keep a shared shopping list, keep to-dos, read the day&apos;s calendar and set
          reminders. It serves only the two phone numbers of the household and is not offered to the
          public.
        </p>
        <p>
          {SMS_BRAND_NAME} runs it. He shows this page to the other member of the household in
          person and gives them the assistant&apos;s number before they join.
        </p>
      </ProgramSection>

      <ProgramSection title="How to sign up">
        {/* One box, so the consent text sits at the call to action, as carriers require. */}
        <div
          aria-label="Sign up by text"
          className="border border-primary/40 rounded-md p-6 space-y-4 bg-card/30"
          role="group"
        >
          <p className="font-mono text-lg text-primary">
            Text {SMS_OPT_IN_KEYWORD} to the household assistant&apos;s number from your own phone.
          </p>
          <p>
            By texting {SMS_OPT_IN_KEYWORD}, you agree to receive recurring text messages from{' '}
            {SMS_PROGRAM_NAME}: {SMS_MESSAGE_KINDS_PHRASE}. {SMS_MESSAGE_FREQUENCY}{' '}
            {SMS_RATES_DISCLOSURE} Reply HELP for help and STOP to cancel at any time. Signing up is
            optional. See the <a href={SMS_PAGE_PATHS.privacy}>Privacy Policy</a> and the{' '}
            <a href={SMS_PAGE_PATHS.terms}>Terms &amp; Conditions</a>.
          </p>
        </div>
        <p>
          The date and time of your {SMS_OPT_IN_KEYWORD} text are kept as the record of your
          consent. Reminders, summaries and sign-in codes are sent only after it.
        </p>
      </ProgramSection>

      <ProgramSection title="The messages, word for word">
        <ol className="space-y-3 font-mono text-sm">
          {EXCHANGE.map((exchangedMessage) => (
            <li key={exchangedMessage.text}>
              <span className="text-muted-foreground">{exchangedMessage.sender}:</span>{' '}
              {exchangedMessage.text}
            </li>
          ))}
        </ol>
        <p>After STOP, nothing more is sent until you text {SMS_OPT_IN_KEYWORD} again.</p>
      </ProgramSection>
    </SmsProgramPage>
  )
}
