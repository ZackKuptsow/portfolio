'use client'

export default function AboutMe() {
  return (
    <section className="w-full py-16">
      <div className="terminal-window shadow-card terminal-about-me group relative overflow-hidden
                    hover:border-primary/60 hover:-translate-y-1 transition-all duration-300 ease-out"
           onMouseMove={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const x = e.clientX - rect.left;
             const y = e.clientY - rect.top;
             e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
             e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
           }}>
        {/* Terminal Header */}
        <div className="terminal-header terminal-header-style">
          <div className="flex items-center gap-3">
            <span className="text-primary text-xs sm:text-sm font-mono">~/portfolio/about.sh</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="terminal-content-padding">
          {/* Command Prompt */}
          <div className="terminal-command-prompt">
            <span className="command-prompt">$</span> <span className="text-muted-foreground">cat developer.profile</span>
          </div>

          {/* Profile Output */}
          <div className="code-block px-4 sm:px-8 py-6 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8">
              <div className="text-primary font-mono text-lg sm:text-xl md:text-2xl text-center sm:text-left">zachary.kuptsow</div>
            </div>

            <div className="terminal-profile-grid">
              {/* Left Column */}
              <div className="terminal-profile-section">
                <div>
                  <div className="terminal-profile-label">Experience:</div>
                  <div className="text-foreground text-lg">
                    <span className="stat-counter text-terminal text-2xl">5+</span> years building scalable systems
                  </div>
                </div>
                
                <div>
                  <div className="terminal-profile-label">Specialty:</div>
                  <div className="terminal-profile-value">Full stack development with continuous learning mindset</div>
                </div>

                <div>
                  <div className="terminal-profile-label">Environment:</div>
                  <div className="terminal-profile-value">Startup ecosystems & rapid iteration</div>
                </div>
              </div>

              {/* Right Column */}
              <div className="terminal-profile-section">
                <div>
                  <div className="terminal-profile-label mb-4">Core Technologies:</div>
                  <div className="terminal-tech-tags">
                    <span className="skill-tag px-3 py-1 text-sm rounded">TypeScript</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">Node</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">React</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">Tailwind</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">Python</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">Django</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">PostgreSQL</span>
                    <span className="skill-tag px-3 py-1 text-sm rounded">AWS</span>
                  </div>
                </div>

                <div>
                  <div className="terminal-profile-label">Mission:</div>
                  <div className="terminal-profile-value">Building reliable, maintainable software that solves real problems</div>
                </div>
              </div>
            </div>

            {/* Command Line Quote */}
            <div className="terminal-philosophy-box">
              <div className="font-mono text-sm text-muted-foreground mb-2 sm:mb-3">{'// Personal philosophy'}</div>
              <div className="text-foreground italic text-sm leading-relaxed">
                &quot;I thrive on turning complex problems into elegant, user-friendly solutions. 
                Whether it&apos;s optimizing backend performance, crafting intuitive UIs, or building CI/CD pipelines, 
                I focus on code that&apos;s built to last and teams that are built to ship.&quot;
              </div>
            </div>

            {/* Status Line */}
            <div className="terminal-status-line">
              <div className="font-mono text-sm text-muted-foreground">
                Last updated: <span className="text-primary">2025</span>
              </div>
            </div>
          </div>

          {/* Second Command */}
          <div className="font-mono text-xs">
            <span className="command-prompt">$</span> <span className="text-muted-foreground typing-animation">
              <span className="sm:hidden sm:text-base"> echo &quot;Let&apos;s build something together&quot; </span>
              <span className="hidden sm:inline"> echo &quot;Let&apos;s build something amazing together&quot; </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}