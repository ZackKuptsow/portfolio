'use client'

import { CONTACT_EMAIL, PERSON_HANDLE, PROFILE_LINKS } from '@/data/identity'
import { PROJECTS_PAGE_PATH } from '@/data/projects'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="px-6 py-8">
        {/* Terminal-style footer header */}
        <div aria-hidden="true" className="font-mono text-xs text-muted-foreground mb-6">
          <span className="command-prompt">$</span> ls -la ./contact/
        </div>

        {/* Side by side only from `md` up. The links and the copyright need about 750px
            between them, so at `sm` they made the page wider than the screen. */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
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
            {/* Same site, so it opens in this tab, with the `.html` the bucket serves. */}
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary
                         transition-colors duration-200 font-mono text-sm"
              href={PROJECTS_PAGE_PATH}
            >
              <span aria-hidden="true" className="text-primary/40 group-hover:text-primary/80">
                →
              </span>
              Projects
            </a>
          </div>

          {/* Copyright & Tech stack */}
          <div className="font-mono text-xs text-muted-foreground border-l-0 md:border-l border-border/30 pl-0 md:pl-6 text-left md:text-right">
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
