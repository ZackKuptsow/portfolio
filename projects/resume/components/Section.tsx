interface SectionProps {
  children: React.ReactNode
  className?: string
  title: string
}

export default function Section({ children, className, title }: SectionProps) {
  return (
    <section className={`mb-10 ${className}`}>
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
