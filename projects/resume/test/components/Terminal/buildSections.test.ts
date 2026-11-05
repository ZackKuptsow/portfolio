import { describe, expect, it } from 'vitest'

import { buildSections, buildSteps } from '@/components/Terminal/buildSections'
import { projects } from '@/data/projects'

describe('buildSections', () => {
  it('holds the sections in the order a visitor reads them, with the resume before Projects', () => {
    expect(buildSections().map((section) => section.id)).toEqual([
      'hero',
      'about',
      'work',
      'education',
      'skills',
      'resume',
      'projects',
    ])
  })
})

describe('buildSteps', () => {
  const steps = buildSteps(buildSections())

  it('gives a section with no cards one step that clears the screen', () => {
    expect(steps.filter((step) => step.sectionId === 'skills')).toEqual([
      { blockId: 'skills-0', clearsBefore: true, fileName: null, sectionId: 'skills' },
    ])
  })

  it('gives each card a step, and only the first of a section clears the screen', () => {
    expect(steps.filter((step) => step.sectionId === 'work')).toEqual([
      { blockId: 'work-0', clearsBefore: true, fileName: 'low_rate_co', sectionId: 'work' },
      { blockId: 'work-1', clearsBefore: false, fileName: 'draynow', sectionId: 'work' },
      { blockId: 'work-2', clearsBefore: false, fileName: 'teampay', sectionId: 'work' },
      { blockId: 'work-3', clearsBefore: false, fileName: 'qlik', sectionId: 'work' },
    ])
  })

  it('tells the two degrees of one school apart by their prefixes', () => {
    expect(
      steps.filter((step) => step.sectionId === 'education').map((step) => step.fileName),
    ).toEqual(['cyber_university_of_delaware', 'eleg_university_of_delaware'])
  })

  it('has a step for every project', () => {
    expect(steps.filter((step) => step.sectionId === 'projects')).toHaveLength(projects.length)
  })
})
