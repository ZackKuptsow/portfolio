'use client'

import { useCallback } from 'react'

import type { MouseEvent } from 'react'

/**
 * Track the cursor position relative to an element for the terminal glow effect.
 *
 * Returns a mouse-move handler that writes the pointer's offset into the
 * `--mouse-x` / `--mouse-y` custom properties, which the `::before` radial
 * gradients in globals.css read to position the glow under the cursor.
 */
export default function useCursorGlow<ElementType extends HTMLElement>() {
  return useCallback((event: MouseEvent<ElementType>) => {
    const elementBounds = event.currentTarget.getBoundingClientRect()
    const cursorOffsetX = event.clientX - elementBounds.left
    const cursorOffsetY = event.clientY - elementBounds.top
    event.currentTarget.style.setProperty('--mouse-x', `${cursorOffsetX}px`)
    event.currentTarget.style.setProperty('--mouse-y', `${cursorOffsetY}px`)
  }, [])
}
