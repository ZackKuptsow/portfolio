'use client'

interface SectionProps {
  children: React.ReactNode
  className?: string
  title: string
}

export default function Section({ children, className, title }: SectionProps) {
  return (
    <section className={`mb-12 ${className}`}>
      {/* Simplified terminal-style section header */}
      <div className="mb-8">
        <div className="font-mono text-sm text-muted-foreground mb-2">
          <span className="command-prompt">$</span> cd ./{title.toLowerCase().replace(/\s+/g, '_')}
        </div>
        <h2 className="text-primary font-mono text-2xl font-bold border-l-4 border-primary/30 pl-4
                     hover:border-primary/60 hover:text-terminal transition-all duration-200">
          # {title}
        </h2>
      </div>
      <div className="space-y-6">{children}</div>
    </section>
  )
}
