import { CONTACT_EMAIL, PERSON_HANDLE, PROFILE_LINKS } from '@/data/identity'
import { PROJECTS_PAGE_PATH } from '@/data/projects'

import { BUILT_WITH_LINE } from '../constants'

import type { MouseEvent, ReactNode } from 'react'

type FooterLinkProps = {
  children: ReactNode
  href: string
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  /** The profile links leave the site, so they open a new tab. */
  opensNewTab?: boolean
}

function FooterLink({ children, href, onClick, opensNewTab = false }: FooterLinkProps) {
  return (
    <a
      className="terminal-footer-link"
      href={href}
      onClick={onClick}
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
  /** Without a script the link simply opens the projects page. With one it may do better. */
  onProjectsClick?: (event: MouseEvent<HTMLAnchorElement>) => void
}

/** Pinned under the prompt: the links, then the built-with line and copyright where they fit. */
export function TerminalFooter({ onProjectsClick }: TerminalFooterProps) {
  return (
    <footer className="terminal-footer">
      <div className="terminal-footer-links">
        <FooterLink href={PROFILE_LINKS.linkedIn} opensNewTab>
          LinkedIn
        </FooterLink>
        <FooterLink href={PROFILE_LINKS.gitHub} opensNewTab>
          GitHub
        </FooterLink>
        <FooterLink href={`mailto:${CONTACT_EMAIL}`}>Email</FooterLink>
        {/* Same site, so it opens in this tab, with the `.html` the bucket serves. */}
        <FooterLink href={PROJECTS_PAGE_PATH} onClick={onProjectsClick}>
          Projects
        </FooterLink>
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
