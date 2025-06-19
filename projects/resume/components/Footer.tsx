import Image from 'next/image'

export default function Footer() {
  return (
    <footer className="px-12 py-6 flex sm:flex-col items-between justify-between text-gray-500 text-center">
      <div className="flex sm:flex-col items-center gap-8">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://www.linkedin.com/in/zack-kuptsow/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/file.svg" alt="File icon" width={16} height={16} />
          LinkedIn
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://github.com/ZackKuptsow"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="Globe icon" width={16} height={16} />
          Github
        </a>
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/window.svg" alt="Window icon" width={16} height={16} />
          Projects (Coming soon!)
        </a>
      </div>
      <div>&copy; {new Date().getFullYear()} Zack Kuptsow</div>
    </footer>
  )
}
