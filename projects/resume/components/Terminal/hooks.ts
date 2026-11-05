'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { INITIAL_PATH, SCRIPT_RUNNING_CLASS, TERMINAL_ON_CLASS } from './constants'
import { TerminalEngine } from './engine/TerminalEngine'

import type { TerminalLocation } from './engine/TerminalEngine'
import type { TerminalElements } from './engine/TerminalLayout'
import type { SectionId } from './types'
import type { RefObject } from 'react'

type TerminalElementRefs = {
  [Name in keyof TerminalElements]: RefObject<TerminalElements[Name] | null>
}

type UseTerminalEngineOptions = {
  /** False until every section is on the page, which the engine needs before it can measure. */
  isReadyToStart: boolean
  onResumeWindowOpenRequest: () => void
  refs: TerminalElementRefs
  startSectionId: SectionId
}

function readElements(refs: TerminalElementRefs): TerminalElements {
  const elements = Object.fromEntries(
    Object.entries(refs).map(([name, ref]) => {
      if (!ref.current) {
        throw new Error(`The terminal's "${name}" element did not render`)
      }
      return [name, ref.current]
    }),
  )
  return elements as TerminalElements
}

/**
 * Runs the terminal over the plain flow, if the pre-paint script opted the page in. It stays out
 * for a reader with reduced motion, and for a page whose script arrived so late that the
 * pre-paint script's failsafe has already handed it the plain flow. That reader can still ask for
 * the terminal from the menu.
 */
export function useTerminalEngine({
  isReadyToStart,
  onResumeWindowOpenRequest,
  refs,
  startSectionId,
}: UseTerminalEngineOptions) {
  const engineRef = useRef<TerminalEngine | null>(null)
  const openResumeRef = useRef(onResumeWindowOpenRequest)
  const [isPlain, setIsPlain] = useState(false)
  const [location, setLocation] = useState<TerminalLocation>({
    cwd: INITIAL_PATH,
    sectionId: startSectionId,
  })

  useEffect(() => {
    openResumeRef.current = onResumeWindowOpenRequest
  }, [onResumeWindowOpenRequest])

  const startEngine = useCallback(() => {
    const engine = new TerminalEngine({
      elements: readElements(refs),
      onLocationChange: setLocation,
      openResumeWindow: () => openResumeRef.current(),
      requestPlainView: () => {
        engine.setPlain(true)
        setIsPlain(true)
      },
      startSectionId,
    })
    engine.start()
    engineRef.current = engine
    // The refs and the start section are fixed for the life of the page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!isReadyToStart) {
      return
    }
    const htmlClasses = document.documentElement.classList
    htmlClasses.add(SCRIPT_RUNNING_CLASS)
    if (htmlClasses.contains(TERMINAL_ON_CLASS)) {
      startEngine()
    } else {
      setIsPlain(true)
    }
    return () => {
      engineRef.current?.destroy()
      engineRef.current = null
    }
  }, [isReadyToStart, startEngine])

  const togglePlainView = useCallback(() => {
    const nextIsPlain = !isPlain
    setIsPlain(nextIsPlain)
    if (engineRef.current) {
      engineRef.current.setPlain(nextIsPlain)
      return
    }
    document.documentElement.classList.add(TERMINAL_ON_CLASS)
    startEngine()
  }, [isPlain, startEngine])

  /** The menu is the one way in from the page, so this waits for the drawer it closes. */
  const navigate = useCallback((sectionId: SectionId) => {
    engineRef.current?.navigate(sectionId, { afterDrawerCloses: true })
  }, [])

  const handleResumeWindowClosed = useCallback(() => {
    engineRef.current?.handleResumeWindowClosed()
  }, [])

  return { handleResumeWindowClosed, isPlain, location, navigate, togglePlainView }
}
