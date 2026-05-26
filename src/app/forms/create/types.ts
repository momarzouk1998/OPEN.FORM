import type { QuestionType, QuestionOption } from '@/types'

export interface MatrixRow {
  id: string
  text: string
  required: boolean
}

export interface MatrixColumn {
  id: string
  text: string
  points: number
}

export interface Question {
  id: string
  text: string
  type: QuestionType
  required: boolean
  points: number
  has_counter?: boolean
  options: QuestionOption[]
  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
  row_group?: number | null
  page?: number
  visibility_rules?: any[]
}

export interface FormData {
  name: string
  description: string
  allow_multiple: boolean
  image_url: string
  questions: Question[]
  time_limit?: number | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
}

export interface ExistingForm {
  id: string
  name: string
  questions: any[]
}
