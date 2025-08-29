'use client'

type SlimCardProps = {
  className?: string
  list: string[]
  title: string
}

export default function SlimCard({
  className = '',
  list,
  title
}: SlimCardProps) {

  return (
    <div className={`terminal-skill-card group relative overflow-hidden flex flex-col
        bg-card border border-border
        transition-all duration-300 ease-out
        hover:border-primary hover:shadow-glow hover:-translate-y-0.5
        after:absolute after:content-['●_●_●'] after:top-1.5 after:left-2 
        after:text-muted-foreground after:text-xs after:z-10 after:pointer-events-none
        ${className}`}>
      
      {/* Primary header with gradient and buttons - matches About Me */}
      <div className="h-6 border-b border-border relative z-[3] flex items-center px-2"
           style={{background: 'linear-gradient(90deg, hsl(var(--primary) / 0.1), transparent)'}}>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground"></div>
        </div>
        <div className="ml-auto font-mono text-xs text-muted-foreground">
          ./{title.toLowerCase()}
        </div>
      </div>
      
      {/* Thin secondary bar - matches About Me proportions */}
      <div className="h-0.5 bg-muted border-b border-border relative z-[2]"></div>

      {/* Content - code-block fills 100% of the card */}
      <div className="code-block !border-0 !rounded-none !rounded-b-[var(--radius)] p-4 flex-1">
        {/* Command prompt */}
        <div className="font-mono text-xs text-muted-foreground mb-3">
          <span className="command-prompt">$</span> ls -la {title.toLowerCase()}
        </div>
        
        {/* Title */}
        <h2 className="text-primary font-mono text-base font-semibold mb-3
                     transition-colors group-hover:text-terminal">
          {title}
        </h2>
        
        {/* Skills list with terminal styling */}
        <div className="space-y-2">
          {list.map((skill: string, index: number) => (
            <div key={index} className="flex items-center font-mono text-sm">
              <span className="text-primary/60 mr-2">→</span>
              <span className="text-foreground/80 group-hover:text-foreground/95 transition-colors">
                {skill}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom accent */}
        <div className="mt-4 pt-2 border-t border-border/30">
          <div className="flex justify-between items-center">
            <span className="font-mono text-xs text-muted-foreground">
              {list.length} items
            </span>
            <span className="font-mono text-xs text-primary/60">
              drwxr-xr-x
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
