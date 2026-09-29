'use client'

import { CONTACT_EMAIL, PERSON_HANDLE, PROFILE_LINKS } from '@/data/identity'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="px-6 py-8">
        {/* Terminal-style footer header */}
        <div aria-hidden="true" className="font-mono text-xs text-muted-foreground mb-6">
          <span className="command-prompt">$</span> ls -la ./contact/
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary
                         transition-colors duration-200 font-mono text-sm"
              href={PROFILE_LINKS.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true" className="text-primary/40 group-hover:text-primary/80">
                →
              </span>
              LinkedIn
            </a>
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary
                         transition-colors duration-200 font-mono text-sm"
              href={PROFILE_LINKS.gitHub}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span aria-hidden="true" className="text-primary/40 group-hover:text-primary/80">
                →
              </span>
              GitHub
            </a>
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary
                         transition-colors duration-200 font-mono text-sm"
              href={`mailto:${CONTACT_EMAIL}`}
            >
              <span aria-hidden="true" className="text-primary/40 group-hover:text-primary/80">
                →
              </span>
              Email
            </a>
            <span
              className="flex items-center gap-3 text-muted-foreground/70
                         font-mono text-sm cursor-not-allowed"
              aria-disabled="true"
            >
              <span aria-hidden="true" className="text-primary/30">
                →
              </span>
              Projects <span className="text-xs opacity-70">(coming soon)</span>
            </span>
          </div>

          {/* Copyright & Tech stack */}
          <div className="font-mono text-xs text-muted-foreground border-l-0 sm:border-l border-border/30 pl-0 sm:pl-6 text-left sm:text-right">
            <div className="mb-1">
              © {new Date().getFullYear()} {PERSON_HANDLE}
            </div>
            <div className="text-muted-foreground">
              <span aria-hidden="true" className="command-prompt">
                $
              </span>{' '}
              Built with Next.js, deployed via AWS CDK, automated through GitHub Actions
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
