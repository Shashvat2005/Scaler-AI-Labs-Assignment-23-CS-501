'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api, defaults } from '../../../../lib/api'
import { Form, Question, QType } from '../../../../lib/types'
import { ShareControls } from '../../../../components/ShareControls'

const kinds: { type: QType; label: string; icon: string }[] = [
  ['short_text', 'Short text', 'T'],
  ['long_text', 'Long text', '¶'],
  ['multiple_choice', 'Multiple choice', '◉'],
  ['dropdown', 'Dropdown', '⌄'],
  ['email', 'Email', '@'],
  ['number', 'Number', '1'],
  ['yes_no', 'Yes / No', '✓'],
  ['rating', 'Rating', '★'],
].map(([type, label, icon]) => ({ type: type as QType, label, icon }))

function SortRow({
  q,
  active,
  onClick,
}: {
  q: Question
  active: boolean
  onClick: () => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: q.id })

  return (
    <button
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      className={'builder-question-row ' + (active ? 'selected' : '')}
      onClick={onClick}
      type="button"
    >
      <span {...listeners} className="builder-question-drag" aria-hidden="true">⠿</span>
      <span className="builder-question-number">{q.position + 1}</span>
      <span className="builder-question-title">{q.title || 'Untitled question'}</span>
      <span className="builder-question-type">{kinds.find((k) => k.type === q.type)?.label || q.type}</span>
    </button>
  )
}

