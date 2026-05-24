'use client'



import { useState, useEffect, useRef, Suspense } from 'react'

import { createClient } from '@/utils/supabase/client'

import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import ImageUpload from '@/components/ImageUpload'
import RichTextEditor from '@/components/RichTextEditor'
import FormFiller from '../FormFiller'

import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import type { QuestionType, QuestionOption, ThemeSettings } from '@/types'
import { generateShortCode } from '@/lib/shortCode'



// Question type definitions with detailed explanations
const QUESTION_TYPES: Record<string, { label: string; icon: string; description: string; explanation: string }> = {
  // نصوص
  text: { label: 'نص', icon: 'T', description: 'إجابة نصية قصيرة', explanation: 'مثال: "ما اسمك؟"' },
  textarea: { label: 'نص طويل', icon: '¶', description: 'إجابة مفصلة', explanation: 'مثال: "صف تجربتك"' },
  email_confirm: { label: 'تأكيد البريد', icon: '✉️', description: 'إدخال الإيميل مرتين', explanation: 'للتأكد من صحة البريد الإلكتروني' },
  // اختيارات
  single_choice: { label: 'اختيار واحد', icon: '○', description: 'اختيار إجابة واحدة', explanation: 'مثال: "نعم أو لا"' },
  multiple_choice: { label: 'اختيار متعدد', icon: '☑', description: 'اختيار عدة إجابات', explanation: 'مثال: "الهوايات"' },
  button_choice: { label: 'اختيار بأزرار', icon: '🔘', description: 'خيارات كأزرار مرئية', explanation: 'بديل جميل للاختيار الواحد' },
  dropdown: { label: 'قائمة منسدلة', icon: '▼', description: 'اختيار من قائمة', explanation: 'قائمة مضغوطة لتوفير المساحة' },
  // تقييم وترتيب
  scale: { label: 'تقييم', icon: '⭐', description: 'تقييم من 1 إلى 10', explanation: 'مثال: تقييم الأداء' },
  star_rating: { label: 'تقييم بالنجوم', icon: '🌟', description: 'تقييم باستخدام النجوم', explanation: 'بديل مرئي للتقييم الرقمي' },
  slider: { label: 'شريط رقمي', icon: '🎚️', description: 'اختيار قيمة بالسحب', explanation: 'مثال: تحديد ميزانية أو عمر' },
  ranking: { label: 'ترتيب', icon: '#', description: 'ترتيب العناصر', explanation: 'ترتيب العناصر حسب الأولوية' },
  matrix: { label: 'مصفوفة', icon: '⊞', description: 'خيارات مشتركة', explanation: 'عدة أسئلة مع نفس الخيارات' },
  match_items: { label: 'توصيل العناصر', icon: '🔗', description: 'مطابقة عمودين', explanation: 'مثال: وصّل الكلمة بمعناها' },
  // تواريخ وملفات
  date: { label: 'تاريخ', icon: '📅', description: 'إدخال تاريخ', explanation: 'مثال: "تاريخ الميلاد"' },
  date_range: { label: 'نطاق تاريخ', icon: '📆', description: 'من تاريخ إلى تاريخ', explanation: 'مثال: فترة الإجازة' },
  time: { label: 'وقت', icon: '⏰', description: 'إدخال وقت', explanation: 'مثال: "وقت الحضور"' },
  file_upload: { label: 'رفع ملف', icon: '📎', description: 'إرفاق ملف أو صورة', explanation: 'مثال: رفع السيرة الذاتية أو صورة' },
  signature: { label: 'التوقيع', icon: '✍️', description: 'حقل توقيع', explanation: 'للحصول على توقيع رقمي' },
  // محتوى ثابت
  static_text: { label: 'فقرة (نص ثابت)', icon: '📝', description: 'نص للقراءة فقط', explanation: 'لعرض تعليمات أو معلومات' },
  static_image: { label: 'صورة ثابتة', icon: '🖼️', description: 'عرض صورة', explanation: 'لعرض شعار أو توضيح' },
  youtube: { label: 'فيديو يوتيوب', icon: '▶️', description: 'تضمين فيديو يوتيوب', explanation: 'لعرض فيديو توضيحي داخل النموذج' },
  divider: { label: 'فاصل', icon: '➖', description: 'خط فاصل', explanation: 'للفصل بين الأقسام' },
  terms: { label: 'الشروط والأحكام', icon: '📋', description: 'موافقة على الشروط', explanation: 'المستخدم يقرأ ويوافق على نص' },
  appointment: { label: 'حجز موعد', icon: '📅', description: 'اختيار تاريخ ووقت للحجز', explanation: 'مثال: حجز موعد استشارة' },
  // إضافات
  countdown_timer: { label: 'العد التنازلي', icon: '⏳', description: 'عرض العد التنازلي', explanation: 'مؤقت لانتهاء العرض' },
  products_block: { label: 'المنتجات', icon: '📦', description: 'قائمة منتجات', explanation: 'عرض منتجات للاختيار والطلب' },
  payment_info_block: { label: 'بيانات الدفع', icon: '💳', description: 'عرض طرق الدفع', explanation: 'عرض معلومات الدفع' },
} as const;



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

interface VisibilityRule {
  question_id: string
  operator: 'equals' | 'not_equals' | 'contains'
  value: string
}

interface Question {

  id: string

  text: string

  type: QuestionType

  required: boolean

  points: number

  has_counter?: boolean

  options: QuestionOption[]

  order_index?: number

  matrix_rows?: MatrixRow[]
  matrix_columns?: MatrixColumn[]
  bulk_text?: string
  correct_option_id?: string
  dropdown_type?: 'single' | 'multiple'
  correct_option_ids?: string[]
  row_group?: number | null
  page?: number
  visibility_rules?: VisibilityRule[]
  hidden?: boolean

}



interface FormData {

  id: string

  name: string

  description: string

  allow_multiple: boolean

  time_limit?: number | null

  expires_at?: string | null

  allow_delete_responses?: boolean

  randomize_questions?: boolean

  questions: Question[]

  is_active: boolean
  image_url: string
  short_code?: string
  serial_number?: number
  page_titles?: Record<string, any>
  enable_auto_save?: boolean
  redirect_rules?: Array<{ question_id: string; operator: string; value: string; redirect_url: string; message?: string }>
  default_redirect_url?: string
  payment_info?: Array<{ method: string; label: string; value: string }>
  products?: Array<{ id: string; name: string; description?: string; price: number; image_url?: string; available?: boolean }>

}



