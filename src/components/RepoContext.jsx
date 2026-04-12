import { createContext, useContext, useState, useEffect } from 'react'

// ─── Default repos ────────────────────────────────────────────────────────────
// Pre-seeded with your two known repos. User can add more via the UI.
const DEFAULT_REPOS = [
  {
    id: 'dissertation',
    label: 'D.Sc. Dissertation',
    repo: 'dissertation-repo',
    owner: import.meta.env.VITE_GITHUB_OWNER,
    token: import.meta.env.VITE_GITHUB_TOKEN,
    color: 'var(--merge)',       // green — academic/primary
    description: 'Algorithmic Accountability · NIST Overlay',
  },
  {
    id: 'substack',
    label: 'Substack Articles',
    repo: 'substack',
    owner: import.meta.env.VITE_GITHUB_OWNER,
    token: import.meta.env.VITE_GITHUB_TOKEN,
    color: 'var(--accent)',      // red — writing/publishing
    description: 'Cybersecurity · CyberLifeCoach',
  },
]

const STORAGE_KEY = 'inkbase:repos'
const ACTIVE_KEY  = 'inkbase:active-repo'

const RepoContext = createContext(null)

export function RepoProvider({ children }) {
  const [repos, setRepos] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : DEFAULT_REPOS
    } catch {
      return DEFAULT_REPOS
    }
  })

  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem(ACTIVE_KEY) || DEFAULT_REPOS[0].id
  })

  const activeRepo = repos.find(r => r.id === activeId) || repos[0]

  // Persist to localStorage whenever repos or activeId change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(repos))
  }, [repos])

  useEffect(() => {
    localStorage.setItem(ACTIVE_KEY, activeId)
  }, [activeId])

  function switchRepo(id) {
    setActiveId(id)
    // Force a full page reload so Octokit re-initialises with the new repo
    window.location.href = '/'
  }

  function addRepo(repo) {
    const newRepo = { ...repo, id: crypto.randomUUID() }
    setRepos(prev => [...prev, newRepo])
    return newRepo.id
  }

  function removeRepo(id) {
    setRepos(prev => prev.filter(r => r.id !== id))
    if (activeId === id) switchRepo(repos[0].id)
  }

  return (
    <RepoContext.Provider value={{ repos, activeRepo, activeId, switchRepo, addRepo, removeRepo }}>
      {children}
    </RepoContext.Provider>
  )
}

export function useRepo() {
  const ctx = useContext(RepoContext)
  if (!ctx) throw new Error('useRepo must be used inside <RepoProvider>')
  return ctx
}

// ─── Active repo values for github.js ────────────────────────────────────────
// Call this anywhere you need the live owner/repo/token values.
// These read from localStorage so they survive hot-reloads.

export function getActiveRepoConfig() {
  try {
    const repos    = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    const activeId = localStorage.getItem(ACTIVE_KEY)
    const active   = repos.find(r => r.id === activeId) || repos[0]
    if (active) return { owner: active.owner, repo: active.repo, token: active.token }
  } catch { /* fall through */ }
  // Fallback to env vars (first-run / no localStorage yet)
  return {
    owner: import.meta.env.VITE_GITHUB_OWNER,
    repo:  import.meta.env.VITE_GITHUB_REPO,
    token: import.meta.env.VITE_GITHUB_TOKEN,
  }
}
