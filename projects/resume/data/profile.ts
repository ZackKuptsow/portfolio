/**
 * Resume content shown on the page.
 *
 * Job highlights, skills and the bio are copied from the public resume, the
 * same source the PDF is rendered from, so they match it word for word. The
 * page is not a full copy: it shows a selection of the highlights, and the
 * Qlik entry, the degree descriptions, `mission` and `specialty` exist only
 * here.
 */

/** A list with at least one item, so an empty list cannot stand in for content. */
export type NonEmptyList<Item> = readonly [Item, ...Item[]]

type WorkExperienceHeading = {
  subtitle: string
  title: string
}

/**
 * One job on the page. A job shows a paragraph, a list of highlights, or both.
 * Each variant requires one of the two, so a job with neither does not compile
 * and cannot render as an empty card.
 */
export type WorkExperienceEntry = WorkExperienceHeading &
  (
    | { description: string; highlights?: NonEmptyList<string> }
    | { description?: string; highlights: NonEmptyList<string> }
  )

/** One degree on the page. */
export type EducationEntry = {
  description: string
  /** Put before the title in the card's prompt, so cards that share a school show different files. */
  fileNamePrefix: string
  subtitle: string
  title: string
}

/** One column of the skills section. */
export type SkillGroup = {
  list: readonly string[]
  title: string
}

/** Jobs, most recent first. */
export const workExperience: readonly WorkExperienceEntry[] = [
  {
    highlights: [
      'Set architecture and technical direction for an AI-powered mortgage lead-conversion platform managing a $60M loan pipeline, built on Python/Quart, GCP/Terraform, and React/TypeScript.',
      'Led detection, containment, and recovery from a targeted supply-chain attack as sole responder, then shipped fail-closed CI scanning, immutable dependency pinning, and hardened org-level controls that automatically blocked subsequent attempts.',
      'Automated loan-document generation and delivery: Fannie Mae 1003/URLA PDFs and MISMO 3.4 XML conforming to the external industry schema, and idempotent outbound sync to the loan origination system behind transactional debounce locking, removing manual application re-keying.',
      'Architected a reusable async-retry framework powering all production LLM workloads (Cloud Tasks-backed deferred queues, dead-letter handling, and operator kill switches), plus a code-generation scaffold so every new AI feature inherits the same reliability guarantees by default.',
      'Built the release platform on GitHub Actions: gated PRs, automated Terraform and container rollouts, keyless authentication with no long-lived credentials in CI, and verified promotion from staging to production.',
      'Reduced Cloud Run spend by 76% and removed daily latency spikes through metrics-driven right-sizing and a scheduled pre-warm/scale-to-zero pattern.',
      'Redesigned the customer dashboard in seven flag-gated phases with no disruption to live users.',
    ],
    subtitle: 'Founding Lead Engineer · March 2026 - September 2026 · Remote',
    title: 'Low Rate Co.',
  },
  {
    highlights: [
      'Drove backend development across a 13-service distributed system, serverless and event-driven, using Node.js, TypeScript, and PostgreSQL on AWS (Lambda, Step Functions, SQS/SNS, S3, ECS) managed through CDK, for an intermodal freight marketplace that moves tens of thousands of loads per month.',
      'Authentication migration, as technical lead: replaced a 6-year-old homegrown service with Kinde to achieve SOC2 compliance, a 4-month effort touching 400,000+ lines of code across two mobile apps, the web frontend, the public API, and internal services, delivered with zero downtime behind feature flags and backward-compatible tokens.',
      'Reduced AWS database costs by ~10% and improved API latency by 30-50% by optimizing query patterns during the authentication migration.',
      'Upgraded Node.js from v16 to v22 across the core platform and more than 20 major dependencies, absorbing breaking changes across six major versions with zero downtime and ~15% better performance.',
      'Automated multi-tenant provisioning with AWS CDK build configurations, so adding a tenant across every environment took one config entry and no manual certificate or DNS work.',
      'Established CI/CD on GitHub Actions with automated coverage reporting, test sharding, and shared linting standards across backend services.',
      'Stood up DataDog dashboards and Slack-routed error alerting for on-call triage, set the platform-wide structured logging standard, and carried the weekly on-call rotation.',
    ],
    subtitle: 'Software Engineer · July 2024 - March 2026 · Conshohocken, PA',
    title: 'DrayNow',
  },
  {
    highlights: [
      'Wrote and maintained RESTful APIs for a corporate spend platform processing roughly $2B in monthly transaction volume, using Python, Django, and PostgreSQL, with React and TypeScript on the front end.',
      "Spend-approval rules engine, the platform's original core logic: rebuilt it from 1:1 manager-employee approvals to many-to-many group approvals, decoupling the relationship from the database layer upward while preserving backward compatibility.",
      'Extended the Forest Admin integration so Customer Success could safely modify production data through engineer-defined validation, cutting engineering escalations from 24% to 7%.',
      'Shipped SAML/SCIM SSO with Okta and OneLogin for enterprise onboarding, along with a self-service vendor portal and multi-line card logic for expense tracking.',
      'Resolved hundreds of escalated production issues using Bash and the Django shell in Dockerized environments, and managed weekly releases through GitHub Actions.',
    ],
    subtitle: 'Software Engineer · September 2021 - February 2024 · Remote',
    title: 'Teampay',
  },
  {
    description:
      'Built a full stack anomaly detection system with Django and Qlik Sense Cloud. Enhanced security observability using NetFlow data and dynamic dashboards.',
    subtitle: 'Security Intern · December 2019 - June 2020',
    title: 'Qlik',
  },
]

