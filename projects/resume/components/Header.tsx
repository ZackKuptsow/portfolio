import { HERO_NAME_LINE, PERSON_HANDLE } from '@/data/identity'

/**
 * The hero. The large handle is what a visitor sees first, and the heading
 * under it is what a search engine and a screen reader are given: the name
 * people type, with the role and the city.
 */
export default function Header() {
  return (
    <header className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-4xl mx-auto">
          <div aria-hidden="true" className="text-sm font-mono mb-4 tracking-widest text-terminal">
            ~/root/portfolio
          </div>
          {/* The handle is the visual headline only. The heading below carries the name. */}
          <div
            aria-hidden="true"
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-foreground font-mono text-terminal"
          >
            {PERSON_HANDLE}
          </div>
          <h1 className="text-base sm:text-lg md:text-xl text-foreground mb-6">{HERO_NAME_LINE}</h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed font-mono">
            <span aria-hidden="true" className="command-prompt">
              $
            </span>{' '}
            full-stack-engineer & <span className="text-primary">./tech.polyglot</span>
          </p>
          <div className="w-32 h-px bg-gradient-to-r from-transparent via-primary to-transparent mx-auto animate-pulse" />
        </div>
      </div>
    </header>
  )
}
