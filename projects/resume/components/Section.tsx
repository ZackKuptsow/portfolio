'use client'

import { toTerminalFileName } from '@/components/terminalFileName'

interface SectionProps {
  children: React.ReactNode
  className?: string
  title: string
}

export default function Section({ children, className = '', title }: SectionProps) {
  return (
    <section className={`mb-12 ${className}`.trim()}>
      {/* Simplified terminal-style section header */}
      <div className="mb-8">
        <div aria-hidden="true" className="font-mono text-sm text-muted-foreground mb-2">
          <span className="command-prompt">$</span> cd ./{toTerminalFileName(title)}
        </div>
        <h2
          className="text-primary font-mono text-2xl font-bold border-l-4 border-primary/30 pl-4
                     terminal-glow-hover hover:border-primary/60 transition-all duration-200"
        >
          <span aria-hidden="true"># </span>
          {title}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}
