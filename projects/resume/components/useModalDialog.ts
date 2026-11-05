'use client'

import { useCallback, useRef } from 'react'

import type { MouseEvent, PointerEvent, RefObject } from 'react'

// `MouseEvent.detail` counts rapid clicks, so anything above one is the second
// half of a double-click.
const SINGLE_CLICK_COUNT = 1

/** What `useModalDialog` hands to the component that renders the dialog. */
export type ModalDialogControls = {
  close: () => void
  dialogRef: RefObject<HTMLDialogElement | null>
  handleDialogClick: (event: MouseEvent<HTMLDialogElement>) => void
  handleDialogPointerDown: (event: PointerEvent<HTMLDialogElement>) => void
  open: () => void
  /** For the window inside the dialog: keyboard focus starts there when the dialog opens. */
  windowRef: RefObject<HTMLDivElement | null>
}

/**
 * Drive a native `<dialog>` as a modal.
 *
 * `showModal()` supplies the inert page, focus containment and Escape. What it
 * lacks is closing on a backdrop click. The backdrop belongs to the dialog
 * element, and the terminal window fills the dialog's box, so a click whose
 * target is the dialog itself landed on the backdrop. It closes the dialog only
 * when:
 * - the press also started on the backdrop, so a text selection dragged out of
 *   the email field does not close it, and
 * - it is not the second click of a double-click. When the trigger is
 *   double-clicked, the first click opens the dialog and the second lands on
 *   the backdrop.
 *
 * It also picks where focus starts: the window itself, which draws no ring. Left
 * to `showModal()` it lands on the first focusable thing, which depends on the
 * height of the browser window, because Chrome counts a scrolling window before
 * the buttons in it. And the terminal opens this without a click, so a browser
 * would draw its ring around whatever got the focus: on the close button, that
 * makes the way out the loudest thing on the window, and a key still held from
 * scrolling would press it. From the window, Tab reaches the close button first,
 * Escape closes, and the arrow keys scroll it when it is taller than the screen.
 */
export function useModalDialog(): ModalDialogControls {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const didPressStartOnBackdropRef = useRef(false)
  const windowRef = useRef<HTMLDivElement>(null)

  const open = useCallback(() => {
    dialogRef.current?.showModal()
    windowRef.current?.focus()
  }, [])

  const close = useCallback(() => {
    dialogRef.current?.close()
  }, [])

  const handleDialogPointerDown = useCallback((event: PointerEvent<HTMLDialogElement>) => {
    didPressStartOnBackdropRef.current = event.target === event.currentTarget
  }, [])

  const handleDialogClick = useCallback((event: MouseEvent<HTMLDialogElement>) => {
    const didClickEndOnBackdrop = event.target === event.currentTarget
    const isSecondClickOfDoubleClick = event.detail > SINGLE_CLICK_COUNT
    if (
      didPressStartOnBackdropRef.current &&
      didClickEndOnBackdrop &&
      !isSecondClickOfDoubleClick
    ) {
      event.currentTarget.close()
    }
    didPressStartOnBackdropRef.current = false
  }, [])

  return { close, dialogRef, handleDialogClick, handleDialogPointerDown, open, windowRef }
}
