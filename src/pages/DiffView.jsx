import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { diffLines } from 'diff'
import { getArticleContent, createPullRequest } from '../utils/github.js'
import { ArrowLeft, GitMerge, GitBranch, Loader, Plus, Minus } from 'lucide-react'

export default function DiffView() {
  const { slug }       = useParams()
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const branch         = params.get('branch') || ''
  const rootPath       = params.get('rootPath')
    ? decodeURIComponent(params.get('rootPath'))
    : 'content'

  // Back destination depends on rootPath
  const backPath = rootPath === 'catalogs/nist-800-53-r5'
    ? `/catalog/${slug}?rootPath=${encodeURIComponent(rootPath)}`
    : `/article/${slug}`

  const [mainContent,  setMainContent]  = useState('')
  const [draftContent, setDraftContent] = useState('')
  const [loading,      setLoading]      = useState(true)
  const [prTitle,      setPrTitle]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)
  const [prUrl,        setPrUrl]        = useState('')

  useEffect(() => {
    if (!branch) return
    Promise.all([
      getArticleContent(slug, 'main', rootPath),
      getArticleContent(slug, branch, rootPath),
    ]).then(([main, draft]) => {
      setMainContent(main.content)
      setDraftContent(draft.content)
    }).finally(() => setLoading(false))
  }, [slug, branch, rootPath])

  const diff      = diffLines(mainContent, draftContent)
  const added     = diff.filter(d => d.added).reduce((n, d) => n + d.count, 0)
  const removed   = diff.filter(d => d.removed).reduce((n, d) => n + d.count, 0)
  const unchanged = diff.filter(d => !d.added && !d.removed).reduce((n, d) => n + d.count, 0)

  async function handleOpenPR() {
    if (!prTitle.trim()) return alert('Add a title for this change.')
    setSubmitting(true)
    try {
      const pr = await createPullRequest(branch, prTitle, `Merging ${branch} into main`)
      setPrUrl(pr.html_url)
    } catch (e) {
      alert(`Failed to open PR: ${e.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1.5rem', flexWrap: 'wrap',
      }}>
        <button className="btn btn-ghost" onClick={() => navigate(backPath)}>
          <ArrowLeft size={15} /> Back
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>Diff View</h1>
          <p className="faint mono" style={{ fontSize: '0.78rem' }}>{slug}</p>
        </div>
        <div style={{ flex: 1 }} />
        <span className="badge badge-branch">{branch}</span>
        <span style={{ color: 'var(--ink-faint)', fontSize: '0.85rem' }}>→</span>
        <span className="badge badge-main">main</span>
      </div>

      {/* Stats bar */}
      {!loading && (
        <div style={{
          display: 'flex', gap: '1.5rem', alignItems: 'center',
          padding: '0.75rem 1.25rem',
          background: 'var(--paper-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          marginBottom: '1.5rem',
          fontSize: '0.875rem',
          flexWrap: 'wrap',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--merge)' }}>
            <Plus size={14} /> {added} {added === 1 ? 'line' : 'lines'} added
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--accent)' }}>
            <Minus size={14} /> {removed} {removed === 1 ? 'line' : 'lines'} removed
          </span>
          <span style={{ color: 'var(--ink-faint)', fontSize: '0.8rem', marginLeft: 'auto' }}>
            {unchanged} unchanged
          </span>
        </div>
      )}

      {/* Open PR form */}
      {!loading && !prUrl && (
        <div className="card" style={{
          padding: '1.25rem', marginBottom: '1.5rem',
          display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap',
        }}>
          <GitMerge size={16} color="var(--merge)" />
          <input
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleOpenPR()}
            placeholder="Title for this change (e.g. Add NextDNS section)"
            style={{
              flex: 1, minWidth: 240,
              padding: '0.5rem 0.75rem',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              fontFamily: 'var(--font-sans)', fontSize: '0.9rem',
              background: 'var(--paper)', color: 'var(--ink)', outline: 'none',
            }}
          />
          <button
            className="btn btn-merge"
            onClick={handleOpenPR}
            disabled={submitting || !prTitle.trim()}
          >
            {submitting
              ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              : <GitMerge size={14} />
            }
            Open Pull Request
          </button>
        </div>
      )}

      {/* PR success banner */}
      {prUrl && (
        <div style={{
          background: 'var(--merge-dim)', border: '1px solid var(--merge)',
          borderRadius: 'var(--radius)', padding: '1rem 1.25rem',
          marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <GitMerge size={16} color="var(--merge)" />
          <span style={{ color: 'var(--merge)', fontSize: '0.9rem' }}>
            Pull request opened!{' '}
            <a href={prUrl} target="_blank" rel="noreferrer"
              style={{ color: 'var(--merge)', fontWeight: 600 }}>
              Review on GitHub →
            </a>
          </span>
        </div>
      )}

      {/* Diff content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--ink-faint)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : diff.length === 0 || (added === 0 && removed === 0) ? (
        <div style={{
          textAlign: 'center', padding: '4rem 2rem',
          color: 'var(--ink-faint)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--paper-card)',
        }}>
          <GitBranch size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.1rem', marginBottom: '0.4rem' }}>
            No changes
          </p>
          <p style={{ fontSize: '0.85rem' }}>
            This branch is identical to main.
          </p>
        </div>
      ) : (
        <div style={{
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          background: 'var(--paper-card)',
        }}>
          {/* Column header */}
          <div style={{
            padding: '0.6rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--paper-warm)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            fontSize: '0.75rem', fontWeight: 600, color: 'var(--ink-muted)',
          }}>
            <GitBranch size={12} />
            <span style={{ color: 'var(--branch)' }}>{branch}</span>
            <span style={{ color: 'var(--ink-faint)' }}>vs</span>
            <span style={{ color: 'var(--merge)' }}>main</span>
            <span style={{ marginLeft: 'auto', fontWeight: 400, color: 'var(--ink-faint)' }}>
              {rootPath}/{slug}{rootPath === 'catalogs/nist-800-53-r5' ? '.md' : '/index.md'}
            </span>
          </div>

          {/* Unified diff lines */}
          <div style={{ overflowY: 'auto', maxHeight: '65vh' }}>
            {diff.map((part, i) => {
              const lines = part.value.split('\n')
              if (lines[lines.length - 1] === '') lines.pop()
              if (lines.length === 0) return null

              const isAdded   = part.added
              const isRemoved = part.removed
              const isContext = !isAdded && !isRemoved

              const visibleLines = isContext && lines.length > 6
                ? [...lines.slice(0, 3), null, ...lines.slice(-3)]
                : lines

              return visibleLines.map((line, j) => {
                if (line === null) {
                  return (
                    <div key={`${i}-ellipsis`} style={{
                      padding: '0.2rem 1rem',
                      background: 'var(--paper-warm)',
                      borderTop: '1px solid var(--border)',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--ink-faint)',
                      userSelect: 'none',
                      textAlign: 'center',
                    }}>
                      ·  ·  ·  {lines.length - 6} lines hidden  ·  ·  ·
                    </div>
                  )
                }

                const bg          = isAdded ? '#e6ffed' : isRemoved ? '#ffeef0' : 'transparent'
                const color       = isAdded ? '#22863a' : isRemoved ? '#cb2431' : 'var(--ink)'
                const prefix      = isAdded ? '+' : isRemoved ? '−' : ' '
                const prefixColor = isAdded ? '#22863a' : isRemoved ? '#cb2431' : 'var(--ink-faint)'

                return (
                  <div key={`${i}-${j}`} style={{
                    display: 'flex',
                    background: bg,
                    borderBottom: isContext ? 'none' : undefined,
                  }}>
                    <div style={{
                      flexShrink: 0,
                      width: '2.5rem',
                      padding: '0.1rem 0',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.8rem',
                      color: prefixColor,
                      userSelect: 'none',
                      borderRight: '1px solid var(--border)',
                      background: isAdded ? '#ccffd8' : isRemoved ? '#ffd7d9' : 'var(--paper-warm)',
                    }}>
                      {prefix}
                    </div>
                    <div style={{
                      flex: 1,
                      padding: '0.1rem 1rem',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.82rem',
                      lineHeight: 1.7,
                      color,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {line || '\u00a0'}
                    </div>
                  </div>
                )
              })
            })}
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