export default function Builder() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Form>()
  const [selected, setSelected] = useState<number>()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)

  const load = () =>
    api.form(id).then((f) => {
      setForm(f)
      setSelected((x) => x || f.questions[0]?.id)
    })

  useEffect(() => {
    void load()
  }, [id])

  const q = form?.questions.find((q) => q.id === selected)

  async function update(next: Question) {
    setForm((f) =>
      f ? { ...f, questions: f.questions.map((q) => (q.id === next.id ? next : q)) } : f
    )
    setSaving(true)
    try {
      await api.updateQ(next)
      setNotice('Saved')
    } catch {
      setNotice('Could not save')
    } finally {
      setSaving(false)
      setTimeout(() => setNotice(''), 1200)
    }
  }

  async function add(type: QType) {
    if (!form) return
    const nq = await api.addQ(form.id, type)
    setForm({ ...form, questions: [...form.questions, nq] })
    setSelected(nq.id)
    setSettingsOpen(true)
  }

  async function remove() {
    if (!q || !form || !confirm('Delete this question?')) return
    await api.deleteQ(q.id)
    const qs = form.questions
      .filter((x) => x.id !== q.id)
      .map((x, i) => ({ ...x, position: i }))
    setForm({ ...form, questions: qs })
    setSelected(qs[0]?.id)
    setSettingsOpen(false)
  }

  async function drag(e: DragEndEvent) {
    if (!form || !e.over || e.active.id === e.over.id) return
    const old = form.questions.findIndex((q) => q.id === e.active.id)
    const ni = form.questions.findIndex((q) => q.id === e.over?.id)
    const qs = arrayMove(form.questions, old, ni).map((q, i) => ({
      ...q,
      position: i,
    }))
    setForm({ ...form, questions: qs })
    await api.reorder(form.id, qs.map((q) => q.id))
  }

  if (!form) return <div className="loading skeleton" style={{ height: '400px', margin: '40px' }} />

  return (
    <div className="builder">
      {/* Left Panel - Mobile Drawer */}
      <aside
        className={`builder-left ${leftPanelOpen ? 'open' : ''}`}
        aria-label="Questions"
      >
        <button
          className="builder-left-close"
          onClick={() => setLeftPanelOpen(false)}
          aria-label="Close question list"
          style={{ display: 'none' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <Link href="/" className="builder-brand brand">
          typeflow<span>.</span>
        </Link>

        <div className="builder-form-name">
          <input
            className="builder-form-name-input"
            value={form.title}
            onChange={async (e) => {
              setForm({ ...form, title: e.target.value })
              await api.update(form.id, e.target.value)
            }}
            placeholder="Untitled form"
          />
          <span className={`builder-form-name-status badge ${form.status === 'published' ? 'badge-published' : 'badge-draft'}`}>
            {form.status}
          </span>
        </div>

        <DndContext collisionDetection={closestCenter} onDragEnd={drag}>
          <SortableContext
            items={form.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {form.questions.map((x) => (
              <SortRow
                key={x.id}
                q={x}
                active={x.id === selected}
                onClick={() => {
                  setSelected(x.id)
                  setSettingsOpen(true)
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        <div className="builder-add-section">
          <p className="builder-add-title">Add question</p>
          <div className="builder-add-grid">
            {kinds.map((k) => (
              <button
                key={k.type}
                className="builder-add-btn"
                onClick={() => add(k.type)}
                type="button"
              >
                <span className="builder-add-icon" aria-hidden="true">{k.icon}</span>
                {k.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Left Panel Overlay for Mobile */}
      {leftPanelOpen && (
        <div
          className="builder-left-overlay visible"
          onClick={() => setLeftPanelOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Canvas */}
      <main className="builder-canvas">
        <header className="builder-toolbar" role="toolbar">
          <div className="builder-toolbar-left">
            <button
              className="builder-left-toggle"
              onClick={() => setLeftPanelOpen(true)}
              aria-label="Open question list"
              style={{ display: 'none' }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
            <Link href="/" className="builder-toolbar-back btn btn-ghost">
              ← Back
            </Link>
            <span className="builder-toolbar-save" aria-live="polite">
              {saving ? 'Saving…' : notice || 'All changes saved'}
            </span>
          </div>

          <div className="builder-toolbar-right">
            <Link className="builder-toolbar-link btn btn-ghost" href={`/forms/${id}/responses`}>
              Responses
            </Link>
            {form.status === 'published' && (
              <ShareControls publicId={form.public_id} compact />
            )}
            <a
              className="btn btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              href={`/form/${form.public_id}?preview=true`}
            >
              Preview
            </a>
            <button
              className={`btn ${form.status === 'published' ? 'btn-secondary' : 'btn-primary'}`}
              onClick={() => {
                if (form.status === 'published') {
                  api.status(form.id, 'unpublish').then(load)
                } else {
                  api.status(form.id, 'publish').then(load)
                }
              }}
            >
              {form.status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            <button
              className="builder-settings-toggle btn btn-ghost"
              onClick={() => setSettingsOpen(!settingsOpen)}
              aria-label={settingsOpen ? 'Close settings' : 'Open settings'}
              aria-expanded={settingsOpen}
              style={{ display: 'flex' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </header>

        <div className="builder-editor">
          {q ? (
            <>
              <QuestionEditor q={q} update={update} remove={remove} />
              <SettingsPanel q={q} update={update} isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
            </>
          ) : (
            <div className="builder-editor-empty">
              <svg className="builder-editor-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <h2 className="builder-editor-empty-title">Your form is empty</h2>
              <p className="builder-editor-empty-text">Add your first question from the left panel.</p>
              <div className="builder-add-grid" style={{ width: 'auto' }}>
                {kinds.slice(0, 4).map((k) => (
                  <button
                    key={k.type}
                    className="builder-add-btn"
                    onClick={() => add(k.type)}
                    type="button"
                  >
                    <span className="builder-add-icon" aria-hidden="true">{k.icon}</span>
                    {k.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Settings Panel - Right Drawer */}
      <div className="builder-settings-overlay" onClick={() => setSettingsOpen(false)} />
      <aside
        className={`builder-settings ${settingsOpen && q ? 'open' : ''}`}
        aria-label="Question settings"
      >
        <div className="builder-settings-header">
          <h2 className="builder-settings-title">Settings</h2>
          <button
            className="builder-settings-close"
            onClick={() => setSettingsOpen(false)}
            aria-label="Close settings"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        {q && (
          <div className="builder-settings-content">
            <Settings q={q} update={update} />
          </div>
        )}
      </aside>
    </div>
  )
}

function QuestionEditor({
  q,
  update,
  remove,
}: {
  q: Question
  update: (x: Question) => void
  remove: () => void
}) {
  return (
    <section className="question-editor">
      <div className="question-editor-header">
        <span className="question-editor-badge">
          {q.position + 1}
          <span className="question-editor-type">{kinds.find((k) => k.type === q.type)?.label}</span>
        </span>
      </div>
      <textarea
        className="question-editor-title"
        rows={1}
        value={q.title}
        onChange={(e) => update({ ...q, title: e.target.value })}
        placeholder="Type your question"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      />
      <textarea
        className="question-editor-desc"
        rows={1}
        value={q.description}
        onChange={(e) => update({ ...q, description: e.target.value })}
        placeholder="Add a description (optional)"
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.blur()
          }
        }}
      />
      {['multiple_choice', 'dropdown', 'yes_no', 'rating'].includes(q.type) && (
        <div className="question-editor-preview">
          <p className="question-editor-preview-label">Options</p>
          <div className="question-editor-options">
            {(q.settings.options || []).map((x, i) => (
              <div key={i} className="question-editor-option">
                {q.type === 'rating' && <span className="question-editor-option-rating">★</span>}
                {x}
              </div>
            ))}
          </div>
        </div>
      )}
      <button className="question-editor-delete btn btn-danger btn-sm" onClick={remove} type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
        Delete question
      </button>
    </section>
  )
}

function Settings({
  q,
  update,
}: {
  q: Question
  update: (x: Question) => void
}) {
  const options = q.settings.options || []

  return (
    <>
      <div className="builder-settings-section">
        <label className="builder-settings-label">
          Required
          <div className="toggle">
            <input
              className="toggle-input"
              type="checkbox"
              checked={q.required}
              onChange={(e) => update({ ...q, required: e.target.checked })}
              id={`required-${q.id}`}
            />
            <span className="toggle-track">
              <span className="toggle-thumb" />
            </span>
          </div>
        </label>
      </div>

      {['multiple_choice', 'dropdown', 'yes_no', 'rating'].includes(q.type) && (
        <>
          <div className="builder-settings-divider" />
          <p className="builder-settings-section-title">
            {q.type === 'rating' ? 'Scale' : 'Options'}
          </p>
          <div className="builder-settings-options">
            {options.map((x, i) => (
              <div key={i} className="builder-settings-option-row">
                <input
                  className="builder-settings-option-input"
                  value={x}
                  onChange={(e) => {
                    const a = [...options]
                    a[i] = e.target.value
                    update({ ...q, settings: { options: a } })
                  }}
                  placeholder={`Option ${i + 1}`}
                />
                <button
                  className="builder-settings-option-delete"
                  onClick={() =>
                    update({
                      ...q,
                      settings: { options: options.filter((_, n) => n !== i) },
                    })
                  }
                  aria-label={`Delete option ${i + 1}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              className="builder-settings-add-option"
              onClick={() =>
                update({
                  ...q,
                  settings: { options: [...options, `Option ${options.length + 1}`] },
                })
              }
              type="button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add option
            </button>
          </div>
        </>
      )}

      <div className="builder-settings-divider" />
      <p className="builder-settings-coming-soon">
        Theme <small>Coming soon</small>
      </p>
      <p className="builder-settings-coming-soon">
        Thank-you screen <small>Coming soon</small>
      </p>
    </>
  )
}

function SettingsPanel({
  q,
  update,
  isOpen,
  onClose,
}: {
  q: Question
  update: (x: Question) => void
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen || !q) return null

  return (
    <aside className="builder-settings-panel" style={{ display: 'none' }}>
      <div className="builder-settings-header">
        <h2 className="builder-settings-title">Settings</h2>
        <button className="builder-settings-close" onClick={onClose} aria-label="Close settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div className="builder-settings-content">
        <Settings q={q} update={update} />
      </div>
    </aside>
  )
}