'use client'

import { ReactNode } from 'react'

import useCursorGlow from '@/components/useCursorGlow'

type CardProps = {
  className?: string
  description: string
  href?: string
  icon?: ReactNode
  subtitle?: string
  title: string
}

export default function Card({
  className = '',
  description,
  href,
  icon,
  subtitle,
  title,
}: CardProps) {
  const Wrapper = href ? 'a' : 'div'
  const handleCursorGlowMove = useCursorGlow<HTMLElement>()

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
        {/* Command Prompt */}
        <div className="font-mono text-base">
          <span className="command-prompt">$</span>{' '}
          <span className="text-muted-foreground">
            cat {title.toLowerCase().replace(/\s+/g, '_')}.txt
          </span>
        </div>

        {/* Content Output */}
        <div className="code-block px-8 py-6 space-y-6">
          <h3
            className="text-primary font-mono text-lg font-semibold
                       terminal-glow-hover transition-all duration-200"
          >
            {title}
          </h3>

          {/* Subtitle with refined spacing */}
          {subtitle && (
            <h4
              className="text-muted-foreground font-mono text-sm
                         border-l-2 border-primary/20 pl-3
                         group-hover:border-primary/40 transition-colors"
            >
              {subtitle}
            </h4>
          )}

          {/* Description with perfect line height and spacing */}
          <p
            className="text-foreground/80 leading-relaxed text-sm
                       group-hover:text-foreground/90 transition-colors
                       mt-4"
          >
            {description}
          </p>

          {/* Bottom terminal accent */}
          <div className="pt-3 mt-4 border-t border-border/50">
            <div className="flex justify-end">
              <span className="font-mono text-xs text-muted-foreground">[EOF]</span>
            </div>
          </div>
        </div>
      </div>
    </Wrapper>
  )
}
