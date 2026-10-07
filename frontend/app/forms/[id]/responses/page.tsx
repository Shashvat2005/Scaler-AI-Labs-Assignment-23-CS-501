'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { api } from '../../../../lib/api'
import { Form } from '../../../../lib/types'
import { Shell } from '../../../../components/Shell'

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
        <div className="loading">Loading responses…</div>
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
      <main className="results">
        <Link href={`/forms/${id}/builder`} className="back">
          ← Back to builder
        </Link>
        <div className="results-head">
          <div>
            <p className="eyebrow">RESPONSES</p>
            <h1>{form.title}</h1>
            <p className="muted">
              {stats.response_count} completed submissions
            </p>
          </div>
          <button className="button" onClick={exportCsv}>
            Export CSV
          </button>
        </div>
        <section className="stat-grid">
          {form.questions.map((q) => {
            const s = stats.questions.find((x) => x.question_id === q.id)
            return (
              <article key={q.id}>
                <small>{s?.count || 0} answers</small>
                <h3>{q.title}</h3>
                {s?.distribution &&
                  Object.entries(s.distribution).map(([v, n]) => (
                    <div className="bar" key={v}>
                      <span>{v}</span>
                      <i style={{ width: `${(n / (s.count || 1)) * 100}%` }} />
                      <b>{n}</b>
                    </div>
                  ))}
              </article>
            )
          })}
        </section>
        <section className="response-table">
          <h2>Individual responses</h2>
          {rows.length === 0 ? (
            <div className="empty">
              No answers yet — share your published form to get started.
            </div>
          ) : (
            <table>
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
                    <td>{new Date(r.submitted_at).toLocaleDateString()}</td>
                    {form.questions.map((q) => (
                      <td key={q.id}>{r.answers[String(q.id)] || '—'}</td>
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