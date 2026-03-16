import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { BookOpen, GitPullRequest, Plus, Home } from 'lucide-react'
import { useState } from 'react'
import NewArticleModal from './NewArticleModal.jsx'

export default function Layout() {
  const [showNew, setShowNew] = useState(false)
  const navigate = useNavigate()

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
            <BookOpen size={20} color="var(--accent)" />
            <span style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'var(--ink)',
              letterSpacing: '-0.01em',
            }}>
              Inkbase
            </span>
          </NavLink>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="btn btn-ghost" onClick={() => navigate('/')} style={{ color: 'var(--ink-muted)', fontWeight: 400 }}>
              <Home size={15} /> Library
            </button>
            <NavLink to="/review" className="btn btn-ghost" style={navStyle}>
              <GitPullRequest size={15} /> Review Queue
            </NavLink>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={15} /> New Article
            </button>
          </nav>
        </div>
      </header>

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

function navStyle({ isActive }) {
  return { color: isActive ? 'var(--accent)' : 'var(--ink-muted)', fontWeight: isActive ? 600 : 400 }
}
