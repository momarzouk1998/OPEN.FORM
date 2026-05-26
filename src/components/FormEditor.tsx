'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { QuestionType, QuestionOption } from '@/types'
import type { ProductGroup } from '@/components/ProductGroupsEditor'
import type { PaymentMethod } from '@/components/PaymentMethodsEditor'

const ImageUpload = dynamic(() => import('@/components/ImageUpload'), { ssr: false })
const RichTextEditor = dynamic(() => import('@/components/RichTextEditor'), { ssr: false })
const ProductGroupsEditor = dynamic(() => import('@/components/ProductGroupsEditor'), { ssr: false })
const PaymentMethodsEditor = dynamic(() => import('@/components/PaymentMethodsEditor'), { ssr: false })
const FormFiller = dynamic(() => import('@/app/forms/[id]/FormFiller'), { ssr: false })

import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import ThemeDesigner from '@/components/edit/ThemeDesigner'
import { generateShortCode } from '@/lib/shortCode'
import { WEEKDAY_OPTIONS } from '@/constants/questionTypes'
import { toast } from '@/lib/toast'
import FormBasicInfo from '@/components/form-creator/FormBasicInfo'
import TemplatesGrid from '@/components/form-creator/TemplatesGrid'
import QuestionList from '@/components/form-creator/QuestionList'
import AddQuestionMenu from '@/components/form-creator/AddQuestionMenu'
import QuestionPickerModal from '@/components/form-creator/QuestionPickerModal'
import ExamplesSection from '@/components/form-creator/ExamplesSection'
import type { FormTemplate } from '@/types'
import { parseOptions } from '@/app/forms/create/utils'

interface MatrixRow { id: string; text: string; required: boolean }
interface MatrixColumn { id: string; text: string; points: number }

interface Question {
  id: string; text: string; type: QuestionType; required: boolean; points: number
  has_counter?: boolean; options: QuestionOption[]
  matrix_rows?: MatrixRow[]; matrix_columns?: MatrixColumn[]
  bulk_text?: string; correct_option_id?: string; dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]; row_group?: number | null; page?: number
  visibility_rules?: any[]; hidden?: boolean; order_index?: number
}

interface FormDataShared {
  id?: string; name: string; description: string; allow_multiple: boolean
  time_limit?: number | null; allow_delete_responses?: boolean; randomize_questions?: boolean
  image_url: string; questions: Question[]
  is_active?: boolean; short_code?: string; serial_number?: number
  page_titles?: Record<string, any>; enable_auto_save?: boolean
  redirect_rules?: any[]; default_redirect_url?: string
}

interface ExistingForm {
  id: string; name: string; questions: any[]
}

const emptyForm = (): FormDataShared => ({
  name: '', description: '', allow_multiple: false, time_limit: null,
  allow_delete_responses: false, randomize_questions: false, image_url: '', questions: []
})

interface FormEditorProps {
  mode: 'create' | 'edit'
  formId?: string
}

