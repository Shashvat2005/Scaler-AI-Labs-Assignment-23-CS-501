import { Form, Question, QType } from './types'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'

async function call<T>(path: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!r.ok) {
    const e = await r.json().catch(() => ({}))
    throw new Error(
      typeof e.detail === 'string' ? e.detail : 'Something went wrong'
    )
  }
  return r.status === 204 ? undefined as T : r.json()
}

export const api = {
  forms: () => call<Form[]>('/forms'),
  form: (id: string | number) => call<Form>(`/forms/${id}`),
  create: (title: string) =>
    call<Form>('/forms', { method: 'POST', body: JSON.stringify({ title }) }),
  update: (id: number, title: string) =>
    call<Form>(`/forms/${id}`, { method: 'PUT', body: JSON.stringify({ title }) }),
  remove: (id: number) => call<void>(`/forms/${id}`, { method: 'DELETE' }),
  duplicate: (id: number) =>
    call<Form>(`/forms/${id}/duplicate`, { method: 'POST' }),
  status: (id: number, a: 'publish' | 'unpublish') =>
    call<Form>(`/forms/${id}/${a}`, { method: 'POST' }),
  addQ: (id: number, type: QType) =>
    call<Question>(`/forms/${id}/questions`, {
      method: 'POST',
      body: JSON.stringify({
        type,
        title: 'Your question goes here',
        description: '',
        required: false,
        settings: defaults(type),
      }),
    }),
  updateQ: (q: Question) =>
    call<Question>(`/questions/${q.id}`, {
      method: 'PUT',
      body: JSON.stringify(q),
    }),
  deleteQ: (id: number) => call<void>(`/questions/${id}`, { method: 'DELETE' }),
  reorder: (id: number, ids: number[]) =>
    call<Question[]>(`/forms/${id}/questions/reorder`, {
      method: 'PUT',
      body: JSON.stringify({ question_ids: ids }),
    }),
  publicForm: (id: string, preview = false) =>
    call<{ title: string; public_id: string; preview: boolean; questions: Question[] }>(
      `/public/forms/${id}${preview ? '?preview=true' : ''}`
    ),
  submit: (id: string, answers: Record<string, string>) =>
    call(`/public/forms/${id}/responses`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),
  responses: (id: string) =>
    call<{ id: number; submitted_at: string; answers: Record<string, string> }[]>(
      `/forms/${id}/responses`
    ),
  stats: (id: string) =>
    call<{
      response_count: number
      questions: { question_id: number; count: number; distribution?: Record<string, number> }[]
    }>(`/forms/${id}/statistics`),
}

export function defaults(t: QType) {
  return ['multiple_choice', 'dropdown'].includes(t)
    ? { options: ['Option 1', 'Option 2'] }
    : t === 'yes_no'
    ? { options: ['Yes', 'No'] }
    : t === 'rating'
    ? { options: ['1', '2', '3', '4', '5'] }
    : {}
}
