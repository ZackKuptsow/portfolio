'use client'

import type { ModalDialogControls } from '@/components/useModalDialog'

import { CLOSE_BUTTON_LABEL, CLOSE_BUTTON_TEXT } from './constants'

import type { ReactNode } from 'react'

type TerminalDialogProps = {
  children: ReactNode
  controls: ModalDialogControls
  /** Decorative path in the window's header. */
  headerPath: string
  /** The id of the heading inside the dialog that names it. */
  labelledBy: string
  /** Runs when the dialog closes, however it was closed: the button, Escape or the backdrop. */
  onClose?: () => void
}

/**
 * A modal that looks like a terminal window: the header with its path and
 * close button, then whatever the caller puts inside. `useModalDialog` drives
 * it; this only renders. Keep the dialog mounted while closed, so what is
 * inside it keeps its state between openings.
 */
export function TerminalDialog({
  children,
  controls,
  headerPath,
  labelledBy,
  onClose,
}: TerminalDialogProps) {
  const { close, closeButtonRef, dialogRef, handleDialogClick, handleDialogPointerDown } = controls

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={labelledBy}
      className="terminal-dialog"
      onClick={handleDialogClick}
      onClose={onClose}
      onPointerDown={handleDialogPointerDown}
    >
      <div className="terminal-window shadow-card">
        <div className="terminal-header terminal-header-style gap-3 pl-16">
          <span className="flex-1 truncate text-center font-mono text-xs text-primary sm:text-sm">
            {headerPath}
          </span>
          <button
            ref={closeButtonRef}
            type="button"
            aria-label={CLOSE_BUTTON_LABEL}
            onClick={close}
            className="shrink-0 cursor-pointer whitespace-nowrap rounded border border-border px-2 font-mono
                       text-xs text-muted-foreground transition-colors hover:border-primary! hover:text-primary"
          >
            {CLOSE_BUTTON_TEXT}
          </button>
        </div>

        {children}
      </div>
    </dialog>
  )
}
