'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { Form } from '../../../../lib/types'
import { Shell } from '../../../../components/Shell'
import { ShareControls } from '../../../../components/ShareControls'

type Stats = {
  response_count: number
  questions: {
    question_id: number
    count: number
    distribution?: Record<string, number>
  }[]
}

export default function Results() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Form>()
  const [rows, setRows] = useState<
    { id: number; submitted_at: string; answers: Record<string, string> }[]
  >([])
  const [stats, setStats] = useState<Stats>()

  useEffect(() => {
    api.form(id).then(setForm)
    api.responses(id).then(setRows)
    api.stats(id).then(setStats)
  }, [id])

  if (!form || !stats)
    return (
      <Shell>
        <div className="page" style={{ minHeight: '60vh' }}>
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p className="empty-state-title">Loading responses…</p>
          </div>
        </div>
      </Shell>
    )

  const exportCsv = () => {
    const lines = [
      ['Submitted', ...form.questions.map((q) => q.title)],
      ...rows.map((r) => [
        new Date(r.submitted_at).toLocaleString(),
        ...form.questions.map((q) => r.answers[String(q.id)] || ''),
      ]),
    ]
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob(
        [
          lines
            .map((x) =>
              x
                .map((v) => `"${v.replaceAll('"', '""')}"`)
                .join(',')
            )
            .join('\n'),
        ],
        { type: 'text/csv' }
      )
    )
    a.download = 'responses.csv'
    a.click()
  }

  return (
    <Shell>
      <main className="responses-page page">
        <header className="responses-header">
          <div>
            <Link href={`/forms/${id}/builder`} className="btn btn-ghost btn-sm" style={{ marginBottom: '16px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to builder
            </Link>
            <h1 className="responses-title">{form.title}</h1>
            <p className="responses-subtitle">
              {stats.response_count} {stats.response_count === 1 ? 'submission' : 'submissions'}
            </p>
          </div>
          <button className="btn btn-secondary" onClick={exportCsv}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
        </header>

        <section className="responses-stats" aria-label="Question statistics">
          {form.questions.map((q) => {
            const s = stats.questions.find((x) => x.question_id === q.id)
            const count = s?.count || 0
            const distribution = s?.distribution || {}
            const maxCount = Math.max(...Object.values(distribution), 1)

            return (
              <article key={q.id} className="responses-stat-card card">
                <p className="responses-stat-label">{count} answers</p>
                <h3 className="responses-stat-question">{q.title}</h3>
                {distribution && Object.keys(distribution).length > 0 && (
                  <div className="responses-stat-distribution">
                    {Object.entries(distribution).map(([v, n]) => (
                      <div key={v} className="responses-stat-bar">
                        <span className="responses-stat-bar-label">{v}</span>
                        <div className="responses-stat-bar-track">
                          <div
                            className="responses-stat-bar-fill"
                            style={{ width: `${(n / maxCount) * 100}%` }}
                          />
                        </div>
                        <span className="responses-stat-bar-value">{n}</span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </section>

        <section className="responses-table-wrapper" aria-label="Individual responses">
          <header className="responses-table-header">Individual responses</header>
          {rows.length === 0 ? (
            <div className="empty-state" style={{ margin: 0, borderRadius: 0, border: 'none', padding: '60px 24px' }}>
              <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <h2 className="empty-state-title">No answers yet</h2>
              <p className="empty-state-text">Share your published form to start collecting responses.</p>
              {form.status !== 'published' && (
                <Link className="btn btn-primary" href={`/forms/${id}/builder`} style={{ marginTop: '16px' }}>
                  Publish form
                </Link>
              )}
            </div>
          ) : (
            <table className="responses-table">
              <thead>
                <tr>
                  <th>Submitted</th>
                  {form.questions.map((q) => (
                    <th key={q.id}>{q.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="responses-table-date">
                      {new Date(r.submitted_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    {form.questions.map((q) => (
                      <td key={q.id} className="responses-table-answer">
                        {r.answers[String(q.id)] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </main>
    </Shell>
  )
}