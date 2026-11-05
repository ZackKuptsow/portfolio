import { RESIZE_SETTLE_MILLISECONDS } from '../constants'

import type { TerminalElements } from './TerminalLayout'

/** The `echo` line wraps when this ends, if it does not fit on one line. See `terminal.css`. */
const WRAPPING_ANIMATION_NAME = 'terminal-type'

/** What the reader did, for the engine to act on. */
export type TerminalInputHandlers = {
  onClick: () => void
  onFindInPage: () => void
  onFocusIn: (target: HTMLElement) => void
  onKeyDown: (event: KeyboardEvent) => void
  /** A line of the output has just wrapped, which moves the rows without resizing anything. */
  onOutputWrapped: () => void
  onResize: () => void
  onScroll: () => void
  /** A touch moved by this many pixels, positive when it pulls down. */
  onTouchPull: (pulled: number) => void
  /** A wheel moved by this many pixels, positive when it scrolls up. */
  onWheelUp: (amount: number) => void
}

type WireOptions = {
  elements: TerminalElements
  handlers: TerminalInputHandlers
  signal: AbortSignal
}

/**
 * Connects the page's input to the engine. Everything is removed through `signal`, and the
 * returned function stops what a signal cannot: the size observer and its waiting timer.
 */
export function wireTerminalInput({ elements, handlers, signal }: WireOptions): () => void {
  const { prompt, root, scroller, stage } = elements
  let touchY = 0

  scroller.addEventListener('scroll', handlers.onScroll, { passive: true, signal })
  scroller.addEventListener('wheel', (event) => handlers.onWheelUp(-event.deltaY), {
    passive: true,
    signal,
  })
  scroller.addEventListener(
    'touchstart',
    (event) => {
      touchY = event.touches[0].clientY
    },
    { passive: true, signal },
  )
  scroller.addEventListener(
    'touchmove',
    (event) => {
      const pulled = event.touches[0].clientY - touchY
      touchY = event.touches[0].clientY
      handlers.onTouchPull(pulled)
    },
    { passive: true, signal },
  )
  scroller.addEventListener('click', handlers.onClick, { signal })
  prompt.addEventListener('click', handlers.onClick, { signal })
  scroller.addEventListener('keydown', handlers.onKeyDown, { signal })
  scroller.addEventListener(
    'focusin',
    (event) => {
      if (event.target !== scroller) {
        handlers.onFocusIn(event.target as HTMLElement)
      }
    },
    { signal },
  )
  stage.addEventListener('beforematch', handlers.onFindInPage, { signal })
  stage.addEventListener(
    'animationend',
    (event) => {
      if (event.animationName === WRAPPING_ANIMATION_NAME) {
        handlers.onOutputWrapped()
      }
    },
    { signal },
  )

  let resizeTimer: ReturnType<typeof setTimeout> | undefined
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer)
    resizeTimer = setTimeout(handlers.onResize, RESIZE_SETTLE_MILLISECONDS)
  })
  resizeObserver.observe(root)
  resizeObserver.observe(scroller)
  // Its rows are sized in rem, so it is the one box that always moves with the text size.
  resizeObserver.observe(prompt)

  return () => {
    clearTimeout(resizeTimer)
    resizeObserver.disconnect()
  }
}
