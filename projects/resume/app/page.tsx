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
          <p>
            I'm a full stack software engineer with a master's in cybersecurity and 6+ years of experience building secure, scalable applications. I’ve contributed to B2B fintech platforms and real-time logistics systems, with a focus on backend architecture, infrastructure, and continuous improvement.
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

        <Section title="Skills">
          <ul className="grid grid-cols-2 gap-2 text-sm text-white/80">
            <li>TypeScript / JavaScript</li>
            <li>React / Tailwind / Redux</li>
            <li>Python / Django</li>
            <li>Node.js / PostgreSQL</li>
            <li>AWS / CDK / Docker</li>
            <li>GitHub Actions / CI/CD</li>
            <li>Shell Scripting / Bash</li>
            <li>Secure Software Design</li>
            <li>Monitoring / Logging</li>
            <li>Testing Automation</li>
          </ul>
        </Section>
      </main>

      <Footer />
    </div>
  )
}