/** Degrees, most recent first. Never empty: the structured data names the school of the first. */
export const education: NonEmptyList<EducationEntry> = [
  {
    description:
      'Advanced degree focused on secure software development, cryptography, network security, and digital forensics. Specialized coursework in vulnerability assessment, secure coding practices, and cybersecurity risk management.',
    fileNamePrefix: 'cyber',
    subtitle: 'Master of Science - Cybersecurity · August 2019 - June 2021',
    title: 'University of Delaware',
  },
  {
    description:
      "Bachelor's degree in Electrical Engineering with integrated design minor. Coursework covered circuit design, signal processing, embedded systems, and interdisciplinary engineering design principles.",
    fileNamePrefix: 'eleg',
    subtitle: 'Bachelor of Electrical Engineering · August 2015 - June 2019',
    title: 'University of Delaware',
  },
]

/** Skills columns, in the order the resume lists them. */
export const skillGroups: readonly SkillGroup[] = [
  {
    list: [
      'Python (Django, Quart/Flask)',
      'TypeScript / JavaScript (Node/Express)',
      'React / Tailwind CSS',
      'SQL / PostgreSQL',
      'Bash / shell scripting',
      'Terraform (HCL)',
      'Jest / Vitest / Pytest',
    ],
    title: 'Languages & Frameworks',
  },
  {
    list: [
      'GCP (Cloud Run, Cloud Tasks, Firestore, Pub/Sub, BigQuery)',
      'AWS (Lambda, Step Functions, SQS/SNS, ECS, S3, CDK)',
      'GitHub Actions',
      'Docker',
      'Supabase / Firebase',
      'LaunchDarkly',
    ],
    title: 'Infrastructure & Tooling',
  },
  {
    list: [
      'AI/LLM engineering (OpenAI, Anthropic, agentic pipelines)',
      'Supply-chain security & incident response',
      'Event-driven architecture',
      'Observability & monitoring (DataDog)',
      'Performance & cloud cost optimization',
    ],
    title: 'Practices & Systems',
  },
]

/** Copy for the About section. Both forms of the name open the bio, since people search for either. */
export const about = {
  bio: 'Zack Kuptsow (Zachary Kuptsow) is a full-stack engineer in Philadelphia who owns the product surfaces and the infrastructure they run on, with 5+ years across fintech, logistics, and AI products. Most recently founding lead engineer for an AI-powered mortgage platform, end to end: backend, frontend, infrastructure, CI/CD, security and compliance. Lays the groundwork so each new feature starts out as dependable as the one before it.',
  coreTechnologies: [
    'TypeScript',
    'Python',
    'React',
    'Node',
    'Django',
    'PostgreSQL',
    'AWS',
    'GCP',
    'Terraform',
  ],
  experienceSummary: 'years across fintech, logistics, and AI products',
  experienceYears: '5+',
  mission: 'Building reliable, maintainable software — that solves real problems',
  specialty: 'Full stack development with continuous learning mindset',
} as const
