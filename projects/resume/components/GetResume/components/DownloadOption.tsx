import { RESUME_PDF_FILE_NAME, RESUME_PDF_PATH, TERMINAL_BUTTON_CLASS_NAME } from '../constants'
import { DownloadIcon } from './DownloadIcon'

/** The PDF download link. Every email error message points visitors back to it. */
export function DownloadOption() {
  return (
    <div className="flex">
      <a
        href={RESUME_PDF_PATH}
        target="_blank"
        rel="noopener noreferrer"
        className={`${TERMINAL_BUTTON_CLASS_NAME} flex-1`}
        download={RESUME_PDF_FILE_NAME}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span className="command-prompt">$</span>
          <span>
            wget <span className="underline underline-offset-2">resume.pdf</span>
          </span>
          <DownloadIcon />
        </span>
      </a>
    </div>
  )
}
