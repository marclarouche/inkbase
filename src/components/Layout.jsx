import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { GitPullRequest, Plus, Home, ChevronDown, Database, Check, Settings, X, GitBranch, Shield } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import NewArticleModal from './NewArticleModal.jsx'
import { useRepo } from './RepoContext.jsx'

export default function Layout() {
  const [showNew, setShowNew]           = useState(false)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [showAddRepo, setShowAddRepo]   = useState(false)
  const switcherRef                     = useRef(null)
  const navigate                        = useNavigate()
  const { repos, activeRepo, switchRepo, addRepo, removeRepo } = useRepo()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setShowSwitcher(false)
        setShowAddRepo(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: 'var(--paper-card)',
        borderBottom: '1px solid var(--border)',
        padding: '0 2rem',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: 1100, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          height: 60,
        }}>

          {/* Wordmark */}
          <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img src="/inkbase-icon.svg" alt="Inkbase" width={28} height={28} style={{ display: 'block' }} />
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}>
              ink<span style={{ color: 'var(--accent)' }}>base</span>
            </span>
          </NavLink>

          {/* ── Repo Switcher ── */}
          <div ref={switcherRef} style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowSwitcher(s => !s); setShowAddRepo(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.35rem 0.75rem',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                background: 'var(--paper-card)',
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.78rem',
                color: 'var(--ink-muted)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = activeRepo.color}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
            >
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: activeRepo.color, flexShrink: 0,
              }} />
              <GitBranch size={12} />
              <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {activeRepo.repo}
              </span>
              <ChevronDown size={12} style={{
                transition: 'transform 0.15s',
                transform: showSwitcher ? 'rotate(180deg)' : 'none',
              }} />
            </button>

            {/* Dropdown */}
            {showSwitcher && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 6px)', left: '50%',
                transform: 'translateX(-50%)',
                width: 300,
                background: 'var(--paper-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
                overflow: 'hidden',
                zIndex: 200,
              }}>
                <div style={{
                  padding: '0.6rem 1rem',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <Database size={12} color="var(--ink-faint)" />
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                    textTransform: 'uppercase', letterSpacing: '0.08em',
                    color: 'var(--ink-faint)',
                  }}>
                    Switch Repository
                  </span>
                </div>

                <div style={{ padding: '0.4rem' }}>
                  {repos.map(repo => {
                    const isActive = repo.id === activeRepo.id
                    return (
                      <div
                        key={repo.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.6rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: 'var(--radius)',
                          background: isActive ? 'var(--paper-warm)' : 'transparent',
                          cursor: isActive ? 'default' : 'pointer',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--paper-warm)' }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                        onClick={() => { if (!isActive) { switchRepo(repo.id); setShowSwitcher(false) } }}
                      >
                        <span style={{
                          width: 9, height: 9, borderRadius: '50%',
                          background: repo.color, flexShrink: 0,
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontFamily: 'var(--font-mono)', fontSize: '0.8rem',
                            color: 'var(--ink)', fontWeight: isActive ? 600 : 400,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>
                            {repo.repo}
                          </div>
                          {repo.description && (
                            <div style={{
                              fontSize: '0.72rem', color: 'var(--ink-faint)',
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {repo.description}
                            </div>
                          )}
                        </div>
                        {isActive ? (
                          <Check size={13} color={repo.color} style={{ flexShrink: 0 }} />
                        ) : (
                          repos.length > 1 && (
                            <button
                              onClick={e => { e.stopPropagation(); removeRepo(repo.id) }}
                              style={{
                                background: 'none', border: 'none', padding: '0.1rem',
                                cursor: 'pointer', color: 'var(--ink-faint)',
                                display: 'flex', alignItems: 'center',
                                borderRadius: '3px', flexShrink: 0,
                              }}
                              onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
                              onMouseLeave={e => e.currentTarget.style.color = 'var(--ink-faint)'}
                              title="Remove repo"
                            >
                              <X size={12} />
                            </button>
                          )
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', padding: '0.4rem' }}>
                  {!showAddRepo ? (
                    <button
                      onClick={() => setShowAddRepo(true)}
                      style={{
                        width: '100%', padding: '0.5rem 0.75rem',
                        background: 'none', border: 'none', borderRadius: 'var(--radius)',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
                        color: 'var(--ink-faint)',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--paper-warm)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    >
                      <Settings size={12} /> Add repository…
                    </button>
                  ) : (
                    <AddRepoForm
                      onAdd={(repo) => {
                        const id = addRepo(repo)
                        switchRepo(id)
                        setShowSwitcher(false)
                        setShowAddRepo(false)
                      }}
                      onCancel={() => setShowAddRepo(false)}
                    />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <NavLink to="/" className="btn btn-ghost" style={navStyle}>
              <Home size={15} /> Library
            </NavLink>
            <NavLink to="/catalog" className="btn btn-ghost" style={navStyle}>
              <Shield size={15} /> Catalog
            </NavLink>
            <NavLink to="/review" className="btn btn-ghost" style={navStyle}>
              <GitPullRequest size={15} /> Review Queue
            </NavLink>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> New Article
            </button>
          </nav>
        </div>
      </header>

      {/* Active repo banner */}
      {activeRepo.id !== 'dissertation' && (
        <div style={{
          background: activeRepo.color === 'var(--accent)' ? 'var(--accent-dim)' : 'var(--branch-dim)',
          borderBottom: `1px solid ${activeRepo.color}`,
          padding: '0.35rem 2rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          fontFamily: 'var(--font-mono)', fontSize: '0.75rem',
          color: activeRepo.color,
        }}>
          <GitBranch size={12} />
          Writing to: <strong>{activeRepo.owner}/{activeRepo.repo}</strong>
          <span style={{ color: 'var(--ink-faint)', marginLeft: '0.25rem' }}>— {activeRepo.description}</span>
        </div>
      )}

      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: '2rem', width: '100%' }}>
        <Outlet />
      </main>

      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 2rem',
        textAlign: 'center',
        color: 'var(--ink-faint)',
        fontSize: '0.8rem',
        fontFamily: 'var(--font-mono)',
      }}>
        books-on-code · phase 1 · personal prototype
      </footer>

      {showNew && (
        <NewArticleModal
          onClose={() => setShowNew(false)}
          onCreated={(slug) => { setShowNew(false); navigate(`/article/${slug}/edit`) }}
        />
      )}
    </div>
  )
}

// ─── Add Repo inline form ─────────────────────────────────────────────────────
function AddRepoForm({ onAdd, onCancel }) {
  const [repoName, setRepoName]       = useState('')
  const [label, setLabel]             = useState('')
  const [description, setDescription] = useState('')

  function handleSubmit() {
    if (!repoName.trim()) return
    onAdd({
      label:       label.trim() || repoName.trim(),
      repo:        repoName.trim(),
      owner:       import.meta.env.VITE_GITHUB_OWNER,
      token:       import.meta.env.VITE_GITHUB_TOKEN,
      color:       'var(--branch)',
      description: description.trim(),
    })
  }

  const fieldStyle = {
    width: '100%',
    padding: '0.4rem 0.6rem',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.78rem',
    background: 'var(--paper)',
    color: 'var(--ink)',
    outline: 'none',
  }

  return (
    <div style={{ padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <input
        value={repoName}
        onChange={e => setRepoName(e.target.value)}
        placeholder="repo-name (exact GitHub name)"
        style={fieldStyle}
        autoFocus
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <input
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Display label (optional)"
        style={fieldStyle}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <input
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Short description (optional)"
        style={fieldStyle}
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
        <button
          onClick={handleSubmit}
          disabled={!repoName.trim()}
          style={{
            flex: 1, padding: '0.4rem',
            background: 'var(--ink)', color: 'var(--paper)',
            border: 'none', borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            cursor: repoName.trim() ? 'pointer' : 'not-allowed',
            opacity: repoName.trim() ? 1 : 0.4,
          }}
        >
          Add & Switch
        </button>
        <button
          onClick={onCancel}
          style={{
            padding: '0.4rem 0.75rem',
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
            cursor: 'pointer', color: 'var(--ink-muted)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function navStyle({ isActive }) {
  return { color: isActive ? 'var(--accent)' : 'var(--ink-muted)', fontWeight: isActive ? 600 : 400 }
}
