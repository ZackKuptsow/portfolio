'use client'

import { useId } from 'react'

import { DownloadIcon } from './components/DownloadIcon'
import { DownloadOption } from './components/DownloadOption'
import { EmailOption } from './components/EmailOption'
import {
  CLOSE_BUTTON_LABEL,
  CLOSE_BUTTON_TEXT,
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TERMINAL_BUTTON_CLASS_NAME,
  TRIGGER_COMMAND,
} from './constants'
import { useModalDialog } from './hooks'

/**
 * The page's one way to get the resume: a terminal-styled button that opens a
 * modal listing every delivery option.
 *
 * The dialog stays mounted while it is closed, so a request started before
 * closing finishes in the background and its result is still shown on reopen.
 */
export function GetResume() {
  const titleId = useId()
  const { close, dialogRef, handleDialogClick, handleDialogPointerDown, open } = useModalDialog()

  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={open}
          className={`${TERMINAL_BUTTON_CLASS_NAME} cursor-pointer`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <span aria-hidden="true" className="command-prompt">
              $
            </span>
            <span>{TRIGGER_COMMAND}</span>
            <DownloadIcon />
          </span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="get-resume-dialog"
        onClick={handleDialogClick}
        onPointerDown={handleDialogPointerDown}
      >
        <div className="terminal-window shadow-card">
          <div className="terminal-header terminal-header-style gap-3 pl-16">
            <span className="flex-1 text-center font-mono text-xs text-primary sm:text-sm">
              {DIALOG_HEADER_PATH}
            </span>
            <button
              type="button"
              aria-label={CLOSE_BUTTON_LABEL}
              onClick={close}
              className="cursor-pointer rounded border border-border px-2 font-mono text-xs
                         text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              {CLOSE_BUTTON_TEXT}
            </button>
          </div>

          <div className="flex flex-col gap-6 p-6">
            <h2 id={titleId} className="font-mono text-xl font-bold text-primary">
              {DIALOG_TITLE}
            </h2>

            <section>
              <h3 className="mb-2 font-mono text-sm text-primary">
                <span aria-hidden="true">## </span>
                {SECTION_TITLE.download}
              </h3>
              <DownloadOption />
            </section>

            <section>
              <h3 className="mb-2 font-mono text-sm text-primary">
                <span aria-hidden="true">## </span>
                {SECTION_TITLE.email}
              </h3>
              <EmailOption />
            </section>
          </div>
        </div>
      </dialog>
    </>
  )
}
