import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { getArticleContent, getCommitHistory, listBranches } from '../utils/github.js'
import { Edit, GitBranch, Clock, ArrowLeft, GitCommit, ChevronDown, Loader } from 'lucide-react'

export default function ArticleReader({ rootPath: rootPathProp }) {
  const { slug }        = useParams()
  const navigate        = useNavigate()
  const [params]        = useSearchParams()

  // rootPath priority: prop from App.jsx route > URL param > default to lit-review
  const rootPath = rootPathProp || params.get('rootPath') || 'lit-review'

  // Back destination depends on where we came from
  const backPath = rootPath === 'catalogs/nist-800-53-r5' ? '/catalog' : '/'

  const [branch, setBranch]           = useState(params.get('branch') || 'main')
  const [branches, setBranches]       = useState(['main'])
  const [content, setContent]         = useState('')
  const [history, setHistory]         = useState([])
  const [loading, setLoading]         = useState(true)
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    listBranches().then(setBranches)
  }, [])

  useEffect(() => {
    setLoading(true)
    Promise.all([
      getArticleContent(slug, branch, rootPath),
      getCommitHistory(slug, branch, rootPath),
    ]).then(([{ content }, commits]) => {
      setContent(content)
      setHistory(commits)
    }).finally(() => setLoading(false))
  }, [slug, branch, rootPath])

  // Strip frontmatter before rendering
  const body = content.replace(/^---[\s\S]*?---\n/, '')

  // Edit URL — passes rootPath as param so editor knows where to save
  const editUrl = rootPath === 'catalogs/nist-800-53-r5'
    ? `/catalog/${slug}/edit?branch=${branch}&rootPath=${encodeURIComponent(rootPath)}`
    : `/article/${slug}/edit?branch=${branch}&rootPath=${encodeURIComponent(rootPath)}`

  // Diff URL
  const diffUrl = rootPath === 'catalogs/nist-800-53-r5'
    ? `/article/${slug}/diff?branch=${branch}`
    : `/article/${slug}/diff?branch=${branch}`

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '2rem', flexWrap: 'wrap',
      }}>
        <button className="btn btn-ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft size={15} /> {rootPath === 'catalogs/nist-800-53-r5' ? 'Catalog' : 'Library'}
        </button>
        <div style={{ flex: 1 }} />

        {/* Branch selector */}
        <div style={{ position: 'relative' }}>
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            style={{
              appearance: 'none',
              padding: '0.45rem 2rem 0.45rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              background: 'var(--paper-card)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.8rem',
              color: branch === 'main' ? 'var(--merge)' : 'var(--branch)',
              cursor: 'pointer',
            }}
          >
            {branches.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <GitBranch size={12} style={{
            position: 'absolute', right: '0.5rem', top: '50%',
            transform: 'translateY(-50%)', pointerEvents: 'none',
            color: 'var(--ink-faint)',
          }} />
        </div>

        <button className="btn" onClick={() => setShowHistory(!showHistory)}>
          <GitCommit size={15} /> History <ChevronDown size={13} />
        </button>
        <button className="btn btn-primary" onClick={() => navigate(editUrl)}>
          <Edit size={15} /> Edit
        </button>
        {branch !== 'main' && (
          <button
            className="btn"
            style={{ borderColor: 'var(--merge)', color: 'var(--merge)' }}
            onClick={() => navigate(diffUrl)}
          >
            View Diff →
          </button>
        )}
      </div>

      {/* Commit history panel */}
      {showHistory && (
        <div className="card" style={{ marginBottom: '2rem', padding: '1.25rem' }}>
          <h3 style={{
            fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.05em', color: 'var(--ink-muted)', marginBottom: '1rem',
          }}>
            Commit History — {branch}
          </h3>
          {history.length === 0 ? (
            <p className="faint" style={{ fontSize: '0.85rem' }}>No commits yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {history.map(c => (
                <div key={c.sha} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <span className="badge badge-branch" style={{ flexShrink: 0, marginTop: '0.1rem' }}>
                    {c.sha}
                  </span>
                  <div>
                    <p style={{ fontSize: '0.875rem' }}>{c.message}</p>
                    <p style={{
                      fontSize: '0.75rem', color: 'var(--ink-faint)',
                      display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.1rem',
                    }}>
                      <Clock size={11} /> {new Date(c.date).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Branch indicator */}
      {branch !== 'main' && (
        <div style={{
          background: 'var(--branch-dim)', border: '1px solid var(--branch)',
          borderRadius: 'var(--radius)', padding: '0.6rem 1rem',
          fontSize: '0.85rem', color: 'var(--branch)', marginBottom: '1.5rem',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <GitBranch size={14} /> Viewing draft branch: <strong>{branch}</strong>
        </div>
      )}

      {/* Article content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--ink-faint)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <article className="prose">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
        </article>
      )}
    </div>
  )
}
