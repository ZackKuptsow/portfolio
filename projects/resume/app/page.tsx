import Card from '@/components/Card'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Section from '@/components/Section'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col font-sans">
      <Header />
      <main className="flex flex-col items-center justify-start flex-1 px-8 pb-20 gap-16 sm:px-20 w-full max-w-3xl mx-auto">
        <Section title="About">
          <p className="text-[color:var(--foreground)]/70 leading-relaxed">
            I’m a full stack software engineer who thrives on building reliable, maintainable
            software across the stack. With a strong foundation in both backend and frontend
            development, I’ve built and improved complex systems for logistics, fintech, and
            analytics platforms — always with an eye toward clean architecture and thoughtful user
            experience.
          </p>

          <p className="text-[color:var(--foreground)]/70 leading-relaxed mt-4">
            I value code that’s easy to understand, tooling that supports the team, and features
            that solve real problems. Whether working in TypeScript, Python, or Rust, I focus on
            writing secure, testable, and resilient applications that are easy to evolve.
          </p>
        </Section>

        <Section title="Work Experience">
          <Card
            title="DrayNow"
            description="Driving backend development in a 13-service AWS environment. Led major Node upgrade, built CI workflows, refactored legacy code, and supported real-time event-driven systems."
          />
          <Card
            title="Teampay"
            description="Owned full-stack features in a B2B fintech platform. Built UIs in React/TS, APIs in Django, improved modularity and support workflows, and delivered secure automation features."
          />
          <Card
            title="Qlik"
            description="Built a full-stack anomaly detection system with Django and Qlik Sense Cloud. Enhanced security observability using NetFlow data and dynamic dashboards."
          />
        </Section>
        <Section title="Education" className="w-full">
          <Card
            className="w-full"
            title="University of Delaware"
            subtitle="M.S. Cybersecurity · 2019–2021"
            description="Concentration: Secure Software"
          />
          <Card
            title="University of Delaware"
            subtitle="B.E.E. Electrical Engineering · 2015–2019"
            description="Minor: Integrated Design"
          />
        </Section>
        <Section title="Skills">
          <div className="flex flex-row gap-8 text-sm text-[color:var(--foreground)]/80">
            <div>
              <h4 className="text-lg font-semibold">Languages</h4>
              <ul className="list-disc list-inside">
                <li>TypeScript / JavaScript</li>
                <li>Python</li>
                <li>Bash / Shell</li>
                <li>Go / Rust (learning)</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold">Frameworks</h4>
              <ul className="list-disc list-inside">
                <li>React / Next.js</li>
                <li>Django / DRF</li>
                <li>Node.js</li>
                <li>Tailwind CSS</li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibolde">Infrastructure</h4>
              <ul className="list-disc list-inside">
                <li>AWS (CDK, SQS, SNS, ECS)</li>
                <li>Docker</li>
                <li>GitHub Actions</li>
                <li>Monitoring / Logging</li>
              </ul>
            </div>
          </div>
        </Section>
        <a
          href="/Zachary_Kuptsow_Resume.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 text-sm px-4 py-2 border border-[color:var(--foreground)]/20 rounded hover:border-emerald-500 hover:text-emerald-400 transition"
          download="Zachary_Kuptsow_Resume.pdf"
        >
          Download Resume
        </a>
      </main>

      <Footer />
    </div>
  )
}
