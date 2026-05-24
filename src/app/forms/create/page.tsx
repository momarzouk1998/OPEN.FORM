'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import RichTextEditor from '@/components/RichTextEditor'
import ProductGroupsEditor, { type ProductGroup } from '@/components/ProductGroupsEditor'
import PaymentMethodsEditor, { type PaymentMethod } from '@/components/PaymentMethodsEditor'
import type { QuestionType, QuestionOption, FormTemplate } from '@/types'
import { TEMPLATE_CATEGORIES } from '@/types'
import { generateShortCode } from '@/lib/shortCode'

// Question/Item type definitions with detailed explanations
// Organized by category for better UX
const QUESTION_TYPES = {
  text: { label: '┘å╪╡', icon: 'T', description: '╪Ñ╪¼╪º╪¿╪⌐ ┘å╪╡┘è╪⌐ ┘é╪╡┘è╪▒╪⌐', explanation: '┘à╪½╪º┘ä: "┘à╪º ╪º╪│┘à┘â╪ƒ"', category: 'basic' },
  textarea: { label: '┘å╪╡ ╪╖┘ê┘è┘ä', icon: '┬╢', description: '╪Ñ╪¼╪º╪¿╪⌐ ┘à┘ü╪╡┘ä╪⌐', explanation: '┘à╪½╪º┘ä: "╪╡┘ü ╪¬╪¼╪▒╪¿╪¬┘â"', category: 'basic' },
  single_choice: { label: '╪º╪«╪¬┘è╪º╪▒ ┘ê╪º╪¡╪»', icon: 'Γùï', description: '╪º╪«╪¬┘è╪º╪▒ ╪Ñ╪¼╪º╪¿╪⌐ ┘ê╪º╪¡╪»╪⌐', explanation: '┘à╪½╪º┘ä: "┘å╪╣┘à ╪ú┘ê ┘ä╪º"', category: 'basic' },
  multiple_choice: { label: '╪º╪«╪¬┘è╪º╪▒ ┘à╪¬╪╣╪»╪»', icon: 'Γÿæ', description: '╪º╪«╪¬┘è╪º╪▒ ╪╣╪»╪⌐ ╪Ñ╪¼╪º╪¿╪º╪¬', explanation: '┘à╪½╪º┘ä: "╪º┘ä┘ç┘ê╪º┘è╪º╪¬"', category: 'basic' },
  dropdown: { label: '┘é╪º╪ª┘à╪⌐ ┘à┘å╪│╪»┘ä╪⌐', icon: 'Γû╝', description: '╪º╪«╪¬┘è╪º╪▒ ┘à┘å ┘é╪º╪ª┘à╪⌐', explanation: '┘é╪º╪ª┘à╪⌐ ┘à╪╢╪║┘ê╪╖╪⌐ ┘ä╪¬┘ê┘ü┘è╪▒ ╪º┘ä┘à╪│╪º╪¡╪⌐', category: 'basic' },
  scale: { label: '╪¬┘é┘è┘è┘à', icon: 'Γ¡É', description: '╪¬┘é┘è┘è┘à ┘à┘å 1 ╪Ñ┘ä┘ë 10', explanation: '┘à╪½╪º┘ä: ╪¬┘é┘è┘è┘à ╪º┘ä╪ú╪»╪º╪í', category: 'advanced' },
  ranking: { label: '╪¬╪▒╪¬┘è╪¿', icon: '#', description: '╪¬╪▒╪¬┘è╪¿ ╪º┘ä╪╣┘å╪º╪╡╪▒', explanation: '╪¬╪▒╪¬┘è╪¿ ╪º┘ä╪╣┘å╪º╪╡╪▒ ╪¡╪│╪¿ ╪º┘ä╪ú┘ê┘ä┘ê┘è╪⌐', category: 'advanced' },
  matrix: { label: '┘à╪╡┘ü┘ê┘ü╪⌐', icon: 'Γè₧', description: '╪«┘è╪º╪▒╪º╪¬ ┘à╪┤╪¬╪▒┘â╪⌐', explanation: '╪╣╪»╪⌐ ╪ú╪│╪ª┘ä╪⌐ ┘à╪╣ ┘å┘ü╪│ ╪º┘ä╪«┘è╪º╪▒╪º╪¬', category: 'advanced' },
  date: { label: '╪¬╪º╪▒┘è╪«', icon: '≡ƒôà', description: '╪Ñ╪»╪«╪º┘ä ╪¬╪º╪▒┘è╪«', explanation: '┘à╪½╪º┘ä: "╪¬╪º╪▒┘è╪« ╪º┘ä┘à┘è┘ä╪º╪»"', category: 'advanced' },
  time: { label: '┘ê┘é╪¬', icon: 'ΓÅ░', description: '╪Ñ╪»╪«╪º┘ä ┘ê┘é╪¬', explanation: '┘à╪½╪º┘ä: "┘ê┘é╪¬ ╪º┘ä╪¡╪╢┘ê╪▒"', category: 'advanced' },
  date_range: { label: '┘å╪╖╪º┘é ┘ê┘é╪¬ ┘ê╪¬╪º╪▒┘è╪«', icon: '≡ƒôå', description: '┘à┘å ┘ê┘é╪¬/╪¬╪º╪▒┘è╪« ╪Ñ┘ä┘ë ┘ê┘é╪¬/╪¬╪º╪▒┘è╪«', explanation: '┘à╪½╪º┘ä: ┘ü╪¬╪▒╪⌐ ╪¡╪¼╪▓ ╪ú┘ê ╪Ñ╪¼╪º╪▓╪⌐', category: 'advanced' },
  slider: { label: '╪┤╪▒┘è╪╖ ╪▒┘é┘à┘è', icon: '≡ƒÄÜ∩╕Å', description: '╪º╪«╪¬┘è╪º╪▒ ┘é┘è┘à╪⌐ ╪¿╪º┘ä╪│╪¡╪¿', explanation: '┘à╪½╪º┘ä: ╪¬╪¡╪»┘è╪» ┘à┘è╪▓╪º┘å┘è╪⌐ ╪ú┘ê ╪╣┘à╪▒', category: 'advanced' },
  button_choice: { label: '╪º╪«╪¬┘è╪º╪▒ ╪¿╪ú╪▓╪▒╪º╪▒', icon: '≡ƒöÿ', description: '╪«┘è╪º╪▒╪º╪¬ ┘â╪ú╪▓╪▒╪º╪▒ ┘à╪▒╪ª┘è╪⌐', explanation: '╪¿╪»┘è┘ä ╪¼┘à┘è┘ä ┘ä┘ä╪º╪«╪¬┘è╪º╪▒ ╪º┘ä┘ê╪º╪¡╪»', category: 'advanced' },
  star_rating: { label: '╪¬┘é┘è┘è┘à ╪¿╪º┘ä┘å╪¼┘ê┘à', icon: 'Γ¡É', description: '╪¬┘é┘è┘è┘à ╪¿╪º╪│╪¬╪«╪»╪º┘à ╪º┘ä┘å╪¼┘ê┘à', explanation: '╪¿╪»┘è┘ä ┘à╪▒╪ª┘è ┘ä┘ä╪¬┘é┘è┘è┘à ╪º┘ä╪▒┘é┘à┘è', category: 'advanced' },
  appointment: { label: '╪¡╪¼╪▓ ┘à┘ê╪╣╪»', icon: '≡ƒôà', description: '╪º╪«╪¬┘è╪º╪▒ ╪¬╪º╪▒┘è╪« ┘ê┘ê┘é╪¬ ┘ä┘ä╪¡╪¼╪▓', explanation: '┘à╪½╪º┘ä: ╪¡╪¼╪▓ ┘à┘ê╪╣╪» ╪º╪│╪¬╪┤╪º╪▒╪⌐', category: 'advanced' },
  match_items: { label: '╪¬┘ê╪╡┘è┘ä ╪º┘ä╪╣┘å╪º╪╡╪▒', icon: '≡ƒöù', description: '┘à╪╖╪º╪¿┘é╪⌐ ╪╣┘à┘ê╪»┘è┘å', explanation: '┘à╪½╪º┘ä: ┘ê╪╡┘æ┘ä ╪º┘ä┘â┘ä┘à╪⌐ ╪¿┘à╪╣┘å╪º┘ç╪º', category: 'advanced' },
  file_upload: { label: '╪▒┘ü╪╣ ┘à┘ä┘ü', icon: '≡ƒôÄ', description: '╪Ñ╪▒┘ü╪º┘é ┘à┘ä┘ü ╪ú┘ê ╪╡┘ê╪▒╪⌐', explanation: '┘à╪½╪º┘ä: ╪▒┘ü╪╣ ╪º┘ä╪│┘è╪▒╪⌐ ╪º┘ä╪░╪º╪¬┘è╪⌐ ╪ú┘ê ╪╡┘ê╪▒╪⌐', category: 'advanced' },
  email_confirm: { label: '╪¬╪ú┘â┘è╪» ╪º┘ä╪¿╪▒┘è╪»', icon: 'Γ£ë∩╕Å', description: '╪Ñ╪»╪«╪º┘ä ╪º┘ä╪Ñ┘è┘à┘è┘ä ┘à╪▒╪¬┘è┘å', explanation: '┘ä┘ä╪¬╪ú┘â╪» ┘à┘å ╪╡╪¡╪⌐ ╪º┘ä╪¿╪▒┘è╪» ╪º┘ä╪Ñ┘ä┘â╪¬╪▒┘ê┘å┘è', category: 'advanced' },
  // ╪╣┘å╪º╪╡╪▒ ╪╣╪▒╪╢ (Display/Content)
  static_text: { label: '┘ü┘é╪▒╪⌐ (┘å╪╡ ╪½╪º╪¿╪¬)', icon: '≡ƒô¥', description: '┘å╪╡ ┘ä┘ä┘é╪▒╪º╪í╪⌐ ┘ü┘é╪╖', explanation: '┘ä╪╣╪▒╪╢ ╪¬╪╣┘ä┘è┘à╪º╪¬ ╪ú┘ê ┘à╪╣┘ä┘ê┘à╪º╪¬', category: 'display' },
  static_image: { label: '╪╡┘ê╪▒╪⌐ ╪½╪º╪¿╪¬╪⌐', icon: '≡ƒû╝∩╕Å', description: '╪╣╪▒╪╢ ╪╡┘ê╪▒╪⌐', explanation: '┘ä╪╣╪▒╪╢ ╪┤╪╣╪º╪▒ ╪ú┘ê ╪¬┘ê╪╢┘è╪¡', category: 'display' },
  youtube: { label: '┘ü┘è╪»┘è┘ê ┘è┘ê╪¬┘è┘ê╪¿', icon: 'Γû╢∩╕Å', description: '╪¬╪╢┘à┘è┘å ┘ü┘è╪»┘è┘ê ┘è┘ê╪¬┘è┘ê╪¿', explanation: '┘ä╪╣╪▒╪╢ ┘ü┘è╪»┘è┘ê ╪¬┘ê╪╢┘è╪¡┘è ╪»╪º╪«┘ä ╪º┘ä┘å┘à┘ê╪░╪¼', category: 'display' },
  divider: { label: '┘ü╪º╪╡┘ä', icon: 'Γ₧û', description: '╪«╪╖ ┘ü╪º╪╡┘ä', explanation: '┘ä┘ä┘ü╪╡┘ä ╪¿┘è┘å ╪º┘ä╪ú┘é╪│╪º┘à', category: 'display' },
  terms: { label: '╪º┘ä╪┤╪▒┘ê╪╖ ┘ê╪º┘ä╪ú╪¡┘â╪º┘à', icon: '≡ƒôï', description: '┘à┘ê╪º┘ü┘é╪⌐ ╪╣┘ä┘ë ╪º┘ä╪┤╪▒┘ê╪╖', explanation: '╪º┘ä┘à╪│╪¬╪«╪»┘à ┘è┘é╪▒╪ú ┘ê┘è┘ê╪º┘ü┘é ╪╣┘ä┘ë ┘å╪╡', category: 'display' },
  signature: { label: '╪º┘ä╪¬┘ê┘é┘è╪╣', icon: 'Γ£ì∩╕Å', description: '╪¡┘é┘ä ╪¬┘ê┘é┘è╪╣', explanation: '┘ä┘ä╪¡╪╡┘ê┘ä ╪╣┘ä┘ë ╪¬┘ê┘é┘è╪╣ ╪▒┘é┘à┘è', category: 'display' },
  // ╪Ñ╪╢╪º┘ü╪º╪¬ (Widgets)
  countdown_timer: { label: '╪º┘ä╪╣╪» ╪º┘ä╪¬┘å╪º╪▓┘ä┘è', icon: 'ΓÅ│', description: '╪╣╪▒╪╢ ╪º┘ä╪╣╪» ╪º┘ä╪¬┘å╪º╪▓┘ä┘è', explanation: '┘à╪ñ┘é╪¬ ┘ä╪º┘å╪¬┘ç╪º╪í ╪º┘ä╪╣╪▒╪╢', category: 'widgets' },
  products_block: { label: '╪º┘ä┘à┘å╪¬╪¼╪º╪¬', icon: '≡ƒôª', description: '┘é╪º╪ª┘à╪⌐ ┘à┘å╪¬╪¼╪º╪¬', explanation: '╪╣╪▒╪╢ ┘à┘å╪¬╪¼╪º╪¬ ┘ä┘ä╪º╪«╪¬┘è╪º╪▒ ┘ê╪º┘ä╪╖┘ä╪¿', category: 'widgets' },
  payment_info_block: { label: '╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪»┘ü╪╣', icon: '≡ƒÆ│', description: '╪╣╪▒╪╢ ╪╖╪▒┘é ╪º┘ä╪»┘ü╪╣', explanation: '╪╣╪▒╪╢ ┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä╪»┘ü╪╣', category: 'widgets' }
} as const

