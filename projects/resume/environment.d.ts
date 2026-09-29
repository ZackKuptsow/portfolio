/**
 * Build-time environment the site reads. next.config.ts validates every entry
 * before a build or dev server starts, which is what lets these be non-optional.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Full URL of the send_resume intake endpoint, ending in exactly /resume-requests. */
    readonly NEXT_PUBLIC_RESUME_REQUEST_API_URL: string
  }
}
