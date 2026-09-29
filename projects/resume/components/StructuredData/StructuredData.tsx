import {
  buildProfilePageStructuredData,
  serializeStructuredData,
} from './buildProfilePageStructuredData'

const STRUCTURED_DATA_MIME_TYPE = 'application/ld+json'

/**
 * The machine-readable description of the page. It renders on the server, so
 * in the static export the date is the moment the site was built. Keep it out
 * of client components: there the date would be the visitor's clock.
 *
 * Setting inner HTML is safe here for two reasons: every value is a constant
 * from this repo, never visitor input, and the serializer escapes "<".
 */
export function StructuredData() {
  const structuredData = buildProfilePageStructuredData(new Date())

  return (
    <script
      type={STRUCTURED_DATA_MIME_TYPE}
      dangerouslySetInnerHTML={{ __html: serializeStructuredData(structuredData) }}
    />
  )
}
