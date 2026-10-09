'use client'

import { useCallback, useRef } from 'react'

import type { MouseEvent, PointerEvent, RefObject } from 'react'

// `MouseEvent.detail` counts rapid clicks, so anything above one is the second
// half of a double-click.
const SINGLE_CLICK_COUNT = 1

/** What `useModalDialog` hands to the component that renders the dialog. */
export type ModalDialogControls = {
  close: () => void
  /** For the dialog's close button: keyboard focus starts there when the dialog opens. */
  closeButtonRef: RefObject<HTMLButtonElement | null>
  dialogRef: RefObject<HTMLDialogElement | null>
  handleDialogClick: (event: MouseEvent<HTMLDialogElement>) => void
  handleDialogPointerDown: (event: PointerEvent<HTMLDialogElement>) => void
  open: () => void
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
 * It also picks where focus starts. `showModal()` focuses the first focusable
 * thing in the dialog. When the window is taller than the screen it scrolls, and
 * Chrome then counts the scrolling window itself, which has no name. So the
 * starting point would depend on the height of the browser window. Opening
 * always moves focus to the close button, where it lands when nothing scrolls.
 */
export function useModalDialog(): ModalDialogControls {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const didPressStartOnBackdropRef = useRef(false)

  const open = useCallback(() => {
    dialogRef.current?.showModal()
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

  return { close, closeButtonRef, dialogRef, handleDialogClick, handleDialogPointerDown, open }
}
