interface SectionProps {
  title: string
  children: React.ReactNode
}

export default function Section({ title, children }: SectionProps) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
