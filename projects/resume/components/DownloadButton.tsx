export default function DownloadButton() {
  return (
    <div className="flex justify-center mt-8">
      <a
        href="/Zachary_Kuptsow_Resume.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="terminal-download-btn group relative overflow-hidden
                 bg-primary text-background font-mono text-sm font-semibold
                 px-6 py-3 rounded-lg border-2 border-primary
                 hover:bg-transparent hover:text-primary
                 transition-all duration-300 ease-out
                 hover:shadow-glow hover:-translate-y-1
                 before:absolute before:inset-0 before:bg-gradient-to-r 
                 before:from-transparent before:via-background/20 before:to-transparent
                 before:-translate-x-full hover:before:translate-x-full
                 before:transition-transform before:duration-700 before:ease-in-out"
        download="Zachary_Kuptsow_Resume.pdf"
      >
        <span className="relative z-10 flex items-center gap-2">
          <span className="command-prompt">$</span>
          <span>
            wget <span className="underline underline-offset-2">resume.pdf</span>
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="animate-pulse drop-shadow-[0_0_10px_currentColor] transition-all duration-300
                     group-hover:drop-shadow-[0_0_12px_currentColor] [animation-duration:3s]"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
          </svg>
        </span>
      </a>
    </div>
  )
}
