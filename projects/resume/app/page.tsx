import { Terminal } from '@/components/Terminal'

/** The home page: the terminal, at its first screen. */
export default function Home() {
  return <Terminal gitLog={[]} startSectionId="hero" />
}
