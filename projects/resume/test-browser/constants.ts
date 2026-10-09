/** The built site is served here for the checks. Port 3000 is left to `next dev`. */
export const LOCAL_HOST = '127.0.0.1'
export const LOCAL_PORT = 4173
export const LOCAL_ORIGIN = `http://${LOCAL_HOST}:${LOCAL_PORT}`

/** A common laptop screen. */
export const LAPTOP_VIEWPORT = { height: 768, width: 1366 }

/**
 * A small phone. Work experience was eleven screens tall at about this size when it never
 * faded in.
 */
export const PHONE_VIEWPORT = { height: 640, width: 360 }

/** Tailwind's `sm` breakpoint, in CSS pixels. The QR code is shown from this width up. */
export const SMALL_BREAKPOINT_PIXELS = 640
