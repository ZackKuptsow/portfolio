import {
  RESUME_PDF_FILE_NAME,
  RESUME_PDF_PATH,
  TERMINAL_BUTTON_CLASS_NAME,
  TERMINAL_OUTLINE_BUTTON_CLASS_NAME,
} from '../constants'
import { DownloadIcon } from './DownloadIcon'
import { OpenIcon } from './OpenIcon'

/**
 * Two links to the same PDF: one saves it, and the quieter one under it opens it in the
 * browser. Every email error message points visitors back to the download.
 */
export function DownloadOption() {
  return (
    <div className="flex flex-col gap-2">
      <a
        href={RESUME_PDF_PATH}
        target="_blank"
        rel="noopener noreferrer"
        className={TERMINAL_BUTTON_CLASS_NAME}
        download={RESUME_PDF_FILE_NAME}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span aria-hidden="true" className="command-prompt">
            $
          </span>
          <span>
            wget <span className="underline underline-offset-2">resume.pdf</span>
          </span>
          <DownloadIcon />
        </span>
      </a>
      {/* No `download` attribute here, so the browser opens the PDF in its viewer. That
          relies on the server sending it with no Content-Disposition header, as the
          infrastructure project's S3 and CloudFront setup does today. */}
      <a
        href={RESUME_PDF_PATH}
        target="_blank"
        rel="noopener noreferrer"
        className={TERMINAL_OUTLINE_BUTTON_CLASS_NAME}
      >
        <span className="flex items-center justify-center gap-2">
          <span aria-hidden="true" className="command-prompt">
            $
          </span>
          <span>
            open <span className="underline underline-offset-2">resume.pdf</span>
          </span>
          <OpenIcon />
        </span>
      </a>
    </div>
  )
}
