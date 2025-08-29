export default function Header() {
  return (
    <header className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="text-sm font-mono mb-4 tracking-widest text-terminal">~/root/portfolio</div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground font-mono text-terminal">
            zachary.kuptsow
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed font-mono">
            <span className="command-prompt">$</span> full-stack-engineer & <span className="text-primary">./tech.polyglot</span>
          </p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto animate-pulse" />
        </div>
      </div>
    </header>
  )
}
