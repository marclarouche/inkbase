import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listOpenPRs, mergePullRequest, deleteBranch } from '../utils/github.js'
import { GitMerge, GitPullRequest, ExternalLink, Loader, CheckCircle, Clock } from 'lucide-react'

export default function ReviewQueue() {
  const navigate          = useNavigate()
  const [prs, setPrs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [merging, setMerging] = useState(null)
  const [merged,  setMerged]  = useState([])

  async function load() {
    setLoading(true)
    try {
      const data = await listOpenPRs()
      setPrs(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function handleMerge(pr) {
    if (!confirm(`Merge "${pr.title}" into main and publish?`)) return
    setMerging(pr.number)
    try {
      await mergePullRequest(pr.number, `publish: ${pr.title}`)
      setMerged(m => [...m, pr.number])
      // Clean up the branch after merging
      try {
        await deleteBranch(pr.head.ref)
      } catch {
        // Branch deletion is best-effort — don't block the UI if it fails
      }
      setTimeout(load, 1500)
    } catch (e) {
      alert(`Merge failed: ${e.message}`)
    } finally {
      setMerging(null)
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.4rem' }}>Review Queue</h1>
        <p className="muted" style={{ fontSize: '0.9rem' }}>Draft branches ready to merge into main (publish).</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--ink-faint)', gap: '0.75rem' }}>
          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading pull requests…
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : prs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '5rem 2rem', color: 'var(--ink-faint)' }}>
          <GitPullRequest size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>Queue is clear</p>
          <p style={{ fontSize: '0.875rem' }}>No open pull requests. All articles are up to date.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {prs.map(pr => (
            <div key={pr.number} className="card" style={{
              padding: '1.5rem',
              opacity: merged.includes(pr.number) ? 0.5 : 1,
              transition: 'opacity 0.4s',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    {merged.includes(pr.number) ? (
                      <CheckCircle size={16} color="var(--merge)" />
                    ) : (
                      <GitPullRequest size={16} color="var(--branch)" />
                    )}
                    <span className="badge badge-branch">{pr.head.ref}</span>
                    <span style={{ color: 'var(--ink-faint)', fontSize: '0.78rem' }}>→ main</span>
                  </div>

                  <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.15rem', marginBottom: '0.4rem' }}>
                    {pr.title}
                  </h2>

                  {pr.body && (
                    <p className="muted" style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>{pr.body}</p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem', color: 'var(--ink-faint)' }}>
                      <Clock size={11} /> Opened {new Date(pr.created_at).toLocaleDateString()}
                    </span>
                    <span className="faint mono" style={{ fontSize: '0.75rem' }}>#{pr.number}</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <a href={pr.html_url} target="_blank" rel="noreferrer" className="btn" style={{ fontSize: '0.8rem' }}>
                    <ExternalLink size={13} /> GitHub
                  </a>
                  <button
                    className="btn"
                    style={{ fontSize: '0.8rem', borderColor: 'var(--branch)', color: 'var(--branch)' }}
                    onClick={() => {
                      // Extract slug from branch name heuristic
                      const slug = pr.head.ref.replace(/^draft\//, '')
                      navigate(`/article/${slug}/diff?branch=${pr.head.ref}`)
                    }}
                  >
                    View Diff
                  </button>
                  <button
                    className="btn btn-merge"
                    style={{ fontSize: '0.8rem' }}
                    onClick={() => handleMerge(pr)}
                    disabled={merging === pr.number || merged.includes(pr.number)}
                  >
                    {merging === pr.number ? (
                      <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                    ) : merged.includes(pr.number) ? (
                      <CheckCircle size={13} />
                    ) : (
                      <GitMerge size={13} />
                    )}
                    {merged.includes(pr.number) ? 'Merged!' : 'Merge & Publish'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