// Category definitions
const ITEM_CATEGORIES = {
  basic: { label: '╪ú╪│╪ª┘ä╪⌐ ╪ú╪│╪º╪│┘è╪⌐', icon: 'Γ¥ô', color: 'blue' },
  advanced: { label: '╪ú╪│╪ª┘ä╪⌐ ┘à╪¬┘é╪»┘à╪⌐', icon: '≡ƒö¼', color: 'purple' },
  display: { label: '╪╣┘å╪º╪╡╪▒ ╪╣╪▒╪╢', icon: '≡ƒæü∩╕Å', color: 'green' },
  widgets: { label: '╪Ñ╪╢╪º┘ü╪º╪¬', icon: 'ΓÜÖ∩╕Å', color: 'amber' }
} as const

const DISPLAY_ONLY_QUESTION_TYPES: QuestionType[] = [
  'static_text',
  'static_image',
  'terms',
  'countdown_timer',
  'products_block',
  'payment_info_block',
]

const DATE_RANGE_MODE_OPTIONS = [
  { value: 'time', label: '┘å╪╖╪º┘é ┘ê┘é╪¬' },
  { value: 'date', label: '┘å╪╖╪º┘é ╪¬╪º╪▒┘è╪«' },
  { value: 'datetime', label: '┘å╪╖╪º┘é ┘ê┘é╪¬ ┘ê╪¬╪º╪▒┘è╪«' },
]

const APPOINTMENT_META_ID = 'appointment_settings'
const WEEKDAY_OPTIONS = [
  { value: '0', label: '╪º┘ä╪ú╪¡╪»' },
  { value: '1', label: '╪º┘ä╪Ñ╪½┘å┘è┘å' },
  { value: '2', label: '╪º┘ä╪½┘ä╪º╪½╪º╪í' },
  { value: '3', label: '╪º┘ä╪ú╪▒╪¿╪╣╪º╪í' },
  { value: '4', label: '╪º┘ä╪«┘à┘è╪│' },
  { value: '5', label: '╪º┘ä╪¼┘à╪╣╪⌐' },
  { value: '6', label: '╪º┘ä╪│╪¿╪¬' },
]

interface MatrixRow {
  id: string
  text: string
  required: boolean
}

interface MatrixColumn {
  id: string
  text: string
  points: number
}

interface Question {
  id: string
  text: string
  type: QuestionType
  required: boolean
  points: number
  has_counter?: boolean
  options: QuestionOption[]
  // Matrix-specific
  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  // Dropdown bulk
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
  row_group?: number | null
  page?: number
}

interface FormData {
  name: string
  description: string
  allow_multiple: boolean
  image_url: string
  questions: Question[]
  time_limit?: number | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
}

interface ExistingForm {
  id: string
  name: string
  questions: any[]
}

function CreateFormContent() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingForms, setExistingForms] = useState<ExistingForm[]>([])
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'advanced' | 'display' | 'widgets'>('basic')
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(true)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateSource, setSelectedTemplateSource] = useState<'form_templates' | 'user_templates' | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    allow_multiple: false,
    time_limit: null,
    allow_delete_responses: false,
    randomize_questions: false,
    image_url: '',
    questions: []
  })

  const router = useRouter()
  

  const parseOptions = (options: any): any[] => {
    if (!options) return []
    if (typeof options === 'string') {
      try {
        return JSON.parse(options)
      } catch {
        return []
      }
    }
    if (Array.isArray(options)) {
      if (options.length > 0 && options[options.length - 1]?._visibility_rules !== undefined) {
        const arr = [...options]
        arr.pop()
        return arr
      }
      return options
    }
    return []
  }

  const normalizeProductGroups = (value: any): ProductGroup[] => {
    if (!Array.isArray(value)) return []
    if (value.length > 0 && value[value.length - 1]?._visibility_rules !== undefined) {
      value = value.slice(0, -1)
    }
    if (value.length === 0) return []
    if ('items' in value[0]) {
      return value.map((group: any) => ({
        id: group.id || `g_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: group.name || '',
        items: Array.isArray(group.items) ? group.items : []
      }))
    }
    return [{
      id: 'g_default',
      name: '╪º┘ä┘à┘å╪¬╪¼╪º╪¬',
      items: value.map((item: any) => ({
        id: item.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.name || item.text || '',
        description: item.description || '',
        price: Number(item.price ?? item.points ?? 0),
        image_url: item.image_url || item.validation_value || '',
        available: item.available !== false
      }))
    }]
  }

  const normalizePaymentMethods = (value: any): PaymentMethod[] => {
    if (!Array.isArray(value)) return []
    if (value.length > 0 && value[value.length - 1]?._visibility_rules !== undefined) {
      value = value.slice(0, -1)
    }
    return value.map((method: any) => ({
      id: method.id || `pm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      method: method.method || method.validation_type || 'bank',
      label: method.label || method.text || '',
      value: method.value || method.validation_value || '',
      details: method.details || method.validation_min || ''
    }))
  }

  const getAppointmentConfig = (options: any) => {
    const opts = parseOptions(options)
    const meta = opts.find((opt: any) => opt.id === APPOINTMENT_META_ID) || {}
    return {
      mode: meta.validation_type === 'custom' || meta.validation_type === 'auto' ? meta.validation_type : 'fixed',
      customBy: meta.validation_category === 'date' ? 'date' : 'weekday',
      single: meta.validation_value !== 'shared',
    }
  }

  const getAppointmentSlots = (options: any) => {
    return parseOptions(options).filter((opt: any) => opt.id !== APPOINTMENT_META_ID)
  }

  const setAppointmentOptions = (questionIndex: number, configUpdates: any = {}, slots?: any[]) => {
    const question = formData.questions[questionIndex]
    const currentConfig = { ...getAppointmentConfig(question.options), ...configUpdates }
    const currentSlots = slots ?? getAppointmentSlots(question.options)
    updateQuestion(questionIndex, {
      options: [
        {
          id: APPOINTMENT_META_ID,
          text: 'appointment_settings',
          points: 0,
          validation_type: currentConfig.mode,
          validation_category: currentConfig.customBy,
          validation_value: currentConfig.single ? 'single' : 'shared',
        },
        ...currentSlots,
      ] as any,
    })
  }

  const addAppointmentSlot = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const config = getAppointmentConfig(question.options)
    const slots = getAppointmentSlots(question.options)
    setAppointmentOptions(questionIndex, {}, [
      ...slots,
      {
        id: `appt_${Date.now()}`,
        text: '',
        points: 0,
        validation_category: config.mode === 'fixed' ? 'fixed' : config.customBy,
        validation_value: config.mode === 'custom' && config.customBy === 'weekday' ? '0' : '',
      },
    ])
  }

  const updateAppointmentSlot = (questionIndex: number, slotIndex: number, updates: any) => {
    const question = formData.questions[questionIndex]
    const slots = getAppointmentSlots(question.options).map((slot: any, index: number) =>
      index === slotIndex ? { ...slot, ...updates } : slot
    )
    setAppointmentOptions(questionIndex, {}, slots)
  }

  const removeAppointmentSlot = (questionIndex: number, slotIndex: number) => {
    const question = formData.questions[questionIndex]
    setAppointmentOptions(questionIndex, {}, getAppointmentSlots(question.options).filter((_: any, index: number) => index !== slotIndex))
  }

  const getAvailabilitySettings = () => {
    return (formData as any)._availability || {
      enabled: false,
      mode: 'weekly',
      weekly: [{ day: '0', start: '09:00', end: '17:00' }],
      starts_at: '',
      ends_at: '',
    }
  }

  const updateAvailabilitySettings = (updates: any) => {
    setFormData(prev => ({ ...prev, _availability: { ...getAvailabilitySettings(), ...updates } } as FormData))
  }

  const updateWeeklyAvailability = (index: number, updates: any) => {
    const current = getAvailabilitySettings()
    updateAvailabilitySettings({
      weekly: (current.weekly || []).map((slot: any, i: number) => i === index ? { ...slot, ...updates } : slot)
    })
  }

  const addWeeklyAvailability = () => {
    const current = getAvailabilitySettings()
    updateAvailabilitySettings({
      weekly: [...(current.weekly || []), { day: '0', start: '09:00', end: '17:00' }]
    })
  }

  const removeWeeklyAvailability = (index: number) => {
    const current = getAvailabilitySettings()
    updateAvailabilitySettings({
      weekly: (current.weekly || []).filter((_: any, i: number) => i !== index)
    })
  }

