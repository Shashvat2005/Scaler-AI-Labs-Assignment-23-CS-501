'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'
import { Form } from '../lib/types'
import { ShareControls } from '../components/ShareControls'

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number>()
  const [menuOpen, setMenuOpen] = useState<number | null>(null)

  const load = () => api.forms().then(setForms).finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  const act = async (f: Form, a: string) => {
    setBusy(f.id)
    setMenuOpen(null)
    try {
      if (a === 'delete') {
        if (!confirm(`Delete "${f.title}"?`)) return
        await api.remove(f.id)
      } else if (a === 'copy') {
        await api.duplicate(f.id)
      } else {
        await api.status(f.id, a as 'publish' | 'unpublish')
      }
      load()
    } finally {
      setBusy(undefined)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <main className="dashboard page">
      <header className="dashboard-hero page-header">
        <div>
          <p className="page-eyebrow">Workspace</p>
          <h1 className="page-title">Forms that feel like<br /><em>conversations.</em></h1>
          <p className="page-subtitle">Create memorable experiences, one thoughtful question at a time.</p>
        </div>
        <Link className="btn btn-primary btn-lg" href="/forms/new">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 8 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create form
        </Link>
      </header>

      {loading ? (
        <div className="dashboard-forms" role="list" aria-label="Forms">
          {[1, 2, 3].map((x) => (
            <div key={x} className="form-row skeleton" style={{ height: '80px', borderRadius: 'var(--radius-md)' }} />
          ))}
        </div>
      ) : forms.length === 0 ? (
        <div className="empty-state" style={{ marginTop: '60px' }}>
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <h2 className="empty-state-title">No forms yet</h2>
          <p className="empty-state-text">Create your first form to start collecting responses.</p>
          <Link className="btn btn-primary" href="/forms/new" style={{ marginTop: '24px' }}>
            Create form
          </Link>
        </div>
      ) : (
        <div className="dashboard-forms" role="list" aria-label="Forms">
          {forms.map((f) => (
            <article key={f.id} className="form-row" role="listitem">
              <div className="form-row-main">
                <div className="form-row-icon" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <line x1="12" y1="8" x2="12" y2="16" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <div className="form-row-info">
                  <Link href={`/forms/${f.id}/builder`} className="form-row-title">
                    {f.title}
                  </Link>
                  <div className="form-row-meta">
                    <span className="form-row-status">
                      <span className={`form-row-status-dot ${f.status}`} aria-hidden="true" />
                      <span className={`badge ${f.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
                        {f.status}
                      </span>
                    </span>
                    <span>{f.questions.length} questions</span>
                    <span>{f.response_count} {f.response_count === 1 ? 'response' : 'responses'}</span>
                    <span>Updated {formatDate(f.updated_at)}</span>
                  </div>
                </div>
              </div>
              <div className="form-row-actions">
                <Link href={`/forms/${f.id}/builder`} className="form-row-action primary">Edit</Link>
                <Link href={`/forms/${f.id}/responses`} className="form-row-action">Results</Link>
                <button
                  className="form-row-action"
                  disabled={busy === f.id}
                  onClick={() => act(f, f.status === 'published' ? 'unpublish' : 'publish')}
                >
                  {f.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <div className="form-row-menu">
                  <button
                    className="form-row-menu-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      setMenuOpen(f.id === menuOpen ? null : f.id)
                    }}
                    aria-expanded={menuOpen === f.id}
                    aria-haspopup="true"
                    aria-label="More actions"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                      <circle cx="5" cy="12" r="1" />
                    </svg>
                  </button>
                  {menuOpen === f.id && (
                    <div className="form-row-menu-dropdown" role="menu">
                      <Link href={`/forms/${f.id}/builder`} className="form-row-menu-item" role="menuitem" onClick={() => setMenuOpen(null)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        Edit
                      </Link>
                      <Link href={`/forms/${f.id}/responses`} className="form-row-menu-item" role="menuitem" onClick={() => setMenuOpen(null)}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                          <polyline points="10 9 9 9 8 9" />
                        </svg>
                        Results
                      </Link>
                      {f.status === 'published' && (
                        <ShareControls key="share" publicId={f.public_id} className="share-controls" />
                      )}
                      <div className="form-row-menu-divider" />
                      <button className="form-row-menu-item" role="menuitem" onClick={() => act(f, 'copy')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                        Duplicate
                      </button>
                      <button className="form-row-menu-item danger" role="menuitem" onClick={() => act(f, 'delete')}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}