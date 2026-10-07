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
}: {
  q: Question
  value: string
  set: (x: string) => void
}) {
  const opts = q.settings.options || []
  if (['multiple_choice', 'yes_no', 'rating'].includes(q.type))
    return (
      <div className={'choices ' + (q.type === 'rating' ? 'stars' : '')}>
        {opts.map((o) => (
          <button
            key={o}
            onClick={() => set(o)}
            className={value === o ? 'picked' : ''}
          >
            {q.type === 'rating' ? '★ ' : ''}
            {o}
          </button>
        ))}
      </div>
    )
  if (q.type === 'dropdown')
    return (
      <select autoFocus value={value} onChange={(e) => set(e.target.value)}>
        <option value="">Choose an answer</option>
        {opts.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    )
  return q.type === 'long_text' ? (
    <textarea
      autoFocus
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder="Type your answer here…"
    />
  ) : (
    <input
      autoFocus
      type={q.type === 'email' ? 'email' : q.type === 'number' ? 'number' : 'text'}
      value={value}
      onChange={(e) => set(e.target.value)}
      placeholder={q.type === 'email' ? 'name@example.com' : 'Type your answer here…'}
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
      e = 'Please answer this question to continue.'
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

  useEffect(() => {
    api.publicForm(publicId, preview).then(setData).catch((e) => setErr(e.message))
  }, [publicId, preview])

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && q?.type !== 'long_text') {
        e.preventDefault()
        next()
      }
      if (e.key === 'ArrowLeft' && at > 0) setAt(at - 1)
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [q, answers, at])

  if (!data)
    return (
      <div className="public loading">
        {err || 'Loading your form…'}
      </div>
    )

  if (done)
    return (
      <div className="public thanks">
        <div>
          <span className="thank-mark">✓</span>
          <p className="eyebrow">{data.preview ? 'PREVIEW COMPLETE' : 'RESPONSE RECEIVED'}</p>
          <h1>
            Thank you for<br />
            <em>sharing.</em>
          </h1>
          <p>{data.preview ? 'This was a preview — no response was saved.' : 'Your response has been submitted.'}</p>
        </div>
      </div>
    )

  return (
    <div className="public">
      <div className="public-top">
        <span className="public-brand">{data.preview ? `Preview · ${data.title}` : data.title}</span>
        <span>
          {at + 1} <i /> {data.questions.length}
        </span>
      </div>
      <div className="progress">
        <i style={{ width: `${((at + 1) / data.questions.length) * 100}%` }} />
      </div>
      <div className="question-stage">
        <AnimatePresence mode="wait">
          <motion.section
            key={q?.id}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.24 }}
          >
            <div className="question-num">
              {at + 1} <span>→</span>
            </div>
            <h1>{q?.title}</h1>
            {q?.description && <p>{q.description}</p>}
            {q && (
              <Input
                q={q}
                value={answers[String(q.id)] || ''}
                set={(v) => {
                  setAnswers({ ...answers, [String(q.id)]: v })
                  setErr('')
                }}
              />
            )}
            {err && <div className="validation">{err}</div>}
            <div className="public-actions">
              {at > 0 && (
                <button className="backbtn" onClick={() => { setAt(at - 1); setErr('') }}>
                  ← Back
                </button>
              )}
              <button
                className="nextbtn"
                disabled={sending}
                onClick={next}
              >
                {sending ? 'Sending…' : at === data.questions.length - 1 ? (data.preview ? 'Finish preview' : 'Submit') : 'OK'}
                <small>↵</small>
              </button>
            </div>
          </motion.section>
        </AnimatePresence>
      </div>
      <div className="hint">press <kbd>Enter</kbd> to continue</div>
    </div>
  )
}
