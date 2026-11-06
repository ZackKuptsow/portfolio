import { readGitLog } from '@/app/readGitLog'
import { Terminal } from '@/components/Terminal'

/** The home page: the terminal, at its first screen. The commits are read here, at build. */
export default function Home() {
  return <Terminal gitLog={readGitLog()} startSectionId="hero" />
}
