'use client'

import AboutMe from '@/components/AboutMe'
import Card from '@/components/Card'
import Footer from '@/components/Footer'
import { GetResume } from '@/components/GetResume'
import Header from '@/components/Header'
import { ScrollFadeIn } from '@/components/ScrollFadeIn'
import Section from '@/components/Section'
import SlimCard from '@/components/SlimCard'
import { education, skillGroups, workExperience } from '@/data/profile'

export default function Home() {
  return (
    <div className="custom-gradient flex min-h-screen flex-col font-sans">
      <Header />

      <main className="flex flex-col items-center justify-start flex-1 px-8 pb-20 gap-16 sm:px-20 w-full max-w-5xl mx-auto">
        <ScrollFadeIn>
          <AboutMe />
        </ScrollFadeIn>

        <ScrollFadeIn delay={200}>
          <Section title="Work Experience">
            {workExperience.map((job) => (
              <Card
                key={job.title}
                description={job.description}
                highlights={job.highlights}
                subtitle={job.subtitle}
                title={job.title}
              />
            ))}
          </Section>
        </ScrollFadeIn>

        <ScrollFadeIn delay={400}>
          <Section title="Education">
            {education.map((degree) => (
              <Card
                key={degree.fileNamePrefix}
                description={degree.description}
                fileNamePrefix={degree.fileNamePrefix}
                subtitle={degree.subtitle}
                title={degree.title}
              />
            ))}
          </Section>
        </ScrollFadeIn>

        <ScrollFadeIn delay={600}>
          <Section
            title="Skills"
            className="[&>div]:space-y-0 [&>div]:md:grid [&>div]:md:grid-cols-3 [&>div]:md:gap-8 [&>div]:space-y-6 [&>div]:md:space-y-0"
          >
            {skillGroups.map((skillGroup) => (
              <SlimCard key={skillGroup.title} list={skillGroup.list} title={skillGroup.title} />
            ))}
          </Section>
        </ScrollFadeIn>

        <ScrollFadeIn delay={800}>
          <GetResume />
        </ScrollFadeIn>
      </main>

      <Footer />
    </div>
  )
}
