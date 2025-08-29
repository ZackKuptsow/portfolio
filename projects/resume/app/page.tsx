'use client'

import { education, skills, workExperience } from '@/data/profile'

import AboutMe from '@/components/AboutMe'
import Card from '@/components/Card'
import DownloadButton from '@/components/DownloadButton'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ScrollFadeIn from '@/components/ScrollFadeIn'
import Section from '@/components/Section'
import SlimCard from '@/components/SlimCard'

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
            {workExperience.map((job, index) => (
              <Card
                key={index}
                title={job.title}
                description={job.description}
              />
            ))}
          </Section>
        </ScrollFadeIn>
        
        <ScrollFadeIn delay={400}>
          <Section title="Education">
            {education.map((edu, index) => (
              <Card
                key={index}
                title={edu.title}
                subtitle={edu.subtitle}
                description={edu.description}
              />
            ))}
          </Section>
        </ScrollFadeIn>
        
        <ScrollFadeIn delay={600}>
          <Section title="Skills" className="[&>div]:space-y-0 [&>div]:md:grid [&>div]:md:grid-cols-3 [&>div]:md:gap-8 [&>div]:space-y-6 [&>div]:md:space-y-0">
            <SlimCard
              list={skills.languages}
              title="Languages"
            />
            <SlimCard
              list={skills.frameworks}
              title="Frameworks"
            />
            <SlimCard
              list={skills.infrastructure}
              title="Infrastructure"
            />
          </Section>
        </ScrollFadeIn>
        
        <ScrollFadeIn delay={800}>
          <DownloadButton />
        </ScrollFadeIn>
      </main>

      <Footer />
    </div>
  )
}
