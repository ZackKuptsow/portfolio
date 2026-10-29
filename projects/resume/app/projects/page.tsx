import Link from 'next/link'

import Card from '@/components/Card'
import Footer from '@/components/Footer'
import { ProjectDemo } from '@/components/ProjectDemo'
import { PERSON_NAME, SITE_TITLE } from '@/data/identity'
import { PROJECTS_PAGE_PATH, projects } from '@/data/projects'

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
 * The projects, one card each, most recent first. A project with a recording
 * gets a control that opens it in a window; the rest link out to the code.
 */
export default function ProjectsPage() {
  return (
    <div className="custom-gradient min-h-screen font-sans">
      <main className="w-full max-w-4xl mx-auto px-8 py-20 sm:px-12">
        <nav aria-label="Back" className="mb-12 font-mono text-sm">
          <Link className="text-muted-foreground hover:text-primary transition-colors" href="/">
            <span aria-hidden="true">← </span>
            kups.me
          </Link>
        </nav>

        <div className="mb-8">
          <div aria-hidden="true" className="font-mono text-sm text-muted-foreground mb-2">
            <span className="command-prompt">$</span> cd ./projects
          </div>
          <h1
            className="text-primary font-mono text-2xl font-bold border-l-4 border-primary/30 pl-4
                       terminal-glow-hover hover:border-primary/60 transition-all duration-200"
          >
            <span aria-hidden="true"># </span>
            {PAGE_TITLE}
          </h1>
        </div>

        <div className="space-y-6">
          {projects.map((project) => (
            <Card
              key={project.title}
              action={project.video && <ProjectDemo video={project.video} />}
              description={project.description}
              highlights={project.highlights}
              links={project.links}
              note={project.privateBecause && `private: ${project.privateBecause}`}
              subtitle={project.subtitle}
              title={project.title}
            />
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
