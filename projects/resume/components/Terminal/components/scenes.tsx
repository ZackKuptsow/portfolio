import { ProjectDemo } from '@/components/ProjectDemo'
import { toTerminalFileName } from '@/components/terminalFileName'
import { HERO_NAME_LINE, LOCATION_LABEL, PERSON_HANDLE } from '@/data/identity'
import { about, education, skillGroups, workExperience } from '@/data/profile'
import { projects } from '@/data/projects'

import { HERO_PATH, SECTION_HEADING } from '../constants'
import { EntryBlock } from './EntryBlock'
import { FileListing } from './FileListing'
import { OutputComment } from './OutputComment'
import { SectionHeading } from './SectionHeading'

import type { SectionId } from '../types'
import type { ReactNode } from 'react'

const FILE_SUFFIX = '.txt'
const FOLDER_SUFFIX = '/'

type SceneProps = {
  children: ReactNode
  id: SectionId
  /** A heading in the scene names it. The hero and About have none. */
  labelledBy?: string
}

/** One section's output. The engine moves and clips this element as the reader scrolls. */
function Scene({ children, id, labelledBy }: SceneProps) {
  return (
    <section
      aria-labelledby={labelledBy}
      className="terminal-scene"
      data-scene={id}
      id={`terminal-section-${id}`}
    >
      <div className="terminal-output">{children}</div>
    </section>
  )
}

type HeroSceneProps = {
  /** The name line is the page's `h1` wherever the hero is the page, and a line elsewhere. */
  isPageHeading: boolean
}

/**
 * The first screen. The handle is what a visitor sees, and the hidden line under it is what a
 * search engine and a screen reader are given: the name people type, with the role and the city.
 */
export function HeroScene({ isPageHeading }: HeroSceneProps) {
  const NameLine = isPageHeading ? 'h1' : 'p'
  return (
    <Scene id="hero">
      <div className="terminal-block terminal-hero" data-block="hero-0">
        <div aria-hidden="true" className="terminal-hero-path text-terminal">
          {HERO_PATH}
        </div>
        <div aria-hidden="true" className="terminal-hero-handle text-terminal">
          {PERSON_HANDLE}
        </div>
        <NameLine className="sr-only">{HERO_NAME_LINE}</NameLine>
        <p className="terminal-tagline">
          <span aria-hidden="true" className="command-prompt">
            $
          </span>{' '}
          full-stack-engineer &amp; <span className="text-primary">./tech.polyglot</span>
        </p>
        <div aria-hidden="true" className="terminal-hero-rule" />
      </div>
    </Scene>
  )
}

type ProfileFieldProps = {
  children: ReactNode
  label: string
}

function ProfileField({ children, label }: ProfileFieldProps) {
  return (
    <p className="terminal-field">
      <span className="terminal-field-label">{label}</span> {children}
    </p>
  )
}

/** The profile, as `cat developer.profile` prints it. The bio carries both forms of the name. */
export function AboutScene() {
  return (
    <Scene id="about">
      <div className="terminal-block" data-block="about-0">
        <ProfileField label="Experience:">
          <span className="text-terminal">{about.experienceYears}</span> {about.experienceSummary}
        </ProfileField>
        <ProfileField label="Specialty:">{about.specialty}</ProfileField>
        <ProfileField label="Based in:">{LOCATION_LABEL}</ProfileField>
        <ProfileField label="Core Technologies:">{about.coreTechnologies.join(' ')}</ProfileField>
        <ProfileField label="Mission:">{about.mission}</ProfileField>
        <p aria-hidden="true" className="terminal-about-label">
          {'// About'}
        </p>
        <p className="terminal-text">{about.bio}</p>
        <p className="terminal-status">
          Last updated: <span className="text-primary">2026</span>
        </p>
        <p className="terminal-sign-off">
          <span aria-hidden="true" className="command-prompt">
            $
          </span>{' '}
          <span className="terminal-typing">
            <span className="sm:hidden">echo &quot;Let&apos;s build something together&quot;</span>
            <span className="hidden sm:inline">
              echo &quot;Let&apos;s build something amazing together&quot;
            </span>
          </span>
        </p>
        <OutputComment commentKey="about" />
      </div>
    </Scene>
  )
}

