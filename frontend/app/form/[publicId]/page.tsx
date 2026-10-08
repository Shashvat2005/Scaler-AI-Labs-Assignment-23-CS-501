'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { api } from '../../../lib/api'
import { Question } from '../../../lib/types'

function Input({
  q,
  value,
  set,
  error,
}: {
  q: Question
  value: string
  set: (x: string) => void
  error: string
}) {
  const opts = q.settings.options || []

  if (['multiple_choice', 'yes_no', 'rating'].includes(q.type)) {
    return (
      <div className={`public-form-choices ${q.type === 'rating' ? 'stars' : ''}`}>
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => set(o)}
            className={`public-form-choice ${value === o ? 'picked' : ''}`}
            type="button"
          >
            {q.type === 'rating' && <span className="public-form-choice-star">★</span>}
            {o}
          </button>
        ))}
      </div>
    )
  }

  if (q.type === 'dropdown') {
    return (
      <select
        className="public-form-select"
        autoFocus
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Choose an answer</option>
        {opts.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    )
  }

  if (q.type === 'long_text') {
    return (
      <textarea
        className="public-form-textarea"
        autoFocus
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder="Type your answer here…"
      />
    )
  }

  return (
    <input
      className="public-form-input"
      autoFocus
      type={q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={q.type === 'email' ? 'name@example.com' : 'Type your answer here…'}
      aria-invalid={!!error}
    />
  )
}

export default function PublicForm() {
  const { publicId } = useParams<{ publicId: string }>()
  const searchParams = useSearchParams()
  const preview = searchParams.get('preview') === 'true'
  const [data, setData] = useState<{ title: string; preview: boolean; questions: Question[] }>()
  const [at, setAt] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [sending, setSending] = useState(false)

  const q = data?.questions[at]

  const validate = () => {
    if (!q) return true
    let e = ''
    const v = answers[String(q.id)] || ''
    if (q.required && !v.trim())
      e = 'This question is required.'
    else if (q.type === 'email' && v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v))
      e = 'Please enter a valid email address.'
    else if (q.type === 'number' && v && Number.isNaN(Number(v)))
      e = 'Please enter a valid number.'
    setErr(e)
    return !e
  }

  async function next() {
    if (!validate() || !data) return
    if (at < data.questions.length - 1) {
      setAt(at + 1)
      setErr('')
    } else {
      setSending(true)
      try {
        if (!data.preview) await api.submit(publicId, answers)
        setDone(true)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Could not submit')
      } finally {
        setSending(false)
      }
    }
  }

  const goBack = () => {
    if (at > 0) {
      setAt(at - 1)
      setErr('')
    }
  }

  useEffect(() => {
    api.publicForm(publicId, preview).then(setData).catch((e) => setErr(e.message))
  }, [publicId, preview])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && q?.type !== 'long_text') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' && at > 0) goBack()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [q, answers, at])

  if (!data)
    return (
      <div className="public-form">
        <div className="public-form-stage" style={{ minHeight: '60vh' }}>
          <div className="empty-state">
            <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 6v6l4 2" />
            </svg>
            <p className="empty-state-title">Loading your form…</p>
          </div>
        </div>
      </div>
    )

  if (done)
    return (
      <div className="public-form public-form-thanks">
        <div className="public-form-thanks-content">
          <div className="public-form-thanks-mark">✓</div>
          <p className="public-form-thanks-eyebrow">{data.preview ? 'PREVIEW COMPLETE' : 'RESPONSE RECEIVED'}</p>
          <h1 className="public-form-thanks-title">Thank you for<br /><em>sharing.</em></h1>
          <p className="public-form-thanks-text">{data.preview ? 'This was a preview — no response was saved.' : 'Your response has been submitted.'}</p>
        </div>
      </div>
    )

  const progress = data.questions.length > 0 ? ((at + 1) / data.questions.length) * 100 : 0

  return (
    <div className="public-form">
      <header className="public-form-top" role="banner">
        <span className="public-form-brand">{data.preview ? `Preview · ${data.title}` : data.title}</span>
        <div className="public-form-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}>
          <span>{at + 1} / {data.questions.length}</span>
          <div className="public-form-progress-bar">
            <div className="public-form-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </header>

      <main className="public-form-stage" role="main">
        <AnimatePresence mode="wait">
          <motion.section
            key={q?.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
            className="public-form-question"
          >
            <div className="public-form-question-num">{at + 1} <span>/ {data.questions.length}</span></div>
            <h1 className="public-form-question-title">{q?.title}</h1>
            {q?.description && <p className="public-form-question-desc">{q.description}</p>}
            {q && (
              <Input
                q={q}
                value={answers[String(q.id)] || ''}
                set={(v) => {
                  setAnswers({ ...answers, [String(q.id)]: v })
                  setErr('')
                }}
                error={err}
              />
            )}
            {err && <div className="public-form-validation" role="alert">{err}</div>}
            <div className="public-form-actions">
              {at > 0 && (
                <button className="public-form-back btn btn-ghost" onClick={goBack} type="button">
                  ← Back
                </button>
              )}
              <button
                className="public-form-next btn btn-primary"
                disabled={sending}
                onClick={next}
                type="button"
              >
                {sending ? 'Sending…' : at === data.questions.length - 1 ? (data.preview ? 'Finish preview' : 'Submit') : 'Next'}
              </button>
            </div>
          </motion.section>
        </AnimatePresence>
      </main>

      <div className="public-form-hint" aria-hidden="true">press <kbd>Enter</kbd> to continue</div>
    </div>
  )
}