import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listArticles, listBranches, ROOTS } from '../utils/github.js'
import { BookOpen, GitBranch, Clock, Tag, ChevronRight, Loader, GitCommit, GitMerge } from 'lucide-react'

export default function ArticleList() {
  const [articles, setArticles] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [arts, brs] = await Promise.all([listArticles('main', ROOTS.LIT_REVIEW), listBranches()])
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

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--paper-card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '3rem 3rem 2.5rem',
        marginBottom: '2.5rem',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative background rule lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--paper-warm) 27px, var(--paper-warm) 28px)',
          opacity: 0.5,
          borderRadius: 'var(--radius-lg)',
        }} />

        {/* Red accent bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 4, height: '100%',
          background: 'var(--accent)',
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        }} />

        <div style={{ position: 'relative' }}>
          {/* Eyebrow */}
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--accent)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            git branch main · personal writing repository
          </p>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--ink)',
            marginBottom: '0.75rem',
          }}>
            Write like a writer.<br />
            <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontWeight: 400 }}>
              Version like a developer.
            </span>
          </h1>

          {/* Tagline */}
          <p style={{
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.7,
            maxWidth: '52ch',
            marginBottom: '2rem',
          }}>
            A personal writing platform built on Git. Draft in branches,
            review diffs, merge to publish. Every article has a changelog.
            Your writing, version-controlled.
          </p>

          {/* Stats row */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <Stat
              icon={<BookOpen size={14} color="var(--accent)" />}
              value={articles.length}
              label={`article${articles.length !== 1 ? 's' : ''} published`}
            />
            <Stat
              icon={<GitBranch size={14} color="var(--branch)" />}
              value={branches.length}
              label={`draft branch${branches.length !== 1 ? 'es' : ''} in progress`}
              color="var(--branch)"
            />
            <Stat
              icon={<GitCommit size={14} color="var(--merge)" />}
              value="Git"
              label="version controlled"
              color="var(--merge)"
            />
          </div>
        </div>
      </div>

      {/* ── Active draft branches banner ── */}
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

      {/* ── Section label ── */}
      {articles.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: 'var(--ink-faint)',
          }}>
            Published Articles
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--ink-faint)',
          }}>
            {articles.length} total
          </span>
        </div>
      )}

      {/* ── Articles grid ── */}
      {articles.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {articles.map(article => (
            <ArticleCard
              key={article.slug}
              article={article}
              onClick={() => navigate(`/article/${article.slug}?rootPath=lit-review`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Stat pill ────────────────────────────────────────────────────────────────
function Stat({ icon, value, label, color = 'var(--accent)' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      {icon}
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        fontWeight: 600,
        color,
      }}>
        {value}
      </span>
      <span style={{
        fontSize: '0.8rem',
        color: 'var(--ink-faint)',
      }}>
        {label}
      </span>
    </div>
  )
}

// ─── Article card ─────────────────────────────────────────────────────────────
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
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--accent)'
        e.currentTarget.style.transform = 'translateY(-1px)'
        e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'none'
        e.currentTarget.style.boxShadow = 'var(--shadow)'
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <BookOpen size={14} color="var(--accent)" />
          <span className="faint mono" style={{ fontSize: '0.72rem' }}>{article.slug}</span>
        </div>
        <h2 style={{
          fontFamily: 'var(--font-serif)',
          fontSize: '1.25rem',
          marginBottom: '0.4rem',
          lineHeight: 1.3,
          color: 'var(--ink)',
        }}>
          {article.title}
        </h2>
        {article.description && (
          <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.75rem', lineHeight: 1.6 }}>
            {article.description}
          </p>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {article.date && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.78rem', color: 'var(--ink-faint)',
            }}>
              <Clock size={11} /> {article.date}
            </span>
          )}
          {article.tags?.map(tag => (
            <span key={tag} style={{
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              fontSize: '0.75rem',
              background: 'var(--paper-warm)',
              border: '1px solid var(--border)',
              borderRadius: '99px',
              padding: '0.1rem 0.55rem',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-mono)',
            }}>
              <Tag size={10} /> {tag}
            </span>
          ))}
        </div>
      </div>
      <ChevronRight size={18} color="var(--ink-faint)" style={{ flexShrink: 0, marginTop: '0.25rem' }} />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  const navigate = useNavigate()
  return (
    <div style={{
      textAlign: 'center',
      padding: '5rem 2rem',
      color: 'var(--ink-faint)',
      background: 'var(--paper-card)',
      border: '1px dashed var(--border)',
      borderRadius: 'var(--radius-lg)',
    }}>
      <GitMerge size={36} style={{ marginBottom: '1rem', opacity: 0.25 }} />
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--ink-muted)' }}>
        Your repository is empty
      </p>
      <p style={{ fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Create your first article and start building your writing repository.
      </p>
      <button className="btn btn-primary" onClick={() => navigate('/new')}>
        + New Article
      </button>
    </div>
  )
}

// ─── Loading state ────────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5rem', gap: '0.75rem', color: 'var(--ink-faint)',
    }}>
      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        Loading repository…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────
function ErrorState({ message }) {
  return (
    <div style={{
      padding: '2rem',
      background: 'var(--accent-dim)',
      borderRadius: 'var(--radius-lg)',
      color: 'var(--accent)',
      border: '1px solid var(--accent)',
    }}>
      <strong>GitHub connection error:</strong> {message}
      <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
        Check your .env file — VITE_GITHUB_TOKEN, VITE_GITHUB_OWNER, and VITE_GITHUB_REPO must all be set.
      </p>
    </div>
  )
}