export default function FormEditor({ mode, formId }: FormEditorProps) {
  const router = useRouter()
  const supabase = createClient()

  // --- Shared state ---
  const [formData, setFormData] = useState<FormDataShared>(mode === 'create' ? emptyForm() : (null as any))
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(mode === 'create')
  const [saving, setSaving] = useState(false)
  const [existingForms, setExistingForms] = useState<ExistingForm[]>([])
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<'basic' | 'advanced' | 'display' | 'widgets'>('basic')
  const [deletedQuestions, setDeletedQuestions] = useState<Array<{ question: any; index: number }>>([])

  // --- Create-only state ---
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(mode === 'create')
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTemplateSource, setSelectedTemplateSource] = useState<'form_templates' | 'user_templates' | null>(null)

  // --- Edit-only state ---
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [isPreviewActive, setIsPreviewActive] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showConvertToTemplate, setShowConvertToTemplate] = useState(false)
  const [convertToTemplateLoading, setConvertToTemplateLoading] = useState(false)
  const [elementPickerOpen, setElementPickerOpen] = useState(false)
  const [pickerCategory, setPickerCategory] = useState('basic')
  const [templateTitle, setTemplateTitle] = useState('')
  const [templateDescription, setTemplateDescription] = useState('')
  const [responseCount, setResponseCount] = useState(0)
  const [isDesignerOpen, setIsDesignerOpen] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [showActionMenu, setShowActionMenu] = useState(false)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // Collaboration
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [collabStatus, setCollabStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const collabChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => { document.documentElement.classList.toggle('dark', isDarkMode) }, [isDarkMode])

  // Init
  useEffect(() => {
    if (mode === 'create') initCreate()
    else initEdit()
  }, [])

  // Auto-save for edit
  useEffect(() => {
    if (mode !== 'edit' || !formData) return
    try {
      const key = `form_draft_${formId}`
      localStorage.setItem(key, JSON.stringify(formData))
    } catch {}
  }, [formData, formId, mode])

  // Collaboration
  useEffect(() => {
    if (mode !== 'edit' || !formData?.id || !profile?.id) return
    const channelName = `form-${formData.id}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: profile.id } },
    })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as any[]
        setCollaborators(users.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })))
      })
      .subscribe(async (status: string) => {
        setCollabStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected')
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: profile.id, name: profile.name, email: profile.email })
        }
      })
    collabChannelRef.current = channel
    return () => { channel.unsubscribe() }
  }, [formData?.id, profile?.id, mode])

  // --- Init functions ---
  const initCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profileData) { router.push('/login'); return }
      setProfile(profileData)

      if (profileData.banned) { router.push('/dashboard?error=banned'); return }
      if (profileData.form_limit !== -1 && profileData.form_limit !== null) {
        const { count } = await supabase.from('forms').select('id', { count: 'exact', head: true }).eq('created_by', user.id)
        if (count !== null && count >= profileData.form_limit) { router.push('/dashboard?error=form_limit'); return }
      }

      const { data: forms } = await supabase.from('forms').select('*, questions(*)').eq('created_by', user.id).order('created_at', { ascending: false })
      setExistingForms(forms || [])

      const { data: built } = await supabase.from('form_templates').select('*').order('sort_order')
      const { data: userTemplates } = await supabase.from('user_templates').select('*').eq('approved', true).order('created_at')
      const merged = [...(built || []).map((t: any) => ({ ...t, source: 'form_templates' })),
        ...(userTemplates || []).map((t: any) => ({ ...t, source: 'user_templates' }))]
      setTemplates(merged)
      setTemplatesLoading(false)

      const templateId = new URLSearchParams(window.location.search).get('templateId')
      const selectedTemplate = templateId ? merged.find((t: any) => t.id === templateId) : null
      if (selectedTemplate) useTemplate(selectedTemplate)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast('حدث خطأ أثناء تحميل البيانات')
    } finally { setLoading(false) }
  }

  const initEdit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!profileData) { router.push('/login'); return }
      setProfile(profileData)

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId!)
      const { data: form, error: formError } = await supabase.from('forms').select('*')
        .eq(isUUID ? 'id' : 'serial_number', isUUID ? formId : parseInt(formId!)).single()
      if (formError || !form) { router.push('/dashboard'); return }
      if (form.created_by !== user.id && profileData.role !== 'admin') { router.push('/dashboard'); return }

      const { count } = await supabase.from('form_responses').select('*', { count: 'exact', head: true }).eq('form_id', form.id)
      setResponseCount(count || 0)

      const { data: questions } = await supabase.from('questions').select('*').eq('form_id', form.id).order('order_index')
      const formattedQuestions: Question[] = (questions || []).map((q: any) => {
        const parsedOpts = q.options ? JSON.parse(q.options) : []
        let matrix_rows: MatrixRow[] | undefined, matrix_columns: MatrixColumn[] | undefined
        let dropdown_type: 'single' | 'multiple' | undefined, correct_option_ids: string[] | undefined
        let visibility_rules: any[] | undefined, optionsValue: any

        if (Array.isArray(parsedOpts)) {
          const last = parsedOpts[parsedOpts.length - 1]
          if (last && last._visibility_rules !== undefined) { visibility_rules = last._visibility_rules?.length > 0 ? last._visibility_rules : undefined; parsedOpts.pop() }
          optionsValue = parsedOpts
        } else {
          visibility_rules = parsedOpts._visibility_rules?.length > 0 ? parsedOpts._visibility_rules : undefined
          if (q.type === 'matrix' && parsedOpts.matrix_rows) { matrix_rows = parsedOpts.matrix_rows; matrix_columns = parsedOpts.matrix_columns || [] }
          if (q.type === 'dropdown' && parsedOpts.dropdown_type) { dropdown_type = parsedOpts.dropdown_type; correct_option_ids = parsedOpts.correct_option_ids || [] }
          if (parsedOpts.matrix_rows) optionsValue = []
          else if (parsedOpts.options) optionsValue = parsedOpts.options
          else if (typeof parsedOpts === 'object' && Object.keys(parsedOpts).some((k: string) => !isNaN(Number(k))))
            optionsValue = Object.values(parsedOpts).filter((v: any) => typeof v === 'object' && !Array.isArray(v) && v !== null)
          else optionsValue = parsedOpts
        }
        return { id: q.id, text: q.text, type: q.type, required: q.required || false, points: q.points || 0,
          has_counter: q.has_counter || false, options: optionsValue, order_index: q.order_index,
          row_group: q.row_group || null, matrix_rows, matrix_columns, dropdown_type, correct_option_ids,
          correct_option_id: correct_option_ids?.[0], page: q.page || 1, visibility_rules }
      })

      const pageTitles = form.page_titles || {}
      setFormData({ id: form.id, name: form.name, description: form.description || '',
        allow_multiple: form.allow_multiple || false, time_limit: form.time_limit || null,
        allow_delete_responses: form.allow_delete_responses || false, randomize_questions: form.randomize_questions || false,
        questions: formattedQuestions, is_active: form.is_active, image_url: form.image_url || '',
        short_code: form.short_code || '', serial_number: form.serial_number, page_titles: pageTitles,
        enable_auto_save: form.enable_auto_save,
        _is_test: !!pageTitles._is_test, _availability: pageTitles._availability || null,
        _payment: pageTitles._payment || [], _products: pageTitles._products || [],
        _submit_button: pageTitles._submit_button || {}, _offer_countdown: pageTitles._offer_countdown || '' } as any)
      try { localStorage.removeItem(`form_draft_${formId}`) } catch {}

      const { data: allForms } = await supabase.from('forms').select('*, questions(*)')
      setExistingForms(allForms || [])
    } catch (error) { console.error('Error fetching data:', error); router.push('/dashboard') }
    finally { setLoading(false) }
  }

  // --- Shared CRUD ---
  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = { id: `q_${Date.now()}`, text: '', type, required: false, points: 0, options: [] }
    if (['single_choice', 'multiple_choice', 'button_choice'].includes(type)) {
      newQuestion.options = [{ id: `opt_${Date.now()}_1`, text: '', points: 0 }, { id: `opt_${Date.now()}_2`, text: '', points: 0 }]
    } else if (type === 'scale') {
      newQuestion.options = Array.from({ length: 10 }, (_, i) => ({ id: `opt_${Date.now()}_${i + 1}`, text: String(i + 1), points: i + 1 }))
    } else if (type === 'matrix') {
      newQuestion.matrix_rows = [{ id: `row_${Date.now()}_1`, text: '', required: true }, { id: `row_${Date.now()}_2`, text: '', required: false }]
      newQuestion.matrix_columns = [{ id: `col_${Date.now()}_1`, text: '', points: 0 }, { id: `col_${Date.now()}_2`, text: '', points: 0 }]
    } else if (type === 'dropdown') { newQuestion.dropdown_type = 'single'; newQuestion.correct_option_ids = []
    } else if (type === 'date_range') { newQuestion.options = [{ id: `range_${Date.now()}`, text: '', points: 0, validation_type: 'datetime' }] as any
    } else if (type === 'appointment') {
      newQuestion.options = [{ id: 'appointment_settings', text: 'appointment_settings', points: 0, validation_type: 'fixed', validation_category: 'weekday', validation_value: 'single' },
        { id: `appt_${Date.now()}_1`, text: '09:00', points: 0, validation_category: 'fixed', validation_value: '' },
        { id: `appt_${Date.now()}_2`, text: '10:00', points: 0, validation_category: 'fixed', validation_value: '' }] as any
    } else if (type === 'slider') { newQuestion.options = [{ id: `opt_${Date.now()}_1`, text: '0|100|1', points: 0 }] as any
    } else if (type === 'star_rating') { newQuestion.options = Array.from({ length: 5 }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i + 1), points: i + 1 }))
    } else if (type === 'countdown_timer') {
      newQuestion.text = 'العد التنازلي للعرض'
      newQuestion.options = [{ id: `timer_${Date.now()}`, text: new Date(Date.now() + 86400000).toISOString().slice(0, 16), validation_value: 'العرض ينتهي خلال', validation_min: '' }] as any
    } else if (type === 'products_block') { newQuestion.text = 'المنتجات'; newQuestion.options = [{ id: `g_${Date.now()}`, name: '', items: [] }] as any
    } else if (type === 'payment_info_block') {
      newQuestion.text = 'بيانات الدفع (جنيه مصري)'
      newQuestion.options = [{ id: `pm_${Date.now()}_1`, method: 'instapay', label: 'انستاباي', value: '01558282760', details: 'جميع المدفوعات بالجنيه المصري' },
        { id: `pm_${Date.now()}_2`, method: 'wallet', label: 'محفظة', value: '01558282760', details: 'بعد الدفع أرسل صورة الإيصال عبر واتساب' }] as any
    } else if (type === 'match_items') {
      newQuestion.matrix_rows = [{ id: `left_${Date.now()}_1`, text: 'عنصر 1', required: true }, { id: `left_${Date.now()}_2`, text: 'عنصر 2', required: true }]
      newQuestion.matrix_columns = [{ id: `right_${Date.now()}_1`, text: 'إجابة 1', points: 0 }, { id: `right_${Date.now()}_2`, text: 'إجابة 2', points: 0 }]
    }
    setFormData((prev: any) => ({ ...prev, questions: [...(prev.questions || []), newQuestion] }))
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    setFormData((prev: any) => ({ ...prev, questions: (prev.questions || []).map((q: any, i: number) => i === index ? { ...q, ...updates } : q) }))
  }
  const removeQuestion = (index: number) => {
    const removed = formData?.questions?.[index]
    if (removed) setDeletedQuestions((prev: any) => [...prev.slice(-19), { question: removed, index }])
    setFormData((prev: any) => ({ ...prev, questions: (prev.questions || []).filter((_: any, i: number) => i !== index) }))
  }
  const undoDelete = () => {
    if (deletedQuestions.length === 0) return
    const last = deletedQuestions[deletedQuestions.length - 1]
    setFormData((prev: any) => ({
      ...prev, questions: [...(prev.questions || []).slice(0, last.index), last.question, ...(prev.questions || []).slice(last.index)]
    }))
    setDeletedQuestions((prev: any) => prev.slice(0, -1))
  }
  const addOption = (qIndex: number) => {
    const newOpt = { id: `opt_${Date.now()}`, text: '', points: 0 }
    updateQuestion(qIndex, { options: [...(formData?.questions?.[qIndex]?.options || []), newOpt] })
  }
  const removeOption = (qIndex: number, optIndex: number) => {
    updateQuestion(qIndex, { options: parseOptions(formData?.questions?.[qIndex]?.options).filter((_: any, i: number) => i !== optIndex) })
  }
  const updateOption = (qIndex: number, optIndex: number, updates: Partial<QuestionOption>) => {
    updateQuestion(qIndex, { options: parseOptions(formData?.questions?.[qIndex]?.options).map((opt: any, i: number) => i === optIndex ? { ...opt, ...updates } : opt) })
  }
  const addMatrixRow = (qIndex: number) => {
    const question = formData?.questions?.[qIndex]
    updateQuestion(qIndex, { matrix_rows: [...(question?.matrix_rows || []), { id: `row_${Date.now()}`, text: '', required: false }] })
  }
  const removeMatrixRow = (qIndex: number, rowIndex: number) => {
    updateQuestion(qIndex, { matrix_rows: (formData?.questions?.[qIndex]?.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex) })
  }
  const updateMatrixRow = (qIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    updateQuestion(qIndex, { matrix_rows: (formData?.questions?.[qIndex]?.matrix_rows || []).map((row: any, i: number) => i === rowIndex ? { ...row, ...updates } : row) })
  }
  const addMatrixColumn = (qIndex: number) => {
    updateQuestion(qIndex, { matrix_columns: [...(formData?.questions?.[qIndex]?.matrix_columns || []), { id: `col_${Date.now()}`, text: '', points: 0 }] })
  }
  const removeMatrixColumn = (qIndex: number, colIndex: number) => {
    updateQuestion(qIndex, { matrix_columns: (formData?.questions?.[qIndex]?.matrix_columns || []).filter((_: any, i: number) => i !== colIndex) })
  }
  const updateMatrixColumn = (qIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    updateQuestion(qIndex, { matrix_columns: (formData?.questions?.[qIndex]?.matrix_columns || []).map((col: any, i: number) => i === colIndex ? { ...col, ...updates } : col) })
  }
  const parseBulkText = (qIndex: number) => {
    const question = formData?.questions?.[qIndex]
    if (!question?.bulk_text) return
    const lines = question.bulk_text.split('\n').filter((l: string) => l.trim())
    updateQuestion(qIndex, { options: lines.map((line: string) => ({ id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, text: line.trim(), points: 0 })), bulk_text: '' })
  }
  const importQuestion = (question: any) => {
    setFormData((prev: any) => ({ ...prev, questions: [...(prev.questions || []), { id: `q_${Date.now()}`, text: question.text, type: question.type, required: question.required || false, points: question.points || 0, options: parseOptions(question.options) }] }))
    setShowQuestionPicker(false)
  }
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!formData) return
    const newQuestions = [...(formData.questions || [])]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setFormData((prev: any) => ({ ...prev, questions: newQuestions }))
  }
  const moveToStart = (index: number) => {
    if (!formData || index <= 0) return
    const newQuestions = [...(formData.questions || [])]
    const [item] = newQuestions.splice(index, 1); newQuestions.unshift(item)
    setFormData((prev: any) => ({ ...prev, questions: newQuestions }))
  }
  const moveToEnd = (index: number) => {
    if (!formData || index >= (formData.questions?.length || 0) - 1) return
    const newQuestions = [...(formData.questions || [])]
    const [item] = newQuestions.splice(index, 1); newQuestions.push(item)
    setFormData((prev: any) => ({ ...prev, questions: newQuestions }))
  }

  // --- DnD ---
  const handleDragStart = (event: DragStartEvent) => setActiveDragId(event.active.id as string)
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null); if (!formData) return
    const { active, over } = event; if (!over || active.id === over.id) return
    const oldIndex = (formData.questions || []).findIndex((q: any) => q.id === active.id)
    const newIndex = (formData.questions || []).findIndex((q: any) => q.id === over.id)
    if (oldIndex !== -1 && newIndex !== -1) setFormData((prev: any) => ({ ...prev, questions: arrayMove(prev.questions, oldIndex, newIndex) }))
  }

  // --- Save ---
  const saveForm = async () => {
    if (!formData?.name.trim()) { toast('يرجى إدخال اسم الفورم'); return }
    if ((formData.questions || []).length === 0) { toast('يرجى إضافة سؤال واحد على الأقل'); return }
    setSaving(true)
    try {
      if (mode === 'edit') {
        const { error: formError } = await supabase.from('forms').update({
          name: formData.name, description: formData.description, allow_multiple: formData.allow_multiple,
          is_active: formData.is_active, time_limit: formData.time_limit || null,
          allow_delete_responses: formData.allow_delete_responses || false, randomize_questions: formData.randomize_questions || false,
          image_url: formData.image_url || null, short_code: formData.short_code || generateShortCode(),
          page_titles: { ...formData.page_titles, _is_test: !!(formData.page_titles as any)?._is_test,
            _payment: formData.questions?.some((q: any) => q.type === 'payment_info_block') ? ((formData.page_titles as any)?._payment || []) : [],
            _products: formData.questions?.some((q: any) => q.type === 'products_block') ? ((formData.page_titles as any)?._products || []) : [],
            _submit_button: (formData.page_titles as any)?._submit_button || {}, _offer_countdown: (formData.page_titles as any)?._offer_countdown || '' }
        }).eq('id', formData.id)
        if (formError) throw formError
        await supabase.from('questions').delete().eq('form_id', formData.id)
        const questionsToInsert = (formData.questions || []).map((q: any, index: number) => {
          let optionsData: any
          if (q.type === 'matrix') {
            optionsData = { matrix_rows: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text, required: row.required })),
              matrix_columns: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text, points: col.points || 0 })) }
          } else if (q.type === 'dropdown') {
            const items = parseOptions(q.options).map((opt: any) => ({ id: opt.id, text: opt.text, points: opt.points || 0 }))
            optionsData = { dropdown_type: q.dropdown_type || 'single', correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : (q.correct_option_id ? [q.correct_option_id] : []), options: items }
          } else if (q.type === 'match_items') {
            optionsData = { left_items: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text })), right_items: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text })) }
          } else { optionsData = parseOptions(q.options) }
          const storedOpts = Array.isArray(optionsData) ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }] : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
          return { form_id: formData.id, text: q.text, type: q.type, required: q.required, points: q.points, has_counter: q.has_counter || false, order_index: index, row_group: q.row_group || null, page: q.page || 1, options: JSON.stringify(storedOpts) }
        })
        const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
        if (qError) throw qError
        toast('تم حفظ التعديلات بنجاح', 'success')
        router.push('/dashboard')
      } else {
        const { data: { user } } = await supabase.auth.getUser()
        const { data: form, error: formError } = await supabase.from('forms').insert({
          name: formData.name, description: formData.description, allow_multiple: formData.allow_multiple,
          time_limit: formData.time_limit, allow_delete_responses: formData.allow_delete_responses,
          randomize_questions: formData.randomize_questions, image_url: formData.image_url,
          created_by: user?.id, is_active: true, short_code: generateShortCode(),
          page_titles: { _is_test: !!((formData as any)._is_test), _availability: (formData as any)._availability || null,
            _payment: (formData as any)._payment || [], _products: (formData as any)._products || [],
            _submit_button: (formData as any)._submit_button || {}, _offer_countdown: (formData as any)._offer_countdown || '' }
        }).select().single()
        if (formError) throw formError
        const questionsToInsert = (formData.questions || []).map((q: any, index: number) => {
          let optionsData: any
          if (q.type === 'matrix') {
            optionsData = { matrix_rows: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text, required: row.required })),
              matrix_columns: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text, points: col.points || 0 })) }
          } else if (q.type === 'dropdown') {
            const items = parseOptions(q.options).map((opt: any) => ({ id: opt.id, text: opt.text, points: opt.points || 0 }))
            optionsData = { dropdown_type: q.dropdown_type || 'single', correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : (q.correct_option_id ? [q.correct_option_id] : []), options: items }
          } else if (q.type === 'match_items') {
            optionsData = { left_items: (q.matrix_rows || []).map((row: any) => ({ id: row.id, text: row.text })), right_items: (q.matrix_columns || []).map((col: any) => ({ id: col.id, text: col.text })) }
          } else { optionsData = parseOptions(q.options) }
          const storedOpts = Array.isArray(optionsData) ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }] : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
          return { form_id: form.id, text: q.text, type: q.type, required: q.required, points: q.points, has_counter: q.has_counter || false, order_index: index, row_group: q.row_group || null, page: q.page || 1, options: JSON.stringify(storedOpts) }
        })
        const { error: qError } = await supabase.from('questions').insert(questionsToInsert)
        if (qError) throw qError
        router.push(`/forms/${form.serial_number}/edit`)
      }
    } catch (error) {
      console.error('Error saving form:', error)
      toast(mode === 'edit' ? 'حدث خطأ أثناء حفظ التعديلات' : 'حدث خطأ أثناء حفظ الفورم')
    } finally { setSaving(false) }
  }

  // --- Template handling (create-only) ---
  const useTemplate = (template: FormTemplate) => {
    const importedQuestions: Question[] = (template.questions_data || []).map((q: any, index: number) => {
      let options: QuestionOption[] = [], matrix_rows: any, matrix_columns: any, dropdown_type: 'single' | 'multiple' | undefined, correct_option_ids: string[] | undefined
      if (q.type === 'matrix' && (q.options?.matrix_rows || q.matrix_rows)) {
        matrix_rows = q.options?.matrix_rows || q.matrix_rows; matrix_columns = q.options?.matrix_columns || q.matrix_columns || []
      } else if (q.type === 'match_items') {
        matrix_rows = q.options?.left_items || q.matrix_rows || []; matrix_columns = q.options?.right_items || q.matrix_columns || []
      } else if (q.type === 'dropdown' && q.options?.dropdown_type) {
        dropdown_type = q.options.dropdown_type; correct_option_ids = q.options.correct_option_ids || []; options = q.options.options || []
      } else { options = q.options || [] }
      return { id: `q_${Date.now()}_${index}`, text: q.text || '', type: q.type || 'text', required: q.required ?? true, points: q.points || 0,
        has_counter: q.has_counter || false, options, matrix_rows, matrix_columns, dropdown_type, correct_option_ids,
        correct_option_id: correct_option_ids?.[0], row_group: q.row_group || null, page: q.page || 1,
        visibility_rules: q.visibility_rules || [] }
    })
    setFormData((prev: any) => ({ ...prev, name: template.name, description: template.description || '', questions: importedQuestions, ...(template.form_settings || {}) }))
    setSelectedTemplateId(template.id); setSelectedTemplateSource((template as any).source || null)
  }

  // --- Edit-only helpers ---
  const getPreviewQuestions = () => {
    if (!formData) return []
    return (formData.questions || []).filter((q: any) => !q.hidden).map((q: any) => {
      let optionsData: any
      if (q.type === 'matrix' && q.matrix_rows) {
        optionsData = { matrix_rows: q.matrix_rows, matrix_columns: q.matrix_columns || [] }
      } else if (q.type === 'dropdown') {
        const items = parseOptions(q.options).map((opt: any) => ({ id: opt.id, text: opt.text, points: opt.points || 0 }))
        optionsData = { dropdown_type: q.dropdown_type || 'single', correct_option_ids: q.dropdown_type === 'multiple' ? (q.correct_option_ids || []) : [], options: items }
      } else if (q.type === 'match_items') {
        optionsData = { left_items: (q.matrix_rows || []).map((r: any) => ({ id: r.id, text: r.text })), right_items: (q.matrix_columns || []).map((r: any) => ({ id: r.id, text: r.text })) }
      } else { optionsData = parseOptions(q.options) }
      const storedOpts = Array.isArray(optionsData) ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }] : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
      return { ...q, options: storedOpts }
    })
  }

  const convertToTemplate = async () => {
    if (!templateTitle.trim()) { toast('يرجى إدخال عنوان القالب'); return }
    setConvertToTemplateLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('user_templates').insert({
        name: templateTitle, description: templateDescription, questions_data: (formData?.questions || []).map((q: any) => ({ ...q, options: parseOptions(q.options) })),
        category: 'general', created_by: user.id, approved: false
      })
      if (error) throw error
      toast('تم إرسال القالب للمراجعة', 'success')
      setShowConvertToTemplate(false); setTemplateTitle(''); setTemplateDescription('')
    } catch (error) { console.error('Error creating template:', error); toast('حدث خطأ أثناء إنشاء القالب') }
    finally { setConvertToTemplateLoading(false) }
  }

  // --- Edit-only: SortableQuestionItem ---
  function SortableQuestionItem({ question, children }: { question: Question; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.id })
    const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }
    return <div ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>
  }

  // --- Render ---
  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  }
  if (mode === 'edit' && !formData) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center"><p className="text-gray-500 mb-4">النموذج غير موجود</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline">العودة للوحة التحكم</Link></div>
    </div>
  }

  return (
    <div dir="rtl" className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* Theme styles */}
      {mode === 'edit' && formData?.page_titles?.theme_settings && (() => {
        const theme = formData.page_titles.theme_settings
        return <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
          body { background: ${theme.pageColor || '#f9fafb'} !important; }
        `}</style>
      })()}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {mode === 'edit' ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
            ) : (
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg></Link>
            )}
            <h1 className="text-lg font-bold text-gray-900">{mode === 'edit' ? 'تعديل النموذج' : 'إنشاء نموذج جديد'}</h1>
          </div>
          <div className="flex items-center gap-2">
            {mode === 'edit' && (
              <>
                <button onClick={() => setShowSettingsModal(true)} className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="الإعدادات">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <button onClick={() => setIsPreviewActive(!isPreviewActive)} className={`p-2.5 rounded-xl transition-colors ${isPreviewActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`} title="معاينة">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                </button>
                <button onClick={() => setIsDesignerOpen(true)} className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors" title="التصميم">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
                </button>
              </>
            )}
            {mode === 'create' && (
              <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">القوالب الجاهزة</Link>
            )}
            {deletedQuestions.length > 0 && (
              <button onClick={undoDelete} className="p-2.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors" title="تراجع">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4m-4 4l4 4" /></svg>
              </button>
            )}
            <button onClick={saveForm} disabled={saving} className="px-6 py-2.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-bold text-sm shadow-lg shadow-blue-500/25 disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
          </div>
        </div>
      </header>

      {/* Floating action menu (edit) */}
      {mode === 'edit' && (
        <div className="fixed bottom-6 left-6 z-50">
          <button onClick={() => setShowActionMenu(!showActionMenu)}
            className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
          {showActionMenu && (
            <div className="absolute bottom-16 left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 p-3 w-64 space-y-1">
              <button onClick={() => { setShowSettingsModal(true); setShowActionMenu(false) }} className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                الإعدادات
              </button>
              <button onClick={() => { setIsDarkMode(!isDarkMode); setShowActionMenu(false) }} className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                {isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
              </button>
              {formData?.short_code && (
                <button onClick={() => { try { navigator.clipboard.writeText(`${window.location.origin}/forms/${formData.short_code}`); toast('تم نسخ الرابط', 'success') } catch {}; setShowActionMenu(false) }} className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                  نسخ رابط النموذج
                </button>
              )}
              <button onClick={() => { setShowConvertToTemplate(true); setShowActionMenu(false) }} className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                  تحويل إلى قالب
                </button>
              {formData?.id && (
                <a href={`/forms/${formData.id}`} target="_blank" className="w-full text-right px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  فتح النموذج
                </a>
              )}
            </div>
          )}
          {showActionMenu && <div className="fixed inset-0 z-40" onClick={() => setShowActionMenu(false)} />}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Response count banner (edit) */}
        {mode === 'edit' && responseCount > 0 && (
          <div className="bg-gradient-to-l from-blue-50 to-indigo-50 rounded-2xl p-4 mb-6 border border-blue-100 flex items-center justify-between">
            <span className="text-sm text-gray-700">عدد الردود: <strong className="text-blue-600">{responseCount}</strong></span>
          </div>
        )}

        {/* Form basic info */}
        {(formData as any) && (
          <FormBasicInfo formData={formData} onChange={(updates: any) => setFormData(updates)} />
        )}

        {/* Templates grid (create-only) */}
        {mode === 'create' && (
          <TemplatesGrid templates={templates} templatesLoading={templatesLoading}
            questionsCount={(formData?.questions || []).length} onUseTemplate={useTemplate} />
        )}

        {/* Questions section */}
        {formData && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">الأسئلة ({(formData.questions || []).length})</h2>
            </div>

            {mode === 'edit' ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <SortableContext items={(formData.questions || []).map((q: any) => q.id)} strategy={verticalListSortingStrategy}>
                  {formData.questions.map((question: Question, qIndex: number) => (
                    <SortableQuestionItem key={question.id} question={question}>
                      <div className="mb-3">
                        <QuestionList questions={[question]} onUpdateQuestion={(i: number, u: any) => updateQuestion(qIndex, u)}
                          onRemoveQuestion={() => removeQuestion(qIndex)} onMoveQuestion={(i: number, d: any) => moveQuestion(qIndex, d)}
                          onAddOption={(i: number) => addOption(qIndex)} onRemoveOption={(i: number, oi: number) => removeOption(qIndex, oi)}
                          onUpdateOption={(i: number, oi: number, u: any) => updateOption(qIndex, oi, u)}
                          onAddMatrixRow={(i: number) => addMatrixRow(qIndex)} onRemoveMatrixRow={(i: number, ri: number) => removeMatrixRow(qIndex, ri)}
                          onUpdateMatrixRow={(i: number, ri: number, u: any) => updateMatrixRow(qIndex, ri, u)}
                          onAddMatrixColumn={(i: number) => addMatrixColumn(qIndex)} onRemoveMatrixColumn={(i: number, ci: number) => removeMatrixColumn(qIndex, ci)}
                          onUpdateMatrixColumn={(i: number, ci: number, u: any) => updateMatrixColumn(qIndex, ci, u)}
                          onParseBulkText={(i: number) => parseBulkText(qIndex)} formData={formData} />
                      </div>
                    </SortableQuestionItem>
                  ))}
                </SortableContext>
                <DragOverlay>
                  {activeDragId ? <div className="bg-white rounded-xl shadow-xl border border-blue-200 p-4 opacity-90">{activeDragId}</div> : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <QuestionList questions={formData.questions || []} onUpdateQuestion={updateQuestion}
                onRemoveQuestion={removeQuestion} onMoveQuestion={moveQuestion}
                onAddOption={addOption} onRemoveOption={removeOption} onUpdateOption={updateOption}
                onAddMatrixRow={addMatrixRow} onRemoveMatrixRow={removeMatrixRow} onUpdateMatrixRow={updateMatrixRow}
                onAddMatrixColumn={addMatrixColumn} onRemoveMatrixColumn={removeMatrixColumn} onUpdateMatrixColumn={updateMatrixColumn}
                onParseBulkText={parseBulkText} formData={formData} />
            )}

            <div className="flex gap-3 mt-8">
              <AddQuestionMenu open={questionMenuOpen} selectedCategory={selectedCategory}
                onToggle={() => setQuestionMenuOpen(!questionMenuOpen)}
                onCategoryChange={(cat: string) => setSelectedCategory(cat as any)} onAddQuestion={addQuestion} />
              <button onClick={() => setShowQuestionPicker(true)}
                className="py-4 px-6 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 font-bold transition-all flex items-center justify-center gap-2">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                استيراد سؤال
              </button>
            </div>
          </div>
        )}

        {/* Examples section (create-only) */}
        {mode === 'create' && <ExamplesSection />}
      </main>

      {/* Modals */}
      <QuestionPickerModal show={showQuestionPicker} existingForms={existingForms}
        onClose={() => setShowQuestionPicker(false)} onImport={importQuestion} />

      {mode === 'edit' && isDesignerOpen && (
        <ThemeDesigner form={formData as any} onClose={() => setIsDesignerOpen(false)}
          onUpdate={(theme: any) => setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, theme_settings: theme } }))} />
      )}

      {/* Preview (edit) */}
      {mode === 'edit' && isPreviewActive && formData && (
        <div className="fixed inset-0 z-50 bg-white overflow-auto">
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">معاينة النموذج</h2>
            <div className="flex items-center gap-2">
              {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                <button key={d} onClick={() => setPreviewDevice(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${previewDevice === d ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}>
                  {d === 'desktop' ? 'حاسوب' : d === 'tablet' ? 'جهاز لوحي' : 'جوال'}
                </button>
              ))}
              <button onClick={() => setIsPreviewActive(false)}
                className="mr-4 px-4 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">إغلاق</button>
            </div>
          </div>
          <div className={`mx-auto ${previewDevice === 'mobile' ? 'max-w-sm' : previewDevice === 'tablet' ? 'max-w-2xl' : 'max-w-4xl'} py-8`}>
            {formData && <FormFiller form={formData as any} questions={getPreviewQuestions()}
              existingResponse={null} allUserResponses={[]} project={null} userId={null} isPreview />}
          </div>
        </div>
      )}

      {/* Settings modal (edit) */}
      {mode === 'edit' && showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center overflow-auto pt-12 pb-12">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">إعدادات النموذج</h2>
              <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-6 max-h-[70vh] overflow-y-auto space-y-6">
              <FormBasicInfo formData={formData} onChange={(updates: any) => setFormData(updates)} />

              {/* Availability schedule */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">جدول التوفر</h3>
                {(() => {
                  const avail = (formData.page_titles as any)?._availability
                  const scheduleType = avail?.type || 'none'
                  return <div className="space-y-3">
                    <select value={scheduleType} onChange={(e) => {
                      const type = e.target.value
                      setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: type === 'none' ? null : { type, ...(type === 'weekly' ? { weekly: [{ day: 0, from: '09:00', to: '17:00' }] } : { from: '', to: '' }) } } }))
                    }} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm">
                      <option value="none">متاح دائماً</option>
                      <option value="weekly">أيام محددة في الأسبوع</option>
                      <option value="date_range">نطاق تاريخ محدد</option>
                    </select>
                    {scheduleType === 'weekly' && <div className="space-y-2">
                      {(avail?.weekly || []).map((slot: any, i: number) => (
                        <div key={i} className="flex items-center gap-2">
                          <select value={slot.day} onChange={(e) => {
                            const weekly = [...(avail?.weekly || [])]; weekly[i] = { ...weekly[i], day: parseInt(e.target.value) }
                            setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, weekly } } }))
                          }} className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                            {WEEKDAY_OPTIONS.map((d: any) => <option key={d.value} value={d.value}>{d.label}</option>)}
                          </select>
                          <input type="time" value={slot.from} onChange={(e) => {
                            const weekly = [...(avail?.weekly || [])]; weekly[i] = { ...weekly[i], from: e.target.value }
                            setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, weekly } } }))
                          }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-24" />
                          <input type="time" value={slot.to} onChange={(e) => {
                            const weekly = [...(avail?.weekly || [])]; weekly[i] = { ...weekly[i], to: e.target.value }
                            setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, weekly } } }))
                          }} className="rounded-xl border border-gray-200 px-3 py-2 text-sm w-24" />
                          <button onClick={() => {
                            const weekly = (avail?.weekly || []).filter((_: any, j: number) => j !== i)
                            setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: weekly.length > 0 ? { ...avail, weekly } : null } }))
                          }} className="text-red-500 hover:text-red-700 p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      ))}
                      <button onClick={() => setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, weekly: [...(avail?.weekly || []), { day: 0, from: '09:00', to: '17:00' }] } } }))}
                        className="text-blue-600 text-sm hover:underline">+ إضافة يوم</button>
                    </div>}
                    {scheduleType === 'date_range' && <div className="flex gap-2">
                      <div><label className="block text-xs text-gray-500 mb-1">من</label><input type="date" value={avail?.from || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, from: e.target.value } } }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" /></div>
                      <div><label className="block text-xs text-gray-500 mb-1">إلى</label><input type="date" value={avail?.to || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, page_titles: { ...prev.page_titles, _availability: { ...avail, to: e.target.value } } }))} className="rounded-xl border border-gray-200 px-3 py-2 text-sm" /></div>
                    </div>}
                  </div>
                })()}
              </div>

              {/* Redirect rules */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">تحويل ذكي بعد الإرسال</h3>
                {(formData.redirect_rules || []).map((rule: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <input type="url" value={rule.redirect_url} onChange={(e) => {
                      const rules = [...(formData.redirect_rules || [])]; rules[i] = { ...rules[i], redirect_url: e.target.value }
                      setFormData((prev: any) => ({ ...prev, redirect_rules: rules }))
                    }} placeholder="رابط التحويل" className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
                    <button onClick={() => setFormData((prev: any) => ({ ...prev, redirect_rules: (prev.redirect_rules || []).filter((_: any, j: number) => j !== i) }))}
                      className="text-red-500 hover:text-red-700 p-1"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                  </div>
                ))}
                <button onClick={() => setFormData((prev: any) => ({ ...prev, redirect_rules: [...(prev.redirect_rules || []), { question_id: '', operator: 'equals', value: '', redirect_url: '', message: '' }] }))}
                  className="text-blue-600 text-sm hover:underline">+ إضافة قاعدة تحويل</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Convert to template modal (edit) */}
      {mode === 'edit' && showConvertToTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">تحويل إلى قالب</h3>
            <input type="text" value={templateTitle} onChange={(e) => setTemplateTitle(e.target.value)}
              placeholder="عنوان القالب" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-3" />
            <textarea value={templateDescription} onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="وصف القالب" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setShowConvertToTemplate(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-700 font-medium">إلغاء</button>
              <button onClick={convertToTemplate} disabled={convertToTemplateLoading}
                className="flex-1 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl font-bold disabled:opacity-50">
                {convertToTemplateLoading ? '...جاري' : 'تحويل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
