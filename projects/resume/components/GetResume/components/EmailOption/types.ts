/** How a resume request ended, in the terms the visitor is told. */
export type ResumeRequestOutcome =
  | 'invalid'
  | 'limited'
  | 'network-error'
  | 'server-error'
  | 'success'

/** Every state the email option can show: before, during, or after a request. */
export type ResumeRequestStatus = 'idle' | 'submitting' | ResumeRequestOutcome
