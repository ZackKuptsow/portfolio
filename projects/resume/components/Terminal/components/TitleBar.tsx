import { useId } from 'react'

import { BrandMark } from '@/components/BrandMark'

import { MENU_LABEL, TITLE_BAR_USER } from '../constants'
import { Drawer } from './Drawer'

import type { SectionId } from '../types'

type TitleBarProps = {
  currentSectionId: SectionId
  isDrawerOpen: boolean
  isPlain: boolean
  onRunHelp: () => void
  onSelectSection: (sectionId: SectionId) => void
  onToggleDrawer: () => void
  onTogglePlainView: () => void
  path: string
}

/**
 * Three dots, the mark and the path, as a terminal's window bar, then plain view and the menu.
 * The dots, the mark and the path are decoration. The controls need a script, so without one they
 * do not show.
 */
export function TitleBar({
  currentSectionId,
  isDrawerOpen,
  isPlain,
  onRunHelp,
  onSelectSection,
  onToggleDrawer,
  onTogglePlainView,
  path,
}: TitleBarProps) {
  const drawerId = useId()

  return (
    <header className="terminal-title-bar">
      <div aria-hidden="true" className="terminal-dots">
        <span />
        <span />
        <span />
      </div>
      <div className="terminal-title-group">
        <BrandMark className="terminal-title-mark" />
        <div aria-hidden="true" className="terminal-title">
          <span className="terminal-title-user">{TITLE_BAR_USER} </span>
          {path}
        </div>
      </div>
      <button
        type="button"
        className="terminal-control terminal-plain-toggle terminal-needs-script"
        onClick={onTogglePlainView}
      >
        {isPlain ? MENU_LABEL.terminalView : MENU_LABEL.plainView}
      </button>
      <button
        type="button"
        aria-controls={drawerId}
        aria-expanded={isDrawerOpen}
        aria-label="Menu"
        className="terminal-control terminal-menu-button terminal-needs-script"
        onClick={onToggleDrawer}
      >
        <span aria-hidden="true">☰</span>
      </button>
      <Drawer
        currentSectionId={currentSectionId}
        id={drawerId}
        isOpen={isDrawerOpen}
        isPlain={isPlain}
        onRunHelp={onRunHelp}
        onSelectSection={onSelectSection}
        onTogglePlainView={onTogglePlainView}
      />
    </header>
  )
}
