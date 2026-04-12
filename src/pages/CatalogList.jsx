import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listArticles, listBranches, ROOTS } from '../utils/github.js'
import { Shield, GitBranch, ChevronRight, Loader, AlertCircle } from 'lucide-react'

// Known NIST 800-53 family descriptions for richer cards
const FAMILY_META = {
  AC: { name: 'Access Control',              description: 'Who can access what, when, and how.' },
  AT: { name: 'Awareness and Training',      description: 'Security literacy across the organization.' },
  AU: { name: 'Audit and Accountability',    description: 'Logging, monitoring, and review of system activity.' },
  CA: { name: 'Assessment, Authorization',   description: 'Evaluating and authorizing system security.' },
  CM: { name: 'Configuration Management',    description: 'Controlling system configurations and changes.' },
  CP: { name: 'Contingency Planning',        description: 'Preparing for and recovering from disruptions.' },
  IA: { name: 'Identification & Auth',       description: 'Verifying the identity of users and devices.' },
  IR: { name: 'Incident Response',           description: 'Detecting, reporting, and responding to incidents.' },
  MA: { name: 'Maintenance',                 description: 'Maintaining information systems securely.' },
  MP: { name: 'Media Protection',            description: 'Protecting information on physical and digital media.' },
  PE: { name: 'Physical Protection',         description: 'Controlling physical access to systems.' },
  PL: { name: 'Planning',                    description: 'Security and privacy planning for systems.' },
  PM: { name: 'Program Management',          description: 'Organization-wide security program management.' },
  PS: { name: 'Personnel Security',          description: 'Security measures for personnel and positions.' },
  PT: { name: 'PII Processing',              description: 'Processing personally identifiable information.' },
  RA: { name: 'Risk Assessment',             description: 'Identifying and evaluating security risks.' },
  SA: { name: 'System Acquisition',          description: 'Security in system development and acquisition.' },
  SC: { name: 'System Communications',       description: 'Protecting system communications and networks.' },
  SI: { name: 'System Integrity',            description: 'Protecting against malicious code and flaws.' },
  SR: { name: 'Supply Chain Risk',           description: 'Managing risks in the supply chain.' },
}

export default function CatalogList() {
  const [families, setFamilies]   = useState([])
  const [branches, setBranches]   = useState([])
  const [activeBranch, setActiveBranch] = useState('main')
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const [fams, brs] = await Promise.all([
          listArticles(activeBranch, ROOTS.CATALOGS),
          listBranches(),
        ])
        setFamilies(fams)
        setBranches(brs)
      } catch (e) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [activeBranch])

  if (loading) return <LoadingState />
  if (error)   return <ErrorState message={error} />

  const draftBranches = branches.filter(b => b !== 'main')

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
        {/* Blue accent bar for catalog (distinct from red Library bar) */}
        <div style={{
          position: 'absolute', top: 0, left: 0,
          width: 4, height: '100%',
          background: 'var(--merge)',
          borderRadius: 'var(--radius-lg) 0 0 var(--radius-lg)',
        }} />

        {/* Decorative rule lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, var(--paper-warm) 27px, var(--paper-warm) 28px)',
          opacity: 0.4,
          borderRadius: 'var(--radius-lg)',
        }} />

        <div style={{ position: 'relative' }}>
          <p style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.72rem',
            color: 'var(--merge)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            NIST SP 800-53 Rev. 5 · Social Impact Overlay
          </p>

          <h1 style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--ink)',
            marginBottom: '0.75rem',
          }}>
            Control Catalog.<br />
            <span style={{ color: 'var(--ink-muted)', fontStyle: 'italic', fontWeight: 400 }}>
              Annotated for equity.
            </span>
          </h1>

          <p style={{
            fontSize: '0.95rem',
            color: 'var(--ink-muted)',
            lineHeight: 1.7,
            maxWidth: '52ch',
            marginBottom: '2rem',
          }}>
            Browse all 20 NIST SP 800-53 control families. Each family contains
            your Social Impact Overlay annotations — the gaps, proposed controls,
            and equity research that form the core of your dissertation.
          </p>

          {/* Stats + branch selector row */}
          <div style={{
            display: 'flex',
            gap: '2rem',
            flexWrap: 'wrap',
            alignItems: 'center',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={14} color="var(--merge)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: 'var(--merge)' }}>
                {families.length}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--ink-faint)' }}>
                control families
              </span>
            </div>

            {/* Branch selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
              <GitBranch size={13} color="var(--ink-faint)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                viewing:
              </span>
              <select
                value={activeBranch}
                onChange={e => { setActiveBranch(e.target.value); setLoading(true) }}
                style={{
                  padding: '0.35rem 0.65rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--paper-card)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.78rem',
                  color: activeBranch === 'main' ? 'var(--merge)' : 'var(--branch)',
                  cursor: 'pointer',
                }}
              >
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section label ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '0.72rem',
          textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-faint)',
        }}>
          Control Families
        </span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
          {families.length} total
        </span>
      </div>

      {/* ── Family grid ── */}
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {families.map(family => {
          const meta = FAMILY_META[family.slug.toUpperCase()] || {}
          return (
            <div
              key={family.slug}
              className="card"
              onClick={() => navigate(`/catalog/${family.slug}/edit?branch=${activeBranch}&rootPath=catalogs/nist-800-53-r5`)}
              style={{
                padding: '1.25rem 1.5rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--merge)'
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = 'var(--shadow-lg)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)'
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'var(--shadow)'
              }}
            >
              {/* Family ID badge */}
              <div style={{
                flexShrink: 0,
                width: 48, height: 48,
                borderRadius: 'var(--radius)',
                background: 'var(--merge-dim)',
                border: '1px solid var(--merge)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--merge)',
              }}>
                {family.slug.toUpperCase()}
              </div>

              {/* Family info */}
              <div style={{ flex: 1 }}>
                <h2 style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '1.1rem',
                  marginBottom: '0.2rem',
                  color: 'var(--ink)',
                }}>
                  {meta.name || family.title}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', margin: 0 }}>
                  {meta.description || 'NIST SP 800-53 Control Family'}
                </p>
              </div>

              <ChevronRight size={16} color="var(--ink-faint)" style={{ flexShrink: 0 }} />
            </div>
          )
        })}
      </div>

    </div>
  )
}

function LoadingState() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '5rem', gap: '0.75rem', color: 'var(--ink-faint)',
    }}>
      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
        Loading catalog…
      </span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div style={{
      padding: '2rem', background: 'var(--accent-dim)',
      borderRadius: 'var(--radius-lg)', color: 'var(--accent)',
      border: '1px solid var(--accent)',
      display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
    }}>
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
      <div>
        <strong>Could not load catalog:</strong> {message}
        <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--ink-muted)' }}>
          Make sure <code>catalogs/nist-800-53-r5/</code> exists in your repository.
        </p>
      </div>
    </div>
  )
}
