'use client'

import useCursorGlow from '@/components/useCursorGlow'
import { LOCATION_LABEL, PERSON_HANDLE } from '@/data/identity'
import { about } from '@/data/profile'

export default function AboutMe() {
  const handleCursorGlowMove = useCursorGlow<HTMLDivElement>()

  return (
    <section className="w-full py-16">
      <div
        className="terminal-window shadow-card terminal-about-me group relative overflow-hidden
                    hover:border-primary/60 hover:-translate-y-1 transition-all duration-300 ease-out"
        onMouseMove={handleCursorGlowMove}
      >
        {/* Terminal Header */}
        <div aria-hidden="true" className="terminal-header terminal-header-style">
          <div className="flex items-center gap-3">
            <span className="text-primary text-xs sm:text-sm font-mono">~/portfolio/about.sh</span>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
        </div>

        {/* Terminal Content */}
        <div className="terminal-content-padding">
          {/* Command Prompt */}
          <div aria-hidden="true" className="terminal-command-prompt">
            <span className="command-prompt">$</span>{' '}
            <span className="text-muted-foreground">cat developer.profile</span>
          </div>

          {/* Profile Output */}
          <div className="code-block px-4 sm:px-8 py-6 space-y-8">
            {/* The handle is decoration here. The bio below carries the name. */}
            <div
              aria-hidden="true"
              className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-8"
            >
              <div className="text-primary font-mono text-lg sm:text-xl md:text-2xl text-center sm:text-left">
                {PERSON_HANDLE}
              </div>
            </div>

            <div className="terminal-profile-grid">
              {/* Left Column */}
              <div className="terminal-profile-section">
                <div>
                  <div className="terminal-profile-label">Experience:</div>
                  <div className="text-foreground text-lg">
                    <span className="stat-counter text-terminal text-2xl">
                      {about.experienceYears}
                    </span>{' '}
                    {about.experienceSummary}
                  </div>
                </div>

                <div>
                  <div className="terminal-profile-label">Specialty:</div>
                  <div className="terminal-profile-value">{about.specialty}</div>
                </div>

                <div>
                  <div className="terminal-profile-label">Based in:</div>
                  <div className="terminal-profile-value">{LOCATION_LABEL}</div>
                </div>
              </div>

              {/* Right Column */}
              <div className="terminal-profile-section">
                <div>
                  <div className="terminal-profile-label mb-4">Core Technologies:</div>
                  <div className="terminal-tech-tags">
                    {about.coreTechnologies.map((technology) => (
                      <span key={technology} className="skill-tag px-3 py-1 text-sm rounded">
                        {technology}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="terminal-profile-label">Mission:</div>
                  <div className="terminal-profile-value">{about.mission}</div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="terminal-philosophy-box">
              <div
                aria-hidden="true"
                className="font-mono text-sm text-muted-foreground mb-2 sm:mb-3"
              >
                {'// About'}
              </div>
              <p className="text-foreground text-sm leading-relaxed">{about.bio}</p>
            </div>

            {/* Status Line */}
            <div className="terminal-status-line">
              <div className="font-mono text-sm text-muted-foreground">
                Last updated: <span className="text-primary">2026</span>
              </div>
            </div>
          </div>

          {/* Second Command */}
          <div className="font-mono text-xs">
            <span className="command-prompt">$</span>{' '}
            <span className="text-muted-foreground typing-animation">
              <span className="sm:hidden sm:text-base">
                {' '}
                echo &quot;Let&apos;s build something together&quot;{' '}
              </span>
              <span className="hidden sm:inline">
                {' '}
                echo &quot;Let&apos;s build something amazing together&quot;{' '}
              </span>
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
