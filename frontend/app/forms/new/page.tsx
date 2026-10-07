'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '../../../lib/api'
import { Shell } from '../../../components/Shell'

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
    <Shell>
      <main className="new">
        <p className="eyebrow">NEW FORM</p>
        <h1>Start with an idea.</h1>
        <form onSubmit={go}>
          <label>What's this form called?</label>
          <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
          <button className="button" disabled={!title.trim() || busy}>
            {busy ? 'Creating...' : 'Create form \u2192'}
          </button>
        </form>
      </main>
    </Shell>
  )
}