const supabase = createClient()

  useEffect(() => {
    init()
  }, [])

  const init = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profileData) {
        router.push('/login')
        return
      }

      setProfile(profileData)

      // Check if user is banned
      if (profileData.banned) {
        router.push('/dashboard?error=banned')
        return
      }

      // Check form limit
      if (profileData.form_limit !== -1 && profileData.form_limit !== null && profileData.form_limit !== undefined) {
        const { data: userForms, count } = await supabase
          .from('forms')
          .select('id', { count: 'exact', head: true })
          .eq('created_by', user.id)
        if (count !== null && count >= profileData.form_limit) {
          router.push('/dashboard?error=form_limit')
          return
        }
      }

      // Get user's existing forms for question reuse
      const { data: forms } = await supabase
        .from('forms')
        .select('*, questions(*)')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })

      setExistingForms(forms || [])

      // Fetch built-in and user templates (approved)
      const { data: built } = await supabase.from('form_templates').select('*').order('sort_order')
      const { data: userTemplates } = await supabase.from('user_templates').select('*').eq('approved', true).order('created_at')
      const merged = [
        ...(built || []).map((t: any) => ({ ...t, source: 'form_templates' })),
        ...(userTemplates || []).map((t: any) => ({ ...t, source: 'user_templates' }))
      ]
      setTemplates(merged)
      setTemplatesLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: '',
      type,
      required: false,
      points: 0,
      options: []
    }

    // Add default options based on type
    if (type === 'single_choice' || type === 'multiple_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'scale') {
      newQuestion.options = Array.from({ length: 10 }, (_, i) => ({
        id: `opt_${Date.now()}_${i + 1}`,
        text: String(i + 1),
        points: i + 1
      }))
    } else if (type === 'matrix') {
      newQuestion.matrix_rows = [
        { id: `row_${Date.now()}_1`, text: '', required: true },
        { id: `row_${Date.now()}_2`, text: '', required: false }
      ]
      newQuestion.matrix_columns = [
        { id: `col_${Date.now()}_1`, text: '', points: 0 },
        { id: `col_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'dropdown') {
      newQuestion.dropdown_type = 'single'
      newQuestion.correct_option_ids = []
    } else if (type === 'date_range') {
      newQuestion.options = [{ id: `range_${Date.now()}`, text: '', points: 0, validation_type: 'datetime' }] as any
    } else if (type === 'appointment') {
      newQuestion.options = [
        {
          id: APPOINTMENT_META_ID,
          text: 'appointment_settings',
          points: 0,
          validation_type: 'fixed',
          validation_category: 'weekday',
          validation_value: 'single',
        },
        { id: `appt_${Date.now()}_1`, text: '09:00', points: 0, validation_category: 'fixed', validation_value: '' },
        { id: `appt_${Date.now()}_2`, text: '10:00', points: 0, validation_category: 'fixed', validation_value: '' },
      ] as any
    } else if (type === 'button_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'slider') {
      newQuestion.options = [{ id: `opt_${Date.now()}_1`, text: '0|100|1', points: 0 }] as any
    } else if (type === 'star_rating') {
      newQuestion.options = Array.from({ length: 5 }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 }))
    } else if (type === 'countdown_timer') {
      newQuestion.text = '╪º┘ä╪╣╪» ╪º┘ä╪¬┘å╪º╪▓┘ä┘è ┘ä┘ä╪╣╪▒╪╢'
      newQuestion.options = [{
        id: `timer_${Date.now()}`,
        text: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
        validation_value: '╪º┘ä╪╣╪▒╪╢ ┘è┘å╪¬┘ç┘è ╪«┘ä╪º┘ä',
        validation_min: ''
      }] as any
    } else if (type === 'products_block') {
      newQuestion.text = '╪º┘ä┘à┘å╪¬╪¼╪º╪¬'
      newQuestion.options = [{ id: `g_${Date.now()}`, name: '', items: [] }] as any
    } else if (type === 'payment_info_block') {
      newQuestion.text = '╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪»┘ü╪╣'
      newQuestion.options = [{ id: `pm_${Date.now()}`, method: 'bank', label: '', value: '', details: '' }] as any
    } else if (type === 'match_items') {
      newQuestion.matrix_rows = [
        { id: `left_${Date.now()}_1`, text: '╪╣┘å╪╡╪▒ 1', required: true },
        { id: `left_${Date.now()}_2`, text: '╪╣┘å╪╡╪▒ 2', required: true }
      ]
      newQuestion.matrix_columns = [
        { id: `right_${Date.now()}_1`, text: '╪Ñ╪¼╪º╪¿╪⌐ 1', points: 0 },
        { id: `right_${Date.now()}_2`, text: '╪Ñ╪¼╪º╪¿╪⌐ 2', points: 0 }
      ]
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q: any, i: number) => 
        i === index ? { ...q, ...updates } : q
      )
    }))
  }

  const [deletedQuestions, setDeletedQuestions] = useState<Array<{ question: any; index: number }>>([])

  const removeQuestion = (index: number) => {
    const removed = formData.questions[index]
    if (removed) {
      setDeletedQuestions(prev => [...prev.slice(-19), { question: removed, index }])
    }
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_: any, i: number) => i !== index)
    }))
  }

  const undoDelete = () => {
    if (deletedQuestions.length === 0) return
    const last = deletedQuestions[deletedQuestions.length - 1]
    const insertAt = Math.min(last.index, formData.questions.length)
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions.slice(0, insertAt),
        last.question,
        ...prev.questions.slice(insertAt)
      ]
    }))
    setDeletedQuestions(prev => prev.slice(0, -1))
  }

  const addOption = (questionIndex: number) => {
    const newOption: QuestionOption = {
      id: `opt_${Date.now()}`,
      text: '',
      points: 0
    }

    updateQuestion(questionIndex, {
      options: [...(formData.questions[questionIndex].options || []), newOption]
    })
  }

  const removeOption = (questionIndex: number, optionIndex: number) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).filter((_: any, i: number) => i !== optionIndex)
    })
  }

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    updateQuestion(questionIndex, {
      options: parseOptions(formData.questions[questionIndex].options).map((opt: any, i: number) =>
        i === optionIndex ? { ...opt, ...updates } : opt
      )
    })
  }

  const addMatrixRow = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newRow = { id: `row_${Date.now()}`, text: '', required: false }
    updateQuestion(questionIndex, {
      matrix_rows: [...(question.matrix_rows || []), newRow]
    })
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex)
    })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).map((row: any, i: number) =>
        i === rowIndex ? { ...row, ...updates } : row
      )
    })
  }

  const addMatrixColumn = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    const newCol = { id: `col_${Date.now()}`, text: '', points: 0 }
    updateQuestion(questionIndex, {
      matrix_columns: [...(question.matrix_columns || []), newCol]
    })
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).filter((_: any, i: number) => i !== colIndex)
    })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).map((col: any, i: number) =>
        i === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const parseBulkText = (questionIndex: number) => {
    const question = formData.questions[questionIndex]
    if (!question.bulk_text) return

    const lines = question.bulk_text.split('\n').filter((l: string) => l.trim())
    const newOptions = lines.map((line: string) => ({
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      text: line.trim(),
      points: 0
    }))

    updateQuestion(questionIndex, {
      options: newOptions,
      bulk_text: ''
    })
  }

  const importQuestion = (question: any) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options)
    }

    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }))
    setShowQuestionPicker(false)
  }

  const useTemplate = (template: FormTemplate) => {
    const importedQuestions: Question[] = (template.questions_data || []).map((q: any, index: number) => {
      let options: QuestionOption[] = []
      let matrix_rows: any = undefined
      let matrix_columns: any = undefined
      let dropdown_type: 'single' | 'multiple' | undefined = undefined
      let correct_option_ids: string[] | undefined = undefined

      if (q.type === 'matrix' && q.options?.matrix_rows) {
        matrix_rows = q.options.matrix_rows
        matrix_columns = q.options.matrix_columns || []
      } else if (q.type === 'dropdown' && q.options?.dropdown_type) {
        dropdown_type = q.options.dropdown_type
        correct_option_ids = q.options.correct_option_ids || []
        options = q.options.options || []
      } else if (q.type === 'single_choice' || q.type === 'multiple_choice') {
        options = q.options || []
      } else if (q.type === 'scale') {
        options = q.options || []
      } else if (q.type === 'ranking') {
        options = q.options || []
      } else {
        options = q.options || []
      }

      return {
        id: `q_${Date.now()}_${index}`,
        text: q.text || '',
        type: q.type || 'text',
        required: q.required ?? true,
        points: q.points || 0,
        has_counter: q.has_counter || false,
        options,
        matrix_rows,
        matrix_columns,
        dropdown_type,
        correct_option_ids,
        correct_option_id: correct_option_ids?.[0],
        row_group: q.row_group || null
      }
    })

    setFormData(prev => ({
      ...prev,
      name: template.name,
      description: template.description || '',
      questions: importedQuestions,
      ...(template.form_settings || {})
    }))
    setSelectedTemplateId(template.id)
    setSelectedTemplateSource((template as any).source || null)
  }

  const saveForm = async () => {
    if (!formData.name.trim()) {
      alert('┘è╪▒╪¼┘å ╪Ñ╪»╪«╪º┘ä ╪º╪│┘à ╪º┘ä┘ü┘ê╪▒┘à')
      return
    }

    if ((formData.questions || []).length === 0) {
      alert('┘è╪▒╪¼┘å ╪Ñ╪╢╪º┘ü╪⌐ ╪│╪ñ╪º┘ä ┘ê╪º╪¡╪» ╪╣┘ä┘ë ╪º┘ä╪ú┘é┘ä')
      return
    }

    setSaving(true)
    try {
      // Create form
      const { data: form, error: formError } = await supabase
        .from('forms')
        .insert({
          name: formData.name,
          description: formData.description,
          allow_multiple: formData.allow_multiple,
          time_limit: formData.time_limit,
          allow_delete_responses: formData.allow_delete_responses,
          randomize_questions: formData.randomize_questions,
          image_url: formData.image_url,
          created_by: profile.id,
          is_active: true,
          short_code: generateShortCode(),
          page_titles: {
            _is_test: !!((formData as any)._is_test),
            _availability: (formData as any)._availability || null
          }
        })
        .select()
        .single()

      if (formError) throw formError

      // Create questions
      const questionsToInsert = (formData.questions || []).map((q: any, index: number) => {
        let optionsData: any

        if (q.type === 'matrix') {
          optionsData = {
            matrix_rows: (q.matrix_rows || []).map((row: any) => ({
              id: row.id,
              text: row.text,
              required: row.required
            })),
            matrix_columns: (q.matrix_columns || []).map((col: any) => ({
              id: col.id,
              text: col.text,
              points: col.points || 0
            }))
          }
        } else if (q.type === 'dropdown') {
          const items = parseOptions(q.options).map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            points: opt.points || 0
          }))
          optionsData = {
            dropdown_type: q.dropdown_type || 'single',
            correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : (q.correct_option_id ? [q.correct_option_id] : []),
            options: items
          }
        } else if (q.type === 'match_items') {
          optionsData = {
            left_items: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text })),
            right_items: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text }))
          }
        } else {
          optionsData = parseOptions(q.options)
        }

        const storedOpts = Array.isArray(optionsData)
          ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }]
          : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
        return {
          form_id: form.id,
          text: q.text,
          type: q.type,
          required: q.required,
          points: q.points,
          has_counter: q.has_counter || false,
          order_index: index,
          row_group: q.row_group || null,
          page: q.page || 1,
          options: JSON.stringify(storedOpts)
        }
      })

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      // If this form was created from an approved user template, inform server to increment usage_count
      try {
        if (selectedTemplateId && selectedTemplateSource === 'user_templates') {
          await fetch('/api/templates/increment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ templateId: selectedTemplateId })
          })
        }
      } catch (e) {
        console.warn('Failed to notify template usage', e)
      }
      router.push(`/forms/${form.serial_number}/edit`)
    } catch (error) {
      console.error('Error saving form:', error)
      alert('╪¡╪»╪½ ╪«╪╖╪ú ╪ú╪½┘å╪º╪í ╪¡┘ü╪╕ ╪º┘ä┘ü┘ê╪▒┘à')
    } finally {
      setSaving(false)
    }
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    
    setFormData(prev => ({ ...prev, questions: newQuestions }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              ╪▒╪¼┘ê╪╣
            </button>
            <Link
              href="/templates"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
              ┘é┘ê╪º┘ä╪¿ ╪¼╪º┘ç╪▓╪⌐
            </Link>
          </div>
          <h1 className="text-lg font-bold text-blue-700">╪Ñ┘å╪┤╪º╪í ┘ü┘ê╪▒┘à ╪¼╪»┘è╪»</h1>
          <button
            onClick={undoDelete}
            disabled={deletedQuestions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-all text-xs font-medium cursor-pointer bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-30 disabled:cursor-not-allowed"
            title="استرداد آخر سؤال تم حذفه"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            استرداد
          </button>
          <button
            onClick={saveForm}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ╪¼╪º╪▒┘è ╪º┘ä╪¡┘ü╪╕...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                ╪¡┘ü╪╕
              </>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Form Basic Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">┘à╪╣┘ä┘ê┘à╪º╪¬ ╪º┘ä┘ü┘ê╪▒┘à</h2>

          {(() => {
            const questions = formData.questions || []
            let totalPoints = 0
            questions.forEach((q: any) => {
              if (q.type === 'file_upload') return
              if (q.type === 'single_choice') {
                totalPoints += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else if (q.type === 'multiple_choice') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'dropdown') {
                const opts = parseOptions(q.options)
                if (q.dropdown_type === 'multiple') {
                  totalPoints += (q.correct_option_ids || []).reduce((s:number, id:string) => {
                    const opt = opts.find((o:any) => o.id === id)
                    return s + (opt?.points || 0)
                  }, 0)
                } else {
                  const opt = opts.find((o:any) => o.id === q.correct_option_id)
                  totalPoints += opt?.points || 0
                }
              } else if (q.type === 'ranking') {
                totalPoints += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
              } else if (q.type === 'matrix') {
                const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                totalPoints += colSum * (q.matrix_rows || []).length
              } else if (q.type === 'scale') {
                totalPoints += Math.max(10, ...parseOptions(q.options).map((o:any) => o.points || 0))
              } else {
                totalPoints += q.points || 0
              }
            })
            return (
              <div className="flex items-center gap-4 mb-6 p-3 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                <div className="flex-1 flex items-center gap-2">
                  <span className="text-sm text-gray-600">╪╣╪»╪» ╪º┘ä╪ú╪│╪ª┘ä╪⌐:</span>
                  <span className="font-bold text-gray-900">{questions.length}</span>
                </div>
                {!!((formData as any)._is_test) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">╪Ñ╪¼┘à╪º┘ä┘è ╪º┘ä┘å┘é╪º╪╖:</span>
                  <span className="font-bold text-blue-700">{totalPoints}</span>
                </div>
                )}
              </div>
            )
          })()}
          
          <div className="space-y-4">
            {/* Image Upload */}
            <ImageUpload
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              currentImage={formData.image_url}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">╪º╪│┘à ╪º┘ä┘ü┘ê╪▒┘à *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="┘à╪½╪º┘ä: ╪¬┘é┘è┘è┘à ╪ú╪»╪º╪í ╪º┘ä╪╡┘ä╪º╪⌐"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">╪º┘ä┘ê╪╡┘ü</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="┘ê╪╡┘ü ┘à╪«╪¬╪╡╪▒ ┘ä┘ä┘å┘à┘ê╪░╪¼..."
              />
            </div>

            {/* Is Test */}
            <div className="bg-cyan-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!(formData as any)._is_test}
                  onChange={(e) => setFormData(prev => ({ ...prev, _is_test: e.target.checked } as FormData))}
                  className="w-5 h-5 mt-1 text-cyan-600 rounded focus:ring-cyan-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">╪º╪«╪¬╪¿╪º╪▒</span>
                  <span className="text-sm text-gray-600">╪Ñ╪╕┘ç╪º╪▒ ╪¡┘é┘ê┘ä ╪º┘ä┘å┘é╪º╪╖ ┘ê╪º┘ä╪»╪▒╪¼╪º╪¬ ┘ä┘ä╪¬┘é┘è┘è┘à ┘ê╪º┘ä╪¬╪╡╪¡┘è╪¡</span>
                </div>
              </label>
            </div>

            {/* Allow Multiple */}
            <div className="bg-amber-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_multiple}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_multiple: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">╪º┘ä╪│┘à╪º╪¡ ╪¿╪º┘ä╪¬╪│╪¼┘è┘ä ╪º┘ä┘à╪¬╪╣╪»╪»</span>
                  <span className="text-sm text-gray-600">╪¬┘ü╪╣┘è┘ä ┘ç╪░╪º ╪º┘ä╪«┘è╪º╪▒ ┘è╪│┘à╪¡ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ╪¿╪Ñ╪╣╪º╪»╪⌐ ┘à┘ä╪í ╪º┘ä┘å┘à┘ê╪░╪¼ ╪╣╪»╪⌐ ┘à╪▒╪º╪¬ ┘è┘ê┘à┘è╪º┘ï</span>
                </div>
              </label>
            </div>

            {/* Timer Limit */}
            <div className="bg-green-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.time_limit !== null && formData.time_limit !== undefined}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_limit: e.target.checked ? 10 : null }))}
                  className="w-5 h-5 mt-1 text-green-600 rounded focus:ring-green-500"
                />
                <div className="flex-1">
                  <span className="font-medium text-gray-800 block">╪¬╪¡╪»┘è╪» ┘ê┘é╪¬ ┘ä┘ä╪Ñ╪¼╪º╪¿╪⌐</span>
                  <span className="text-sm text-gray-600">╪¬┘ü╪╣┘è┘ä ╪╣╪»╪º╪» ╪¬┘å╪º╪▓┘ä┘è ┘ä┘ä┘à╪│╪¬╪«╪»┘à┘è┘å ┘ä╪Ñ┘â┘à╪º┘ä ╪º┘ä┘å┘à┘ê╪░╪¼ ╪«┘ä╪º┘ä ┘à╪»╪⌐ ┘à╪¡╪»╪»╪⌐</span>
                  {formData.time_limit !== null && formData.time_limit !== undefined && (
                    <div className="mt-2">
                      <label className="text-sm text-gray-600 ml-2">╪º┘ä┘ê┘é╪¬ (╪¿╪º┘ä╪»┘é╪º╪ª┘é):</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.time_limit}
                        onChange={(e) => setFormData(prev => ({ ...prev, time_limit: parseInt(e.target.value) || 1 }))}
                        className="w-24 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-center"
                      />
                    </div>
                  )}
                </div>
              </label>
            </div>

            {/* Availability Schedule */}
            <div className="bg-blue-50 rounded-xl p-4">
              {(() => {
                const availability = getAvailabilitySettings()
                return (
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!availability.enabled}
                        onChange={(e) => updateAvailabilitySettings({ enabled: e.target.checked })}
                        className="w-5 h-5 mt-1 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-800 block">╪¼╪»┘ê┘ä ╪¬╪┤╪║┘è┘ä ╪º┘ä┘å┘à┘ê╪░╪¼</span>
                        <span className="text-sm text-gray-600">╪º┘ü╪¬╪¡ ┘ê╪ú╪║┘ä┘é ╪º┘ä┘å┘à┘ê╪░╪¼ ╪¬┘ä┘é╪º╪ª┘è┘ï╪º ╪¡╪│╪¿ ╪ú┘è╪º┘à ╪º┘ä╪ú╪│╪¿┘ê╪╣ ╪ú┘ê ╪¡╪│╪¿ ╪¬╪º╪▒┘è╪« ┘ê┘ê┘é╪¬ ┘à╪¡╪»╪»┘è┘å.</span>
                      </div>
                    </label>

                    {availability.enabled && (
                      <div className="space-y-3 pr-8">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <button type="button" onClick={() => updateAvailabilitySettings({ mode: 'weekly' })} className={`px-3 py-2 rounded-lg border text-sm ${availability.mode === 'weekly' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>╪¡╪│╪¿ ╪ú┘è╪º┘à ╪º┘ä╪ú╪│╪¿┘ê╪╣</button>
                          <button type="button" onClick={() => updateAvailabilitySettings({ mode: 'range' })} className={`px-3 py-2 rounded-lg border text-sm ${availability.mode === 'range' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>╪¡╪│╪¿ ╪¬╪º╪▒┘è╪« ┘ê┘ê┘é╪¬</button>
                        </div>

                        {availability.mode === 'weekly' ? (
                          <div className="space-y-2">
                            {(availability.weekly || []).map((slot: any, index: number) => (
                              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto] bg-white border border-blue-100 rounded-xl p-2">
                                <select value={slot.day || '0'} onChange={(e) => updateWeeklyAvailability(index, { day: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                                  {WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                                </select>
                                <input type="time" value={slot.start || ''} onChange={(e) => updateWeeklyAvailability(index, { start: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                <input type="time" value={slot.end || ''} onChange={(e) => updateWeeklyAvailability(index, { end: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                                <button type="button" onClick={() => removeWeeklyAvailability(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={addWeeklyAvailability} className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded-lg hover:border-blue-400 text-sm">+ ╪Ñ╪╢╪º┘ü╪⌐ ┘è┘ê┘à ╪¬╪┤╪║┘è┘ä</button>
                          </div>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="block">
                              <span className="block text-sm text-gray-600 mb-1">┘è┘ü╪¬╪¡ ┘ü┘è</span>
                              <input type="datetime-local" value={availability.starts_at || ''} onChange={(e) => updateAvailabilitySettings({ starts_at: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" />
                            </label>
                            <label className="block">
                              <span className="block text-sm text-gray-600 mb-1">┘è┘é┘ü┘ä ┘ü┘è</span>
                              <input type="datetime-local" value={availability.ends_at || ''} onChange={(e) => updateAvailabilitySettings({ ends_at: e.target.value })} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" />
                            </label>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* Allow Delete Responses */}
            <div className="bg-orange-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_delete_responses || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, allow_delete_responses: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-orange-600 rounded focus:ring-orange-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">╪º┘ä╪│┘à╪º╪¡ ╪¿╪¡╪░┘ü ╪º┘ä╪▒╪»┘ê╪»</span>
                  <span className="text-sm text-gray-600">╪Ñ╪╕┘ç╪º╪▒ ╪▓╪▒ ╪¡╪░┘ü ╪¿╪¼╪º┘å╪¿ ┘â┘ä ╪¬╪│╪¼┘è┘ä ┘ä┘è╪¬┘à┘â┘å ╪º┘ä┘à╪│╪¬╪«╪»┘à ┘à┘å ╪¡╪░┘ü ╪▒╪»┘ê╪»┘ç ╪¿┘å┘ü╪│┘ç</span>
                </div>
              </label>
            </div>

            {/* Randomize Questions */}
            <div className="bg-purple-50 rounded-xl p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.randomize_questions || false}
                  onChange={(e) => setFormData(prev => ({ ...prev, randomize_questions: e.target.checked }))}
                  className="w-5 h-5 mt-1 text-purple-600 rounded focus:ring-purple-500"
                />
                <div>
                  <span className="font-medium text-gray-800 block">╪¬╪▒╪¬┘è╪¿ ╪╣╪┤┘ê╪º╪ª┘è ┘ä┘ä╪ú╪│╪ª┘ä╪⌐</span>
                  <span className="text-sm text-gray-600">╪╣╪▒╪╢ ╪º┘ä╪ú╪│╪ª┘ä╪⌐ ╪¿╪¬╪▒╪¬┘è╪¿ ┘à╪«╪¬┘ä┘ü ┘ä┘â┘ä ┘à╪│╪¬╪«╪»┘à ┘ä┘à┘å╪╣ ╪º┘ä╪║╪┤</span>
                </div>
              </label>
            </div>


          </div>
        </div>

        {/* Templates Section */}
        {!templatesLoading && templates.length > 0 && (
          <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 ${(formData.questions || []).length > 0 ? 'hidden' : ''}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">╪º╪¿╪»╪ú ┘à┘å ┘é╪º┘ä╪¿ ╪¼╪º┘ç╪▓</h2>
              <Link
                href="/templates"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                ╪¬╪╡┘ü╪¡ ╪º┘ä┘â┘ä
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {templates.slice(0, 6).map((template) => (
                <button
                  key={template.id}
                  onClick={() => useTemplate(template)}
                  className="text-right p-4 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    {template.image_url ? (
                      <img src={template.image_url} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center shrink-0">
                        <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm group-hover:text-blue-700 transition-colors">{template.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{template.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          {TEMPLATE_CATEGORIES[template.category] || template.category}
                        </span>
                        <span className="text-xs text-gray-400">{(template.questions_data || []).length} ╪│╪ñ╪º┘ä</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              ╪º┘ä╪ú╪│╪ª┘ä╪⌐ ({(formData.questions || []).length})
            </h2>
          </div>


          {/* Questions List */}
          <div className="space-y-4">
            {(formData.questions || []).map((question: any, qIndex: number) => (
              <div key={question.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-sm">
                    {qIndex + 1}
                  </span>
                  <div className="flex-1">
                    {question.type === 'static_text' ? (
                      <RichTextEditor
                        value={question.text}
                        onChange={(html) => updateQuestion(qIndex, { text: html })}
                        placeholder="╪º┘â╪¬╪¿ ╪º┘ä┘å╪╡ ┘ç┘å╪º..."
                      />
                    ) : ['terms'].includes(question.type) ? (
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                        placeholder="╪º┘â╪¬╪¿ ╪º┘ä┘å╪╡ ┘ç┘å╪º..."
                        rows={4}
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                        placeholder="╪º┘â╪¬╪¿ ╪º┘ä╪│╪ñ╪º┘ä ┘ç┘å╪º..."
                        className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveQuestion(qIndex, 'up')}
                      disabled={qIndex === 0}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveQuestion(qIndex, 'down')}
                      disabled={qIndex === (formData.questions || []).length - 1}
                      className="p-2 text-gray-500 hover:bg-gray-200 rounded-lg disabled:opacity-30"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeQuestion(qIndex)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Question Settings */}
                <div className="flex flex-wrap gap-4 mb-4 ms-2 sm:ms-11">
                  {!DISPLAY_ONLY_QUESTION_TYPES.includes(question.type) && (
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={question.required}
                        onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-gray-700">┘à╪╖┘ä┘ê╪¿</span>
                    </label>
                  )}
                  
                  {!!((formData as any)._is_test) && !['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix', 'button_choice', 'match_items', 'static_text', 'static_image', 'divider', 'terms', 'youtube'].includes(question.type) && (
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-700">╪º┘ä┘å┘é╪º╪╖:</label>
                    <input
                      type="number"
                      min="0"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })}
                      className="w-20 px-2 py-1 bg-white border border-gray-200 rounded-lg text-center"
                    />
                  </div>
                  )}

                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                    {QUESTION_TYPES[question.type as QuestionType]?.label}
                  </span>
                  {!!((formData as any)._is_test) && (() => {
                    if (question.type === 'file_upload') return null
                    let total = 0
                    if (question.type === 'single_choice') {
                      total = Math.max(0, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else if (question.type === 'multiple_choice') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'dropdown') {
                      const opts = parseOptions(question.options)
                      if (question.dropdown_type === 'multiple') {
                        total = (question.correct_option_ids || []).reduce((s:number, id:string) => {
                          const opt = opts.find((o:any) => o.id === id)
                          return s + (opt?.points || 0)
                        }, 0)
                      } else {
                        const opt = opts.find((o:any) => o.id === question.correct_option_id)
                        total = opt?.points || 0
                      }
                    } else if (question.type === 'ranking') {
                      total = parseOptions(question.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (question.type === 'matrix') {
                      const colSum = (question.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                      total = colSum * (question.matrix_rows || []).length
                    } else if (question.type === 'scale') {
                      total = Math.max(10, ...parseOptions(question.options).map((o:any) => o.points || 0))
                    } else {
                      total = question.points || 0
                    }
                    return <span className="text-xs text-blue-600 font-medium me-2">({total} ┘å┘é╪╖╪⌐)</span>
                  })()}
                </div>

                {/* Text validation options (short text only) */}
                {question.type === 'text' && (() => {
                  const opts: any[] = parseOptions(question.options)
                  const meta = opts[0] || {}
                  const vt = meta.validation_type || ''
                  const vcat = meta.validation_category || ''
                  const firstOptions = [
                    { value: 'name', label: '╪º╪│┘à' },
                    { value: 'email', label: '╪º┘è┘à┘è┘ä' },
                    { value: 'phone', label: '╪▒┘é┘à ┘ç╪º╪¬┘ü' },
                    { value: 'number', label: '╪▒┘é┘à' },
                    { value: 'plain', label: '┘å╪╡ ╪¿╪»┘ê┘å ╪¬╪¡┘é┘é' },
                    { value: 'text_check', label: '┘å╪╡ ╪¿╪¬╪¡┘é┘é' },
                  ]
                  const currentFirst = firstOptions.find(o => {
                    if (vcat) return o.value === vcat
                    if (!vt || vt === '') return o.value === 'plain'
                    if (vt === 'name' || vt === 'email' || vt === 'phone' || vt === 'plain') return o.value === vt
                    return o.value === 'plain'
                  }) || firstOptions[0]

                  const secondOptions = (() => {
                    if (currentFirst.value === 'name') return [
                      { value: 'name_2', label: '╪½┘å╪º╪ª┘è' },
                      { value: 'name_3', label: '╪½┘ä╪º╪½┘è' },
                      { value: 'name_4', label: '╪▒╪¿╪º╪╣┘è' },
                    ]
                    if (currentFirst.value === 'number') return [
                      { value: 'equal_to', label: '┘è╪│╪º┘ê┘è' },
                      { value: 'not_equal_to', label: '┘ä╪º ┘è╪│╪º┘ê┘è' },
                      { value: 'less_than', label: '╪ú┘é┘ä ┘à┘å' },
                      { value: 'less_than_or_equal', label: '╪ú┘é┘ä ┘à┘å ╪ú┘ê ┘è╪│╪º┘ê┘è' },
                      { value: 'greater_than', label: '╪ú┘â╪¿╪▒ ┘à┘å' },
                      { value: 'greater_than_or_equal', label: '╪ú┘â╪¿╪▒ ┘à┘å ╪ú┘ê ┘è╪│╪º┘ê┘è' },
                      { value: 'between', label: '╪¿┘è┘å' },
                      { value: 'not_between', label: '┘ä┘è╪│ ╪¿┘è┘å' },
                      { value: 'whole_number', label: '╪╣╪»╪» ╪╡╪¡┘è╪¡' },
                      { value: 'is_number', label: '╪º╪╣╪»╪º╪» ╪╣╪┤╪▒┘è╪⌐' },
                    ]
                    if (currentFirst.value === 'text_check') return [
                      { value: 'equal_to', label: '┘è╪│╪º┘ê┘è' },
                      { value: 'not_equal_to', label: '┘ä╪º ┘è╪│╪º┘ê┘è' },
                      { value: 'contains_word', label: '┘è╪¡╪¬┘ê┘ë ╪╣┘ä┘ë' },
                      { value: 'does_not_contain', label: '┘ä╪º ┘è╪¡╪¬┘ê┘ë ╪╣┘ä┘ë' },
                    ]
                    return []
                  })()

                  const setValidation = (firstVal: string, secondVal?: string) => {
                    if (firstVal === '' || firstVal === 'email' || firstVal === 'phone' || firstVal === 'plain') {
                      updateQuestion(qIndex, { options: [{ validation_type: firstVal, validation_category: '', validation_value: '', validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'name') {
                      const wordCount = secondVal ? parseInt(secondVal.split('_')[1]) : 2
                      updateQuestion(qIndex, { options: [{ validation_type: 'name', validation_category: 'name', validation_value: String(wordCount), validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'number') {
                      const sv = secondVal || 'equal_to'
                      updateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'number', validation_value: '', validation_min: '', validation_max: '' }] as any })
                    } else if (firstVal === 'text_check') {
                      const sv = secondVal || 'contains_word'
                      updateQuestion(qIndex, { options: [{ validation_type: sv, validation_category: 'text_check', validation_value: sv === 'contains_word' || sv === 'does_not_contain' ? '' : '', validation_min: '', validation_max: '' }] as any })
                    }
                  }

                  const currentSecondVal = (() => {
                    if (currentFirst.value === 'name') {
                      const wc = meta.validation_value || '2'
                      return `name_${wc}`
                    }
                    if (currentFirst.value === 'number' || currentFirst.value === 'text_check') {
                      if (['contains_word','does_not_contain','equal_to','not_equal_to','less_than','less_than_or_equal','greater_than','greater_than_or_equal','between','not_between','whole_number','is_number'].includes(vt)) return vt
                    }
                    return ''
                  })()

                  return (
                    <div className="ms-2 sm:ms-11 mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="text-sm font-medium text-purple-700 mb-2">┘å┘ê╪╣ ╪º┘ä╪¬╪¡┘é┘é ┘à┘å ╪º┘ä╪Ñ╪¼╪º╪¿╪⌐:</p>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={currentFirst.value}
                          onChange={(e) => {
                            setValidation(e.target.value)
                          }}
                          className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500"
                        >
                          {firstOptions.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        {secondOptions.length > 0 && (
                          <select
                            value={currentSecondVal}
                            onChange={(e) => {
                              setValidation(currentFirst.value, e.target.value)
                            }}
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500"
                          >
                            <option value="">╪º╪«╪¬╪▒...</option>
                            {secondOptions.map(o => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        )}
                        {(currentFirst.value === 'text_check' && vt) && (
                          <input
                            type="text"
                            value={meta.validation_value || ''}
                            onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                            placeholder="╪ú╪»╪«┘ä ╪º┘ä┘å╪╡..."
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-40"
                          />
                        )}
                        {(currentFirst.value === 'number' && (vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal')) && (
                          <input
                            type="number"
                            step="any"
                            value={meta.validation_value ?? ''}
                            onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                            placeholder="╪º┘ä┘é┘è┘à╪⌐..."
                            className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-32"
                          />
                        )}
                        {(currentFirst.value === 'number' && (vt === 'between' || vt === 'not_between')) && (
                          <>
                            <input
                              type="number"
                              step="any"
                              value={meta.validation_min ?? ''}
                              onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: e.target.value, validation_max: meta.validation_max || '', validation_value: '' }] as any })}
                              placeholder="╪º┘ä╪╡╪║╪▒┘ë..."
                              className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                            />
                            <input
                              type="number"
                              step="any"
                              value={meta.validation_max ?? ''}
                              onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: meta.validation_min || '', validation_max: e.target.value, validation_value: '' }] as any })}
                              placeholder="╪º┘ä╪╣╪╕┘à┘ë..."
                              className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                            />
                          </>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Matrix specific UI */}
                {question.type === 'matrix' && (
                  <div className="ms-2 sm:ms-11 space-y-6">
                    {/* Rows */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">╪º┘ä╪╡┘ü┘ê┘ü:</p>
                      <div className="space-y-2">
                        {(question.matrix_rows || []).map((row: any, rIndex: number) => (
                          <div key={row.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white rounded-lg p-3 border border-gray-200">
                            <span className="text-gray-400">Γè₧</span>
                            <input
                              type="text"
                              value={row.text}
                              onChange={(e) => updateMatrixRow(qIndex, rIndex, { text: e.target.value })}
                              placeholder="┘å╪╡ ╪º┘ä╪│╪ñ╪º┘ä..."
                              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                            />
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={row.required}
                                onChange={(e) => updateMatrixRow(qIndex, rIndex, { required: e.target.checked })}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                              ╪Ñ╪¼╪¿╪º╪▒┘è
                            </label>
                            <button
                              onClick={() => removeMatrixRow(qIndex, rIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixRow(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          ╪Ñ╪╢╪º┘ü╪⌐ ╪╡┘ü
                        </button>
                      </div>
                    </div>
                    {/* Columns */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">╪▒╪ñ┘ê╪│ ╪º┘ä╪ú╪╣┘à╪»╪⌐:</p>
                      <div className="space-y-2">
                        {(question.matrix_columns || []).map((col: any, cIndex: number) => (
                          <div key={col.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-amber-50 rounded-lg p-3 border border-amber-200">
                            <span className="text-gray-400">ΓÿÉ</span>
                            <input
                              type="text"
                              value={col.text}
                              onChange={(e) => updateMatrixColumn(qIndex, cIndex, { text: e.target.value })}
                              placeholder="╪╣┘å┘ê╪º┘å ╪º┘ä╪╣┘à┘ê╪»..."
                              className="flex-1 px-3 py-2 border border-amber-200 rounded-lg focus:ring-1 focus:ring-blue-500 bg-white"
                            />
                            <div className={`flex items-center gap-1 ${!!((formData as any)._is_test) ? '' : 'hidden'}`}>
                              <span className="text-xs text-gray-500">╪º┘ä╪»╪▒╪¼╪⌐:</span>
                              <input
                                type="number"
                                min="0"
                                value={col.points}
                                onChange={(e) => updateMatrixColumn(qIndex, cIndex, { points: Number(e.target.value) })}
                                className="w-16 px-2 py-2 border border-amber-200 rounded-lg text-center bg-white"
                              />
                            </div>
                            <button
                              onClick={() => removeMatrixColumn(qIndex, cIndex)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addMatrixColumn(qIndex)}
                          className="w-full py-2 border-2 border-dashed border-amber-300 text-amber-600 rounded-lg hover:border-amber-400 hover:text-amber-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘à┘ê╪»
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bulk text import for dropdown */}
                {question.type === 'dropdown' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    {/* Single / Multi toggle */}
                    <div className="flex gap-3 bg-gray-50 rounded-lg p-2 border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'single', correct_option_ids: [], correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'single' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        ╪º╪«╪¬┘è╪º╪▒ ┘ê╪º╪¡╪»
                      </button>
                      <button
                        type="button"
                        onClick={() => updateQuestion(qIndex, { dropdown_type: 'multiple', correct_option_id: undefined })}
                        className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${question.dropdown_type === 'multiple' ? 'bg-white text-blue-700 shadow-sm border border-blue-200' : 'text-gray-600 hover:text-gray-800'}`}
                      >
                        ╪º╪«╪¬┘è╪º╪▒ ┘à╪¬╪╣╪»╪»
                      </button>
                    </div>

                    <p className="text-sm font-medium text-gray-700">╪º┘ä╪«┘è╪º╪▒╪º╪¬:</p>
                    {/* Bulk import */}
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 mb-2">╪Ñ╪╢╪º┘ü╪⌐ ╪«┘è╪º╪▒╪º╪¬ ╪»┘ü╪╣╪⌐ ┘ê╪º╪¡╪»╪⌐ (┘â┘ä ╪│╪╖╪▒ ╪«┘è╪º╪▒):</p>
                      <textarea
                        value={question.bulk_text || ''}
                        onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })}
                        placeholder="╪º┘ä╪«┘è╪º╪▒ ╪º┘ä╪ú┘ê┘ä
╪º┘ä╪«┘è╪º╪▒ ╪º┘ä╪½╪º┘å┘è
╪º┘ä╪«┘è╪º╪▒ ╪º┘ä╪½╪º┘ä╪½"
                        rows={3}
                        className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={() => parseBulkText(qIndex)}
                        disabled={!question.bulk_text?.trim()}
                        className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        ╪Ñ╪╢╪º┘ü╪⌐ ╪º┘ä╪«┘è╪º╪▒╪º╪¬
                      </button>
                    </div>
                    {/* Options list */}
                    {parseOptions(question.options).map((option: any, oIndex: number) => {
                      const isMulti = question.dropdown_type === 'multiple'
                      const correctIds = question.correct_option_ids || []
                      const isCorrect = isMulti ? correctIds.includes(option.id) : question.correct_option_id === option.id
                      return (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">Γû╝</span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="┘å╪╡ ╪º┘ä╪«┘è╪º╪▒..."
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1 text-sm whitespace-nowrap">
                              <input
                                type={isMulti ? 'checkbox' : 'radio'}
                                name={`correct_${question.id}`}
                                checked={isCorrect}
                                onChange={() => {
                                  if (isMulti) {
                                    const newIds = isCorrect
                                      ? correctIds.filter((id: string) => id !== option.id)
                                      : [...correctIds, option.id]
                                    updateQuestion(qIndex, { correct_option_ids: newIds })
                                  } else {
                                    updateQuestion(qIndex, { correct_option_id: question.correct_option_id === option.id ? undefined : option.id })
                                  }
                                }}
                                className="w-4 h-4 text-green-600"
                              />
                              <span className="text-green-700 text-xs">╪╡╪¡┘è╪¡</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={option.points}
                              onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                              placeholder="╪º┘ä╪»╪▒╪¼╪⌐"
                              className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                            />
                          </div>
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )})}
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      ╪Ñ╪╢╪º┘ü╪⌐ ╪«┘è╪º╪▒
                    </button>
                  </div>
                )}

                {/* Options for other choice questions */}
                {(question.type === 'single_choice' || question.type === 'multiple_choice' || question.type === 'ranking' || question.type === 'button_choice') && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    {question.type === 'single_choice' && (
                      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!question.has_counter}
                          onChange={(e) => updateQuestion(qIndex, { has_counter: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        ╪¬┘ü╪╣┘è┘ä ╪º┘ä╪╣╪»╪º╪» (╪│╪¿╪¡╪⌐ ╪º┘ä╪¬╪│╪¿┘è╪¡)
                      </label>
                    )}
                    <p className="text-sm font-medium text-gray-700">╪º┘ä╪«┘è╪º╪▒╪º╪¬:</p>
                    {parseOptions(question.options).map((option: any, oIndex: number) => (
                      <div key={option.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3">
                          <span className="text-gray-400">
                            {question.type === 'single_choice' ? 'Γùï' : question.type === 'ranking' ? '#' : 'Γÿæ'}
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => updateOption(qIndex, oIndex, { text: e.target.value })}
                            placeholder="┘å╪╡ ╪º┘ä╪«┘è╪º╪▒..."
                            className="w-full sm:flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                          />
                          <input
                            type="number"
                            min="0"
                            value={option.points}
                            onChange={(e) => updateOption(qIndex, oIndex, { points: Number(e.target.value) })}
                            placeholder="╪º┘ä┘å┘é╪º╪╖"
                            className={`w-20 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                            title="╪º┘ä┘å┘é╪º╪╖"
                          />
                          {question.has_counter && (
                            <input
                              type="number"
                              min="1"
                              value={option.counter_target || ''}
                              onChange={(e) => updateOption(qIndex, oIndex, { counter_target: parseInt(e.target.value) || null })}
                              placeholder="╪º┘ä┘ç╪»┘ü"
                              className="w-20 px-2 py-2 border border-emerald-200 rounded-lg text-center text-sm"
                              title="╪º┘ä╪╣╪»╪» ╪º┘ä┘à╪│╪¬┘ç╪»┘ü ┘ä┘ä╪¬╪│╪¿┘è╪¡"
                            />
                          )}
                          <button
                            onClick={() => removeOption(qIndex, oIndex)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => addOption(qIndex)}
                      className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      ╪Ñ╪╢╪º┘ü╪⌐ ╪«┘è╪º╪▒
                    </button>
                  </div>
                )}

                {question.type === 'match_items' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">╪º┘ä╪╣┘à┘ê╪» ╪º┘ä╪ú┘è┘à┘å (╪º┘ä╪«┘è╪º╪▒╪º╪¬):</p>
                      <div className="space-y-2">
                        {(question.matrix_rows || []).map((row: any, ri: number) => (
                          <div key={ri} className="flex items-center gap-2">
                            <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`╪╣┘å╪╡╪▒ ${ri + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                            <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addMatrixRow(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘å╪╡╪▒</button>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-3">╪º┘ä╪╣┘à┘ê╪» ╪º┘ä╪ú┘è╪│╪▒ (╪º┘ä╪Ñ╪¼╪º╪¿╪º╪¬):</p>
                      <div className="space-y-2">
                        {(question.matrix_columns || []).map((col: any, ci: number) => (
                          <div key={ci} className="flex items-center gap-2">
                            <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`╪Ñ╪¼╪º╪¿╪⌐ ${ci + 1}`} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                            <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className={`w-16 px-2 py-2 border border-gray-200 rounded-lg text-center ${!!((formData as any)._is_test) ? '' : 'hidden'}`} placeholder="┘å┘é╪º╪╖" />
                            <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        ))}
                      </div>
                      <button onClick={() => addMatrixColumn(qIndex)} className="mt-2 text-sm text-blue-600 hover:text-blue-700">+ ╪Ñ╪╢╪º┘ü╪⌐ ╪Ñ╪¼╪º╪¿╪⌐</button>
                    </div>
                  </div>
                )}

                {question.type === 'slider' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">╪Ñ╪╣╪»╪º╪»╪º╪¬ ╪º┘ä╪┤╪▒┘è╪╖ ╪º┘ä╪▒┘é┘à┘è (Min|Max|Step):</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).text || '0|100|1'} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="0|100|1" />
                    <p className="text-xs text-gray-500 mt-1">╪ú╪»╪«┘ä ╪º┘ä╪¡╪» ╪º┘ä╪ú╪»┘å┘ë | ╪º┘ä╪¡╪» ╪º┘ä╪ú┘é╪╡┘ë | ┘à┘é╪»╪º╪▒ ╪º┘ä╪▓┘è╪º╪»╪⌐</p>
                  </div>
                )}

                {question.type === 'youtube' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">╪▒╪º╪¿╪╖ ┘è┘ê╪¬┘è┘ê╪¿:</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).text || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
                  </div>
                )}

                {question.type === 'appointment' && (() => {
                  const appointmentConfig = getAppointmentConfig(question.options)
                  const appointmentSlots = getAppointmentSlots(question.options)
                  return (
                    <div className="ms-2 sm:ms-11 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">┘å┘ê╪╣ ╪º┘ä┘à┘ê╪º╪╣┘è╪»</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {[
                            { value: 'fixed', label: '┘à┘ê╪º╪╣┘è╪» ╪½╪º╪¿╪¬╪⌐', hint: '┘å┘ü╪│ ╪º┘ä┘à┘ê╪º╪╣┘è╪» ┘à╪¬╪º╪¡╪⌐ ┘â┘ä ┘è┘ê┘à.' },
                            { value: 'custom', label: '┘à┘ê╪º╪╣┘è╪» ┘à╪«╪╡╪╡╪⌐', hint: '┘à┘ê╪º╪╣┘è╪» ┘à╪«╪¬┘ä┘ü╪⌐ ╪¡╪│╪¿ ╪º┘ä┘è┘ê┘à ╪ú┘ê ╪º┘ä╪¬╪º╪▒┘è╪«.' },
                            { value: 'auto', label: '┘à┘ê╪╣╪» ╪¬┘ä┘é╪º╪ª┘è', hint: '┘è╪╣╪▒╪╢ ╪ú┘é╪▒╪¿ ┘à┘ê╪╣╪» ╪¬┘ä┘é╪º╪ª┘è┘ï╪º╪î ┘ê┘â┘ä ╪¡╪¼╪▓ ╪¼╪»┘è╪» ┘è╪▓┘è╪» ╪¿╪╣╪»╪» ╪»┘é╪º╪ª┘é ╪¬╪¡╪»╪»┘ç.' },
                          ].map((mode) => (
                            <button
                              key={mode.value}
                              type="button"
                              onClick={() => setAppointmentOptions(qIndex, { mode: mode.value })}
                              className={`text-right p-3 rounded-xl border transition-colors ${appointmentConfig.mode === mode.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300'}`}
                            >
                              <span className="block text-sm font-semibold">{mode.label}</span>
                              <span className="block text-xs mt-1 opacity-75">{mode.hint}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {appointmentConfig.mode === 'custom' && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">╪¬╪«╪╡┘è╪╡ ╪º┘ä┘à┘ê╪º╪╣┘è╪» ╪¡╪│╪¿</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <button type="button" onClick={() => setAppointmentOptions(qIndex, { customBy: 'weekday' })} className={`px-3 py-2 rounded-lg border text-sm ${appointmentConfig.customBy === 'weekday' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>╪ú┘è╪º┘à ╪º┘ä╪ú╪│╪¿┘ê╪╣</button>
                            <button type="button" onClick={() => setAppointmentOptions(qIndex, { customBy: 'date' })} className={`px-3 py-2 rounded-lg border text-sm ${appointmentConfig.customBy === 'date' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}>╪¬╪º╪▒┘è╪« ┘à╪¡╪»╪»</button>
                          </div>
                        </div>
                      )}

                      {appointmentConfig.mode === 'auto' && (
                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1.5">╪¿╪»╪º┘è╪⌐ ╪ú┘ê┘ä ┘à┘ê╪╣╪»</span>
                            <input
                              type="datetime-local"
                              value={appointmentSlots[0]?.validation_value || ''}
                              onChange={(e) => {
                                const firstSlot = appointmentSlots[0] || { id: `appt_auto_${Date.now()}`, text: '', points: 0 }
                                setAppointmentOptions(qIndex, {}, [{ ...firstSlot, text: 'auto', validation_category: 'auto', validation_value: e.target.value, validation_min: firstSlot.validation_min || '30' }])
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            />
                          </label>
                          <label className="block">
                            <span className="block text-sm font-medium text-gray-700 mb-1.5">┘ü╪▒┘é ╪º┘ä╪»┘é╪º╪ª┘é ╪¿┘è┘å ┘â┘ä ╪¡╪º┘ä╪⌐</span>
                            <input
                              type="number"
                              min="1"
                              value={appointmentSlots[0]?.validation_min || '30'}
                              onChange={(e) => {
                                const firstSlot = appointmentSlots[0] || { id: `appt_auto_${Date.now()}`, text: 'auto', points: 0, validation_category: 'auto' }
                                setAppointmentOptions(qIndex, {}, [{ ...firstSlot, validation_category: 'auto', validation_value: firstSlot.validation_value || '', validation_min: e.target.value }])
                              }}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            />
                          </label>
                          <p className="sm:col-span-2 text-xs text-gray-500">┘à╪½╪º┘ä: ┘ä┘ê ╪ú┘ê┘ä ┘à┘ê╪╣╪» 10:00 ┘ê╪º┘ä┘ü╪▒┘é 15 ╪»┘é┘è┘é╪⌐╪î ╪ú┘ê┘ä ╪¡╪¼╪▓ ┘è┘â┘ê┘å 10:00 ┘ê╪º┘ä╪½╪º┘å┘è 10:15 ┘ê╪º┘ä╪½╪º┘ä╪½ 10:30.</p>
                        </div>
                      )}

                      {appointmentConfig.mode !== 'auto' && <label className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer">
                        <input
                          type="checkbox"
                          checked={appointmentConfig.single}
                          onChange={(e) => setAppointmentOptions(qIndex, { single: e.target.checked })}
                          className="w-4 h-4 mt-0.5 text-amber-600 rounded"
                        />
                        <span>
                          <span className="block text-sm font-medium text-amber-800">┘à┘ê╪º╪╣┘è╪» ┘à┘å┘ü╪▒╪»╪⌐</span>
                          <span className="block text-xs text-amber-700 mt-1">┘ä┘ê ┘à╪│╪¬╪«╪»┘à ╪º╪«╪¬╪º╪▒ ┘à┘ê╪╣╪»╪î ┘è╪«╪¬┘ü┘è ┘ç╪░╪º ╪º┘ä┘à┘ê╪╣╪» ┘à┘å ╪º┘ä╪º╪«╪¬┘è╪º╪▒╪º╪¬ ╪º┘ä┘à╪¬╪º╪¡╪⌐ ┘ä╪¿╪º┘é┘è ╪º┘ä┘à╪│╪¬╪«╪»┘à┘è┘å.</span>
                        </span>
                      </label>}

                      {appointmentConfig.mode !== 'auto' && <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">╪º┘ä┘à┘ê╪º╪╣┘è╪» ╪º┘ä┘à╪¬╪º╪¡╪⌐</p>
                        {appointmentSlots.map((slot: any, slotIndex: number) => (
                          <div key={slot.id || slotIndex} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] items-center bg-white border border-gray-200 rounded-xl p-2">
                            {appointmentConfig.mode === 'custom' && appointmentConfig.customBy === 'weekday' && (
                              <select value={slot.validation_value || '0'} onChange={(e) => updateAppointmentSlot(qIndex, slotIndex, { validation_category: 'weekday', validation_value: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                                {WEEKDAY_OPTIONS.map((day) => <option key={day.value} value={day.value}>{day.label}</option>)}
                              </select>
                            )}
                            {appointmentConfig.mode === 'custom' && appointmentConfig.customBy === 'date' && (
                              <input type="date" value={slot.validation_value || ''} onChange={(e) => updateAppointmentSlot(qIndex, slotIndex, { validation_category: 'date', validation_value: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                            )}
                            <input type="time" value={slot.text || ''} onChange={(e) => updateAppointmentSlot(qIndex, slotIndex, { text: e.target.value, validation_category: appointmentConfig.mode === 'fixed' ? 'fixed' : appointmentConfig.customBy })} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white" />
                            <button type="button" onClick={() => removeAppointmentSlot(qIndex, slotIndex)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={() => addAppointmentSlot(qIndex)} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm">
                          + ╪Ñ╪╢╪º┘ü╪⌐ ┘à┘ê╪╣╪»
                        </button>
                      </div>}
                    </div>
                  )
                })()}

                {question.type === 'date_range' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">┘å┘ê╪╣ ╪º┘ä┘å╪╖╪º┘é:</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {DATE_RANGE_MODE_OPTIONS.map((mode) => {
                        const currentMode = parseOptions(question.options)[0]?.validation_type || 'datetime'
                        const isSelected = currentMode === mode.value
                        return (
                          <button
                            key={mode.value}
                            type="button"
                            onClick={() => {
                              if (parseOptions(question.options).length === 0) addOption(qIndex)
                              updateOption(qIndex, 0, { validation_type: mode.value })
                            }}
                            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'}`}
                          >
                            {mode.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {question.type === 'countdown_timer' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">╪º┘ä╪╣╪» ╪º┘ä╪¬┘å╪º╪▓┘ä┘è ┘ä┘ä╪╣╪▒╪╢</p>
                      <p className="text-xs text-gray-500">╪¡╪»╪» ┘ê┘é╪¬ ╪º┘å╪¬┘ç╪º╪í ╪º┘ä╪╣╪▒╪╢ ┘ê╪º┘ä┘å╪╡ ╪º┘ä╪░┘è ╪│┘è╪╕┘ç╪▒ ┘ä┘ä┘à╪│╪¬╪«╪»┘à.</p>
                    </div>
                    <input
                      type="text"
                      value={parseOptions(question.options)[0]?.validation_value || '╪º┘ä╪╣╪▒╪╢ ┘è┘å╪¬┘ç┘è ╪«┘ä╪º┘ä'}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { validation_value: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="╪º┘ä╪╣╪▒╪╢ ┘è┘å╪¬┘ç┘è ╪«┘ä╪º┘ä"
                    />
                    <input
                      type="datetime-local"
                      value={parseOptions(question.options)[0]?.text || ''}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { text: e.target.value })
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                    />
                    <textarea
                      value={parseOptions(question.options)[0]?.validation_min || ''}
                      onChange={(e) => {
                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                        updateOption(qIndex, 0, { validation_min: e.target.value })
                      }}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                      placeholder="┘ê╪╡┘ü ╪º╪«╪¬┘è╪º╪▒┘è ┘è╪╕┘ç╪▒ ╪ú╪│┘ü┘ä ╪º┘ä╪╣╪»"
                    />
                  </div>
                )}

                {question.type === 'products_block' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">╪º┘ä┘à┘å╪¬╪¼╪º╪¬</p>
                      <p className="text-xs text-gray-500">╪ú╪╢┘ü ┘à╪¼┘à┘ê╪╣╪º╪¬╪î ┘ê╪»╪º╪«┘ä ┘â┘ä ┘à╪¼┘à┘ê╪╣╪⌐ ╪º┘ä╪ú╪╡┘å╪º┘ü ┘ê╪º┘ä╪│╪╣╪▒ ┘ê╪º┘ä╪¬┘ü╪º╪╡┘è┘ä ┘ê╪º┘ä╪╡┘ê╪▒╪⌐.</p>
                    </div>
                    <ProductGroupsEditor
                      groups={normalizeProductGroups(parseOptions(question.options))}
                      onChange={(groups) => updateQuestion(qIndex, { options: groups as any })}
                    />
                  </div>
                )}

                {question.type === 'payment_info_block' && (
                  <div className="ms-2 sm:ms-11 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">╪¿┘è╪º┘å╪º╪¬ ╪º┘ä╪»┘ü╪╣</p>
                      <p className="text-xs text-gray-500">╪º┘â╪¬╪¿ ╪¿┘è╪º┘å╪º╪¬┘â ╪º┘ä╪¬┘è ╪│╪¬╪╕┘ç╪▒ ┘ä┘ä┘à╪│╪¬╪«╪»┘à ┘à╪╣ ╪▓╪▒ ┘å╪│╪« ┘ä┘â┘ä ╪▒┘é┘à ╪ú┘ê ╪▒╪º╪¿╪╖.</p>
                    </div>
                    <PaymentMethodsEditor
                      methods={normalizePaymentMethods(parseOptions(question.options))}
                      onChange={(methods) => updateQuestion(qIndex, { options: methods as any })}
                    />
                  </div>
                )}

                {question.type === 'star_rating' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">╪╣╪»╪» ╪º┘ä┘å╪¼┘ê┘à:</p>
                    <input type="number" min="1" max="10" value={parseOptions(question.options).length} onChange={(e) => {
                      const count = parseInt(e.target.value) || 5;
                      updateQuestion(qIndex, { options: Array.from({ length: count }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 })) });
                    }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" />
                  </div>
                )}

                {question.type === 'static_image' && (
                  <div className="ms-2 sm:ms-11">
                    <p className="text-sm font-medium text-gray-700 mb-3">╪▒╪º╪¿╪╖ ╪º┘ä╪╡┘ê╪▒╪⌐ (URL):</p>
                    <input type="text" value={(parseOptions(question.options)[0] || {}).validation_value || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { validation_value: e.target.value }) }} className="w-full px-3 py-2 border border-gray-200 rounded-lg" dir="ltr" placeholder="https://..." />
                    <p className="text-xs text-gray-500 mt-1">╪º┘å╪│╪« ╪▒╪º╪¿╪╖ ╪º┘ä╪╡┘ê╪▒╪⌐ ┘ê╪╢╪╣┘ç ┘ç┘å╪º</p>
                  </div>
                )}


                {question.type === 'scale' && (
                  <div className="ms-2 sm:ms-11 bg-blue-50 rounded-lg p-4 overflow-x-auto">
                    <p className="text-sm font-medium text-blue-700 mb-3">┘à┘é┘è╪º╪│ ╪º┘ä╪¬┘é┘è┘è┘à (1-10)</p>
                    <div className="flex justify-between items-center min-w-[200px]">
                      {parseOptions(question.options).map((opt: any) => (
                        <div key={opt.id} className="text-center">
                          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mb-1">
                            {opt.text}
                          </div>
                          <input
                            type="number"
                            value={opt.points}
                            onChange={(e) => {
                              const idx = (question.options || []).findIndex((o: any) => o.id === opt.id)
                              updateOption(qIndex, idx, { points: Number(e.target.value) })
                            }}
                            className={`w-12 px-1 py-1 border border-blue-200 rounded text-center text-sm ${!!((formData as any)._is_test) ? '' : 'hidden'}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {(formData.questions || []).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 mb-4">┘ä┘à ╪¬╪╢┘ü ╪ú┘è ╪ú╪│╪ª┘ä╪⌐ ╪¿╪╣╪»</p>
              </div>
            )}
            
            {/* Add Question Button and Import Button */}
            <div className="flex gap-3 mt-8">
              <div className="relative flex-1">
                <button
                  onClick={() => setQuestionMenuOpen(!questionMenuOpen)}
                  className="w-full py-4 border-2 border-dashed border-blue-300 text-blue-600 rounded-xl hover:bg-blue-50 hover:border-blue-400 font-bold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  ╪Ñ╪╢╪º┘ü╪⌐ ╪╣┘å╪╡╪▒
                </button>
                
                {questionMenuOpen && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 shadow-xl rounded-xl z-20">
                    {/* Category Tabs */}
                    <div className="flex flex-wrap border-b border-gray-200 p-2 gap-2">
                      {(Object.entries(ITEM_CATEGORIES) as [typeof selectedCategory, typeof ITEM_CATEGORIES['basic']][]).map(([cat, info]) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium text-sm transition-colors ${
                            selectedCategory === cat
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{info.icon}</span>
                          {info.label}
                        </button>
                      ))}
                    </div>

                    {/* Items Grid */}
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][])
                        .filter(([_, info]) => info.category === selectedCategory)
                        .map(([type, info]) => (
                          <button
                            key={type}
                            onClick={() => {
                              if (type === 'file_upload') return
                              addQuestion(type)
                              setQuestionMenuOpen(false)
                              setSelectedCategory('basic')
                            }}
                            className={`flex flex-col items-center justify-center text-center p-3 rounded-lg transition-colors border ${
                              type === 'file_upload'
                                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                                : 'hover:bg-blue-50 border-transparent hover:border-blue-200'
                            }`}
                            title={type === 'file_upload' ? '┘é┘è╪» ╪º┘ä╪¬╪╖┘ê┘è╪▒' : ''}
                          >
                            <span className={`text-2xl mb-2 ${type === 'file_upload' ? 'opacity-50' : ''}`}>
                              {info.icon}
                            </span>
                            <span className="font-medium text-gray-800 text-sm mb-1">{info.label}</span>
                            <span className="text-xs text-gray-500">{type === 'file_upload' ? '┘é┘è╪» ╪º┘ä╪¬╪╖┘ê┘è╪▒' : info.description}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowQuestionPicker(true)}
                className="py-4 px-6 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 font-bold transition-all flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
                </svg>
                ╪º╪│╪¬┘è╪▒╪º╪» ╪│╪ñ╪º┘ä
              </button>
            </div>
          </div>
        </div>

        {/* Examples Section */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
          <h3 className="text-lg font-bold text-amber-800 mb-4">≡ƒÆí ╪ú┘à╪½┘ä╪⌐ ╪╣┘à┘ä┘è╪⌐ ┘ä╪ú┘å┘ê╪º╪╣ ╪º┘ä╪ú╪│╪ª┘ä╪⌐</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Text Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">T</span>
                <span className="font-medium text-gray-800">┘å╪╡ ┘é╪╡┘è╪▒</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">┘à╪º ╪º╪│┘à ╪º┘ä┘à╪│╪¼╪» ╪º┘ä╪░┘è ╪¬╪╡┘ä┘è ┘ü┘è┘ç╪ƒ</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                ╪Ñ╪¼╪º╪¿╪⌐: ┘à╪│╪¼╪» ╪º┘ä┘å┘ê╪▒
              </div>
            </div>

            {/* Textarea Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">┬╢</span>
                <span className="font-medium text-gray-800">┘å╪╡ ╪╖┘ê┘è┘ä</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">╪º┘â╪¬╪¿ ╪╣┘å ╪┤╪╣┘ê╪▒┘â ╪ú╪½┘å╪º╪í ┘é╪▒╪º╪í╪⌐ ╪º┘ä┘é╪▒╪ó┘å</p>
              <div className="bg-gray-50 rounded p-2 text-xs text-gray-500">
                ╪Ñ╪¼╪º╪¿╪⌐: ╪ú╪┤╪╣╪▒ ╪¿╪º┘ä╪│┘â┘è┘å╪⌐ ┘ê╪º┘ä╪╖┘à╪ú┘å┘è┘å╪⌐...
              </div>
            </div>

            {/* Single Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">Γùï</span>
                <span className="font-medium text-gray-800">╪º╪«╪¬┘è╪º╪▒ ┘ê╪º╪¡╪»</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">┘ü┘è ╪ú┘è ┘ê┘é╪¬ ╪¬╪╡┘ä┘è ╪º┘ä┘ü╪¼╪▒╪ƒ</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>Γùï ┘é╪¿┘ä ╪º┘ä╪ú╪░╪º┘å (5 ┘å┘é╪º╪╖)</div>
                <div>Γùï ┘à╪╣ ╪º┘ä╪ú╪░╪º┘å (4 ┘å┘é╪º╪╖)</div>
                <div>Γùï ╪¿╪╣╪» ╪º┘ä╪ú╪░╪º┘å ╪¿┘Ç15 ╪»┘é┘è┘é╪⌐ (3 ┘å┘é╪º╪╖)</div>
              </div>
            </div>

            {/* Multiple Choice Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">Γÿæ</span>
                <span className="font-medium text-gray-800">╪º╪«╪¬┘è╪º╪▒ ┘à╪¬╪╣╪»╪»</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">┘à╪º ╪º┘ä╪ú╪╣┘à╪º┘ä ╪º┘ä╪╡╪º┘ä╪¡╪⌐ ╪º┘ä╪¬┘è ╪¬┘é┘ê┘à ╪¿┘ç╪º╪ƒ</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>Γÿæ ╪º┘ä╪╡┘ä╪º╪⌐ ┘ü┘è ┘ê┘é╪¬┘ç╪º (2 ┘å┘é╪º╪╖)</div>
                <div>Γÿæ ┘é╪▒╪º╪í╪⌐ ╪º┘ä┘é╪▒╪ó┘å (2 ┘å┘é╪º╪╖)</div>
                <div>ΓÿÉ ╪º┘ä╪╡╪»┘é╪⌐ (2 ┘å┘é╪º╪╖)</div>
                <div>Γÿæ ╪º┘ä╪░┘â╪▒ (1 ┘å┘é╪╖╪⌐)</div>
              </div>
            </div>

            {/* Scale Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">Γ¡É</span>
                <span className="font-medium text-gray-800">╪¬┘é┘è┘è┘à</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">┘é┘è┘à ┘à╪│╪¬┘ê┘ë ╪«╪┤┘ê╪╣┘â ┘ü┘è ╪º┘ä╪╡┘ä╪º╪⌐</p>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Γ¡ÉΓÿåΓÿåΓÿåΓÿå ╪╢╪╣┘è┘ü</span>
                <span>Γ¡ÉΓ¡ÉΓ¡ÉΓ¡ÉΓ¡É ┘à┘à╪¬╪º╪▓</span>
              </div>
            </div>

            {/* Ranking Example */}
            <div className="bg-white rounded-xl p-4 border border-amber-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center text-sm font-bold">#</span>
                <span className="font-medium text-gray-800">╪¬╪▒╪¬┘è╪¿</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">╪▒╪¬╪¿ ╪º┘ä╪╣╪¿╪º╪»╪º╪¬ ╪¡╪│╪¿ ╪ú┘ê┘ä┘ê┘è╪¬┘â</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div>1. ╪º┘ä╪╡┘ä╪º╪⌐ (5 ┘å┘é╪º╪╖)</div>
                <div>2. ┘é╪▒╪º╪í╪⌐ ╪º┘ä┘é╪▒╪ó┘å (4 ┘å┘é╪º╪╖)</div>
                <div>3. ╪º┘ä╪░┘â╪▒ (3 ┘å┘é╪º╪╖)</div>
                <div>4. ╪º┘ä╪╡╪»┘é╪⌐ (2 ┘å┘é╪º╪╖)</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-amber-100 rounded-lg">
            <p className="text-sm text-amber-800">
              <strong>┘å╪╡┘è╪¡╪⌐:</strong> ╪º╪│╪¬╪«╪»┘à ╪ú┘å┘ê╪º╪╣ ╪º┘ä╪ú╪│╪ª┘ä╪⌐ ╪º┘ä┘à╪«╪¬┘ä┘ü╪⌐ ┘ä╪¼╪╣┘ä ╪º┘ä┘å┘à┘ê╪░╪¼ ╪ú┘â╪½╪▒ ╪¬┘ü╪º╪╣┘ä╪º┘ï ┘ê╪┤┘à┘ê┘ä┘è╪⌐.
              ┘è┘à┘â┘å┘â ╪»┘à╪¼ ╪╣╪»╪⌐ ╪ú┘å┘ê╪º╪╣ ┘ü┘è ┘å┘à┘ê╪░╪¼ ┘ê╪º╪¡╪» ┘ä╪¬╪║╪╖┘è╪⌐ ╪¼┘ê╪º┘å╪¿ ┘à╪«╪¬┘ä┘ü╪⌐ ┘à┘å ╪º┘ä┘à┘ê╪╢┘ê╪╣.
            </p>
          </div>
        </div>
      </main>

      {/* Question Picker Modal */}
      {showQuestionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestionPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">╪º╪│╪¬┘è╪▒╪º╪» ╪│╪ñ╪º┘ä ┘à┘å ┘ü┘ê╪▒┘à ╪│╪º╪¿┘é╪⌐</h3>
              <button onClick={() => setShowQuestionPicker(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              {existingForms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">┘ä╪º ╪¬┘ê╪¼╪» ┘ü┘ê╪▒┘à╪▓ ╪│╪º╪¿┘é╪⌐</p>
                </div>
              ) : (
                existingForms.map(form => (
                  <div key={form.id} className="mb-4">
                    <div className="mb-2">
                      <h4 className="font-medium text-gray-800">{form.name}</h4>
                    </div>
                    <div className="space-y-2">
                      {form.questions?.map((q: any) => (
                        <button
                          key={q.id}
                          onClick={() => importQuestion(q)}
                          className="w-full text-right p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-lg transition-colors"
                        >
                          <p className="font-medium text-gray-800">{q.text}</p>
                          <p className="text-sm text-gray-500">{QUESTION_TYPES[q.type as QuestionType]?.label}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateFormPage() {
  return <CreateFormContent />
}

