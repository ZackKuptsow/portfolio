import { CONTACT_EMAIL, PERSON_HANDLE, PROFILE_LINKS } from '@/data/identity'

import { BUILT_WITH_LINE } from '../constants'

import type { ReactNode, RefObject } from 'react'

type FooterLinkProps = {
  children: ReactNode
  href: string
  /** The profile links leave the site, so they open a new tab. */
  opensNewTab?: boolean
}

function FooterLink({ children, href, opensNewTab = false }: FooterLinkProps) {
  return (
    <a
      className="terminal-footer-link"
      href={href}
      rel={opensNewTab ? 'noopener noreferrer' : undefined}
      target={opensNewTab ? '_blank' : undefined}
    >
      <span aria-hidden="true" className="terminal-footer-arrow">
        →
      </span>
      {children}
    </a>
  )
}

type TerminalFooterProps = {
  footerRef: RefObject<HTMLElement | null>
}

/** Pinned under the prompt: the links, then the built-with line and copyright where they fit. */
export function TerminalFooter({ footerRef }: TerminalFooterProps) {
  return (
    <footer ref={footerRef} className="terminal-footer">
      <div className="terminal-footer-links">
        <FooterLink href={PROFILE_LINKS.linkedIn} opensNewTab>
          LinkedIn
        </FooterLink>
        <FooterLink href={PROFILE_LINKS.gitHub} opensNewTab>
          GitHub
        </FooterLink>
        <FooterLink href={`mailto:${CONTACT_EMAIL}`}>Email</FooterLink>
      </div>
      <div className="terminal-footer-about">
        <span className="terminal-built-with">{BUILT_WITH_LINE}</span>
        <span className="terminal-copyright">
          © {new Date().getFullYear()} {PERSON_HANDLE}
        </span>
      </div>
    </footer>
  )
}
