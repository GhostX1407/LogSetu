import { useTheme } from '../context/ThemeContext.jsx'

// TODO(Antigravity/Cursor): replace this stub with the real dashboard —
// pipeline canvas, traceability view, AI Integrator flow, hash-chain
// verifier. See docs/HANDOFF.md and PROMPT.md for the full spec.
export default function Dashboard() {
  const { theme, toggleTheme } = useTheme()
  const role = localStorage.getItem('logsetu-role') || 'Analyst'

  return (
    <div className="min-h-screen bg-base-light dark:bg-base-dark text-neutral-900 dark:text-neutral-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-mono text-xl">LogSetu — signed in as {role}</h1>
        <button
          onClick={toggleTheme}
          className="text-sm px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700"
        >
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
      <p className="text-neutral-500">
        Dashboard placeholder — pipeline visualization, traceability panel,
        AI Integrator, hash-chain verifier all to be built here.
      </p>
    </div>
  )
}
