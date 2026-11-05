'use client'

import Link from 'next/link'
import { memo, useCallback, useEffect, useRef, useState } from 'react'

import { GetResume, GetResumeTrigger } from '@/components/GetResume'
import { useModalDialog } from '@/components/useModalDialog'

import { Prompt } from './components/Prompt'
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
import { TERMINAL_ON_CLASS } from './constants'
import { useTerminalEngine } from './hooks'

import type { SectionId } from './types'

type TerminalProps = {
  /** Where the terminal opens. `/projects.html` opens at Projects, and every other page at the hero. */
  startSectionId: Extract<SectionId, 'hero' | 'projects'>
}

type ScenesProps = {
  isProjectsPage: boolean
  onOpenResume: () => void
  /** Whether the sections other than the page's own are on the page yet. */
  showsEverySection: boolean
}

/**
 * The output. The engine styles these elements many times a second and React has no reason to
 * touch them again, so the location changing above does not render them.
 */
const Scenes = memo(function Scenes({
  isProjectsPage,
  onOpenResume,
  showsEverySection,
}: ScenesProps) {
  return (
    <>
      {showsEverySection && (
        <>
          <HeroScene isPageHeading={!isProjectsPage} />
          <AboutScene />
          <WorkScene />
          <EducationScene />
          <SkillsScene />
          <ResumeScene trigger={<GetResumeTrigger onOpen={onOpenResume} />} />
        </>
      )}
      <ProjectsScene isPageHeading={isProjectsPage} />
    </>
  )
})

/**
 * The home page and the projects page: every section as plain output in one reading column,
 * which is what a visitor without a script reads, and one stationary terminal on top of that for
 * everyone else. The window for the resume is mounted here, at the root, so it can open whichever
 * section is hidden.
 *
 * `/projects.html` is a separate indexed page, with its own title and `h1`, so its server HTML
 * holds only the Projects section. The rest arrives with the script, so the resume text has one
 * home for search engines: the home page.
 */
export function Terminal({ startSectionId }: TerminalProps) {
  const isProjectsPage = startSectionId === 'projects'
  const resumeControls = useModalDialog()
  const [hasMounted, setHasMounted] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const footerRef = useRef<HTMLElement>(null)
  const promptRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const typedRef = useRef<HTMLSpanElement>(null)

  const showsEverySection = !isProjectsPage || hasMounted

  const { handleResumeWindowClosed, isPlain, location, navigate, togglePlainView } =
    useTerminalEngine({
      isReadyToStart: hasMounted,
      onResumeWindowOpenRequest: resumeControls.open,
      refs: {
        footer: footerRef,
        prompt: promptRef,
        root: rootRef,
        scroller: scrollerRef,
        stage: stageRef,
        track: trackRef,
        typed: typedRef,
      },
      startSectionId,
    })

  useEffect(() => {
    setHasMounted(true)
  }, [])

  // A plain flow on the projects page gets every section above Projects, so it opens at Projects.
  useEffect(() => {
    const isPlainFlow = !document.documentElement.classList.contains(TERMINAL_ON_CLASS)
    if (hasMounted && isProjectsPage && isPlainFlow) {
      document.getElementById('terminal-section-projects')?.scrollIntoView()
    }
  }, [hasMounted, isProjectsPage])

  useEffect(() => {
    if (!isDrawerOpen) {
      return
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false)
        rootRef.current?.querySelector<HTMLElement>('.terminal-menu-button')?.focus()
      }
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [isDrawerOpen])

  const handleToggleDrawer = useCallback(() => setIsDrawerOpen((isOpen) => !isOpen), [])

  const handleTogglePlainView = useCallback(() => {
    setIsDrawerOpen(false)
    togglePlainView()
  }, [togglePlainView])

  const handleSelectSection = useCallback(
    (sectionId: SectionId) => {
      setIsDrawerOpen(false)
      scrollerRef.current?.focus({ preventScroll: true })
      navigate(sectionId)
    },
    [navigate],
  )

  return (
    <div
      ref={rootRef}
      className="terminal-root custom-gradient"
      data-start-section={startSectionId}
    >
      <TitleBar
        currentSectionId={location.sectionId}
        isDrawerOpen={isDrawerOpen}
        isPlain={isPlain}
        onSelectSection={handleSelectSection}
        onToggleDrawer={handleToggleDrawer}
        onTogglePlainView={handleTogglePlainView}
        path={location.cwd}
      />
      <main
        ref={scrollerRef}
        className="terminal-scroller"
        tabIndex={0}
        onClick={() => setIsDrawerOpen(false)}
      >
        {/* The only way home that works without a script. */}
        {isProjectsPage && (
          <nav aria-label="Back" className="terminal-back-link">
            <Link href="/">
              <span aria-hidden="true">← </span>
              kups.me
            </Link>
          </nav>
        )}
        <div ref={trackRef} className="terminal-track">
          <div ref={stageRef} className="terminal-stage">
            <Scenes
              isProjectsPage={isProjectsPage}
              onOpenResume={resumeControls.open}
              showsEverySection={showsEverySection}
            />
          </div>
        </div>
      </main>
      <div className="terminal-dock">
        <Prompt path={location.cwd} promptRef={promptRef} typedRef={typedRef} />
        <TerminalFooter footerRef={footerRef} />
      </div>
      <GetResume controls={resumeControls} onClose={handleResumeWindowClosed} />
    </div>
  )
}
