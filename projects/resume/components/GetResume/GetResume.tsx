'use client'

import { useId } from 'react'

import { TerminalDialog } from '@/components/TerminalDialog'
import { useModalDialog } from '@/components/useModalDialog'

import { DownloadIcon } from './components/DownloadIcon'
import { DownloadOption } from './components/DownloadOption'
import { EmailOption } from './components/EmailOption'
import { QrCodeOption } from './components/QrCodeOption'
import {
  DIALOG_HEADER_PATH,
  DIALOG_TITLE,
  SECTION_TITLE,
  TERMINAL_BUTTON_CLASS_NAME,
  TRIGGER_COMMAND,
} from './constants'

/**
 * The page's one way to get the resume: a terminal-styled button that opens a
 * modal listing every delivery option.
 *
 * The dialog stays mounted while it is closed, so a request started before
 * closing finishes in the background and its result is still shown on reopen.
 */
export function GetResume() {
  const titleId = useId()
  const controls = useModalDialog()

  return (
    <>
      <div className="mt-8 flex justify-center">
        <button
          type="button"
          aria-haspopup="dialog"
          onClick={controls.open}
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

      <TerminalDialog controls={controls} headerPath={DIALOG_HEADER_PATH} labelledBy={titleId}>
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

          {/* A phone cannot scan its own screen, so below the `sm` breakpoint the code is
              not shown. The link that opens the PDF does the same job there. */}
          <section className="max-sm:hidden">
            <h3 className="mb-2 font-mono text-sm text-primary">
              <span aria-hidden="true">## </span>
              {SECTION_TITLE.qrCode}
            </h3>
            <QrCodeOption />
          </section>
        </div>
      </TerminalDialog>
    </>
  )
}
