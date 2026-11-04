'use client'

import Link from 'next/link'

import { GetResume } from '@/components/GetResume'

import {
  AboutScene,
  EducationScene,
  HeroScene,
  ProjectsScene,
  ResumeScene,
  SkillsScene,
  WorkScene,
} from './components/scenes'
import { TerminalFooter } from './components/TerminalFooter'
import { TitleBar } from './components/TitleBar'
import { INITIAL_PATH } from './constants'

import type { SectionId } from './types'

type TerminalProps = {
  /** Where the terminal opens. `/projects.html` opens at Projects, and every other page at the hero. */
  startSectionId: Extract<SectionId, 'hero' | 'projects'>
}

/**
 * The home page and the projects page: every section as plain output, in one reading column.
 * This is what a visitor without a script reads, so it holds all the words.
 *
 * `/projects.html` is a separate indexed page, with its own title and `h1`, so its server HTML
 * holds only the Projects section: the resume text has one home, the home page.
 */
export function Terminal({ startSectionId }: TerminalProps) {
  const isProjectsPage = startSectionId === 'projects'

  return (
    <div className="terminal-root custom-gradient" data-start-section={startSectionId}>
      <TitleBar path={INITIAL_PATH} />
      <main className="terminal-scroller">
        {/* The only way home that works without a script. */}
        {isProjectsPage && (
          <nav aria-label="Back" className="terminal-back-link">
            <Link href="/">
              <span aria-hidden="true">← </span>
              kups.me
            </Link>
          </nav>
        )}
        {!isProjectsPage && (
          <>
            <HeroScene isPageHeading />
            <AboutScene />
            <WorkScene />
            <EducationScene />
            <SkillsScene />
            <ResumeScene trigger={<GetResume />} />
          </>
        )}
        <ProjectsScene isPageHeading={isProjectsPage} />
      </main>
      <TerminalFooter />
    </div>
  )
}
