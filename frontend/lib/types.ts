export type QType =
  | 'short_text'
  | 'long_text'
  | 'multiple_choice'
  | 'dropdown'
  | 'email'
  | 'number'
  | 'yes_no'
  | 'rating'

export interface Question {
  id: number
  form_id: number
  position: number
  type: QType
  title: string
  description: string
  required: boolean
  settings: { options?: string[] }
}

export interface Form {
  id: number
  title: string
  public_id: string
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
  response_count: number
  questions: Question[]
}
