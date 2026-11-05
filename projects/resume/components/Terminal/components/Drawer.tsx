import { useTheme } from '@/components/useTheme'
import { PERSON_HANDLE } from '@/data/identity'

import { BUILT_WITH_LINE, MENU_HEADING_COMMAND, MENU_LABEL, MENU_SECTIONS } from '../constants'

import type { SectionId } from '../types'

type DrawerProps = {
  currentSectionId: SectionId
  id: string
  isOpen: boolean
  isPlain: boolean
  onSelectSection: (sectionId: SectionId) => void
  onTogglePlainView: () => void
}

/**
 * The menu, from the right: the sections, plain view and the theme switch, then whatever the
 * footer could not fit. The sections are for the terminal: the plain flow is already all there.
 * It lies over the terminal, so opening it moves nothing behind it.
 */
export function Drawer({
  currentSectionId,
  id,
  isOpen,
  isPlain,
  onSelectSection,
  onTogglePlainView,
}: DrawerProps) {
  const { isDark, toggleTheme } = useTheme()

  return (
    <nav id={id} aria-label="Menu" className={`terminal-drawer ${isOpen ? 'is-open' : ''}`.trim()}>
      {!isPlain && (
        <>
          <p aria-hidden="true" className="terminal-drawer-heading">
            <span className="command-prompt">$</span> {MENU_HEADING_COMMAND}
          </p>
          <ul>
            {MENU_SECTIONS.map(({ label, sectionId }) => (
              <li key={sectionId}>
                <button
                  type="button"
                  aria-current={sectionId === currentSectionId ? 'true' : undefined}
                  className="terminal-drawer-item"
                  onClick={() => onSelectSection(sectionId)}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="terminal-drawer-settings">
        <button
          type="button"
          className="terminal-drawer-item terminal-plain-toggle-item"
          onClick={onTogglePlainView}
        >
          {isPlain ? MENU_LABEL.terminalView : MENU_LABEL.plainView}
        </button>
        <button type="button" className="terminal-drawer-item" onClick={toggleTheme}>
          {isDark ? MENU_LABEL.lightMode : MENU_LABEL.darkMode}
        </button>
      </div>
      <div className="terminal-drawer-about">
        <div className="terminal-drawer-built-with">{BUILT_WITH_LINE}</div>
        <div className="terminal-drawer-copyright">
          © {new Date().getFullYear()} {PERSON_HANDLE}
        </div>
      </div>
    </nav>
  )
}
