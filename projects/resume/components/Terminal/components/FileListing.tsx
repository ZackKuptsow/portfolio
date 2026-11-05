import { Fragment } from 'react'

const WORD_SEPARATOR = '_'

type FileListingProps = {
  fileNames: readonly string[]
  /** What `ls` prints after each name: `.txt` for a file, `/` for a folder. */
  suffix: string
}

/**
 * What `ls` prints: the section's files on a row. A name can be wider than a phone, so it may
 * wrap after each underscore, and never in the middle of a word.
 */
export function FileListing({ fileNames, suffix }: FileListingProps) {
  return (
    <p aria-hidden="true" className="terminal-listing">
      {fileNames.map((fileName) => (
        <span key={fileName} className="terminal-listing-file">
          {fileName.split(WORD_SEPARATOR).map((word, index) => (
            <Fragment key={`${word}-${index}`}>
              {index > 0 && (
                <>
                  {WORD_SEPARATOR}
                  <wbr />
                </>
              )}
              {word}
            </Fragment>
          ))}
          {suffix}
        </span>
      ))}
    </p>
  )
}
