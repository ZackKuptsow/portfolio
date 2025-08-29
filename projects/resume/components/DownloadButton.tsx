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
          <span>wget <span className="underline underline-offset-2">resume.pdf</span></span>
          <span className="text-xs opacity-90 group-hover:opacity-100 group-hover:drop-shadow-[0_0_12px_currentColor] 
                     animate-pulse drop-shadow-[0_0_10px_currentColor] transition-all duration-300
                     [animation-duration:3s]">⬇</span>
        </span>
      </a>
    </div>
  )
}