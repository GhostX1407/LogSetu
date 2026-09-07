import { useNavigate } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext.jsx'

// MOCKED LOGIN — no real backend auth. Selecting a role just stores it
// in localStorage and routes to the dashboard, so UI role-gating
// (e.g. "Approve AI Mapping" visible only to Admin) can be demoed.
const ROLES = ['Analyst', 'Admin', 'Auditor']

export default function Login() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()

  const handleLogin = (role) => {
    localStorage.setItem('logsetu-role', role)
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-light dark:bg-base-dark text-neutral-900 dark:text-neutral-100 transition-colors">
      <button
        onClick={toggleTheme}
        className="absolute top-6 right-6 text-sm px-3 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700"
      >
        {theme === 'dark' ? 'Light mode' : 'Dark mode'}
      </button>

      <div className="w-full max-w-sm p-8 rounded-2xl bg-panel-light dark:bg-panel-dark border border-neutral-200 dark:border-neutral-800">
        <h1 className="font-mono text-2xl tracking-tight mb-1">LogSetu</h1>
        <p className="text-sm text-neutral-500 mb-6">
          Universal Log Pre-processing Framework — SIH26156
        </p>

        <div className="space-y-2">
          {ROLES.map((role) => (
            <button
              key={role}
              onClick={() => handleLogin(role)}
              className="w-full text-left px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:border-accent transition-colors"
            >
              Sign in as {role}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
