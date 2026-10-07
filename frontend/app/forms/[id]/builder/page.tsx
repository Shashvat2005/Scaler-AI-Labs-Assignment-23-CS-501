'use client'

import { useEffect, useState } from 'react'
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
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: q.id,
  })
  return (
    <button
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      className={'qrow ' + (active ? 'selected' : '')}
      onClick={onClick}
    >
      <span {...listeners} className="grab">
        ⠿
      </span>
      <b>{q.position + 1}</b>
      <span>{q.title || 'Untitled question'}</span>
    </button>
  )
}

export default function Builder() {
  const { id } = useParams<{ id: string }>()
  const [form, setForm] = useState<Form>()
  const [selected, setSelected] = useState<number>()
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

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
  }

  async function remove() {
    if (!q || !form || !confirm('Delete this question?')) return
    await api.deleteQ(q.id)
    const qs = form.questions
      .filter((x) => x.id !== q.id)
      .map((x, i) => ({ ...x, position: i }))
    setForm({ ...form, questions: qs })
    setSelected(qs[0]?.id)
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

  if (!form) return <div className="loading">Loading builder…</div>

  return (
    <div className="builder">
      <aside className="builder-left">
        <Link href="/" className="brand">
          typeflow<span>.</span>
        </Link>
        <div className="form-name">
          <input
            value={form.title}
            onChange={async (e) => {
              setForm({ ...form, title: e.target.value })
              await api.update(form.id, e.target.value)
            }}
          />
          <small>{form.status}</small>
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
                onClick={() => setSelected(x.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="addmenu">
          {kinds.map((k) => (
            <button key={k.type} onClick={() => add(k.type)}>
              <i>{k.icon}</i>
              {k.label}
            </button>
          ))}
        </div>
      </aside>
      <main className="builder-canvas">
        <div className="builderbar">
          <Link href="/">← Back</Link>
          <span>{saving ? 'Saving…' : notice || 'All changes saved'}</span>
          <div>
            <Link className="quiet" href={`/forms/${id}/responses`}>
              Responses
            </Link>
            {form.status === 'published' && <ShareControls publicId={form.public_id} compact />}
            <a
              className="button small"
              target="_blank"
              href={`/form/${form.public_id}?preview=true`}
            >
              Preview &#8599;
            </a>
          </div>
        </div>
        {q ? (
          <QuestionEditor q={q} update={update} remove={remove} />
        ) : (
          <div className="empty canvas-empty">
            <h2>Your form is empty</h2>
            <p>Add your first question from the left.</p>
          </div>
        )}
      </main>
      {q && <Settings q={q} update={update} />}
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
      <div className="qbadge">
        {q.position + 1}
        <span> {kinds.find((k) => k.type === q.type)?.label}</span>
      </div>
      <textarea
        className="question-title"
        rows={2}
        value={q.title}
        onChange={(e) => update({ ...q, title: e.target.value })}
        placeholder="Type your question"
      />
      <textarea
        className="question-desc"
        value={q.description}
        onChange={(e) => update({ ...q, description: e.target.value })}
        placeholder="Add a description (optional)"
      />
      {['multiple_choice', 'dropdown', 'yes_no', 'rating'].includes(q.type) ? (
        <div className={q.type === 'rating' ? 'rating-preview' : 'option-preview'}>
          {(q.settings.options || []).map((x, i) => (
            <span key={i}>
              {q.type === 'rating' ? '★ ' : ''}
              {x}
            </span>
          ))}
        </div>
      ) : q.type === 'long_text' ? (
        <div className="fake-input long" />
      ) : (
        <div className="fake-input">
          {q.type === 'email'
            ? 'name@example.com'
            : q.type === 'number'
            ? 'Type a number...'
            : 'Type your answer here...'}
        </div>
      )}
      <button className="delete-question" onClick={remove}>
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
    <aside className="settings">
      <h3>Question settings</h3>
      <label className="toggle">
        Required
        <input
          type="checkbox"
          checked={q.required}
          onChange={(e) => update({ ...q, required: e.target.checked })}
        />
        <span />
      </label>
      {['multiple_choice', 'dropdown', 'yes_no', 'rating'].includes(q.type) && (
        <>
          <h4>{q.type === 'rating' ? 'Scale' : 'Options'}</h4>
          {options.map((x, i) => (
            <div className="option-edit" key={i}>
              <input
                value={x}
                onChange={(e) => {
                  const a = [...options]
                  a[i] = e.target.value
                  update({ ...q, settings: { options: a } })
                }}
              />
              <button
                onClick={() =>
                  update({
                    ...q,
                    settings: { options: options.filter((_, n) => n !== i) },
                  })
                }
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="add-option"
            onClick={() =>
              update({
                ...q,
                settings: { options: [...options, `Option ${options.length + 1}`] },
              })
            }
          >
            + Add option
          </button>
        </>
      )}
      <hr />
      <h3 className="soon">
        Theme <small>Coming soon</small>
      </h3>
      <h3 className="soon">
        Thank-you screen <small>Coming soon</small>
      </h3>
    </aside>
  )
}
