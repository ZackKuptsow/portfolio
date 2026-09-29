/**
 * Who the site is about. The page chrome, the metadata and the structured data
 * read from here, so a search engine gets one consistent answer to "who is
 * this".
 *
 * Prose is the exception. The bio in `profile.ts`, the share image and its alt
 * text spell the name and city out, because they are sentences or pictures.
 * Change those by hand when something here changes.
 */

/**
 * Where a visitor can write: the footer links it. The same address the public
 * resume carries. It is left out of the structured data on purpose.
 */
export const CONTACT_EMAIL = 'zkups56@gmail.com'

/**
 * The role as the title, the hero and the structured data name it. A range,
 * never a single layer of the stack.
 */
export const JOB_TITLE = 'Full-Stack Software Engineer'

/** The location, split into the parts structured data asks for. */
export const LOCATION = {
  country: 'US',
  locality: 'Philadelphia',
  region: 'PA',
} as const

/** City and state as shown to visitors. Built from `LOCATION`, so the two cannot disagree. */
export const LOCATION_LABEL = `${LOCATION.locality}, ${LOCATION.region}`

/** Family name, for the structured data and the link-preview tags. */
export const PERSON_FAMILY_NAME = 'Kuptsow'

/** The formal name, as the resume writes it. People search for this form too. */
export const PERSON_FORMAL_NAME = 'Zachary Kuptsow'

/** Given name, for the structured data and the link-preview tags. */
export const PERSON_GIVEN_NAME = 'Zachary'

/**
 * The stylized handle. A search engine may not split it into the two names, so
 * nothing relies on it to carry the name.
 */
export const PERSON_HANDLE = 'zachary.kuptsow'

/** The name he goes by. It leads the title, the hero and the structured data. */
export const PERSON_NAME = 'Zack Kuptsow'

/** The hero's heading: name, role and place on one line. */
export const HERO_NAME_LINE = `${PERSON_NAME} · ${JOB_TITLE} · ${LOCATION_LABEL}`

/** Public profiles. Structured data lists them as the same person. */
export const PROFILE_LINKS = {
  gitHub: 'https://github.com/ZackKuptsow',
  linkedIn: 'https://www.linkedin.com/in/zack-kuptsow/',
} as const

/**
 * Shown under the title in search results. A test keeps it to 160 characters,
 * a common length for results to cut a description off at.
 */
export const SITE_DESCRIPTION = `${PERSON_NAME} (${PERSON_FORMAL_NAME}) is a full-stack software engineer in ${LOCATION_LABEL} who owns the product surfaces and the infrastructure they run on.`

/** The browser tab and the search result title. */
export const SITE_TITLE = `${PERSON_NAME} | ${JOB_TITLE}`

/** The one address the site is served from. No trailing slash. */
export const SITE_URL = 'https://kups.me'
