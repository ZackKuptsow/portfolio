import { TITLE_BAR_USER } from '../constants'

type TitleBarProps = {
  path: string
}

/** Three dots and the path, as a terminal's window bar. All of it is decoration. */
export function TitleBar({ path }: TitleBarProps) {
  return (
    <header className="terminal-title-bar">
      <div aria-hidden="true" className="terminal-dots">
        <span />
        <span />
        <span />
      </div>
      <div aria-hidden="true" className="terminal-title">
        <span className="terminal-title-user">{TITLE_BAR_USER} </span>
        {path}
      </div>
    </header>
  )
}
