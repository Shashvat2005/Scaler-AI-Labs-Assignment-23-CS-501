'use client'

import { useState } from 'react'

export function ShareControls({ publicId, compact = false }: { publicId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window === 'undefined' ? `/form/${publicId}` : `${window.location.origin}/form/${publicId}`

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  if (compact) {
    return (
      <div className="share-compact">
        <button onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
        <a href={`/form/${publicId}`} target="_blank" rel="noreferrer">View live ↗</a>
      </div>
    )
  }

  return (
    <div className="share-controls">
      <span className="share-label">Live form</span>
      <div className="share-url" title={url}>{url}</div>
      <button onClick={copy}>{copied ? 'Copied!' : 'Copy link'}</button>
      <a href={`/form/${publicId}`} target="_blank" rel="noreferrer">Open ↗</a>
    </div>
  )
}
