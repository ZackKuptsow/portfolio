/** The terminal's sections, each one screen of output between two clears. */
export type SectionId = 'about' | 'education' | 'hero' | 'projects' | 'resume' | 'skills' | 'work'

/**
 * One section as the scroll sees it. `fileNames` holds one fake file per card, and a section
 * with no files prints as one block.
 */
export type TerminalSection = {
  /** The section's folder under `~/portfolio`, when it has one. */
  directory: string | null
  fileNames: readonly string[]
  id: SectionId
}

/** One stop of the scroll: a block of output that prints as a unit. */
export type TerminalStep = {
  /** The `data-block` value of the element this step prints. */
  blockId: string
  /** The first step of a section clears the screen before it prints. */
  clearsBefore: boolean
  fileName: string | null
  sectionId: SectionId
}