/** The jobs, one card per step. */
export function WorkScene() {
  const headingId = 'terminal-heading-work'
  const fileNames = workExperience.map((job) => toTerminalFileName(job.title))
  return (
    <Scene id="work" labelledBy={headingId}>
      {workExperience.map((job, index) => (
        <EntryBlock
          key={job.title}
          blockId={`work-${index}`}
          commentKey={fileNames[index]}
          description={job.description}
          header={
            index === 0 && (
              <>
                <SectionHeading id={headingId} title={SECTION_HEADING.work} />
                <FileListing fileNames={fileNames} suffix={FILE_SUFFIX} />
                <OutputComment commentKey="work" />
              </>
            )
          }
          highlights={job.highlights}
          subtitle={job.subtitle}
          title={job.title}
        />
      ))}
    </Scene>
  )
}

/** The degrees, one card per step. Both are from one school, so the files carry a prefix. */
export function EducationScene() {
  const headingId = 'terminal-heading-education'
  const fileNames = education.map((degree) =>
    toTerminalFileName(`${degree.fileNamePrefix} ${degree.title}`),
  )
  return (
    <Scene id="education" labelledBy={headingId}>
      {education.map((degree, index) => (
        <EntryBlock
          key={degree.fileNamePrefix}
          blockId={`education-${index}`}
          commentKey={fileNames[index]}
          description={degree.description}
          header={
            index === 0 && (
              <>
                <SectionHeading id={headingId} title={SECTION_HEADING.education} />
                <FileListing fileNames={fileNames} suffix={FILE_SUFFIX} />
                <OutputComment commentKey="education" />
              </>
            )
          }
          subtitle={degree.subtitle}
          title={degree.title}
        />
      ))}
    </Scene>
  )
}

/** Skills print as one cluster: one command, every column printing together. */
export function SkillsScene() {
  const headingId = 'terminal-heading-skills'
  return (
    <Scene id="skills" labelledBy={headingId}>
      <div className="terminal-block" data-block="skills-0">
        <SectionHeading id={headingId} title={SECTION_HEADING.skills} />
        <FileListing
          fileNames={skillGroups.map((skillGroup) => toTerminalFileName(skillGroup.title))}
          suffix={FOLDER_SUFFIX}
        />
        <OutputComment commentKey="skills" />
        <div className="terminal-columns">
          {skillGroups.map((skillGroup) => (
            <div key={skillGroup.title}>
              <h3 className="terminal-entry-title terminal-glow-hover">{skillGroup.title}</h3>
              <ul className="terminal-list">
                {skillGroup.list.map((skill) => (
                  <li key={skill}>
                    <span aria-hidden="true" className="terminal-arrow">
                      →
                    </span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
              <p aria-hidden="true" className="terminal-skill-count">
                {skillGroup.list.length} items
              </p>
            </div>
          ))}
        </div>
      </div>
    </Scene>
  )
}

type ResumeSceneProps = {
  /** Plain flow's way to the window, since it has no prompt to type the command into. */
  trigger: ReactNode
}

/** Between Skills and Projects. The terminal prints its fake download here. */
export function ResumeScene({ trigger }: ResumeSceneProps) {
  return (
    <Scene id="resume">
      <div className="terminal-block" data-block="resume-0">
        <div className="terminal-resume-trigger">{trigger}</div>
        <div aria-hidden="true" className="terminal-download" data-download-output />
      </div>
    </Scene>
  )
}

type ProjectsSceneProps = {
  isPageHeading: boolean
}

/** The projects, one card per step. A project with a recording gets a control that opens it. */
export function ProjectsScene({ isPageHeading }: ProjectsSceneProps) {
  const headingId = 'terminal-heading-projects'
  const fileNames = projects.map((project) => toTerminalFileName(project.title))
  return (
    <Scene id="projects" labelledBy={headingId}>
      {projects.map((project, index) => (
        <EntryBlock
          key={project.title}
          action={project.video && <ProjectDemo video={project.video} />}
          blockId={`projects-${index}`}
          commentKey={fileNames[index]}
          description={project.description}
          header={
            index === 0 && (
              <>
                <SectionHeading
                  id={headingId}
                  isPageHeading={isPageHeading}
                  title={SECTION_HEADING.projects}
                />
                <FileListing fileNames={fileNames} suffix={FILE_SUFFIX} />
              </>
            )
          }
          highlights={project.highlights}
          links={project.links}
          note={project.privateBecause && `private: ${project.privateBecause}`}
          subtitle={project.subtitle}
          title={project.title}
        />
      ))}
    </Scene>
  )
}
