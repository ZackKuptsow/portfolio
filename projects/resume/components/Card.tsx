'use client'

import { ReactNode } from 'react'

import { toTerminalFileName } from '@/components/terminalFileName'
import useCursorGlow from '@/components/useCursorGlow'
import type { ProjectLink } from '@/data/projects'

/**
 * A card is a link, or it holds links and controls. Never both: an anchor or a
 * button inside an anchor is invalid HTML, and browsers split it unpredictably.
 */
type CardLinking =
  | { action?: never; href?: string; links?: never; note?: never }
  | { action?: ReactNode; href?: never; links?: readonly ProjectLink[]; note?: string }

type CardProps = CardLinking & {
  className?: string
  /** A paragraph under the subtitle. Left out when the card shows only highlights. */
  description?: string
  /** Put before the title in the prompt's file name, to tell apart cards that share a title. */
  fileNamePrefix?: string
  /** Shown as a list, in the order given. An empty list renders no list at all. */
  highlights?: readonly string[]
  icon?: ReactNode
  /** A line under the title, such as a role and its dates. It is a paragraph, not a heading. */
  subtitle?: string
  title: string
}

/**
 * One terminal window holding a job, a degree or a project. The title is the
 * card's only heading. The prompt above it and the `[EOF]` below are
 * decoration, hidden from assistive technology.
 *
 * The links open in a new tab, since the visitor is leaving the page. The note,
 * when there is one, follows them in the same row as plain text: what stands
 * where a link would be, such as why the code is private. The action, when
 * there is one, ends the row: a control that does something here, such as
 * opening a demo, styled as the links are.
 */
export default function Card({
  action,
  className = '',
  description,
  fileNamePrefix = '',
  highlights = [],
  href,
  icon,
  links = [],
  note,
  subtitle,
  title,
}: CardProps) {
  const Wrapper = href ? 'a' : 'div'
  const handleCursorGlowMove = useCursorGlow<HTMLElement>()
  const fileName = toTerminalFileName(`${fileNamePrefix} ${title}`)
  const hasLinkRow = links.length > 0 || note !== undefined || action !== undefined

  return (
    <Wrapper
      href={href}
      className={`terminal-card group relative overflow-hidden
        bg-card border border-border
        transition-all duration-300 ease-out
        hover:border-primary/60 hover:-translate-y-1
        ${href ? 'cursor-pointer' : ''} ${className}`}
      onMouseMove={handleCursorGlowMove}
    >
      {/* Primary header with gradient and buttons - matches About Me */}
      <div
        className="h-8 border-b border-border relative z-[3] flex items-center px-3"
        style={{ background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), transparent)' }}
      >
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
          <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>
        </div>
        {icon && <div className="ml-auto text-primary/60 text-sm">{icon}</div>}
      </div>

      {/* Thin secondary bar - matches About Me proportions */}
      <div className="h-1 bg-muted border-b border-border relative z-[2]"></div>

      {/* Terminal content area with command prompt - matches About Me */}
      <div className="px-6 py-8 space-y-8">
        {/* Command Prompt. It wraps mid-word, as a terminal does: a long file name that could
            not wrap would make the card wider than a narrow phone. */}
        <div aria-hidden="true" className="font-mono text-base break-all">
          <span className="command-prompt">$</span>{' '}
          <span className="text-muted-foreground">cat {fileName}.txt</span>
        </div>

        {/* Content Output */}
        <div className="code-block px-8 py-6 space-y-6">
          <h3
            className="text-primary font-mono text-lg font-semibold
                       terminal-glow-hover transition-all duration-200"
          >
            {title}
          </h3>

          {/* A paragraph, not a heading: it describes the title and opens no section */}
          {subtitle && (
            <p
              className="text-muted-foreground font-mono text-sm
                         border-l-2 border-primary/20 pl-3
                         group-hover:border-primary/40 transition-colors"
            >
              {subtitle}
            </p>
          )}

          {/* Description with perfect line height and spacing */}
          {description && (
            <p
              className="text-foreground/80 leading-relaxed text-sm
                         group-hover:text-foreground/90 transition-colors
                         mt-4"
            >
              {description}
            </p>
          )}

          {highlights.length > 0 && (
            <ul className="space-y-3 mt-4">
              {highlights.map((highlight) => (
                <li key={highlight} className="flex gap-2 text-sm leading-relaxed">
                  <span aria-hidden="true" className="text-primary/60 shrink-0">
                    →
                  </span>
                  <span className="text-foreground/80 group-hover:text-foreground/90 transition-colors">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* Where the project can be seen, what stands in for a link, then what can be done here */}
          {hasLinkRow && (
            <ul className="flex flex-wrap gap-x-6 gap-y-2 mt-4 font-mono text-sm">
              {links.map((link) => (
                <li key={link.href}>
                  <a
                    className="text-primary underline-offset-4 hover:underline
                               terminal-glow-hover transition-all duration-200"
                    href={link.href}
                    rel="noreferrer"
                    target="_blank"
                  >
                    <span aria-hidden="true">→ </span>
                    {link.label}
                  </a>
                </li>
              ))}
              {note !== undefined && <li className="text-muted-foreground">{note}</li>}
              {action !== undefined && <li>{action}</li>}
            </ul>
          )}

          {/* Bottom terminal accent */}
          <div aria-hidden="true" className="pt-3 mt-4 border-t border-border/50">
            <div className="flex justify-end">
              <span className="font-mono text-xs text-muted-foreground">[EOF]</span>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
