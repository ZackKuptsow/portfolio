type SectionHeadingProps = {
  id: string
  /** `/projects.html` is its own page, so there the Projects heading is the page's `h1`. */
  isPageHeading?: boolean
  title: string
}

/** `# Work Experience`. The hash is decoration, hidden from assistive technology. */
export function SectionHeading({ id, isPageHeading = false, title }: SectionHeadingProps) {
  const Heading = isPageHeading ? 'h1' : 'h2'
  return (
    <Heading id={id} className="terminal-section-heading terminal-glow-hover">
      <span aria-hidden="true"># </span>
      {title}
    </Heading>
  )
}
