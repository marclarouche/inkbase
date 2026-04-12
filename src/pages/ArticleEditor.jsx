import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { getArticleContent, saveArticle, createBranch, listBranches } from '../utils/github.js'
import { Save, GitBranch, ArrowLeft, Plus, Loader, Check } from 'lucide-react'

export default function ArticleEditor({ rootPath = 'content' }) {
  const { slug }          = useParams()
  const navigate          = useNavigate()
  const [params]          = useSearchParams()
  const initialBranch     = params.get('branch') || 'main'

  const [branch, setBranch]           = useState(initialBranch)
  const [branches, setBranches]       = useState([])
  const [content, setContent]         = useState('')
  const [commitMsg, setCommitMsg]     = useState('')
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [loading, setLoading]         = useState(true)
  const [showNewBranch, setShowNewBranch] = useState(false)
  const [newBranchName, setNewBranchName] = useState('')
  const [creatingBranch, setCreatingBranch] = useState(false)
  const [savedContent, setSavedContent]     = useState('') // tracks last-saved state

  const isDirty = content !== savedContent

  useEffect(() => {
    listBranches().then(setBranches)
  }, [])

  useEffect(() => {
    setLoading(true)
    getArticleContent(slug, branch, rootPath)
      .then(({ content }) => {
        setContent(content)
        setSavedContent(content) // baseline for dirty tracking
      })
      .finally(() => setLoading(false))
  }, [slug, branch])

  // Warn before browser tab close / reload when there are unsaved changes
  useEffect(() => {
    const handler = (e) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  async function handleSave() {
    if (!commitMsg.trim()) return alert('Please add a commit message describing your changes.')
    setSaving(true)
    try {
      await saveArticle(slug, content, commitMsg, branch, rootPath)
      setCommitMsg('')
      setSavedContent(content) // mark as clean
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      alert(`Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateBranch() {
    if (!newBranchName.trim()) return
    setCreatingBranch(true)
    try {
      await createBranch(newBranchName, 'main')
      const updated = await listBranches()
      setBranches(updated)
      setBranch(newBranchName)
      setShowNewBranch(false)
      setNewBranchName('')
    } catch (e) {
      alert(`Failed to create branch: ${e.message}`)
    } finally {
      setCreatingBranch(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Editor toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        marginBottom: '1rem', flexWrap: 'wrap',
      }}>
        <button className="btn btn-ghost" onClick={() => {
          if (isDirty && !window.confirm('You have unsaved changes. Leave anyway?')) return
          navigate(rootPath === 'content' ? `/article/${slug}` : `/catalog`)
        }}>
          <ArrowLeft size={15} /> Back
        </button>

        <div style={{ flex: 1 }} />

        {/* Branch selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <GitBranch size={14} color="var(--ink-faint)" />
          <select
            value={branch}
            onChange={e => setBranch(e.target.value)}
            style={{
              padding: '0.4rem 0.75rem',
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
          <button className="btn btn-ghost" style={{ padding: '0.4rem 0.6rem' }} title="New branch" onClick={() => setShowNewBranch(!showNewBranch)}>
            <Plus size={14} />
          </button>
        </div>

        {/* Commit message + save */}
        <input
          value={commitMsg}
          onChange={e => setCommitMsg(e.target.value)}
          placeholder="Describe your changes…"
          onKeyDown={e => e.key === 'Enter' && handleSave()}
          style={{
            padding: '0.45rem 0.75rem',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.8rem',
            width: 260,
            background: 'var(--paper)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !commitMsg.trim()}>
          {saving ? <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> : saved ? <Check size={14} /> : <Save size={14} />}
          {saved ? 'Saved!' : isDirty ? 'Commit*' : 'Commit'}
        </button>
      </div>

      {/* New branch inline form */}
      {showNewBranch && (
        <div style={{
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          padding: '0.75rem 1rem', background: 'var(--branch-dim)',
          borderRadius: 'var(--radius)', marginBottom: '0.75rem',
          border: '1px solid var(--branch)',
        }}>
          <GitBranch size={14} color="var(--branch)" />
          <input
            value={newBranchName}
            onChange={e => setNewBranchName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
            placeholder="draft/my-revision"
            onKeyDown={e => e.key === 'Enter' && handleCreateBranch()}
            style={{ padding: '0.35rem 0.6rem', border: '1px solid var(--branch)', borderRadius: 'var(--radius)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'white', outline: 'none' }}
            autoFocus
          />
          <button className="btn" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={handleCreateBranch} disabled={creatingBranch || !newBranchName}>
            {creatingBranch ? 'Creating…' : 'Create'}
          </button>
          <button className="btn btn-ghost" onClick={() => setShowNewBranch(false)} style={{ fontSize: '0.8rem' }}>Cancel</button>
        </div>
      )}

      {/* Editor */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--ink-faint)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} data-color-mode="light">
          <MDEditor
            value={content}
            onChange={setContent}
            height="100%"
            preview="live"
            style={{ height: '100%' }}
          />
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
