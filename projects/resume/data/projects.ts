/**
 * Projects shown on their own page: side projects and open source, most
 * recent first.
 *
 * Every project links somewhere a visitor can go (the code, a live site, a
 * recorded demo), because a project card with nowhere to go is only a claim.
 * The copy follows the resume's rules: plain sentences, numbers only where
 * the repository can back them, and no em or en dash, which
 * `test/data/copy.test.ts` enforces.
 */

import type { NonEmptyList } from '@/data/profile'

/**
 * Where the projects page is served. The footer links it with the `.html`,
 * because the bucket serves files, not routes: `/projects` alone is a missing
 * path and answers with the 404 page.
 */
export const PROJECTS_PAGE_PATH = '/projects.html'

/** Where a project can be seen. The label is what the visitor clicks. */
export type ProjectLink = {
  href: string
  label: string
}

/**
 * A recorded demo, opened from the card in a dialog. The poster is the frame
 * shown before play, and the description stands in for the video for anyone
 * who cannot watch it.
 */
export type ProjectVideo = {
  description: string
  /** Shown with the trigger, so the visitor knows the commitment before opening it. */
  durationLabel: string
  posterPath: string
  sourcePath: string
  /** The dialog's heading. */
  title: string
  /** The control's text, as a verb a visitor can act on. */
  triggerLabel: string
}

/**
 * Where a visitor can go from the card: at least one link, or a recording to open. A project
 * with neither is only a claim, and does not compile.
 */
type ProjectDestination =
  | { links: NonEmptyList<ProjectLink>; video?: ProjectVideo }
  | { links: readonly ProjectLink[]; video: ProjectVideo }

/** One project on the page. A project shows a paragraph, and may add highlights. */
export type ProjectEntry = ProjectDestination & {
  description: string
  highlights?: NonEmptyList<string>
  subtitle: string
  title: string
}

/** What varies between builds. */
export type ProjectsOptions = {
  /**
   * Where the Save State web build runs. Left unset until it sits behind a
   * login, so the card offers no way to a site anyone could write to.
   */
  saveStateLiveUrl?: string
}

/** The Save State tour, 90 seconds of the iPhone build, recorded 2026-10-28. */
export const SAVE_STATE_TOUR: ProjectVideo = {
  description:
    'A 90 second tour of Save State on an iPhone: the daily session, a card graded with a certainty, an estimation drill, the mock interview clock, and the progress screens.',
  durationLabel: '1:30',
  posterPath: '/save-state-tour-poster.jpg',
  sourcePath: '/save-state-tour.mp4',
  title: 'Save State, a 90 second tour',
  triggerLabel: 'watch the tour',
}

/**
 * The projects, most recent first, with the links a build is allowed to show. Save State's
 * repository is private while it is being prepared, so its card has the tour and no code link.
 */
export function buildProjects({ saveStateLiveUrl }: ProjectsOptions): NonEmptyList<ProjectEntry> {
  const saveStateLinks: readonly ProjectLink[] = saveStateLiveUrl
    ? [{ href: saveStateLiveUrl, label: 'live site' }]
    : []

  return [
    {
      description:
        'A platform plugin for Hermes Agent, the open source agent from Nous Research, that lets you text your agent over iMessage from a Mac you already own, with no Full Disk Access and no relay service in the middle. A Shortcuts automation posts each incoming text to a listener on the loopback address; the reply goes back through imsg from the same Messages account.',
      highlights: [
        'A sender allow list checked before the gateway sees a text, a shared secret compared in constant time, and a refusal to start in any profile but the texting one, so a cloud model in another profile can never answer by accident.',
        '72 tests, 15 of them inside the agent runtime itself. CI runs both forms on macOS, the second after installing Hermes Agent with its own install script.',
        'An optional tool forwards a household command to a second service and reports only whether the answer was delivered, so the other person in the house never has their data pass through the model.',
      ],
      links: [{ href: 'https://github.com/ZackKuptsow/hermes-imessage-shortcuts', label: 'code' }],
      subtitle: 'Hermes Agent platform plugin · Python · 2026',
      title: 'hermes-imessage-shortcuts',
    },
    {
      description:
        'A system design interview study app for iPhone and the web: spaced repetition cards, back of the envelope estimation drills, quizzes and a timed mock interview, all graded without any runtime AI. Progress lives on the device in SQLite and syncs as an append only event log to a serverless AWS backend that stays inside the free tier.',
      highlights: [
        'One Expo codebase for iOS and web, 31 phases since September 2026, each closed by a multi agent review with every finding fixed or left with its reason.',
        "A practice IDE runs the learner's Python in a Lambda with no route out of its VPC, behind a token checking gateway with reserved concurrency, and records the attempt without a self report.",
        'Content is markdown with frontmatter, checked by Zod schemas at build time and fed from an Obsidian study vault.',
      ],
      links: saveStateLinks,
      subtitle: 'System design interview prep on iOS and web · Expo, TypeScript, AWS · 2026',
      title: 'Save State',
      video: SAVE_STATE_TOUR,
    },
    {
      description:
        'This site, and the AWS behind it: a Next.js static export on S3 and CloudFront from a CDK stack, and a Step Functions service that emails the resume on request through SES, with Zod validation and a DynamoDB rate limit in front of it.',
      highlights: [
        'The checks run against the built files and in a real browser: sections revealed on a phone, no sideways scroll, focus kept inside the resume dialog, and every request to another host aborted so no check can send an email.',
        'A missing path answers with the 404 page and a 404 status, every PDF carries a noindex header, and the payload scan runs first in every CI job that installs.',
      ],
      links: [{ href: 'https://github.com/ZackKuptsow/portfolio', label: 'code' }],
      subtitle: 'kups.me · Next.js, AWS CDK, Step Functions · 2025 to 2026',
      title: 'This site',
    },
  ]
}

/** The projects this build shows. The live link appears only when the build names the site. */
export const projects: NonEmptyList<ProjectEntry> = buildProjects({
  saveStateLiveUrl: process.env.NEXT_PUBLIC_SAVE_STATE_LIVE_URL,
})
