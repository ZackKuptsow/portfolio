import type { ProjectLink } from '@/data/projects'

import { OutputComment } from './OutputComment'

import type { ReactNode } from 'react'

type EntryBlockProps = {
  /** A control that does something here, such as opening a recording. Ends the link row. */
  action?: ReactNode
  blockId: string
  /** Where the comment line is filed: the entry's file name. */
  commentKey: string
  description?: string
  /** The section's heading and listing, which print with its first card. */
  header?: ReactNode
  highlights?: readonly string[]
  links?: readonly ProjectLink[]
  /** What stands where a link would be, such as why the code is private. */
  note?: string
  subtitle: string
  title: string
}

/**
 * One job, degree or project, as plain output: its title, a line under it, a paragraph or a
 * list with arrows, what a visitor can do from it, and `[EOF]`. The arrows and `[EOF]` are
 * decoration, hidden from assistive technology.
 */
export function EntryBlock({
  action,
  blockId,
  commentKey,
  description,
  header,
  highlights = [],
  links = [],
  note,
  subtitle,
  title,
}: EntryBlockProps) {
  const hasLinkRow = links.length > 0 || note !== undefined || action !== undefined

  return (
    <div className="terminal-block" data-block={blockId}>
      {header}
      <h3 className="terminal-entry-title terminal-glow-hover">{title}</h3>
      <p className="terminal-secondary">{subtitle}</p>
      {description && <p className="terminal-text">{description}</p>}
      {highlights.length > 0 && (
        <ul className="terminal-list">
          {highlights.map((highlight) => (
            <li key={highlight}>
              <span aria-hidden="true" className="terminal-arrow">
                →
              </span>
              <span>{highlight}</span>
            </li>
          ))}
        </ul>
      )}
      {hasLinkRow && (
        <ul className="terminal-link-row">
          {links.map((link) => (
            <li key={link.href}>
              <a
                className="terminal-link terminal-glow-hover"
                href={link.href}
                rel="noreferrer"
                target="_blank"
              >
                <span aria-hidden="true">→ </span>
                {link.label}
              </a>
            </li>
          ))}
          {note !== undefined && <li className="terminal-note">{note}</li>}
          {action !== undefined && <li>{action}</li>}
        </ul>
      )}
      <p aria-hidden="true" className="terminal-eof">
        [EOF]
      </p>
      <OutputComment commentKey={commentKey} />
    </div>
  )
}
