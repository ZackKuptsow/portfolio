'use client'

import { useCallback, useId, useRef } from 'react'

import { TerminalDialog } from '@/components/TerminalDialog'
import { useModalDialog } from '@/components/useModalDialog'
import type { ProjectVideo } from '@/data/projects'

import { VIDEO_MIME_TYPE, VIDEO_PRELOAD } from './constants'

type ProjectDemoProps = {
  video: ProjectVideo
}

/**
 * A recorded demo behind a control in a project card. The control reads as
 * one of the card's links, with the length beside it, and opens a terminal
 * window holding the recording with the browser's own controls.
 *
 * Nothing plays until the visitor presses play, and only the poster and the
 * file's metadata load with the page, so a 9 MB recording costs a visitor who
 * never opens it nothing. Closing the window pauses the recording, however it
 * was closed, so the sound does not go on behind a page the visitor has
 * returned to.
 */
export function ProjectDemo({ video }: ProjectDemoProps) {
  const titleId = useId()
  const videoRef = useRef<HTMLVideoElement>(null)
  const controls = useModalDialog()
  // The file's own name, as the header of a window showing it. Short, so it clears the
  // window's dots on a phone.
  const headerPath = `.${video.sourcePath}`

  const handleClose = useCallback(() => {
    videoRef.current?.pause()
  }, [])

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        className="cursor-pointer text-primary underline-offset-4 hover:underline
                   terminal-glow-hover transition-all duration-200"
        onClick={controls.open}
      >
        <span aria-hidden="true">→ </span>
        {video.triggerLabel} <span className="text-muted-foreground">({video.durationLabel})</span>
      </button>

      <TerminalDialog
        controls={controls}
        headerPath={headerPath}
        labelledBy={titleId}
        onClose={handleClose}
      >
        <figure className="flex flex-col gap-4 p-6">
          <figcaption className="contents">
            <h2 id={titleId} className="font-mono text-xl font-bold text-primary">
              {video.title}
            </h2>
          </figcaption>
          {/* Sized by height, so a portrait recording fits the screen without the window scrolling */}
          <video
            ref={videoRef}
            aria-label={video.description}
            className="mx-auto max-h-[70dvh] aspect-[9/16] bg-black rounded-[var(--radius)] border border-border"
            controls
            playsInline
            poster={video.posterPath}
            preload={VIDEO_PRELOAD}
          >
            <source src={video.sourcePath} type={VIDEO_MIME_TYPE} />
            <a href={video.sourcePath}>Download the recording</a>
          </video>
          <p className="font-mono text-xs text-muted-foreground text-center">
            {video.durationLabel} · sound on
          </p>
        </figure>
      </TerminalDialog>
    </>
  )
}
