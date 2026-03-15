import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveArticle, listArticles, buildArticleTemplate } from '../utils/github.js'
import { FileText, ArrowLeft, Loader, AlertCircle } from 'lucide-react'

// Derive a URL-safe slug from a title string
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function NewArticle() {
  const navigate = useNavigate()

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags]               = useState('')
  const [slug, setSlug]               = useState('')
  const [slugEdited, setSlugEdited]   = useState(false) // true once user has manually changed the slug
  const [creating, setCreating]       = useState(false)
  const [error, setError]             = useState('')

  // Keep slug in sync with title unless user has manually edited it
  function handleTitleChange(val) {
    setTitle(val)
    if (!slugEdited) {
      setSlug(slugify(val))
    }
  }

  function handleSlugChange(val) {
    // Enforce slug format as the user types
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
    setSlug(clean)
    setSlugEdited(true)
  }

  async function handleCreate() {
    setError('')

    // Validation
    if (!title.trim()) return setError('Title is required.')
    if (!slug.trim())  return setError('Slug is required.')
    if (slug.length < 2) return setError('Slug must be at least 2 characters.')

    setCreating(true)
    try {
      // Check slug uniqueness against existing articles
      const existing = await listArticles('main')
      if (existing.some(a => a.slug === slug)) {
        setError(`An article with slug "${slug}" already exists.`)
        setCreating(false)
        return
      }

      const content = buildArticleTemplate(title.trim(), description.trim(), tags.trim())
      await saveArticle(slug, content, `init: ${title.trim()}`, 'main')

      // Head straight into the editor
      navigate(`/article/${slug}/edit?branch=main`)
    } catch (e) {
      setError(`Failed to create article: ${e.message}`)
    } finally {
      setCreating(false)
    }
  }

  const slugPreview = slug || 'your-article-slug'
  const isValid = title.trim().length > 0 && slug.trim().length >= 2

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/')}
          style={{ marginBottom: '1.5rem' }}
        >
          <ArrowLeft size={15} /> Library
        </button>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.4rem' }}>
          New Article
        </h1>
        <p className="muted" style={{ fontSize: '0.9rem' }}>
          Create a new article. You'll be dropped straight into the editor.
        </p>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* Title */}
        <Field label="Title" required hint="The display title of your article.">
          <input
            type="text"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. On Writing With Version Control"
            autoFocus
            style={inputStyle}
          />
        </Field>

        {/* Slug */}
        <Field
          label="Slug"
          required
          hint={
            <span>
              Used as the folder name in your repo:{' '}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--accent)' }}>
                content/<strong>{slugPreview}</strong>/index.md
              </span>
            </span>
          }
        >
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
              fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--ink-faint)',
              pointerEvents: 'none', userSelect: 'none',
            }}>
              content/
            </span>
            <input
              type="text"
              value={slug}
              onChange={e => handleSlugChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="your-article-slug"
              style={{ ...inputStyle, paddingLeft: '5.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
            />
          </div>
        </Field>

        {/* Description */}
        <Field label="Description" hint="A short summary shown in the Library. Optional but recommended.">
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Thoughts on using Git branching as a writing discipline."
            style={inputStyle}
          />
        </Field>

        {/* Tags */}
        <Field label="Tags" hint="Comma-separated. Optional. e.g. writing, tools, productivity">
          <input
            type="text"
            value={tags}
            onChange={e => setTags(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            placeholder="writing, tools"
            style={inputStyle}
          />
        </Field>

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.75rem 1rem',
            background: 'var(--accent-dim)',
            border: '1px solid var(--accent)',
            borderRadius: 'var(--radius)',
            fontSize: '0.875rem',
            color: 'var(--accent)',
          }}>
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={creating || !isValid}
            style={{ minWidth: 160 }}
          >
            {creating
              ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</>
              : <><FileText size={14} /> Create & Edit</>
            }
          </button>
          <button className="btn btn-ghost" onClick={() => navigate('/')} disabled={creating}>
            Cancel
          </button>
        </div>

      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────
function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      <label style={{
        fontFamily: 'var(--font-mono)', fontSize: '0.78rem',
        fontWeight: 500, color: 'var(--ink-muted)',
        textTransform: 'uppercase', letterSpacing: '0.06em',
        display: 'flex', alignItems: 'center', gap: '0.35rem',
      }}>
        {label}
        {required && <span style={{ color: 'var(--accent)', fontSize: '0.7rem' }}>*</span>}
      </label>
      {children}
      {hint && (
        <p style={{ fontSize: '0.78rem', color: 'var(--ink-faint)', margin: 0 }}>
          {hint}
        </p>
      )}
    </div>
  )
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle = {
  width: '100%',
  padding: '0.65rem 0.85rem',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  background: 'var(--paper)',
  color: 'var(--ink)',
  fontFamily: 'var(--font-sans)',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.15s',
}
