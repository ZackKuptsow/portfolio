interface ProgramSectionProps {
  children: React.ReactNode
  title: string
}

/** One titled part of a household assistant page. */
export default function ProgramSection({ children, title }: ProgramSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-primary font-mono text-xl font-bold">{title}</h2>
      {children}
    </section>
  )
}
