import { describe, expect, it } from 'vitest'

import { HERO_NAME_LINE, PERSON_FORMAL_NAME, PERSON_NAME, SITE_TITLE } from '@/data/identity'
import { about, education, skillGroups, workExperience } from '@/data/profile'
import { PROJECTS_PAGE_PATH, projects } from '@/data/projects'

import { parseBuiltPage, parseHomePage } from './builtSite'

const PROJECTS_PAGE_FILE = 'projects.html'

/**
 * The words of a page as a reader without a script gets them. The inline scripts go first: Next
 * repeats the page's data in them, so a word could be there for a script and in no element.
 */
function readText(page: Document): string {
  const body = page.body.cloneNode(true) as HTMLElement
  body.querySelectorAll('script, style').forEach((element) => element.remove())
  return body.textContent ?? ''
}

/** The resume's long passages, each of which belongs to one page. */
function listProfilePassages(): string[] {
  return [
    about.bio,
    ...workExperience.flatMap((job) => [job.description ?? '', ...(job.highlights ?? [])]),
    ...education.map((degree) => degree.description),
  ].filter(Boolean)
}

/** Every string the terminal must keep in the HTML of the home page. */
function listProfileWords(): string[] {
  return [
    ...listProfilePassages(),
    ...workExperience.flatMap((job) => [job.title, job.subtitle]),
    ...education.flatMap((degree) => [degree.title, degree.subtitle]),
    ...skillGroups.flatMap((skillGroup) => [skillGroup.title, ...skillGroup.list]),
  ]
}

function listProjectWords(): string[] {
  return projects.flatMap((project) => [
    project.title,
    project.subtitle,
    project.description,
    ...(project.highlights ?? []),
  ])
}

// The terminal shows one screen at a time, and a visitor reads it after the script has run. A
// search engine and a visitor without a script read this file. Nothing visible changes if a
// word goes missing here, so nobody would notice.
describe('the words in the built home page', () => {
  const text = readText(parseHomePage())

  it('holds every job, degree, skill and the bio', () => {
    const profileWords = listProfileWords()

    // Without this, a list that came back short would pass.
    expect(profileWords.length).toBeGreaterThan(40)
    expect(profileWords.filter((words) => !text.includes(words))).toEqual([])
  })

  it('holds every project', () => {
    const projectWords = listProjectWords()

    expect(projectWords.length).toBeGreaterThan(20)
    expect(projectWords.filter((words) => !text.includes(words))).toEqual([])
  })

  it('keeps the name, role and city in the one main heading, and both forms of the name', () => {
    const headings = [...parseHomePage().querySelectorAll('h1')].map((h) => h.textContent)

    expect(headings).toEqual([HERO_NAME_LINE])
    expect(text).toContain(PERSON_NAME)
    expect(text).toContain(PERSON_FORMAL_NAME)
  })
})

describe(`the built projects page, ${PROJECTS_PAGE_PATH}`, () => {
  const page = parseBuiltPage(PROJECTS_PAGE_FILE)
  const text = readText(page)

  it('holds the whole list of projects', () => {
    const projectWords = listProjectWords()

    expect(projectWords.length).toBeGreaterThan(20)
    expect(projectWords.filter((words) => !text.includes(words))).toEqual([])
  })

  it('has its own title and one main heading', () => {
    const headings = [...page.querySelectorAll('h1')].map((h) => h.textContent)

    expect(page.title).toBe(`Projects | ${SITE_TITLE}`)
    expect(headings).toEqual(['# Projects'])
  })

  it('leaves the resume text to the home page, so there is no second copy to index', () => {
    const profilePassages = listProfilePassages()

    expect(profilePassages.length).toBeGreaterThan(15)
    expect(profilePassages.filter((passage) => text.includes(passage))).toEqual([])
  })
})
