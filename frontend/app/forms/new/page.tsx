'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'

export default function New() {
  const [title, setTitle] = useState('Untitled form')
  const [busy, setBusy] = useState(false)
  const r = useRouter()

  async function go(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    try {
      const f = await api.create(title)
      r.push(`/forms/${f.id}/builder`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="new-form page">
        <p className="page-eyebrow">New form</p>
        <h1 className="new-form-title">Start with an idea.</h1>
        <p className="new-form-subtitle">Give your form a name and start building.</p>
        <form onSubmit={go}>
          <div className="new-form-field">
            <label className="label" htmlFor="form-title">
              What's this form called?
            </label>
            <input
              id="form-title"
              className="new-form-input"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Customer Feedback"
              disabled={busy}
            />
          </div>
          <button className="btn btn-primary btn-lg new-form-submit" type="submit" disabled={!title.trim() || busy}>
            {busy ? 'Creating…' : 'Create form'}
          </button>
        </form>
      </main>
  )
}