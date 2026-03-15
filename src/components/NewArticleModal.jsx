import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { saveArticle, buildArticleTemplate, listArticles } from '../utils/github.js'

export default function NewArticleModal({ onClose, onCreated }) {
  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function handleCreate() {
    if (!title.trim()) return setError('Title is required')
    setLoading(true)
    setError('')
    try {
      // Check slug uniqueness before creating
      const existing = await listArticles('main')
      if (existing.some(a => a.slug === slug)) {
        setError(`An article with slug "${slug}" already exists.`)
        setLoading(false)
        return
      }
      const content = buildArticleTemplate(title, description)
      await saveArticle(slug, content, `init: ${title}`, 'main')
      onCreated(slug)
    } catch (e) {
      setError(e.message || 'Failed to create article')
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 200, padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="card" style={{ width: '100%', maxWidth: 480, padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.4rem' }}>New Article</h2>
          <button className="btn btn-ghost" onClick={onClose} style={{ padding: '0.25rem' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Title</span>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="How Targeted Advertising..."
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              autoFocus
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Description <span style={{ fontWeight: 400 }}>(optional)</span>
            </span>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="A short summary..."
              style={inputStyle}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
            />
          </label>

          {title && (
            <p style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>
              slug: <strong>{slug}</strong>
            </p>
          )}

          {error && <p style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button className="btn" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleCreate} disabled={loading || !title.trim()}>
              {loading ? 'Creating…' : 'Create Article'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '0.6rem 0.75rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.95rem',
  background: 'var(--paper)',
  color: 'var(--ink)',
  outline: 'none',
  width: '100%',
}
