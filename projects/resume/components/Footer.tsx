'use client'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border/30 bg-card/30 backdrop-blur-sm">
      <div className="px-6 py-8">
        {/* Terminal-style footer header */}
        <div className="font-mono text-xs text-muted-foreground mb-6">
          <span className="command-prompt">$</span> ls -la ./contact/
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
          {/* Links */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary 
                         transition-colors duration-200 font-mono text-sm"
              href="https://www.linkedin.com/in/zack-kuptsow/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-primary/40 group-hover:text-primary/80">→</span>
              LinkedIn
            </a>
            <a
              className="group flex items-center gap-3 text-muted-foreground hover:text-primary 
                         transition-colors duration-200 font-mono text-sm"
              href="https://github.com/ZackKuptsow"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="text-primary/40 group-hover:text-primary/80">→</span>
              GitHub
            </a>
            <a
              className="group flex items-center gap-3 text-muted-foreground/60 
                         font-mono text-sm cursor-not-allowed"
              href="#"
              onClick={(e) => e.preventDefault()}
            >
              <span className="text-primary/20">→</span>
              Projects <span className="text-xs opacity-60">(coming soon)</span>
            </a>
          </div>

          {/* Copyright & Tech stack */}
          <div className="font-mono text-xs text-muted-foreground/80 border-l-0 sm:border-l border-border/30 pl-0 sm:pl-6 text-left sm:text-right">
            <div className="mb-1">© {new Date().getFullYear()} zachary.kuptsow</div>
            <div className="text-muted-foreground/60">
              <span className="command-prompt">$</span> Built with Next.js, deployed via AWS CDK, automated through GitHub Actions
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
