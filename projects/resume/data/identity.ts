/**
 * Who the site is about, in one place. The page, the metadata and the
 * structured data all read from here, so a search engine sees one consistent
 * answer to "who is this".
 */

/**
 * Where a visitor can write. The same address the public resume carries. It is
 * shown on the page, and left out of the structured data on purpose.
 */
export const CONTACT_EMAIL = 'zkups56@gmail.com'

/** How the role is named everywhere. A range, never a single layer of the stack. */
export const JOB_TITLE = 'Full-Stack Software Engineer'

/** City and state as shown to visitors. */
export const LOCATION_LABEL = 'Philadelphia, PA'

/** The same location, split into the parts structured data asks for. */
export const LOCATION = {
  country: 'US',
  locality: 'Philadelphia',
  region: 'PA',
} as const

/** Family name, for structured data. */
export const PERSON_FAMILY_NAME = 'Kuptsow'

/** The formal name, as the resume writes it. People search for this form too. */
export const PERSON_FORMAL_NAME = 'Zachary Kuptsow'

/** Given name, for structured data. */
export const PERSON_GIVEN_NAME = 'Zachary'

/** The stylized handle. It is decoration, and search engines read it as one word. */
export const PERSON_HANDLE = 'zachary.kuptsow'

/** The name people search for most. It leads the title, the hero and the structured data. */
export const PERSON_NAME = 'Zack Kuptsow'

/** The hero's heading: name, role and place on one line. */
export const HERO_NAME_LINE = `${PERSON_NAME} · ${JOB_TITLE} · ${LOCATION_LABEL}`

/** Public profiles. Structured data lists them as the same person. */
export const PROFILE_LINKS = {
  gitHub: 'https://github.com/ZackKuptsow',
  linkedIn: 'https://www.linkedin.com/in/zack-kuptsow/',
} as const

/** Shown under the title in search results, which cut off near 160 characters. */
export const SITE_DESCRIPTION = `${PERSON_NAME} (${PERSON_FORMAL_NAME}) is a full-stack software engineer in ${LOCATION_LABEL} who owns the product surfaces and the infrastructure they run on.`

/** The browser tab and the search result title. */
export const SITE_TITLE = `${PERSON_NAME} | ${JOB_TITLE}`

/** The one address the site is served from. No trailing slash. */
export const SITE_URL = 'https://kups.me'
