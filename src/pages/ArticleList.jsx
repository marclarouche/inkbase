import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listArticles, listBranches } from '../utils/github.js'
import { BookOpen, GitBranch, Clock, Tag, ChevronRight, Loader } from 'lucide-react'

export default function ArticleList() {
  const [articles, setArticles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [arts, brs] = await Promise.all([listArticles('main'), listBranches()])
        setArticles(arts)
        setBranches(brs.filter(b => b !== 'main'))
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.4rem' }}>Library</h1>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          {articles.length} article{articles.length !== 1 ? 's' : ''} published ·{' '}
          {branches.length} draft branch{branches.length !== 1 ? 'es' : ''} in progress
        </p>
      </div>

      {/* Active draft branches banner */}
      {branches.length > 0 && (
        <div style={{
          background: 'var(--branch-dim)',
          border: '1px solid var(--branch)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <GitBranch size={16} color="var(--branch)" />
          <span style={{ fontSize: '0.875rem', color: 'var(--branch)', fontWeight: 500 }}>
            Active drafts:
          </span>
          {branches.map(b => (
            <span key={b} className="badge badge-branch">{b}</span>
          ))}
          <button
            className="btn"
            style={{ marginLeft: 'auto', fontSize: '0.8rem', padding: '0.3rem 0.75rem' }}
            onClick={() => navigate('/review')}
          >
            Review Queue →
          </button>
        </div>
      )}

      {/* Articles grid */}
      {articles.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {articles.map(article => (
            <ArticleCard key={article.slug} article={article} onClick={() => navigate(`/article/${article.slug}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleCard({ article, onClick }) {
  return (
    <div
      className="card"
      onClick={onClick}
      style={{
        padding: '1.5rem',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '1rem',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <BookOpen size={14} color="var(--accent)" />
          <span className="faint mono" style={{ fontSize: '0.75rem' }}>{article.slug}</span>
        </div>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.4rem', lineHeight: 1.3 }}>
          {article.title}
        </h2>
        {article.description && (
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>{article.description}</p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {article.date && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
              <Clock size={11} /> {article.date}
            </span>
          )}
          {article.tags?.map(tag => (
            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
              <Tag size={11} /> {tag}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight size={18} color="var(--ink-faint)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
    </div>
  )
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--ink-faint)' }}>
      <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>No articles yet</p>
      <p style={{ fontSize: '0.875rem' }}>Click "New Article" to write your first one.</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '0.75rem', color: 'var(--ink-faint)' }}>
      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span>Loading library…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{ padding: '2rem', background: 'var(--accent-dim)', borderRadius: 'var(--radius-lg)', color: 'var(--accent)' }}>
      <strong>GitHub connection error:</strong> {message}
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Check your .env file — VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, and VITE_GITHUB_REPO must all be set.</p>
    </div>
  )
}
