'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api } from '../lib/api'
import { Form } from '../lib/types'
import { Shell } from '../components/Shell'
import { ShareControls } from '../components/ShareControls'

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<number>()

  const load = () => api.forms().then(setForms).finally(() => setLoading(false))

  useEffect(() => {
    void load()
  }, [])

  const act = async (f: Form, a: string) => {
    setBusy(f.id)
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

  return (
    <Shell>
      <main className="dashboard">
        <div className="hero">
          <div>
            <p className="eyebrow">WORKSPACE</p>
            <h1>
              Forms that feel like<br />
              <em>conversations.</em>
            </h1>
            <p className="muted">
              Create memorable experiences, one thoughtful question at a time.
            </p>
          </div>
          <Link className="button" href="/forms/new">
            + Create a form
          </Link>
        </div>

        <div className="section-head">
          <h2>My forms <small>{forms.length}</small></h2>
        </div>

        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map((x) => <div className="skeleton" key={x} />)}
          </div>
        ) : forms.length === 0 ? (
          <div className="empty">No forms yet. Make something worth answering.</div>
        ) : (
          <div className="form-grid">
            {forms.map((f) => (
              <article className="form-card" key={f.id}>
                <Link href={`/forms/${f.id}/builder`}>
                  <div className="card-top">
                    <span className={`status ${f.status}`}>{f.status}</span>
                    <span className="dots">&#8226;&#8226;&#8226;</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>
                    {f.questions.length} questions &#183; {f.response_count} {f.response_count === 1 ? 'response' : 'responses'}
                  </p>
                </Link>
                <div className="card-actions">
                  <Link href={`/forms/${f.id}/builder`}>Edit</Link>
                  <Link href={`/forms/${f.id}/responses`}>Results</Link>
                  <button disabled={busy === f.id} onClick={() => act(f, f.status === 'published' ? 'unpublish' : 'publish')}>
                    {f.status === 'published' ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => act(f, 'copy')}>Duplicate</button>
                  <button className="danger" onClick={() => act(f, 'delete')}>
                    Delete
                  </button>
                </div>
                {f.status === 'published' && <ShareControls publicId={f.public_id} />}
              </article>
            ))}
          </div>
        )}
      </main>
    </Shell>
  )
}
