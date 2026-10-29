/**
 * Build-time environment the site reads. next.config.ts validates every
 * required entry before a build or dev server starts, which is what lets those
 * be non-optional.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Full URL of the send_resume intake endpoint, ending in exactly /resume-requests. */
    readonly NEXT_PUBLIC_RESUME_REQUEST_API_URL: string
    /**
     * Where the Save State web build runs. Optional: unset, the project card
     * shows no live link. Set it only once the site is behind a login.
     */
    readonly NEXT_PUBLIC_SAVE_STATE_LIVE_URL?: string
  }
}