function EditFormContent() {

  const [formData, setFormData] = useState<FormData | null>(null)

  const [profile, setProfile] = useState<any>(null)

  const [loading, setLoading] = useState(true)

  const [saving, setSaving] = useState(false)
  const [questionMenuOpen, setQuestionMenuOpen] = useState<string | null>(null)
  const [showQuestionPicker, setShowQuestionPicker] = useState(false)
  const [existingForms, setExistingForms] = useState<any[]>([])
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState<number | null>(null)
  const [showLeftPanel, setShowLeftPanel] = useState(true)
  const [showRightPanel, setShowRightPanel] = useState(true)
   const [isPreviewActive, setIsPreviewActive] = useState(false)
   const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

   // Convert to template states
   const [showConvertToTemplate, setShowConvertToTemplate] = useState(false)
   const [convertToTemplateLoading, setConvertToTemplateLoading] = useState(false)
   const [templateTitle, setTemplateTitle] = useState('')
   const [templateDescription, setTemplateDescription] = useState('')

   const [responseCount, setResponseCount] = useState(0)

  const [isDesignerOpen, setIsDesignerOpen] = useState(false)
  const [designerTab, setDesignerTab] = useState<'colors' | 'styles' | 'themes' | 'layout' | 'button'>('colors')
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  // Collaboration state
  const [collaborators, setCollaborators] = useState<Array<{ id: string; name: string; email: string }>>([])
  const [collabStatus, setCollabStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected')
  const collabChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  // Setup Realtime collaboration
  useEffect(() => {
    if (!formData?.id || !profile?.id) return

    const channelName = `form-${formData.id}`
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false }, presence: { key: profile.id } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: Array<{ id: string; name: string; email: string }> = []
        for (const key in state) {
          const presences = state[key] as any[]
          presences.forEach((p: any) => {
            if (p.id !== profile.id) {
              users.push({ id: p.id, name: p.name || 'محرر', email: p.email || '' })
            }
          })
        }
        setCollaborators(users)
      })
      .on('presence', { event: 'join' }, () => {})
      .on('presence', { event: 'leave' }, () => {})
      .on('broadcast', { event: 'form_update' }, ({ payload }) => {
        if (payload.userId === profile.id) return
        setFormData(prev => {
          if (!prev) return prev
          return { ...prev, ...payload.data }
        })
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setCollabStatus('connected')
          await channel.track({
            id: profile.id,
            name: profile.name || profile.email?.split('@')[0] || 'محرر',
            email: profile.email || '',
          })
        } else if (status === 'CHANNEL_ERROR') {
          setCollabStatus('disconnected')
        }
      })

    collabChannelRef.current = channel

    return () => {
      channel.unsubscribe()
      setCollaborators([])
      setCollabStatus('disconnected')
    }
  }, [formData?.id, profile?.id])

  // Debounced broadcast of form changes
  const collabBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!formData || !profile?.id || collabStatus !== 'connected') return
    if (collabBroadcastRef.current) clearTimeout(collabBroadcastRef.current)
    collabBroadcastRef.current = setTimeout(() => {
      collabChannelRef.current?.send({
        type: 'broadcast',
        event: 'form_update',
        payload: { userId: profile.id, data: { questions: formData.questions, name: formData.name, description: formData.description, is_active: formData.is_active, page_titles: formData.page_titles } },
      })
    }, 500)
  }, [formData?.questions, formData?.name, formData?.description, formData?.is_active, formData?.page_titles])

  const PRESET_THEMES: Array<{ name: string; label: string; settings: ThemeSettings }> = [
    {
      name: 'Default',
      label: 'الافتراضي الكلاسيكي',
      settings: {
        pageColor: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        formBgColor: '#ffffff',
        textColor: '#1e293b',
        primaryColor: '#2563eb',
        borderRadius: '16px',
        spacing: 'normal',
        fontFamily: 'Cairo',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Simplicity',
      label: 'البساطة الفائقة',
      settings: {
        pageColor: '#ffffff',
        formBgColor: '#fafafa',
        textColor: '#262626',
        primaryColor: '#171717',
        borderRadius: '8px',
        spacing: 'compact',
        fontFamily: 'Inter',
        flatLayout: true,
        borderStyle: 'solid',
        borderWidth: 1
      }
    },
    {
      name: 'Sunset Poetry',
      label: 'شعر الغروب',
      settings: {
        pageColor: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fca5a5 100%)',
        formBgColor: '#ffffffc0',
        textColor: '#78350f',
        primaryColor: '#db2777',
        borderRadius: '24px',
        spacing: 'cozy',
        fontFamily: 'Tajawal',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Vintage Star',
      label: 'النجم الكلاسيكي',
      settings: {
        pageColor: 'linear-gradient(135deg, #fefbf3 0%, #f1efe3 100%)',
        formBgColor: '#fdfcf7',
        textColor: '#4a3f35',
        primaryColor: '#b45309',
        borderRadius: '4px',
        spacing: 'normal',
        fontFamily: 'Cairo',
        flatLayout: false,
        borderStyle: 'solid',
        borderWidth: 2
      }
    },
    {
      name: 'Brick Wall',
      label: 'جدار الطوب الدافئ',
      settings: {
        pageColor: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
        formBgColor: '#ffffff',
        textColor: '#991b1b',
        primaryColor: '#dc2626',
        borderRadius: '12px',
        spacing: 'normal',
        fontFamily: 'Cairo',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Colorful Smart',
      label: 'الذكي الملون',
      settings: {
        pageColor: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
        formBgColor: '#ffffff',
        textColor: '#0f172a',
        primaryColor: '#0ea5e9',
        borderRadius: '20px',
        spacing: 'normal',
        fontFamily: 'Outfit',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Basic Cool',
      label: 'البارد الأساسي',
      settings: {
        pageColor: '#f1f5f9',
        formBgColor: '#ffffff',
        textColor: '#334155',
        primaryColor: '#64748b',
        borderRadius: '12px',
        spacing: 'normal',
        fontFamily: 'Inter',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Tech Cyber',
      label: 'السيبراني التقني',
      settings: {
        pageColor: '#030712',
        formBgColor: '#111827',
        textColor: '#f3f4f6',
        primaryColor: '#10b981',
        borderRadius: '0px',
        spacing: 'compact',
        fontFamily: 'Outfit',
        flatLayout: true,
        borderStyle: 'solid',
        borderWidth: 1
      }
    },
    {
      name: 'Pet Lover',
      label: 'عشاق الأليفة دافئ',
      settings: {
        pageColor: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)',
        formBgColor: '#ffffff',
        textColor: '#7c2d12',
        primaryColor: '#ea580c',
        borderRadius: '24px',
        spacing: 'cozy',
        fontFamily: 'Tajawal',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Natural Green',
      label: 'الأخضر الطبيعي',
      settings: {
        pageColor: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
        formBgColor: '#ffffff',
        textColor: '#14532d',
        primaryColor: '#16a34a',
        borderRadius: '16px',
        spacing: 'normal',
        fontFamily: 'Cairo',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Blue Ocean',
      label: 'المحيط الأزرق العميق',
      settings: {
        pageColor: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        formBgColor: '#1e293b',
        textColor: '#f8fafc',
        primaryColor: '#3b82f6',
        borderRadius: '16px',
        spacing: 'normal',
        fontFamily: 'Outfit',
        flatLayout: false,
        borderStyle: 'none',
        borderWidth: 0
      }
    },
    {
      name: 'Purple Galaxy',
      label: 'مجرة الأرجوان السحرية',
      settings: {
        pageColor: 'linear-gradient(135deg, #581c87 0%, #2e1065 100%)',
        formBgColor: '#ffffff10',
        textColor: '#f3e8ff',
        primaryColor: '#a855f7',
        borderRadius: '24px',
        spacing: 'cozy',
        fontFamily: 'Cairo',
        flatLayout: false,
        borderStyle: 'dashed',
        borderWidth: 1
      }
    }
  ]

  const getThemeSettings = (): ThemeSettings | null => {
    if (!formData?.page_titles?.theme_settings) return null
    const ts = formData.page_titles.theme_settings
    if (typeof ts === 'string') {
      try {
        return JSON.parse(ts)
      } catch {
        return null
      }
    }
    return ts as any
  }

  const theme = getThemeSettings()

  const updateThemeSettings = (updates: Partial<ThemeSettings>) => {
    if (!formData) return
    const currentTheme = theme || {}
    const newTheme = { ...currentTheme, ...updates }
    setFormData(prev => {
      if (!prev) return null
      return {
        ...prev,
        page_titles: {
          ...prev.page_titles,
          theme_settings: JSON.stringify(newTheme)
        }
      }
    })
  }

  const renderThemeStyles = () => {
    if (!theme) return null
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        .builder-themed-container {
          ${theme.pageColor ? `background: ${theme.pageColor} !important;` : ''}
          ${theme.fontFamily ? `font-family: '${theme.fontFamily}', sans-serif !important;` : ''}
        }
        .form-themed-card {
          ${theme.formBgColor ? `background-color: ${theme.formBgColor} !important;` : ''}
          ${theme.borderRadius ? `border-radius: ${theme.borderRadius} !important;` : ''}
          ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
          ${theme.flatLayout ? `box-shadow: none !important;` : ''}
          ${theme.borderStyle && theme.borderStyle !== 'none' ? `border: ${theme.borderWidth || 1}px ${theme.borderStyle} ${theme.textColor || '#d1d5db'} !important;` : ''}
        }
        .form-themed-text {
          ${theme.textColor ? `color: ${theme.textColor} !important;` : ''}
        }
        .form-themed-description {
          ${theme.textColor ? `color: ${theme.textColor}cc !important;` : ''}
        }
        .form-themed-primary-bg {
          ${theme.primaryColor ? `background: ${theme.primaryColor} !important; background-color: ${theme.primaryColor} !important;` : ''}
          color: #ffffff !important;
        }
        .form-themed-primary-text {
          ${theme.primaryColor ? `color: ${theme.primaryColor} !important;` : ''}
        }
        .form-themed-primary-border {
          ${theme.primaryColor ? `border-color: ${theme.primaryColor} !important;` : ''}
        }
        .form-themed-spacing {
          ${theme.spacing === 'compact' ? 'margin-bottom: 0.5rem !important;' : theme.spacing === 'cozy' ? 'margin-bottom: 2rem !important;' : 'margin-bottom: 1.5rem !important;'}
        }
        .form-themed-width {
          ${theme.formWidth ? `max-width: ${theme.formWidth}px !important; width: 100% !important;` : ''}
        }
      `}} />
    )
  }

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

  const prepareQuestionsForPreview = (qs: any[]): any[] => {
    return qs.filter((q: any) => !q.hidden).map((q, index) => {
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

      const previewStored = Array.isArray(optionsData)
        ? [...optionsData, { _visibility_rules: q.visibility_rules || [] }]
        : { ...optionsData, _visibility_rules: q.visibility_rules || [] }
      return {
        id: q.id,
        text: q.text,
        type: q.type,
        required: q.required || false,
        points: q.points || 0,
        has_counter: q.has_counter || false,
        order_index: index,
        row_group: q.row_group || null,
        page: q.page || 1,
        visibility_rules: q.visibility_rules,
        options: JSON.stringify(previewStored)
      }
    })
  }

const params = useParams()

  const formId = params.id as string

  const supabase = createClient()



  useEffect(() => {

    fetchData()

  }, [formId])

  // Auto-save form edits to localStorage when enabled
  useEffect(() => {
    if (!formData) return
    try {
      const key = `form_draft_${formId}`
      if (formData.enable_auto_save !== false) {
        localStorage.setItem(key, JSON.stringify(formData))
      } else {
        localStorage.removeItem(key)
      }
    } catch (e) {
      // ignore localStorage errors
    }
  }, [formData, formId])



  const fetchData = async () => {

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

      // Fetch form data - accept UUID or serial_number

      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(formId)
      const { data: form, error: formError } = await supabase

        .from('forms')

        .select('*')

        .eq(isUUID ? 'id' : 'serial_number', isUUID ? formId : parseInt(formId))

        .single()

      if (formError || !form) {

        router.push('/dashboard')

        return

      }

      // Allow form owner or admin to edit

      if (form.created_by !== user.id && profileData.role !== 'admin') {

        router.push('/dashboard')

        return

      }




      // Fetch response count
      const { count } = await supabase
        .from('form_responses')
        .select('*', { count: 'exact', head: true })
        .eq('form_id', form.id)
      setResponseCount(count || 0)



      // Fetch questions

      const { data: questions } = await supabase

        .from('questions')

        .select('*')

        .eq('form_id', form.id)

        .order('order_index')



      const formattedQuestions: Question[] = (questions || []).map(q => {
        const parsedOpts = q.options ? JSON.parse(q.options) : []
        let matrix_rows: MatrixRow[] | undefined
        let matrix_columns: MatrixColumn[] | undefined
        let dropdown_type: 'single' | 'multiple' | undefined
        let correct_option_ids: string[] | undefined
        let visibility_rules: VisibilityRule[] | undefined
        let optionsValue: any

        if (Array.isArray(parsedOpts)) {
          const last = parsedOpts[parsedOpts.length - 1]
          if (last && last._visibility_rules !== undefined) {
            visibility_rules = last._visibility_rules?.length > 0 ? last._visibility_rules : undefined
            parsedOpts.pop()
          }
          optionsValue = parsedOpts
        } else {
          visibility_rules = parsedOpts._visibility_rules?.length > 0 ? parsedOpts._visibility_rules : undefined
          if (parsedOpts._visibility_rules) {
            const { _visibility_rules, ...cleanOpts } = parsedOpts
          }
          if (q.type === 'matrix' && parsedOpts.matrix_rows) {
            matrix_rows = parsedOpts.matrix_rows
            matrix_columns = parsedOpts.matrix_columns || []
          }
          if (q.type === 'dropdown' && parsedOpts.dropdown_type) {
            dropdown_type = parsedOpts.dropdown_type
            correct_option_ids = parsedOpts.correct_option_ids || []
          }
          // Convert objects with numeric keys (old format) to arrays
          if (parsedOpts.matrix_rows) {
            optionsValue = []
          } else if (parsedOpts.options) {
            optionsValue = parsedOpts.options
          } else if (!Array.isArray(parsedOpts) && typeof parsedOpts === 'object' && Object.keys(parsedOpts).some(k => !isNaN(Number(k)))) {
            optionsValue = Object.values(parsedOpts).filter((v: any) => typeof v === 'object' && !Array.isArray(v) && v !== null)
          } else {
            optionsValue = parsedOpts
          }
        }

        return {
          id: q.id,
          text: q.text,
          type: q.type,
          required: q.required || false,
          points: q.points || 0,
          has_counter: q.has_counter || false,
          options: optionsValue,
          order_index: q.order_index,
          row_group: q.row_group || null,
          matrix_rows,
          matrix_columns,
          dropdown_type,
          correct_option_ids,
          correct_option_id: correct_option_ids?.[0],
          page: q.page || 1,
          visibility_rules
        }
      })



      setFormData({

        id: form.id,

        name: form.name,

        description: form.description || '',



        allow_multiple: form.allow_multiple || false,

        time_limit: form.time_limit || null,

        expires_at: form.expires_at || '',

        allow_delete_responses: form.allow_delete_responses || false,

        randomize_questions: form.randomize_questions || false,

        questions: formattedQuestions,

        is_active: form.is_active,
        image_url: form.image_url || '',
        short_code: form.short_code || '',
        serial_number: form.serial_number,
        page_titles: form.page_titles || {},
        payment_info: form.page_titles?._payment ? (typeof form.page_titles._payment === 'string' ? JSON.parse(form.page_titles._payment) : form.page_titles._payment) : [],
        products: form.page_titles?._products || []

      })

      // If there is a locally saved draft and auto-save is enabled, offer to restore it
      try {
        const key = `form_draft_${formId}`
        const draft = localStorage.getItem(key)
        if (draft) {
          const parsed = JSON.parse(draft)
          if (parsed && parsed.id === form.id && parsed.enable_auto_save !== false) {
            if (confirm('يوجد مسودة محفوظة محلياً. هل تريد استعادتها؟')) {
              setFormData({ ...parsed })
            }
          }
        }
      } catch (e) {
        // ignore
      }

      // Get existing forms for question import
      const { data: allForms } = await supabase
        .from('forms')
        .select('*, questions(*)')

      setExistingForms(allForms || [])

    } catch (error) {

      console.error('Error fetching data:', error)

      router.push('/dashboard')

    } finally {

      setLoading(false)

    }

  }



  const addQuestion = (type: QuestionType) => {

    if (!formData) return



    const newQuestion: Question = {

      id: `q_${Date.now()}`,

      text: '',

      type,

      required: false,

      points: 0,

      options: [],
      page: formData.questions.length > 0 ? (formData.questions[formData.questions.length - 1].page || 1) : 1

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

    } else if (type === 'dropdown') {
      newQuestion.dropdown_type = 'single'
      newQuestion.correct_option_ids = []
    } else if (type === 'button_choice') {
      newQuestion.options = [
        { id: `opt_${Date.now()}_1`, text: '', points: 0 },
        { id: `opt_${Date.now()}_2`, text: '', points: 0 }
      ]
    } else if (type === 'slider') {
      newQuestion.options = [{ id: `opt_${Date.now()}_1`, text: '0|100|1', points: 0 }] as any
    } else if (type === 'star_rating') {
      newQuestion.options = Array.from({ length: 5 }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 }))
    } else if (type === 'match_items') {
      newQuestion.matrix_rows = [
        { id: `left_${Date.now()}_1`, text: 'عنصر 1', required: true },
        { id: `left_${Date.now()}_2`, text: 'عنصر 2', required: true }
      ]
      newQuestion.matrix_columns = [
        { id: `right_${Date.now()}_1`, text: 'إجابة 1', points: 0 },
        { id: `right_${Date.now()}_2`, text: 'إجابة 2', points: 0 }
      ]
    }



    setFormData(prev => prev ? ({

      ...prev,

      questions: [...prev.questions, newQuestion]

    }) : null)

  }



  const updateQuestion = (index: number, updates: Partial<Question>) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.map((q: any, i: number) => 

        i === index ? { ...q, ...updates } : q

      )

    }) : null)

  }



  const removeQuestion = (index: number) => {

    if (!formData) return



    setFormData(prev => prev ? ({

      ...prev,

      questions: prev.questions.filter((_: any, i: number) => i !== index)

    }) : null)

  }



  const addMatrixRow = (questionIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    const newRow = { id: `row_${Date.now()}`, text: '', required: false }
    updateQuestion(questionIndex, {
      matrix_rows: [...(question.matrix_rows || []), newRow]
    })
  }

  const removeMatrixRow = (questionIndex: number, rowIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).filter((_: any, i: number) => i !== rowIndex)
    })
  }

  const updateMatrixRow = (questionIndex: number, rowIndex: number, updates: Partial<MatrixRow>) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_rows: (question.matrix_rows || []).map((row: any, i: number) =>
        i === rowIndex ? { ...row, ...updates } : row
      )
    })
  }

  const addMatrixColumn = (questionIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    const newCol = { id: `col_${Date.now()}`, text: '', points: 0 }
    updateQuestion(questionIndex, {
      matrix_columns: [...(question.matrix_columns || []), newCol]
    })
  }

  const removeMatrixColumn = (questionIndex: number, colIndex: number) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).filter((_: any, i: number) => i !== colIndex)
    })
  }

  const updateMatrixColumn = (questionIndex: number, colIndex: number, updates: Partial<MatrixColumn>) => {
    if (!formData) return
    const question = formData.questions[questionIndex]
    updateQuestion(questionIndex, {
      matrix_columns: (question.matrix_columns || []).map((col: any, i: number) =>
        i === colIndex ? { ...col, ...updates } : col
      )
    })
  }

  const parseBulkText = (questionIndex: number) => {
    if (!formData) return
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

  const addOption = (questionIndex: number) => {

    if (!formData) return



    const newOption: QuestionOption = {

      id: `opt_${Date.now()}`,

      text: '',

      points: 0

    }



    updateQuestion(questionIndex, {

      options: [...(Array.isArray(formData.questions[questionIndex].options) ? formData.questions[questionIndex].options : []), newOption]

    })

  }



  const removeOption = (questionIndex: number, optionIndex: number) => {

    if (!formData) return



    updateQuestion(questionIndex, {

      options: parseOptions(formData.questions[questionIndex].options).filter((_: any, i: number) => i !== optionIndex)

    })

  }



  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {

    if (!formData) return



    updateQuestion(questionIndex, {

      options: parseOptions(formData.questions[questionIndex].options).map((opt: any, i: number) =>

        i === optionIndex ? { ...opt, ...updates } : opt

      )

    })
  }

  // Redirect rules helpers
  const addRedirectRule = () => {
    if (!formData) return
    const firstQuestionId = formData.questions && formData.questions.length > 0 ? formData.questions[0].id : ''
    setFormData(prev => prev ? ({
      ...prev,
      redirect_rules: [...(prev.redirect_rules || []), { question_id: firstQuestionId, operator: 'equals', value: '', redirect_url: '', message: '' }]
    }) : null)
  }

  const updateRedirectRule = (index: number, updates: Partial<{ question_id: string; operator: string; value: string; redirect_url: string; message?: string }>) => {
    if (!formData) return
    setFormData(prev => prev ? ({
      ...prev,
      redirect_rules: (prev.redirect_rules || []).map((r: any, i: number) => i === index ? { ...r, ...updates } : r)
    }) : null)
  }

  const removeRedirectRule = (index: number) => {
    if (!formData) return
    setFormData(prev => prev ? ({
      ...prev,
      redirect_rules: (prev.redirect_rules || []).filter((_: any, i: number) => i !== index)
    }) : null)
  }

  const saveForm = async () => {

    if (!formData || !formData.name.trim()) {

      alert('يرجى إدخال اسم الفورم')

      return

    }



    if ((formData.questions || []).length === 0) {

      alert('يرجى إضافة سؤال واحد على الأقل')

      return

    }



    setSaving(true)

    try {

      // Update form

      const { error: formError } = await supabase

        .from('forms')

        .update({

          name: formData.name,

          description: formData.description,



          allow_multiple: formData.allow_multiple,

          is_active: formData.is_active,

          time_limit: formData.time_limit || null,

          expires_at: formData.expires_at || null,

          allow_delete_responses: formData.allow_delete_responses || false,
          randomize_questions: formData.randomize_questions || false,
          image_url: formData.image_url || null,
          short_code: formData.short_code || generateShortCode(),
          page_titles: { ...formData.page_titles, _is_test: !!(formData.page_titles as any)?._is_test, _payment: formData.payment_info || [], _products: formData.products || [], _submit_button: (formData.page_titles as any)?._submit_button || {}, _offer_countdown: (formData.page_titles as any)?._offer_countdown || '' }

        })

        .eq('id', formData.id)



      if (formError) throw formError



      // Delete existing questions

      const { error: deleteError } = await supabase

        .from('questions')

        .delete()

        .eq('form_id', formData.id)



      if (deleteError) throw deleteError

      // Insert updated questions

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
          form_id: formData.id,
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



      alert('تم حفظ التعديلات بنجاح')

      router.push('/dashboard')

    } catch (error) {

      console.error('Error saving form:', error)

      alert('حدث خطأ أثناء حفظ التعديلات')

    } finally {

      setSaving(false)

    }

  }



  const moveQuestion = (index: number, direction: 'up' | 'down') => {

    if (!formData) return

    const newQuestions = [...formData.questions]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= newQuestions.length) return
    ;[newQuestions[index], newQuestions[targetIndex]] = [newQuestions[targetIndex], newQuestions[index]]
    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)
  }

  const moveToStart = (index: number) => {
    if (!formData || index <= 0) return
    const newQuestions = [...formData.questions]
    const [item] = newQuestions.splice(index, 1)
    newQuestions.unshift(item)
    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)
  }

  const moveToEnd = (index: number) => {
    if (!formData || index >= formData.questions.length - 1) return
    const newQuestions = [...formData.questions]
    const [item] = newQuestions.splice(index, 1)
    newQuestions.push(item)
    setFormData(prev => prev ? ({ ...prev, questions: newQuestions }) : null)
  }

  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const [collabConditionalOpen, setCollabConditionalOpen] = useState<number | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return
    if (!formData) return
    const qs = formData.questions
    const oldIndex = qs.findIndex(q => q.id === active.id)
    const newIndex = qs.findIndex(q => q.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setFormData(prev => prev ? ({ ...prev, questions: arrayMove([...prev.questions], oldIndex, newIndex) }) : null)
  }

  const importQuestion = (question: any) => {
    if (!formData) return
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: question.text,
      type: question.type,
      required: question.required || false,
      points: question.points || 0,
      options: parseOptions(question.options)
    }
    setFormData(prev => prev ? ({
      ...prev,
      questions: [...prev.questions, newQuestion]
    }) : null)
    setShowQuestionPicker(false)
  }

  const addPage = () => {
    if (!formData) return
    const maxPage = Math.max(1, ...formData.questions.map(q => q.page || 1))
    const newPage = maxPage + 1
    setFormData(prev => prev ? ({
      ...prev,
      page_titles: { ...prev.page_titles, [String(newPage)]: '' }
    }) : null)
  }

  const removePage = (pageNum: number) => {
    if (!formData) return
    const qs = formData.questions
    const hasQuestions = qs.some(q => (q.page || 1) === pageNum)
    if (hasQuestions) {
      if (!confirm('هناك أسئلة في هذه الصفحة. هل تريد نقلها للصفحة السابقة؟')) return
    }
    const newPageTitles = { ...formData.page_titles }
    delete newPageTitles[String(pageNum)]
    setFormData(prev => prev ? ({
      ...prev,
      page_titles: newPageTitles,
      questions: prev.questions.map(q => (q.page || 1) === pageNum ? { ...q, page: Math.max(1, pageNum - 1) } : q)
    }) : null)
  }

  const setPageTitle = (pageNum: number, title: string) => {
    if (!formData) return
    setFormData(prev => prev ? ({
      ...prev,
      page_titles: { ...prev.page_titles, [String(pageNum)]: title }
    }) : null)
  }

  const moveToPage = (qIndex: number, pageNum: number) => {
    updateQuestion(qIndex, { page: pageNum })
  }

  const renderQuestionPreview = (question: any, qIndex: number) => (
    <div
      onClick={() => setSelectedQuestionIndex(selectedQuestionIndex === qIndex ? null : qIndex)}
      className={`rounded-xl p-4 border-2 cursor-pointer transition-all ${
        selectedQuestionIndex === qIndex
          ? 'border-blue-500 bg-blue-50/50 shadow-sm'
          : 'border-gray-100 bg-gray-50 hover:border-blue-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
          selectedQuestionIndex === qIndex ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
        }`}>
          {qIndex + 1}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${question.text ? 'text-gray-900' : 'text-gray-400'}`}>
            {question.text || 'اكتب السؤال هنا...'}
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
              {QUESTION_TYPES[question.type as QuestionType]?.label}
            </span>
            {question.required && <span className="text-xs text-red-500">* مطلوب</span>}
            {question.points > 0 && <span className="text-xs text-amber-600">{question.points} نقطة</span>}
          </div>
          {parseOptions(question.options).length > 0 && !['scale'].includes(question.type) && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(parseOptions(question.options) as any[]).slice(0, 4).map((opt: any, oi: number) => (
                <span key={oi} className="text-xs bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-lg">
                  {opt.text || 'خيار'}
                </span>
              ))}
              {parseOptions(question.options).length > 4 && (
                <span className="text-xs text-gray-400">+{parseOptions(question.options).length - 4}</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
          </button>
          <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === ((formData?.questions || []).length - 1)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 rounded-lg disabled:opacity-30">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
          </button>
          <button onClick={() => removeQuestion(qIndex)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </button>
        </div>
      </div>
    </div>
  )

  if (loading) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>

      </div>

    )

  }



  if (!formData) {

    return (

      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <p className="text-gray-500">لم يتم العثور على النموذج</p>

          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
          >
            العودة للوحة التحكم
          </Link>
        </div>

      </div>

    )

  }



  return (

    <div dir="rtl" className={`min-h-screen ${isDarkMode ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {renderThemeStyles()}

      {/* Header */}

      <header className="bg-white shadow-sm sticky top-0 z-10">

        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">

          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>

          <h1 className="text-lg font-bold text-blue-700">تعديل النموذج</h1>

        </div>

      </header>

      {/* Action Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-center sm:justify-start gap-2">
          <button
            onClick={() => setShowSettingsModal(prev => !prev)}
            className="flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit"
            title="الإعدادات"
          >
            <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">الإعدادات</span>
          </button>
          <button
            onClick={() => setFormData(prev => prev ? ({ ...prev, is_active: !prev.is_active }) : null)}
            className={`flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit ${
              formData?.is_active 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
            title={formData?.is_active ? 'مفعل' : 'معطل'}
          >
            <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {formData?.is_active ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              )}
            </svg>
            <span className="hidden sm:inline">{formData?.is_active ? 'مفعل' : 'معطل'}</span>
          </button>
          <button
            onClick={() => {
              const code = formData?.short_code
              const serial = formData?.serial_number || formId
              const link = code ? `${window.location.origin}/f/${code}` : `${window.location.origin}/forms/${serial}`
              navigator.clipboard.writeText(link)
              alert('تم نسخ رابط المشاركة: ' + link)
            }}
            className="flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit"
            title="نسخ الرابط"
          >
            <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="hidden sm:inline">نسخ الرابط</span>
          </button>
           <button
             onClick={() => { setIsPreviewActive(prev => !prev); setShowSettingsModal(false) }}
             className="flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit"
             title="معاينة النموذج"
           >
             <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
             </svg>
             <span className="hidden sm:inline">معاينة</span>
           </button>
           <button
             onClick={() => setShowConvertToTemplate(true)}
             className="flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit"
             title="تحويل إلى قالب"
           >
             <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
             </svg>
             <span className="hidden sm:-inline">قالب</span>
           </button>
           {/* Collaboration indicator */}
          <div className="flex items-center gap-1.5 px-2">
            <span className={`w-2 h-2 rounded-full ${
              collabStatus === 'connected' ? 'bg-green-500' : collabStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-[10px] text-gray-500 hidden sm:inline">
              {collabStatus === 'connecting' ? 'جاري الاتصال...' : ''}
            </span>
            {collaborators.map(c => (
              <span key={c.id} className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-bold" title={c.name}>
                {c.name.charAt(0)}
              </span>
            ))}
          </div>
          <button
            onClick={() => setIsDarkMode(prev => !prev)}
            className={`flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 rounded-xl active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer min-w-0 sm:min-w-fit ${
              isDarkMode
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                : 'bg-gray-800 text-white hover:bg-gray-700'
            }`}
            title={isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}
          >
            <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isDarkMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              )}
            </svg>
            <span className="hidden sm:inline">{isDarkMode ? 'نهاري' : 'ليلي'}</span>
          </button>
          <button
            onClick={saveForm}
            disabled={saving}
            className="flex flex-col sm:flex-row items-center gap-1 px-2 sm:px-3 py-2 sm:py-1.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all text-[10px] sm:text-xs font-medium cursor-pointer disabled:opacity-50 min-w-0 sm:min-w-fit"
            title="حفظ التعديلات"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></div>
            ) : (
              <svg className="w-5 h-5 sm:w-3.5 sm:h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            )}
            <span className="hidden sm:inline">{saving ? 'جاري الحفظ...' : 'حفظ'}</span>
          </button>
        </div>
      </div>

      {showSettingsModal && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">الإعدادات</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={saveForm}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-1 cursor-pointer text-xs font-medium"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ التعديلات'
                  )}
                </button>
                <button onClick={() => setShowSettingsModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer">
                  <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="space-y-5">
              {/* Form Image, Name, Description */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="space-y-3">
                  <ImageUpload onImageUploaded={(url) => setFormData(prev => prev ? ({ ...prev, image_url: url }) : null)} currentImage={formData?.image_url || ''} />
                  <input type="text" value={formData?.name || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, name: e.target.value }) : null)} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="اسم النموذج *" />
                  <textarea value={formData?.description || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, description: e.target.value }) : null)} rows={2} className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="وصف مختصر..." />
                </div>
                {(() => {
                  const qs = formData?.questions || []
                  let totalPts = 0
                  qs.forEach((q: any) => {
                    if (q.type === 'file_upload') return
                    if (q.type === 'single_choice') {
                      totalPts += Math.max(0, ...parseOptions(q.options).map((o:any) => o.points || 0))
                    } else if (q.type === 'multiple_choice') {
                      totalPts += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (q.type === 'dropdown') {
                      const opts = parseOptions(q.options)
                      if (q.dropdown_type === 'multiple') {
                        totalPts += (q.correct_option_ids || []).reduce((s:number, id:string) => {
                          const opt = opts.find((o:any) => o.id === id); return s + (opt?.points || 0)
                        }, 0)
                      } else {
                        const opt = opts.find((o:any) => o.id === q.correct_option_id)
                        totalPts += opt?.points || 0
                      }
                    } else if (q.type === 'ranking') {
                      totalPts += parseOptions(q.options).reduce((s:number, o:any) => s + (o.points || 0), 0)
                    } else if (q.type === 'matrix') {
                      const colSum = (q.matrix_columns || []).reduce((s:number, c:any) => s + (c.points || 0), 0)
                      totalPts += colSum * (q.matrix_rows || []).length
                    } else if (q.type === 'scale') {
                      totalPts += Math.max(10, ...parseOptions(q.options).map((o:any) => o.points || 0))
                    } else {
                      totalPts += q.points || 0
                    }
                  })
                  return (
                    <div className="flex items-center gap-3 mt-3 p-2.5 bg-gradient-to-l from-blue-50 to-purple-50 rounded-xl border border-blue-100 text-sm">
                      <span className="text-gray-600">الأسئلة: <strong className="text-gray-900">{qs.length}</strong></span>
                      {!!(formData?.page_titles as any)?._is_test && <span className="text-gray-600">النقاط: <strong className="text-blue-700">{totalPts}</strong></span>}
                    </div>
                  )
                })()}
              </div>

              {/* Settings Toggles */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">خيارات النموذج</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-start gap-2 p-2 bg-cyan-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={!!(formData?.page_titles as any)?._is_test} onChange={(e) => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _is_test: e.target.checked } }) : null)} className="w-4 h-4 mt-0.5 text-cyan-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">اختبار</span>
                      <p className="text-xs text-gray-500 mt-0.5">إظهار حقول النقاط والدرجات</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={formData?.allow_multiple || false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, allow_multiple: e.target.checked }) : null)} className="w-4 h-4 mt-0.5 text-blue-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">تسجيل متعدد</span>
                      <p className="text-xs text-gray-500 mt-0.5">السماح للمستخدم بإعادة ملء النموذج عدة مرات</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-green-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={formData?.time_limit !== null && formData?.time_limit !== undefined} onChange={(e) => setFormData(prev => prev ? ({ ...prev, time_limit: e.target.checked ? 10 : null }) : null)} className="w-4 h-4 mt-0.5 text-green-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">مؤقت</span>
                      <p className="text-xs text-gray-500 mt-0.5">عداد تنازلي لإكمال النموذج خلال مدة محددة</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-red-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={!!formData?.expires_at} onChange={(e) => setFormData(prev => prev ? ({ ...prev, expires_at: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : '' }) : null)} className="w-4 h-4 mt-0.5 text-red-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">تاريخ إغلاق</span>
                      <p className="text-xs text-gray-500 mt-0.5">إغلاق النموذج تلقائياً في تاريخ محدد</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-orange-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={formData?.allow_delete_responses || false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, allow_delete_responses: e.target.checked }) : null)} className="w-4 h-4 mt-0.5 text-orange-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">حذف الردود</span>
                      <p className="text-xs text-gray-500 mt-0.5">إظهار زر حذف لكل تسجيل ليحذفه المستخدم بنفسه</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-purple-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={formData?.randomize_questions || false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, randomize_questions: e.target.checked }) : null)} className="w-4 h-4 mt-0.5 text-purple-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">ترتيب عشوائي للأسئلة</span>
                      <p className="text-xs text-gray-500 mt-0.5">عرض الأسئلة بترتيب مختلف لكل مستخدم</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 p-2 bg-indigo-50 rounded-lg cursor-pointer text-sm">
                    <input type="checkbox" checked={formData?.enable_auto_save !== false} onChange={(e) => setFormData(prev => prev ? ({ ...prev, enable_auto_save: e.target.checked }) : null)} className="w-4 h-4 mt-0.5 text-indigo-600 rounded" />
                    <div>
                      <span className="text-gray-700 font-medium">الحفظ التلقائي (Auto Save)</span>
                      <p className="text-xs text-gray-500 mt-0.5">حفظ إجابات المستخدم محلياً للعودة لها لاحقاً</p>
                    </div>
                  </label>
                </div>

                {formData?.time_limit !== null && formData?.time_limit !== undefined && (
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm text-gray-600">الوقت (دقيقة):</label>
                    <input type="number" min="1" value={formData?.time_limit || 1} onChange={(e) => setFormData(prev => prev ? ({ ...prev, time_limit: parseInt(e.target.value) || 1 }) : null)} className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center text-sm" />
                  </div>
                )}
                {formData?.expires_at && (
                  <div className="mt-2">
                    <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData(prev => prev ? ({ ...prev, expires_at: e.target.value }) : null)} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                  </div>
                )}
              </div>

              {/* Smart Redirect Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">التوجيه الذكي بعد الإرسال</h4>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">التوجيه الافتراضي بعد الإرسال</label>
                  <input type="text" value={formData?.default_redirect_url || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, default_redirect_url: e.target.value }) : null)} placeholder="https://example.com/thank-you" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-bold text-gray-900">قواعد التوجيه الذكي</h4>
                    <button onClick={addRedirectRule} className="text-xs text-blue-600 hover:underline">+ إضافة قاعدة</button>
                  </div>
                  <div className="space-y-2">
                    {(formData?.redirect_rules || []).map((rule: any, idx: number) => (
                      <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                        <select value={rule.question_id} onChange={(e) => updateRedirectRule(idx, { question_id: e.target.value })} className="col-span-4 px-2 py-1.5 bg-white border border-gray-200 rounded text-sm">
                          {(formData?.questions || []).map((q: any) => (
                            <option key={q.id} value={q.id}>{q.text || `سؤال ${q.id}`}</option>
                          ))}
                        </select>
                        <select value={rule.operator || 'equals'} onChange={(e) => updateRedirectRule(idx, { operator: e.target.value })} className="col-span-2 px-2 py-1.5 bg-white border border-gray-200 rounded text-sm">
                          <option value="equals">يساوي</option>
                          <option value="contains">يحتوي</option>
                          <option value="not_equals">لا يساوي</option>
                        </select>
                        <input type="text" value={rule.value || ''} onChange={(e) => updateRedirectRule(idx, { value: e.target.value })} placeholder="قيمة المطابقة" className="col-span-3 px-2 py-1.5 bg-white border border-gray-200 rounded text-sm" />
                        <input type="text" value={rule.redirect_url || ''} onChange={(e) => updateRedirectRule(idx, { redirect_url: e.target.value })} placeholder="رابط التوجيه" className="col-span-2 px-2 py-1.5 bg-white border border-gray-200 rounded text-sm" />
                        <button onClick={() => removeRedirectRule(idx)} className="col-span-1 text-red-500 hover:underline text-sm">حذف</button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Offer Countdown */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">العد التنازلي للعرض</h4>
                <div className="p-3 bg-gradient-to-l from-red-50 to-orange-50 rounded-lg border border-red-100 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!(formData?.page_titles as any)?._offer_countdown}
                      onChange={(e) => setFormData(prev => prev ? ({
                        ...prev,
                        page_titles: {
                          ...prev.page_titles,
                          _offer_countdown: e.target.checked ? new Date(Date.now() + 86400000).toISOString().slice(0, 16) : ''
                        }
                      }) : null)}
                      className="w-4 h-4 text-red-600 rounded"
                    />
                    <span className="text-sm text-gray-700 font-medium">تفعيل العد التنازلي</span>
                  </label>
                  {(formData?.page_titles as any)?._offer_countdown && (
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">وقت انتهاء العرض</label>
                      <input
                        type="datetime-local"
                        value={(formData?.page_titles as any)?._offer_countdown || ''}
                        onChange={(e) => setFormData(prev => prev ? ({
                          ...prev,
                          page_titles: { ...prev.page_titles, _offer_countdown: e.target.value }
                        }) : null)}
                        className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <p className="text-xs text-red-500 mt-1">سيظهر للمستخدم "العرض ينتهي خلال: HH:MM:SS"</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">المنتجات</h4>
                <p className="text-xs text-gray-500 mb-3">أضف المنتجات التي سيتم عرضها للمستخدم لاختيارها وطلبها</p>
                <div className="space-y-3">
                  {(formData?.products || []).map((prod: any, pi: number) => (
                    <div key={pi} className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                      <div className="flex gap-2 items-start">
                        {prod.image_url ? (
                          <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                            <img src={prod.image_url} alt={prod.name} className="w-full h-full object-cover" />
                            <button onClick={() => {
                              const newProds = [...(formData?.products || [])]
                              newProds[pi] = { ...newProds[pi], image_url: '' }
                              setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                            }} className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">×</button>
                          </div>
                        ) : (
                          <label className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 shrink-0">
                            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                              const file = e.target.files?.[0]
                              if (!file) return
                              const supabase = (await import('@/utils/supabase/client')).createClient()
                              const ext = file.name.split('.').pop()
                              const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
                              const { data, error } = await supabase.storage.from('products').upload(fileName, file)
                              if (error) { alert('فشل رفع الصورة'); return }
                              const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName)
                              const newProds = [...(formData?.products || [])]
                              newProds[pi] = { ...newProds[pi], image_url: publicUrl }
                              setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                            }} />
                          </label>
                        )}
                        <div className="flex-1 space-y-1.5 min-w-0">
                          <input type="text" value={prod.name} onChange={(e) => {
                            const newProds = [...(formData?.products || [])]
                            newProds[pi] = { ...newProds[pi], name: e.target.value }
                            setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                          }} placeholder="اسم المنتج" className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium" />
                          <textarea value={prod.description || ''} onChange={(e) => {
                            const newProds = [...(formData?.products || [])]
                            newProds[pi] = { ...newProds[pi], description: e.target.value }
                            setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                          }} rows={2} placeholder="وصف المنتج (اختياري)" className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label className="text-xs text-gray-500">السعر (EGP)</label>
                          <input type="number" min="0" value={prod.price || ''} onChange={(e) => {
                            const newProds = [...(formData?.products || [])]
                            newProds[pi] = { ...newProds[pi], price: Number(e.target.value) }
                            setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                          }} placeholder="0.00" className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                        <label className="flex items-center gap-1.5 text-xs text-gray-600 mt-5">
                          <input type="checkbox" checked={prod.available !== false} onChange={(e) => {
                            const newProds = [...(formData?.products || [])]
                            newProds[pi] = { ...newProds[pi], available: e.target.checked }
                            setFormData(prev => prev ? ({ ...prev, products: newProds }) : null)
                          }} className="w-3.5 h-3.5 text-blue-600 rounded" />
                          متاح
                        </label>
                        <button onClick={() => {
                          setFormData(prev => prev ? ({ ...prev, products: prev.products?.filter((_: any, i: number) => i !== pi) }) : null)
                        }} className="p-1.5 mt-5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => {
                    setFormData(prev => prev ? ({ ...prev, products: [...(prev.products || []), { id: `p_${Date.now()}`, name: '', description: '', price: 0, image_url: '', available: true }] }) : null)
                  }} className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة منتج
                  </button>
                </div>
              </div>

              {/* Payment Info Section */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">بيانات الدفع</h4>
                <p className="text-xs text-gray-500 mb-3">أضف طرق الدفع لعرضها للمستخدم عند ملء النموذج</p>
                <div className="space-y-2">
                  {(formData?.payment_info || []).map((pm: any, pi: number) => (
                    <div key={pi} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <select value={pm.method} onChange={(e) => {
                        const newPm = [...(formData?.payment_info || [])]
                        newPm[pi] = { ...newPm[pi], method: e.target.value }
                        setFormData(prev => prev ? ({ ...prev, payment_info: newPm }) : null)
                      }} className="w-28 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                        <option value="bank">حساب بنكي</option>
                        <option value="instapay">إنستاباي</option>
                        <option value="vodafone">فودافون كاش</option>
                      </select>
                      <input type="text" value={pm.label} onChange={(e) => {
                        const newPm = [...(formData?.payment_info || [])]
                        newPm[pi] = { ...newPm[pi], label: e.target.value }
                        setFormData(prev => prev ? ({ ...prev, payment_info: newPm }) : null)
                      }} placeholder={pm.method === 'bank' ? 'اسم البك' : pm.method === 'instapay' ? 'اسم المستخدم' : 'رقم المحفظة'} className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                      <input type="text" value={pm.value} onChange={(e) => {
                        const newPm = [...(formData?.payment_info || [])]
                        newPm[pi] = { ...newPm[pi], value: e.target.value }
                        setFormData(prev => prev ? ({ ...prev, payment_info: newPm }) : null)
                      }} placeholder="رقم الحساب" className="flex-1 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                      <button onClick={() => {
                        setFormData(prev => prev ? ({ ...prev, payment_info: prev.payment_info?.filter((_: any, i: number) => i !== pi) }) : null)
                      }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => {
                    setFormData(prev => prev ? ({ ...prev, payment_info: [...(prev.payment_info || []), { method: 'bank', label: '', value: '' }] }) : null)
                  }} className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة طريقة دفع
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {isPreviewActive ? (
        <div className="bg-slate-900/5 min-h-[calc(100vh-73px)] w-full py-6 flex flex-col items-center justify-start overflow-y-auto">
          {previewDevice === 'mobile' && (
            <div className="relative mx-auto my-4 border-[12px] border-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden bg-white w-[375px] h-[780px] max-h-[80vh] flex flex-col shrink-0">
              {/* Notch */}
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 rounded-b-xl flex items-center justify-center z-20">
                <div className="w-16 h-1 bg-black/40 rounded-full"></div>
              </div>
              {/* Scrollable Form Content */}
              <div id="preview-device-content" className="w-full h-full overflow-y-auto pt-4 scrollbar-hide">
                <FormFiller
                  form={formData as any}
                  questions={prepareQuestionsForPreview(formData.questions)}
                  existingResponse={null}
                  allUserResponses={[]}
                  project={null}
                  userId={null}
                  isPreview={true}
                />
              </div>
              {/* Home Indicator */}
              <div className="absolute bottom-1 inset-x-0 h-1 w-24 bg-slate-900/40 rounded-full mx-auto z-20"></div>
            </div>
          )}

          {previewDevice === 'tablet' && (
            <div className="relative mx-auto my-4 border-[14px] border-slate-900 rounded-[2rem] shadow-2xl overflow-hidden bg-white w-[768px] h-[1024px] max-h-[85vh] flex flex-col shrink-0">
              {/* Tablet Home Button / Indicator */}
              <div className="absolute bottom-1 inset-x-0 h-1.5 w-20 bg-slate-900/40 rounded-full mx-auto z-20"></div>
              {/* Scrollable Form Content */}
              <div id="preview-device-content" className="w-full h-full overflow-y-auto">
                <FormFiller
                  form={formData as any}
                  questions={prepareQuestionsForPreview(formData.questions)}
                  existingResponse={null}
                  allUserResponses={[]}
                  project={null}
                  userId={null}
                  isPreview={true}
                />
              </div>
            </div>
          )}

          {previewDevice === 'desktop' && (
            <div className="w-full max-w-5xl mx-auto px-4">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <FormFiller
                  form={formData as any}
                  questions={prepareQuestionsForPreview(formData.questions)}
                  existingResponse={null}
                  allUserResponses={[]}
                  project={null}
                  userId={null}
                  isPreview={true}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        <main className="max-w-4xl mx-auto px-4 py-6 rounded-2xl transition-all duration-300 builder-themed-container">



            {/* Question Preview */}
            {(() => {
              const qs = formData.questions || []
              // removed early return for empty form to allow adding the first question
              const pageMap: Record<number, { questions: any[], indices: number[] }> = {}
              qs.forEach((q: any, idx: number) => {
                const p = q.page || 1
                if (!pageMap[p]) pageMap[p] = { questions: [], indices: [] }
                pageMap[p].questions.push(q)
                pageMap[p].indices.push(idx)
              })
              
              const pageNumbersSet = new Set<number>()
              qs.forEach((q: any) => pageNumbersSet.add(q.page || 1))
              if (formData?.page_titles) {
                Object.keys(formData.page_titles).forEach(p => {
                  const num = Number(p)
                  if (!isNaN(num)) pageNumbersSet.add(num)
                })
              }
              if (pageNumbersSet.size === 0) pageNumbersSet.add(1)
              const pageNumbers = Array.from(pageNumbersSet).sort((a, b) => a - b)

              return (
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900">الأسئلة</h3>
                    <span className="text-xs text-gray-500">{qs.length} سؤال</span>
                  </div>
                  {pageNumbers.map(pageNum => {
                    const pageQs = pageMap[pageNum]?.questions || []
                    const indices = pageMap[pageNum]?.indices || []
                    const pageTitle = formData?.page_titles?.[String(pageNum)] || ''
                    return (
                      <div key={pageNum} className="space-y-2">
                        {/* Page header */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-lg shrink-0 form-themed-primary-bg">صفحة {pageNum}</span>
                          {pageNumbers.length > 1 && (
                            <button onClick={() => removePage(pageNum)} className="p-0.5 text-red-300 hover:text-red-500 shrink-0">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={pageTitle}
                          onChange={(e) => setPageTitle(pageNum, e.target.value)}
                          placeholder={`عنوان الصفحة ${pageNum} (اختياري)`}
                          className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-blue-500"
                        />
                        {/* Question cards with drag & drop */}
                        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
                          <SortableContext items={pageQs.map(q => q.id)} strategy={verticalListSortingStrategy}>
                        {pageQs.map((question, pi) => {
                          const qIndex = indices[pi]
                          const isSelected = selectedQuestionIndex === qIndex
                          const typeInfo = QUESTION_TYPES[question.type as QuestionType]
                          
                          if (question.type === 'divider') {
                            return (
                              <SortableQuestionItem key={question.id} id={question.id}>
                              <div
                                className="group relative flex items-center py-4 px-2 bg-transparent cursor-pointer"
                              >
                                <div className="flex-1 h-0.5 bg-gray-300 group-hover:bg-blue-400 transition-colors"></div>
                                <div className="absolute left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-white shadow-md border border-gray-200 rounded-xl flex items-center gap-1 p-1 transition-opacity z-10">
                                  <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                  </button>
                                  <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === qs.length - 1} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button onClick={() => removeQuestion(qIndex)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                            </SortableQuestionItem>
                            )
                          }

                          return (
                            <div
                              key={question.id}
                              onClick={() => setSelectedQuestionIndex(isSelected ? null : qIndex)}
                              className={`bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer form-themed-card form-themed-spacing ${
                                isSelected
                                  ? 'border-blue-500 ring-2 ring-blue-100'
                                  : 'border-gray-100 hover:shadow-md'
                              } ${isSelected && theme?.primaryColor ? 'form-themed-primary-border' : ''}`}
                            >
                              <div className="flex items-start gap-3 cursor-pointer" onClick={() => setSelectedQuestionIndex(isSelected ? null : qIndex)}>
                                <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 form-themed-primary-bg">
                                  {qIndex + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-gray-900 form-themed-text">
                                    {question.text || 'سؤال جديد'}
                                    {question.required && <span className="text-red-500 mr-1">*</span>}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-blue-500 form-themed-primary-text">{typeInfo?.icon} {typeInfo?.label}</span>
                                    {!!(formData?.page_titles as any)?._is_test && question.points > 0 && <span className="text-xs text-gray-400">{question.points} نقطة</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => moveQuestion(qIndex, 'up')} disabled={qIndex === 0} className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded-lg hover:bg-gray-100">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                  </button>
                                  <button onClick={() => moveQuestion(qIndex, 'down')} disabled={qIndex === qs.length - 1} className="p-1.5 text-gray-300 hover:text-gray-600 disabled:opacity-20 rounded-lg hover:bg-gray-100">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                  </button>
                                  <button onClick={() => { removeQuestion(qIndex); if (isSelected) setSelectedQuestionIndex(null) }} className="p-1.5 text-red-300 hover:text-red-500 rounded-lg hover:bg-red-50">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              </div>
                              {isSelected && (

                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 cursor-default" onClick={(e) => e.stopPropagation()}>
                                  {/* Question Text */}
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1.5">نص السؤال</label>
                    {question.type === 'static_text' ? (
                      <RichTextEditor
                        value={question.text}
                        onChange={(html) => updateQuestion(qIndex, { text: html })}
                        placeholder="اكتب النص هنا..."
                      />
                    ) : ['terms'].includes(question.type) ? (
                      <textarea
                        value={question.text}
                        onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                        rows={4}
                        placeholder="اكتب النص هنا..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                                      <input type="text" value={question.text} onChange={(e) => updateQuestion(qIndex, { text: e.target.value })} placeholder="اكتب السؤال هنا..." className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500" />
                                    )}
                                  </div>

                                  {/* Required & Points */}
                                  <div className="flex gap-4">
                                    <label className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg cursor-pointer flex-1">
                                      <input type="checkbox" checked={question.required} onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })} className="w-4 h-4 text-blue-600 rounded" />
                                      <span className="text-sm text-gray-700 font-medium">مطلوب</span>
                                    </label>
                                    {!!(formData?.page_titles as any)?._is_test && !['single_choice', 'multiple_choice', 'dropdown', 'ranking', 'matrix', 'button_choice', 'match_items', 'static_text', 'static_image', 'divider', 'terms', 'youtube', 'countdown_timer', 'products_block', 'payment_info_block'].includes(question.type) && (
                                      <div className="flex-1">
                                        <input type="number" min="0" value={question.points} onChange={(e) => updateQuestion(qIndex, { points: Number(e.target.value) })} placeholder="النقاط" className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                                      </div>
                                    )}
                                  </div>

                                  {/* Options */}
                                  {['single_choice', 'multiple_choice', 'button_choice'].includes(question.type) && (
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-600">الخيارات</label>
                                        {question.type === 'single_choice' && (
                                          <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                            <input type="checkbox" checked={question.has_counter || false} onChange={(e) => updateQuestion(qIndex, { has_counter: e.target.checked })} className="w-3.5 h-3.5 text-emerald-600 rounded" />
                                            <span className="text-gray-600">عداد</span>
                                          </label>
                                        )}
                                      </div>
                                      <div className="space-y-1.5">
                                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                                          <div key={oi} className="flex items-center gap-1.5">
                                            <input type="text" value={opt.text} onChange={(e) => updateOption(qIndex, oi, { text: e.target.value })} placeholder={`خيار ${oi + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                            <input type="number" min="0" value={opt.points} onChange={(e) => updateOption(qIndex, oi, { points: Number(e.target.value) })} className={`w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center ${!!(formData?.page_titles as any)?._is_test ? '' : 'hidden'}`} placeholder="نقاط" />
                                            {question.has_counter && (
                                              <input type="number" min="1" value={opt.counter_target || ''} onChange={(e) => updateOption(qIndex, oi, { counter_target: parseInt(e.target.value) || null })} className="w-14 px-2 py-1.5 border border-emerald-200 rounded-lg text-sm text-center" placeholder="هدف" />
                                            )}
                                            <button onClick={() => removeOption(qIndex, oi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          </div>
                                        ))}
                                      </div>
                                      <button onClick={() => addOption(qIndex)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة خيار
                                      </button>
                                    </div>
                                  )}

                                  {/* Dropdown Options */}
                                  {question.type === 'dropdown' && (
                                    <div>
                                      <select value={question.dropdown_type || 'single'} onChange={(e) => updateQuestion(qIndex, { dropdown_type: e.target.value as 'single' | 'multiple' })} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm mb-3">
                                        <option value="single">اختيار واحد</option>
                                        <option value="multiple">اختيار متعدد</option>
                                      </select>
                                      <textarea value={question.bulk_text || ''} onChange={(e) => updateQuestion(qIndex, { bulk_text: e.target.value })} rows={4} placeholder="اكتب كل خيار في سطر منفصل" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                                      <button onClick={() => parseBulkText(qIndex)} className="mt-1.5 w-full py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">تطبيق</button>
                                    </div>
                                  )}

                                  {/* Matrix Options */}
                                  {question.type === 'matrix' && (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الصفوف</label>
                                        <div className="space-y-1">
                                          {(question.matrix_rows || []).map((row: any, ri: number) => (
                                            <div key={ri} className="flex items-center gap-1">
                                              <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`صف ${ri + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <label className="flex items-center gap-1 text-xs shrink-0"><input type="checkbox" checked={row.required} onChange={(e) => updateMatrixRow(qIndex, ri, { required: e.target.checked })} className="w-3.5 h-3.5" /> مطلوب</label>
                                              <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixRow(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة صف</button>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">الأعمدة</label>
                                        <div className="space-y-1">
                                          {(question.matrix_columns || []).map((col: any, ci: number) => (
                                            <div key={ci} className="flex items-center gap-1">
                                              <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`عمود ${ci + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className={`w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center ${!!(formData?.page_titles as any)?._is_test ? '' : 'hidden'}`} placeholder="نقاط" />
                                              <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixColumn(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة عمود</button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'match_items' && (
                                    <div className="space-y-3">
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">العمود الأيمن (الخيارات)</label>
                                        <div className="space-y-1">
                                          {(question.matrix_rows || []).map((row: any, ri: number) => (
                                            <div key={ri} className="flex items-center gap-1">
                                              <input type="text" value={row.text} onChange={(e) => updateMatrixRow(qIndex, ri, { text: e.target.value })} placeholder={`عنصر ${ri + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <button onClick={() => removeMatrixRow(qIndex, ri)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixRow(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة عنصر</button>
                                      </div>
                                      <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1.5">العمود الأيسر (الإجابات)</label>
                                        <div className="space-y-1">
                                          {(question.matrix_columns || []).map((col: any, ci: number) => (
                                            <div key={ci} className="flex items-center gap-1">
                                              <input type="text" value={col.text} onChange={(e) => updateMatrixColumn(qIndex, ci, { text: e.target.value })} placeholder={`إجابة ${ci + 1}`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                              <input type="number" min="0" value={col.points} onChange={(e) => updateMatrixColumn(qIndex, ci, { points: Number(e.target.value) })} className={`w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center ${!!(formData?.page_titles as any)?._is_test ? '' : 'hidden'}`} placeholder="نقاط" />
                                              <button onClick={() => removeMatrixColumn(qIndex, ci)} className="p-1 text-red-400 hover:text-red-600"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                            </div>
                                          ))}
                                        </div>
                                        <button onClick={() => addMatrixColumn(qIndex)} className="mt-1 text-xs text-blue-600 hover:text-blue-700">+ إضافة إجابة</button>
                                      </div>
                                    </div>
                                  )}

                                  {question.type === 'slider' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">إعدادات الشريط الرقمي (Min|Max|Step)</label>
                                      <input type="text" value={(parseOptions(question.options)[0] || {}).text || '0|100|1'} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" dir="ltr" placeholder="0|100|1" />
                                      <p className="text-xs text-gray-500 mt-1">أدخل الحد الأدنى | الحد الأقصى | مقدار الزيادة</p>
                                    </div>
                                  )}

                                  {question.type === 'youtube' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">رابط يوتيوب</label>
                                      <input type="text" value={(parseOptions(question.options)[0] || {}).text || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { text: e.target.value }) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" dir="ltr" placeholder="https://youtube.com/watch?v=..." />
                                    </div>
                                  )}

                                  {question.type === 'countdown_timer' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">وقت انتهاء العرض</label>
                                      <input type="datetime-local" value={parseOptions(question.options)[0]?.text || ''} onChange={(e) => {
                                        if (parseOptions(question.options).length === 0) addOption(qIndex)
                                        updateOption(qIndex, 0, { text: e.target.value })
                                      }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                  )}

                                  {question.type === 'products_block' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">المنتجات</label>
                                      {(parseOptions(question.options) as any[]).map((prod: any, pi: number) => (
                                        <div key={pi} className="flex items-center gap-1.5 mb-1.5">
                                          <input type="text" value={prod.text || ''} onChange={(e) => updateOption(qIndex, pi, { text: e.target.value })} placeholder="اسم المنتج" className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                          <input type="number" min="0" value={prod.points || 0} onChange={(e) => updateOption(qIndex, pi, { points: Number(e.target.value) })} placeholder="السعر" className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center" />
                                          <button onClick={() => removeOption(qIndex, pi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                      ))}
                                      <button onClick={() => addOption(qIndex)} className="w-full mt-1 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة منتج
                                      </button>
                                    </div>
                                  )}

                                  {question.type === 'payment_info_block' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">طرق الدفع</label>
                                      {(parseOptions(question.options) as any[]).map((pm: any, pi: number) => (
                                        <div key={pi} className="flex items-center gap-1.5 mb-1.5">
                                          <select value={pm.validation_type || 'bank'} onChange={(e) => updateOption(qIndex, pi, { validation_type: e.target.value })} className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm">
                                            <option value="bank">بنكي</option>
                                            <option value="instapay">إنستاباي</option>
                                            <option value="vodafone">فودافون كاش</option>
                                          </select>
                                          <input type="text" value={pm.text || ''} onChange={(e) => updateOption(qIndex, pi, { text: e.target.value })} placeholder="الاسم" className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                          <input type="text" value={pm.validation_value || ''} onChange={(e) => updateOption(qIndex, pi, { validation_value: e.target.value })} placeholder="الرقم" className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                          <button onClick={() => removeOption(qIndex, pi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                        </div>
                                      ))}
                                      <button onClick={() => addOption(qIndex)} className="w-full mt-1 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة طريقة دفع
                                      </button>
                                    </div>
                                  )}

                                  {question.type === 'appointment' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">المواعيد المتاحة</label>
                                      <p className="text-xs text-gray-500 mb-2">أضف أوقاتاً متاحة لكل خيار (مثل: 09:00, 10:00, 11:00)</p>
                                      <div className="space-y-1.5">
                                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                                          <div key={oi} className="flex items-center gap-1.5">
                                            <input type="text" value={opt.text} onChange={(e) => updateOption(qIndex, oi, { text: e.target.value })} placeholder={`مثل: 09:00`} className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-sm" />
                                            <button onClick={() => removeOption(qIndex, oi)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          </div>
                                        ))}
                                      </div>
                                      <button onClick={() => addOption(qIndex)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-300 text-gray-500 rounded-lg hover:border-blue-400 hover:text-blue-600 transition-colors text-sm flex items-center justify-center gap-1">
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> إضافة وقت
                                      </button>
                                    </div>
                                  )}

                                  {question.type === 'star_rating' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">عدد النجوم</label>
                                      <input type="number" min="1" max="10" value={parseOptions(question.options).length} onChange={(e) => {
                                        const count = parseInt(e.target.value) || 5;
                                        updateQuestion(qIndex, { options: Array.from({ length: count }).map((_, i) => ({ id: `opt_${Date.now()}_${i}`, text: String(i+1), points: i+1 })) });
                                      }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
                                    </div>
                                  )}

                                  {question.type === 'static_image' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">رابط الصورة (URL)</label>
                                      <input type="text" value={(parseOptions(question.options)[0] || {}).validation_value || ''} onChange={(e) => { if(parseOptions(question.options).length===0) addOption(qIndex); updateOption(qIndex, 0, { validation_value: e.target.value }) }} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" dir="ltr" placeholder="https://..." />
                                      <p className="text-xs text-gray-500 mt-1">انسخ رابط الصورة وضعه هنا</p>
                                    </div>
                                  )}

                                  {/* Text validation options (short text only) */}
                                  {question.type === 'text' && (() => {
                                    const opts: any[] = parseOptions(question.options)
                                    const meta = opts[0] || {}
                                    const vt = meta.validation_type || ''
                                    const vcat = meta.validation_category || ''
                                    const firstOptions = [
                                      { value: 'name', label: 'اسم' },
                                      { value: 'email', label: 'ايميل' },
                                      { value: 'phone', label: 'رقم هاتف' },
                                      { value: 'number', label: 'رقم' },
                                      { value: 'plain', label: 'نص بدون تحقق' },
                                      { value: 'text_check', label: 'نص بتحقق' },
                                    ]
                                    const currentFirst = firstOptions.find(o => {
                                      if (vcat) return o.value === vcat
                                      if (!vt || vt === '') return o.value === 'plain'
                                      if (vt === 'name' || vt === 'email' || vt === 'phone' || vt === 'plain') return o.value === vt
                                      return o.value === 'plain'
                                    }) || firstOptions[0]
                  
                                    const secondOptions = (() => {
                                      if (currentFirst.value === 'name') return [
                                        { value: 'name_2', label: 'ثنائي' },
                                        { value: 'name_3', label: 'ثلاثي' },
                                        { value: 'name_4', label: 'رباعي' },
                                      ]
                                      if (currentFirst.value === 'number') return [
                                        { value: 'equal_to', label: 'يساوي' },
                                        { value: 'not_equal_to', label: 'لا يساوي' },
                                        { value: 'less_than', label: 'أقل من' },
                                        { value: 'less_than_or_equal', label: 'أقل من أو يساوي' },
                                        { value: 'greater_than', label: 'أكبر من' },
                                        { value: 'greater_than_or_equal', label: 'أكبر من أو يساوي' },
                                        { value: 'between', label: 'بين' },
                                        { value: 'not_between', label: 'ليس بين' },
                                        { value: 'whole_number', label: 'عدد صحيح' },
                                        { value: 'is_number', label: 'اعداد عشرية' },
                                      ]
                                      if (currentFirst.value === 'text_check') return [
                                        { value: 'equal_to', label: 'يساوي' },
                                        { value: 'not_equal_to', label: 'لا يساوي' },
                                        { value: 'contains_word', label: 'يحتوى على' },
                                        { value: 'does_not_contain', label: 'لا يحتوى على' },
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
                                      <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <p className="text-sm font-medium text-purple-700 mb-2">نوع التحقق من الإجابة:</p>
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
                                              <option value="">اختر...</option>
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
                                              placeholder="أدخل النص..."
                                              className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-40"
                                            />
                                          )}
                                          {(currentFirst.value === 'number' && (vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal')) && (
                                            <input
                                              type="number"
                                              step="any"
                                              value={meta.validation_value ?? ''}
                                              onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_value: e.target.value, validation_min: '', validation_max: '' }] as any })}
                                              placeholder="القيمة..."
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
                                                placeholder="الصغرى..."
                                                className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                                              />
                                              <input
                                                type="number"
                                                step="any"
                                                value={meta.validation_max ?? ''}
                                                onChange={(e) => updateQuestion(qIndex, { options: [{ validation_type: vt, validation_min: meta.validation_min || '', validation_max: e.target.value, validation_value: '' }] as any })}
                                                placeholder="العظمى..."
                                                className="px-3 py-1.5 bg-white border border-purple-200 rounded-lg text-sm focus:ring-1 focus:ring-purple-500 w-28"
                                              />
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })()}

                                  {/* Scale Options */}
                                  {question.type === 'scale' && (
                                    <div>
                                      <label className="block text-xs font-medium text-gray-600 mb-1.5">نقاط المقياس</label>
                                      <div className="grid grid-cols-5 gap-1.5">
                                        {(parseOptions(question.options) as any[]).map((opt: any, oi: number) => (
                                          <div key={oi} className="text-center">
                                            <div className="w-full py-1.5 bg-blue-600 text-white rounded-lg font-bold text-sm mb-1">{opt.text}</div>
                                            <input type="number" value={opt.points} onChange={(e) => { const idx = (Array.isArray(question.options) ? question.options : []).findIndex((o: any) => o.id === opt.id); if (idx >= 0) updateOption(qIndex, idx, { points: Number(e.target.value) }) }} className={`w-full px-1 py-1 border border-blue-200 rounded text-center text-sm ${!!(formData?.page_titles as any)?._is_test ? '' : 'hidden'}`} />
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                              )}
                            {/* Click-away handler */}
                            {questionMenuOpen && (
                              <div className="fixed inset-0 z-40" onClick={() => setQuestionMenuOpen(null)} />
                            )}
                            <div className="relative flex justify-center -mt-2 mb-1">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setQuestionMenuOpen(questionMenuOpen === question.id ? null : question.id) }}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                                  questionMenuOpen === question.id
                                    ? 'bg-blue-100 text-blue-600 shadow-sm'
                                    : 'bg-gray-50 border border-gray-200 text-gray-400 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-200'
                                }`}
                                title="إعدادات السؤال"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                              {questionMenuOpen === question.id && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[200px] z-50" onClick={(e) => e.stopPropagation()}>
                                  {/* Hide/Show */}
                                  <button onClick={() => { updateQuestion(qIndex, { hidden: !question.hidden }); setQuestionMenuOpen(null) }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      {question.hidden ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      )}
                                    </svg>
                                    {question.hidden ? 'إظهار' : 'إخفاء'}
                                  </button>
                                  <div className="h-px bg-gray-100 my-1" />
                                  {/* Move to start */}
                                  <button onClick={() => { moveToStart(qIndex); setQuestionMenuOpen(null) }} disabled={qIndex === 0} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right disabled:opacity-30">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                    نقل إلى البداية
                                  </button>
                                  {/* Move to end */}
                                  <button onClick={() => { moveToEnd(qIndex); setQuestionMenuOpen(null) }} disabled={qIndex === qs.length - 1} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right disabled:opacity-30">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                    نقل إلى النهاية
                                  </button>
                                  <div className="h-px bg-gray-100 my-1" />
                                  {/* Page */}
                                  <div className="px-4 py-2">
                                    <label className="flex items-center gap-2 text-sm text-gray-700">
                                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                      <span className="shrink-0">الصفحة</span>
                                      <select value={question.page || 1} onChange={(e) => { updateQuestion(qIndex, { page: parseInt(e.target.value) }); setQuestionMenuOpen(null) }} className="flex-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                                        {Array.from({ length: Math.max(1, ...formData.questions.map((q: any) => q.page || 1)) + 1 }, (_, i) => i + 1).map(p => (
                                          <option key={p} value={p}>{p}</option>
                                        ))}
                                      </select>
                                    </label>
                                  </div>
                                  <div className="h-px bg-gray-100 my-1" />
                                  {/* Next to previous */}
                                  {qIndex > 0 && formData.questions[qIndex - 1].page === (question.page || 1) && (
                                    <button onClick={() => {
                                      if (!question.row_group || formData.questions[qIndex - 1].row_group !== question.row_group) {
                                        const prevQ = formData.questions[qIndex - 1];
                                        const newGroupId = prevQ.row_group || Date.now();
                                        if (!prevQ.row_group) updateQuestion(qIndex - 1, { row_group: newGroupId });
                                        updateQuestion(qIndex, { row_group: newGroupId });
                                      } else {
                                        updateQuestion(qIndex, { row_group: null });
                                      }
                                      setQuestionMenuOpen(null)
                                    }} className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-right">
                                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                                      <span className={`${!!question.row_group && formData.questions[qIndex - 1].row_group === question.row_group ? 'text-blue-600 font-bold' : ''}`}>
                                        {!!question.row_group && formData.questions[qIndex - 1].row_group === question.row_group ? '✓ ' : ''}عرض بجوار السؤال السابق
                                      </span>
                                    </button>
                                  )}
                                  <div className="h-px bg-gray-100 my-1" />
                                  {/* Conditional Logic */}
                                  <div className="px-4 py-2">
                                    <div className="flex items-center justify-between mb-2">
                                      <label className="flex items-center gap-2 text-sm text-gray-700">
                                        <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        المنطق الشرطي
                                      </label>
                                      <button onClick={() => {
                                        const firstQ = (formData?.questions || []).find((q: any) => q.id !== question.id)
                                        if (firstQ) {
                                          updateQuestion(qIndex, { visibility_rules: [{ question_id: firstQ.id, operator: 'equals', value: '' }] })
                                        }
                                      }} className="text-xs text-indigo-600 hover:underline shrink-0">+ إضافة شرط</button>
                                    </div>
                                    {(question.visibility_rules || []).length > 0 ? (
                                      <div className="space-y-1.5 mt-1">
                                        {(question.visibility_rules || []).map((rule: any, ri: number) => (
                                          <div key={ri} className="flex items-center gap-1 text-xs">
                                            <span className="text-indigo-600 font-medium shrink-0">إذا</span>
                                            <select value={rule.question_id} onChange={(e) => { const r = [...(question.visibility_rules || [])]; r[ri] = { ...r[ri], question_id: e.target.value }; updateQuestion(qIndex, { visibility_rules: r }) }} className="flex-1 min-w-0 px-1.5 py-1 bg-white border border-indigo-200 rounded text-xs">
                                              {(formData?.questions || []).filter((q: any) => q.id !== question.id).map((q: any) => (
                                                <option key={q.id} value={q.id}>{q.text ? q.text.slice(0, 15) : 'سؤال'}</option>
                                              ))}
                                            </select>
                                            <select value={rule.operator || 'equals'} onChange={(e) => { const r = [...(question.visibility_rules || [])]; r[ri] = { ...r[ri], operator: e.target.value }; updateQuestion(qIndex, { visibility_rules: r }) }} className="px-1.5 py-1 bg-white border border-indigo-200 rounded text-xs">
                                              <option value="equals">=</option>
                                              <option value="not_equals">≠</option>
                                              <option value="contains">يحتوي</option>
                                            </select>
                                            <input type="text" value={rule.value || ''} onChange={(e) => { const r = [...(question.visibility_rules || [])]; r[ri] = { ...r[ri], value: e.target.value }; updateQuestion(qIndex, { visibility_rules: r }) }} placeholder="قيمة" className="w-14 px-1.5 py-1 bg-white border border-indigo-200 rounded text-xs" />
                                            <button onClick={() => { const r = (question.visibility_rules || []).filter((_: any, i: number) => i !== ri); updateQuestion(qIndex, { visibility_rules: r.length > 0 ? r : undefined }) }} className="p-0.5 text-red-400 hover:text-red-600"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-xs text-indigo-400 mt-0.5">بدون شروط — يظهر دائماً</p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            </div>
                          )
                        })}
                          </SortableContext>
                        </DndContext>
                        {/* Add question to this page */}
                        <div className="mt-4 pt-2 border-t border-dashed border-gray-200">
                          <p className="text-sm font-bold text-gray-700 mb-3">إضافة سؤال جديد:</p>
                          <div className="flex flex-wrap gap-2">
                            {(Object.entries(QUESTION_TYPES) as [QuestionType, typeof QUESTION_TYPES['text']][]).map(([type, info]) => (
                              <button
                                key={type}
                                onClick={() => { addQuestion(type); moveToPage(qs.length, pageNum) }}
                                className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                              >
                                <span className="text-blue-500 font-bold">{info.icon}</span> {info.label}
                              </button>
                            ))}
                            
                            <button
                              onClick={() => setShowQuestionPicker(true)}
                              className="px-3 py-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-sm hover:bg-emerald-100 transition-colors flex items-center gap-2 shadow-sm mr-auto"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
                              استيراد سؤال
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <button
                    onClick={addPage}
                    className="w-full py-2.5 border-2 border-dashed border-blue-200 text-blue-500 rounded-xl hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50 transition-all text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    إضافة صفحة جديدة
                  </button>
                </div>
              )
            })()}
          </main>
        )}

      {showQuestionPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQuestionPicker(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">استيراد سؤال من فورم سابقة</h3>
              <button onClick={() => setShowQuestionPicker(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
              {existingForms.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">لا توجد فورمز سابقة</p>
                </div>
              ) : (
                existingForms.map((form: any) => (
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

      {/* Form Designer Floating Button */}
      {!isPreviewActive && (
        <button
          onClick={() => setIsDesignerOpen(!isDesignerOpen)}
          className="fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer group flex items-center justify-center border-0"
          title="مصمم المظهر"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-out whitespace-nowrap mr-0 group-hover:mr-2 font-bold text-sm">
            مصمم المظهر
          </span>
        </button>
      )}

      {/* Sliding Designer Sidebar */}
      <div 
        dir="rtl"
        className={`fixed top-[73px] right-0 bottom-0 w-full sm:w-[420px] bg-white shadow-2xl z-30 transition-transform duration-300 ease-in-out border-l border-gray-100 flex flex-col ${
          isDesignerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-sm sm:text-base">مصمم النموذج</h3>
          </div>
          <button 
            onClick={() => setIsDesignerOpen(false)}
            className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer text-gray-400 hover:text-gray-700 border-0 bg-transparent"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-gray-100 bg-gray-50/50 p-1">
          {[
            { id: 'themes', label: 'الثيمات', icon: '🎨' },
            { id: 'colors', label: 'الألوان', icon: '✨' },
            { id: 'styles', label: 'الأنماط', icon: '📏' },
            { id: 'layout', label: 'التخطيط', icon: '🖼️' },
            { id: 'button', label: 'الزر', icon: '🔘' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDesignerTab(tab.id as any)}
              className={`flex-1 py-2 px-1 text-center font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer border-0 ${
                designerTab === tab.id
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-800 bg-transparent'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 scrollbar-thin">
          {designerTab === 'themes' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-medium">
                💡 اختر من القوالب الجاهزة لتغيير مظهر استبيانك بضغطة زر واحدة. يمكنك بعدها تخصيص الألوان والتفاصيل كما تحب.
              </div>
              <div className="grid grid-cols-2 gap-3">
                {PRESET_THEMES.map(preset => {
                  const isSelected = theme?.themeName === preset.name || (!theme?.themeName && preset.name === 'Default');
                  return (
                    <button
                      key={preset.name}
                      onClick={() => updateThemeSettings({ ...preset.settings, themeName: preset.name })}
                      className={`p-3 rounded-xl border text-right transition-all hover:scale-[1.02] flex flex-col justify-between h-28 cursor-pointer relative overflow-hidden ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-50 bg-blue-50/10' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      style={{ 
                        background: isSelected ? undefined : preset.settings.formBgColor === '#ffffff10' ? '#1e293b' : preset.settings.formBgColor 
                      }}
                    >
                      {/* Mini Preview Background */}
                      <div 
                        className="absolute inset-0 opacity-5 pointer-events-none" 
                        style={{ background: preset.settings.pageColor }}
                      />
                      
                      <div className="flex justify-between items-start w-full relative z-10">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white"
                          style={{ backgroundColor: preset.settings.primaryColor }}
                        />
                        {isSelected && (
                          <span className="text-blue-600 bg-blue-100 text-[10px] px-1.5 py-0.5 rounded font-bold">
                            نشط
                          </span>
                        )}
                      </div>

                      <div className="relative z-10 w-full col-span-2">
                        <h4 
                          className="font-bold text-sm truncate"
                          style={{ 
                            color: isSelected ? '#1e293b' : preset.settings.textColor === '#f3e8ff' || preset.settings.textColor === '#f8fafc' ? '#ffffff' : preset.settings.textColor 
                          }}
                        >
                          {preset.label}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">{preset.name}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {designerTab === 'colors' && (
            <div className="space-y-4">
              {/* Page Background */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">لون خلفية الصفحة</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme?.pageColor?.startsWith('#') ? theme.pageColor : '#f8fafc'} 
                    onChange={(e) => updateThemeSettings({ pageColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input 
                    type="text" 
                    value={theme?.pageColor || ''} 
                    onChange={(e) => updateThemeSettings({ pageColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#f8fafc أو gradient..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#f8fafc', '#f1f5f9', '#eff6ff', '#f5f3ff', '#fff7ed', '#0f172a', '#1e293b'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => updateThemeSettings({ pageColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Card Background */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">خلفية بطاقات الأسئلة</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme?.formBgColor?.startsWith('#') ? theme.formBgColor : '#ffffff'} 
                    onChange={(e) => updateThemeSettings({ formBgColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input 
                    type="text" 
                    value={theme?.formBgColor || ''} 
                    onChange={(e) => updateThemeSettings({ formBgColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#ffffff أو rgba..."
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#ffffff', '#f8fafc', '#f1f5f9', '#1e293b', '#0f172a', '#ffffff10', '#ffffff30'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => updateThemeSettings({ formBgColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Primary Theme Color */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">اللون الأساسي (الأزرار والتركيز)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme?.primaryColor || '#2563eb'} 
                    onChange={(e) => updateThemeSettings({ primaryColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input 
                    type="text" 
                    value={theme?.primaryColor || ''} 
                    onChange={(e) => updateThemeSettings({ primaryColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#2563eb"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#2563eb', '#7c3aed', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#e11d48'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => updateThemeSettings({ primaryColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Text Color */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">لون النصوص</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={theme?.textColor || '#1e293b'} 
                    onChange={(e) => updateThemeSettings({ textColor: e.target.value, themeName: 'Custom' })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200 p-0"
                  />
                  <input 
                    type="text" 
                    value={theme?.textColor || ''} 
                    onChange={(e) => updateThemeSettings({ textColor: e.target.value, themeName: 'Custom' })}
                    placeholder="#1e293b"
                    className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {['#0f172a', '#1e293b', '#475569', '#f8fafc', '#f3e8ff', '#ffe4e6'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => updateThemeSettings({ textColor: c, themeName: 'Custom' })}
                      className="w-6 h-6 rounded-full border border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {designerTab === 'styles' && (
            <div className="space-y-4">
              {/* Form Width */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-gray-700">عرض النموذج</label>
                  <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                    {theme?.formWidth || 768}px
                  </span>
                </div>
                <input 
                  type="range" 
                  min="600" 
                  max="1200" 
                  step="10"
                  value={theme?.formWidth || 768} 
                  onChange={(e) => updateThemeSettings({ formWidth: Number(e.target.value) })}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                  <span>ضيق (600px)</span>
                  <span>افتراضي (768px)</span>
                  <span>عريض (1200px)</span>
                </div>
              </div>

              {/* Spacing Selection */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">المسافات والتباعد</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'compact', label: 'مدمج / ضيق', desc: 'compact' },
                    { id: 'normal', label: 'طبيعي', desc: 'normal' },
                    { id: 'cozy', label: 'مريح / واسع', desc: 'cozy' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateThemeSettings({ spacing: item.id as any })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.spacing === item.id || (!theme?.spacing && item.id === 'normal')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Radius */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">انحناء الزوايا</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: '0px', label: 'حاد' },
                    { id: '8px', label: 'خفيف' },
                    { id: '16px', label: 'متوسط' },
                    { id: '28px', label: 'دائري' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateThemeSettings({ borderRadius: item.id })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.borderRadius === item.id || (!theme?.borderRadius && item.id === '16px')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                <label className="block text-sm font-bold text-gray-700">خط الاستبيان</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Cairo', label: 'خط القاهرة (Cairo)', family: "'Cairo', sans-serif" },
                    { id: 'Tajawal', label: 'خط تجول (Tajawal)', family: "'Tajawal', sans-serif" },
                    { id: 'Inter', label: 'Inter (إنجليزي)', family: "'Inter', sans-serif" },
                    { id: 'Outfit', label: 'Outfit (إنجليزي)', family: "'Outfit', sans-serif" },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateThemeSettings({ fontFamily: item.id })}
                      className={`p-3 text-center border rounded-lg transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                        theme?.fontFamily === item.id || (!theme?.fontFamily && item.id === 'Cairo')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                      style={{ fontFamily: item.family }}
                    >
                      <span className="text-sm font-bold">{item.label}</span>
                      <span className="text-xs opacity-85">أبجد هوز 123</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {designerTab === 'button' && (
            <div className="space-y-5">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5 text-xs text-blue-700 font-medium">
                🔘 تخصيص شكل ونص زر الإرسال في الفورم
              </div>

              {/* Button Text */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">نص الزر</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {['إرسال', 'تسجيل', 'حجز', 'تأكيد الطلب', 'Submission'].map(t => {
                    const currentText = (formData?.page_titles as any)?._submit_button?.text
                    return (
                      <button key={t} type="button" onClick={() => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _submit_button: { ...((prev.page_titles as any)?._submit_button || {}), text: t } } }) : null)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                          currentText === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                        }`}
                      >{t}</button>
                    )
                  })}
                </div>
                <input type="text" value={(formData?.page_titles as any)?._submit_button?.text || ''} onChange={(e) => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _submit_button: { ...((prev.page_titles as any)?._submit_button || {}), text: e.target.value } } }) : null)}
                  placeholder="نص مخصص..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm" />
              </div>

              {/* Button Background Color */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">لون خلفية الزر</label>
                <div className="flex gap-2 items-center">
                  {['#059669', '#2563eb', '#dc2626', '#7c3aed', '#d97706', '#0891b2'].map(c => {
                    const currentColor = (formData?.page_titles as any)?._submit_button?.color || '#059669'
                    return <button key={c} type="button" onClick={() => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _submit_button: { ...((prev.page_titles as any)?._submit_button || {}), color: c } } }) : null)}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${currentColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                  })}
                  <input type="color" value={(formData?.page_titles as any)?._submit_button?.color || '#059669'}
                    onChange={(e) => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _submit_button: { ...((prev.page_titles as any)?._submit_button || {}), color: e.target.value } } }) : null)}
                    className="w-7 h-7 rounded cursor-pointer border border-gray-200" />
                </div>
              </div>

              {/* Button Text Color */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">لون نص الزر</label>
                <input type="color" value={(formData?.page_titles as any)?._submit_button?.textColor || '#ffffff'}
                  onChange={(e) => setFormData(prev => prev ? ({ ...prev, page_titles: { ...prev.page_titles, _submit_button: { ...((prev.page_titles as any)?._submit_button || {}), textColor: e.target.value } } }) : null)}
                  className="w-10 h-10 rounded cursor-pointer border border-gray-200" />
              </div>

              {/* Live Preview */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">معاينة حية</label>
                <div className="bg-gradient-to-br from-slate-50 to-gray-100 rounded-xl p-6 border border-gray-200 flex items-center justify-center">
                  <button
                    className="px-8 py-3.5 rounded-2xl font-bold text-sm shadow-lg transition-all"
                    style={{
                      backgroundColor: (formData?.page_titles as any)?._submit_button?.color || '#059669',
                      color: (formData?.page_titles as any)?._submit_button?.textColor || '#ffffff',
                    }}
                  >
                    {(formData?.page_titles as any)?._submit_button?.text || 'إرسال'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {designerTab === 'layout' && (
            <div className="space-y-4">
              {/* Shadow Layout */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                <div>
                  <label className="block text-sm font-bold text-gray-700">تصميم مسطح بدون ظلال</label>
                  <p className="text-xs text-gray-400 mt-0.5">إلغاء تفعيل الظلال ثلاثية الأبعاد للبطاقات</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={theme?.flatLayout || false} 
                    onChange={(e) => updateThemeSettings({ flatLayout: e.target.checked })}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Border Style */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                <label className="block text-sm font-bold text-gray-700">شكل حدود البطاقات</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'none', label: 'بدون إطار' },
                    { id: 'solid', label: 'خط متصل' },
                    { id: 'dashed', label: 'خط متقطع' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => updateThemeSettings({ borderStyle: item.id as any })}
                      className={`py-2 px-1 text-center font-bold text-xs border rounded-lg transition-colors cursor-pointer ${
                        theme?.borderStyle === item.id || (!theme?.borderStyle && item.id === 'none')
                          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Border Width */}
              {theme?.borderStyle && theme.borderStyle !== 'none' && (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-gray-700">سمك الإطار</label>
                    <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">
                      {theme?.borderWidth || 1}px
                    </span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="5" 
                    step="1"
                    value={theme?.borderWidth || 1} 
                    onChange={(e) => updateThemeSettings({ borderWidth: Number(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>نحيف (1px)</span>
                    <span>سميك (5px)</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Reset */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('هل أنت متأكد من رغبتك في إعادة تعيين كافة التنسيقات للقالب الافتراضي؟')) {
                updateThemeSettings(PRESET_THEMES[0].settings);
              }
            }}
            className="text-xs text-red-600 hover:text-red-700 font-bold flex items-center gap-1.5 cursor-pointer bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors border-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            إعادة تعيين الافتراضي
          </button>
          <button
            onClick={() => setIsDesignerOpen(false)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-all shadow-sm cursor-pointer border-0"
           >
             تم وتطبيق التغييرات
           </button>
         </div>
      </div>

      {/* Convert to Template Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${showConvertToTemplate ? '' : 'hidden'}`}>
       <div className="bg-white rounded-2xl w-full max-w-md p-6">
         <div className="mb-6">
           <h2 className="text-2xl font-bold text-gray-900">تحويل النموذج إلى قالب</h2>
           <p className="text-gray-600">
             سيصبح هذا النموذج قالبًا يمكن للمستخدمين الآخرين استخدامه كنقطة بداية
           </p>
         </div>
         
         <div className="space-y-4">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">اسم القالب</label>
             <input
               type="text"
               value={templateTitle}
               onChange={(e) => setTemplateTitle(e.target.value)}
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               placeholder="أدخل اسم القالب"
               required
             />
           </div>
           
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-2">وصف القالب</label>
             <textarea
               value={templateDescription}
               onChange={(e) => setTemplateDescription(e.target.value)}
               className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
               rows={4}
               placeholder="صف briefly ما يحتويه هذا القالب"
               required
             />
           </div>
           
           <div className="flex justify-end space-x-3">
             <button
               onClick={() => setShowConvertToTemplate(false)}
               className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300"
             >
               إلغاء
             </button>
             <button
               onClick={async () => {
                 if (!templateTitle.trim()) {
                   alert('يرجى إدخال اسم القالب')
                   return
                 }
                 
                 setConvertToTemplateLoading(true)
                 
                 try {
                   const supabase = createClient()
                   
                   // First create the template record
                   const { data: templateData, error: templateError } = await supabase
                     .from('user_templates')
                     .insert({
                       title: templateTitle,
                       description: templateDescription,
                       user_id: profile?.id,
                       form_id: formData?.id,
                       approved: false // Requires admin approval
                     })
                     .select()
                     .single()
                     
                   if (templateError) throw templateError
                   
                   alert('تم إنشاء القالب بنجاح! سيظهر في القائمة بعد موافقة المشرف')
                   setShowConvertToTemplate(false)
                   setTemplateTitle('')
                   setTemplateDescription('')
                 } catch (error: any) {
                   console.error('Template creation error:', error)
                   alert(error.message || 'فشل إنشاء القالب')
                 } finally {
                   setConvertToTemplateLoading(false)
                 }
               }}
               disabled={convertToTemplateLoading}
               className={`px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50`}
             >
               {convertToTemplateLoading ? 'جاري الإنشاء...' : 'إنشاء القالب'}
             </button>
           </div>
         </div>
       </div>
      </div>
    </div>
  )
}

function SortableQuestionItem({
  id,
  children,
  className,
  onClick,
}: {
  id: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: 'relative' as const,
    zIndex: isDragging ? 10 : 'auto' as any,
  }

  return (
    <div ref={setNodeRef} style={style} className={className} onClick={onClick}>
      {children}
      <div
        {...attributes}
        {...listeners}
        className="absolute top-1 right-1 p-1 text-gray-300 hover:text-gray-500 hover:bg-gray-100 rounded-lg cursor-grab active:cursor-grabbing z-10"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm8-16a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4z" />
        </svg>
      </div>
    </div>
  )
}

export default function EditFormPage() {

  return (

    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div></div>}>

      <EditFormContent />

    </Suspense>

  )

}
