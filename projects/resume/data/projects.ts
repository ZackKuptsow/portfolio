/**
 * Projects shown on their own page: side projects and open source, in the
 * order a reviewer should read them.
 *
 * Every project gives a visitor somewhere to go (the code, a live site, a
 * recorded demo) or says, in a few words, why there is nowhere to go yet. A
 * project card with neither is only a claim.
 *
 * The copy reads like a launch page: what the thing does and who it is for,
 * then what makes it worth a look. No counts, because a count goes stale between
 * deploys. Nothing about how decisions were recorded, and nothing a reader would
 * assume anyway, such as a working 404 page: "That should be a default" (Zack,
 * 2026-11-06). No em or en dash, which `test/data/copy.test.ts` enforces. The
 * private products are described at the level of their public pages and no
 * further.
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
 * Where a visitor can go from the card: at least one link, a recording to open, or the
 * reason the code is private, in a few words, shown where the link would be. A project with
 * none of the three is only a claim, and does not compile.
 */
type ProjectDestination =
  | { links: NonEmptyList<ProjectLink>; privateBecause?: string; video?: ProjectVideo }
  | { links: readonly ProjectLink[]; privateBecause?: string; video: ProjectVideo }
  | { links: readonly ProjectLink[]; privateBecause: string; video?: ProjectVideo }

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

/** The Save State tour, 91 seconds of the iPhone build, the fifth cut (2026-10-28). */
export const SAVE_STATE_TOUR: ProjectVideo = {
  description:
    "A 91 second tour of Save State on an iPhone: the day's session, a card and its follow-up question, a bottleneck drill graded with the reason, mastery by concept, the interview track and its common problems, duels and the mistake bank, Survival, the Estimation Ladder, and the web IDE that is coming.",
  durationLabel: '1:31',
  posterPath: '/save-state-tour-poster.jpg',
  sourcePath: '/save-state-tour.mp4',
  title: 'Save State, a 91 second tour',
  triggerLabel: 'watch the tour',
}

/** The one project that is public code, which the household assistant's card links to as well. */
const HERMES_PLUGIN_REPOSITORY_URL = 'https://github.com/ZackKuptsow/hermes-imessage-shortcuts'

/**
 * The projects, with the links a build is allowed to show. Save State's repository is
 * private while it is being prepared, so its card has the tour and no code link.
 */
export function buildProjects({ saveStateLiveUrl }: ProjectsOptions): NonEmptyList<ProjectEntry> {
  const saveStateLinks: readonly ProjectLink[] = saveStateLiveUrl
    ? [{ href: saveStateLiveUrl, label: 'live site' }]
    : []

  return [
    {
      description:
        'Text your AI agent the way you text anyone else. Hermes Agent, the open source agent from Nous Research, already has iMessage options of its own. This plugin is my take on one, built to experiment with Hermes, n8n automations and local LLMs. Your phone, your Mac, your agent: that is the whole route.',
      highlights: [
        'Private by design: Messages hands the agent one text at a time, so it never needs your message history or broad access to the Mac.',
        'Answers only you: a sender allow list, a shared secret and a dedicated texting profile stand between a stranger and the model.',
        'Tested in the real runtime: CI on macOS installs Hermes Agent from scratch and runs the suite inside it.',
        'The front door to my house: it carries texts to the household assistant, next in this list.',
      ],
      links: [{ href: HERMES_PLUGIN_REPOSITORY_URL, label: 'code' }],
      subtitle: 'Text your AI agent over iMessage · Python · open source · 2026',
      title: 'hermes-imessage-shortcuts',
    },
    {
      description:
        "Run the household from a text thread. Text the assistant to add to the shared shopping list, check off a to-do, set a reminder or get the day's calendar, and it is done. The assistant runs on AWS for the whole household, and a Mac at home answers my own texts with Hermes Agent on a local model.",
      highlights: [
        'Predictable by design: the model only translates a text into a command. Everything that acts is plain, tested code.',
        "The home stays home: the house runs on Home Assistant, kept to the local network, and the Mac's agent runs a local model through Ollama.",
        'An open source front door: texts reach the Mac through hermes-imessage-shortcuts, the plugin above.',
      ],
      links: [{ href: HERMES_PLUGIN_REPOSITORY_URL, label: 'the iMessage plugin' }],
      privateBecause: "it holds the household's data and the home's automations",
      subtitle:
        'Lists, to-dos and reminders by text · Python, AWS, Home Assistant, Hermes Agent · 2026',
      title: 'Household assistant',
    },
    {
      description:
        'Interview prep that fits in your pocket. Spaced repetition cards, back of the envelope estimation drills, quizzes and a timed mock interview, all graded on the spot by the app itself, with no AI at runtime. Start on your phone and carry on from the web.',
      highlights: [
        'One codebase, two platforms: a single Expo app, React Native on iOS and React on the web.',
        'Local first, synced after: progress lives on the device in SQLite and syncs as an append only event log to a serverless AWS backend that stays inside the free tier.',
        'A real code runner: the practice IDE runs your Python in an isolated Lambda behind a token checking gateway, and records every attempt.',
        'Content as code: every card is markdown, checked by Zod schemas at build time and fed from my own study notes.',
      ],
      links: saveStateLinks,
      subtitle:
        'Interview Prep for Engineers · iOS and web · React, React Native, Expo, TypeScript, AWS · 2026',
      title: 'Save State',
      video: SAVE_STATE_TOUR,
    },
    {
      description:
        'Creative collaboration starts here. akin is where creatives of every kind connect around projects rather than follower counts: build a portfolio, pitch what you want to make, then find the people you want to make it with. The waitlist is live, and the mobile app is in progress.',
      highlights: [
        'The app is the product: the creative collaboration app itself, in React Native on Expo.',
        'A waitlist that is already live: a static Next.js site on AWS, provisioned with Terraform, with DynamoDB behind the signups.',
      ],
      links: [{ href: 'https://theakin.app', label: 'live site' }],
      subtitle: 'A startup I co-founded · React Native, Expo, TypeScript, Next.js, AWS · 2026',
      title: 'akin',
    },
    {
      description:
        'A second brain for leisure travel. Capture inspiration from anywhere, plan it into trips, and relive where you have been on a rotating 3D globe. In progress, on iPhone and the web.',
      links: [],
      privateBecause: 'early days',
      subtitle: 'A second brain for travel · Python, TypeScript, AWS · in progress',
      title: 'awty',
    },
    {
      description: 'The tools behind the rest of this list, each with its own tests.',
      highlights: [
        'Notes to audio: one command turns a folder of notes into a Gemini Notebook audio overview.',
        'Interview practice: a local, CodeSignal style server with a vim editor, locked test files and a phase clock, in plain Python with no build step.',
        'Dotfiles: a new Mac is ready from one clone and one script, with the Claude Code skills, agents and hooks I work with. It scans itself before it installs anything.',
      ],
      links: [],
      privateBecause: 'wired to my notes and my machine',
      subtitle: 'Tools I built for my own work · Python, Shell · 2026',
      title: 'Smaller tools',
    },
    {
      description:
        'You are looking at it. A portfolio that behaves like a terminal: scroll, and it types the next command and prints the next section. Underneath is plain HTML, a Next.js static export on S3 and CloudFront from a CDK stack.',
      highlights: [
        'Resume on request: a Step Functions service emails it through SES, with Zod validation and a DynamoDB rate limit in front.',
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
