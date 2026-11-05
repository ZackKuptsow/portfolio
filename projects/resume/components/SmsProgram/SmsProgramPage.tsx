import Link from 'next/link'

import ThemeToggle from '@/components/ThemeToggle'
import { SMS_PAGE_PATHS, SMS_PROGRAM_NAME } from '@/data/householdAssistantSms'

interface SmsProgramPageProps {
  children: React.ReactNode
  /** The date the page's text last changed, shown under the heading. */
  lastUpdated?: string
  /** The page's one main heading. Twilio's reviewers look for "Privacy Policy" and "Terms & Conditions". */
  title: string
}

const PAGE_LINKS = [
  { href: SMS_PAGE_PATHS.signUp, label: 'Sign up' },
  { href: SMS_PAGE_PATHS.privacy, label: 'Privacy Policy' },
  { href: SMS_PAGE_PATHS.terms, label: 'Terms & Conditions' },
] as const

/** A 44 by 44 target around the words. */
const PAGE_LINK_CLASS_NAME =
  'inline-flex min-h-11 min-w-11 items-center text-muted-foreground hover:text-primary'

/**
 * The frame of the household assistant's three pages: the program's name, the heading, the
 * text, and links between the three. Plain reading text, since a reviewer reads every word.
 */
export default function SmsProgramPage({ children, lastUpdated, title }: SmsProgramPageProps) {
  return (
    <div className="custom-gradient flex min-h-screen flex-col font-sans">
      <ThemeToggle />
      {/* A long word breaks at a large text size, rather than run off the screen. */}
      <main className="w-full max-w-3xl mx-auto flex-1 px-8 py-20 sm:px-12 [overflow-wrap:anywhere]">
        <div aria-hidden="true" className="font-mono text-sm text-muted-foreground mb-2">
          <span className="command-prompt">$</span> cat ./household-assistant
        </div>
        <p className="font-mono text-sm text-primary mb-4">{SMS_PROGRAM_NAME}</p>
        <h1 className="text-foreground font-mono text-2xl sm:text-3xl font-bold mb-2">{title}</h1>
        {lastUpdated && (
          <p className="text-sm text-muted-foreground mb-10">Last updated {lastUpdated}</p>
        )}
        <div className="space-y-10 text-foreground leading-relaxed">{children}</div>
      </main>

      <footer className="border-t border-border/30 bg-card/30 px-8 py-8 sm:px-12">
        <nav aria-label="Household assistant pages">
          <ul className="flex flex-col flex-wrap sm:flex-row gap-x-10 font-mono text-sm">
            {PAGE_LINKS.map((pageLink) => (
              <li key={pageLink.href}>
                <a className={PAGE_LINK_CLASS_NAME} href={pageLink.href}>
                  {pageLink.label}
                </a>
              </li>
            ))}
            <li>
              <Link className={PAGE_LINK_CLASS_NAME} href="/">
                kups.me
              </Link>
            </li>
          </ul>
        </nav>
      </footer>
    </div>
  )
}
