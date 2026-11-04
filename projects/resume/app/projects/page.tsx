import { Terminal } from '@/components/Terminal'
import { PERSON_NAME, SITE_TITLE } from '@/data/identity'
import { PROJECTS_PAGE_PATH } from '@/data/projects'

import type { Metadata } from 'next'

const PAGE_TITLE = 'Projects'

/**
 * The page names itself as canonical, so the root layout's canonical does not
 * claim it for the home page. It is indexed: the point of the page is to be
 * found.
 */
export const metadata: Metadata = {
  alternates: { canonical: PROJECTS_PAGE_PATH },
  description: `Side projects and open source by ${PERSON_NAME}: a Hermes Agent plugin, a system design study app with a recorded tour, and the AWS behind this site.`,
  title: `${PAGE_TITLE} | ${SITE_TITLE}`,
}

/**
 * The same terminal as the home page, opened at Projects, so a search result or a shared link
 * lands on them. Its own title and `h1` are what keep it worth indexing.
 */
export default function ProjectsPage() {
  return <Terminal startSectionId="projects" />
}
