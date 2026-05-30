'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { useFormAutoSave, useConditionalRedirect, type RedirectRule } from '@/hooks/useFormFeatures'
import { parseOptions, parseMatrixData, normalizeProductGroups, normalizePaymentMethods, getVisibilityRules, getAvailabilityStatus, getAppointmentConfig, getAutoAppointment, type Question } from '@/lib/formFillerUtils'
import { calculateScore } from '@/lib/scoringUtils'
import FormFillerHeader from '@/components/FormFillerHeader'
import { FormClosedScreen, FormSubmittedScreen, RetryConfirmModal } from '@/components/FormFillerScreens'
import { FormProductsSection, FormOfferCountdownBanner } from '@/components/FormProductsSection'
import { FormPaymentInfo } from '@/components/FormPaymentInfo'
import FormNavigation from '@/components/FormNavigation'
import FormFillerDraftBanner from '@/components/FormFillerDraftBanner'
import FormFillerErrorAlert from '@/components/FormFillerErrorAlert'
import FormFillerQuestionGroup from '@/components/FormFillerQuestionGroup'

interface Form {
  id: string
  name: string
  description: string
  project_id: string
  created_by?: string
  allow_multiple: boolean
  time_limit?: number | null
  expires_at?: string | null
  allow_delete_responses?: boolean
  randomize_questions?: boolean
  redirect_rules?: RedirectRule[]
  default_redirect_url?: string
  enable_auto_save?: boolean
  page_titles?: Record<string, any>
}

interface Project {
  id: string
  name: string
  color: string
}

interface FormFillerProps {
  form: Form
  questions: Question[]
  existingResponse: any
  allUserResponses: any[]
  project: Project | null
  userId: string | null
  isPreview?: boolean
}

function getRespondentId(): string {
  const key = 'jotform_respondent_id'
  try {
    let id = localStorage.getItem(key)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(key, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const getThemeSettings = (form: any) => {
  const ts = form?.page_titles?.theme_settings
  if (!ts) return null
  if (typeof ts === 'string') {
    try { return JSON.parse(ts) } catch { return null }
  }
  return ts
}

export default function FormFiller({ form, questions, existingResponse: propExistingResponse, allUserResponses: propAllUserResponses, project, userId, isPreview = false }: FormFillerProps) {
  const theme = getThemeSettings(form)
  const [answers, setAnswers] = useState<Record<string, any>>({})

  const renderThemeStyles = () => {
    if (!theme) return null
    return (
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=Outfit:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700;800&display=swap');
        
        .form-themed-container {
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
        .form-themed-container input[type="text"],
        .form-themed-container input[type="email"],
        .form-themed-container input[type="tel"],
        .form-themed-container input[type="number"],
        .form-themed-container input[type="date"],
        .form-themed-container input[type="time"],
        .form-themed-container textarea,
        .form-themed-container select {
          ${theme.borderRadius ? `border-radius: calc(${theme.borderRadius} * 0.75) !important;` : ''}
        }
        .form-themed-container input[type="text"]:focus,
        .form-themed-container input[type="email"]:focus,
        .form-themed-container input[type="tel"]:focus,
        .form-themed-container input[type="number"]:focus,
        .form-themed-container input[type="date"]:focus,
        .form-themed-container input[type="time"]:focus,
        .form-themed-container textarea:focus,
        .form-themed-container select:focus {
          ${theme.primaryColor ? `border-color: ${theme.primaryColor} !important; --tw-ring-color: ${theme.primaryColor} !important; box-shadow: 0 0 0 2px ${theme.primaryColor}33 !important;` : ''}
        }
        .form-themed-container input[type="checkbox"],
        .form-themed-container input[type="radio"] {
          ${theme.primaryColor ? `color: ${theme.primaryColor} !important; --tw-ring-color: ${theme.primaryColor} !important;` : ''}
        }
      `}} />
    )
  }
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [showRetryConfirm, setShowRetryConfirm] = useState(false)
  const [deletingResponse, setDeletingResponse] = useState(false)
  const [dropdownSearch, setDropdownSearch] = useState<Record<string, string>>({})
  const [dropdownOpen, setDropdownOpen] = useState<Record<string, boolean>>({})
  const [existingResponse, setExistingResponse] = useState(propExistingResponse)
  const [allUserResponses, setAllUserResponses] = useState(propAllUserResponses)
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)
  const [draftDismissed, setDraftDismissed] = useState(false)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const [closedReason, setClosedReason] = useState('النموذج غير متاح الآن')

  // Appointment calendar state
  const [apptMonth, setApptMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const [bookedSlots, setBookedSlots] = useState<Record<string, Record<string, string[]>>>({})

  const router = useRouter()
  const supabase = createClient()

  const scrollToTop = () => {
    if (isPreview) {
      const container = document.getElementById('preview-device-content')
      if (container) {
        container.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Auto-Save & Conditional Redirect hooks
  const autoSave = useFormAutoSave(form.id)
  const { evaluate: evaluateRedirect } = useConditionalRedirect()

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [offerCountdown, setOfferCountdown] = useState<number>(-1);
  const [countdownNow, setCountdownNow] = useState<number>(() => Date.now());
  const [totalResponses, setTotalResponses] = useState<number>(0);
  const [cart, setCart] = useState<Record<string, number>>({});

  const legacyPaymentMethods = normalizePaymentMethods((form.page_titles as any)?._payment || [])
  const rawProducts: any = (form.page_titles as any)?._products || []
  const legacyProductGroups = normalizeProductGroups(rawProducts)
  const inlineProductGroups = (questions || [])
    .filter(q => q.type === 'products_block')
    .flatMap(q => normalizeProductGroups(q.options))
  const productGroups = inlineProductGroups.length > 0 ? inlineProductGroups : legacyProductGroups
  const allProducts = productGroups.flatMap(g => g.items)

  const cartTotal = Object.entries(cart).reduce((sum, [id, qty]) => {
    const prod = allProducts.find(p => p.id === id)
    return sum + (prod ? prod.price * qty : 0)
  }, 0)

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0)
  const [displayQuestions, setDisplayQuestions] = useState<Question[]>([]);
  const [isExpired, setIsExpired] = useState(false);

  // Extract visibility_rules from question (may be in q.visibility_rules or inside options._visibility_rules)
  // Uses imported getVisibilityRules from formFillerUtils

  // Conditional logic: compute visible questions based on visibility rules
  const visibleQuestions = useMemo(() => {
    return displayQuestions.filter(q => {
      const rules = getVisibilityRules(q)
      if (!rules || rules.length === 0) return true
      return rules.every(rule => {
        const triggerAnswer = answers[rule.question_id]
        if (triggerAnswer === undefined || triggerAnswer === null || triggerAnswer === '') return false
        const ansStr = String(
          typeof triggerAnswer === 'object' && triggerAnswer !== null
            ? (triggerAnswer as any).option_id || ''
            : triggerAnswer
        )
        switch (rule.operator) {
          case 'equals': return ansStr === rule.value
          case 'not_equals': return ansStr !== rule.value
          case 'contains': return ansStr.includes(rule.value)
          case 'greater_than': return Number(ansStr) > Number(rule.value)
          case 'less_than': return Number(ansStr) < Number(rule.value)
          default: return false
        }
      })
    })
  }, [displayQuestions, answers])

  const answerableQuestions = useMemo(() => {
    return visibleQuestions.filter(q => 
      !['static_text', 'static_image', 'divider', 'youtube', 'countdown_timer', 'payment_info_block'].includes(q.type)
    )
  }, [visibleQuestions])

  const answersCount = useMemo(() => {
    return answerableQuestions.filter(q => {
      const ans = answers[q.id]
      if (q.type === 'products_block') {
        return Object.values(cart).some(qty => qty > 0)
      }
      return ans !== undefined && ans !== null && ans !== '' && (!Array.isArray(ans) || ans.length > 0)
    }).length
  }, [answerableQuestions, answers, cart])

  // Multi-page computation (based on visible questions only)
  const pages = Array.from(new Set(visibleQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
  const totalPages = pages.length
  const pageQuestions = visibleQuestions.filter(q => (q.page || 1) === currentPage)
  const pageIndex = pages.indexOf(currentPage)
  const isFirstPage = pageIndex <= 0
  const isLastPage = pageIndex >= totalPages - 1

  useEffect(() => {
    const availabilityStatus = getAvailabilityStatus(form.page_titles || {}, isPreview)
    if (availabilityStatus.closed) {
      setClosedReason(availabilityStatus.reason)
      setIsExpired(true)
      return
    }

    // Check expiration
    if (form.expires_at) {
      if (new Date() > new Date(form.expires_at)) {
        setClosedReason('تم إغلاق النموذج')
        setIsExpired(true);
        return;
      }
    }

    setIsExpired(false)

    // Set Timer
    if (form.time_limit && !submitted) {
      setTimeLeft(form.time_limit * 60);
    }

    // Set Questions (randomized or normal)
    if (form.randomize_questions) {
      const shuffled = [...questions].sort(() => 0.5 - Math.random());
      setDisplayQuestions(shuffled);
    } else {
      setDisplayQuestions(questions);
    }

    // Load draft from localStorage if auto-save is enabled
    if (!isPreview && form.enable_auto_save !== false && autoSave.hasDraft()) {
      const draft = autoSave.loadDraft()
      if (Object.keys(draft).length > 0) {
        setAnswers(draft)
        setDraftRestored(true)
      }
    }
  }, [form, questions]);

  // For anonymous users: load existing responses by respondent_id
  useEffect(() => {
    if (isPreview || userId || existingResponse || form.allow_multiple) return

    const loadAnonymousResponses = async () => {
      setLoadingExisting(true)
      try {
        const rid = getRespondentId()
        const { data } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', form.id)
          .eq('respondent_id', rid)
          .order('submitted_at', { ascending: false })

        if (data && data.length > 0) {
          setExistingResponse(data[0])
          setAllUserResponses(data)
          if (!form.allow_multiple) {
            setSubmitted(true)
          }
        }
      } finally {
        setLoadingExisting(false)
      }
    }

    loadAnonymousResponses()
  }, [userId, form.id, form.allow_multiple])

  // Fetch existing appointment bookings for availability filtering
  useEffect(() => {
    const apptQuestions = displayQuestions.filter(q => q.type === 'appointment')
    if (apptQuestions.length === 0) return

    const fetchBookings = async () => {
      const { data } = await supabase
        .from('form_responses')
        .select('answers')
        .eq('form_id', form.id)

      if (data) {
        const slots: Record<string, Record<string, string[]>> = {}
        for (const row of data) {
          const answersObj = row.answers as Record<string, any> || {}
          for (const q of apptQuestions) {
            const ans = answersObj[q.id]
            if (ans?.date && ans?.time) {
              if (!slots[q.id]) slots[q.id] = {}
              if (!slots[q.id][ans.date]) slots[q.id][ans.date] = []
              if (!slots[q.id][ans.date].includes(ans.time)) {
                slots[q.id][ans.date].push(ans.time)
              }
            }
          }
        }
        setBookedSlots(slots)
      }
    }

    fetchBookings()
  }, [form.id, displayQuestions])

  useEffect(() => {
    if (timeLeft === null || submitted || isExpired) return;
    
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, submitted, isExpired]);

  // Offer countdown
  const offerEndStr = (form.page_titles as any)?._offer_countdown
  useEffect(() => {
    if (!offerEndStr || submitted) return
    const update = () => {
      const diff = Math.floor((new Date(offerEndStr).getTime() - Date.now()) / 1000)
      setOfferCountdown(diff > 0 ? diff : 0)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [offerEndStr, submitted])

  useEffect(() => {
    if (submitted || !questions?.some(q => q.type === 'countdown_timer')) return
    const interval = setInterval(() => setCountdownNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [questions, submitted])

  const goToNextPage = () => {
    const currentQs = displayQuestions.filter(q => (q.page || 1) === currentPage)
    for (const q of currentQs) {
      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          const rows = matrixData.matrix_rows || []
          const rowAnswers = answers[q.id] || {}
          for (const row of rows) {
            if (row.required) {
              const rowVal = rowAnswers[row.id]
              if (!rowVal || (Array.isArray(rowVal) && rowVal.length === 0)) {
                setError(`يرجى الإجابة على الصف "${row.text}" في السؤال: ${q.text}`)
                return
              }
            }
          }
        }
      } else if (q.required) {
        const answer = answers[q.id]
        if (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          setError(`يرجى الإجابة على السؤال: ${q.text}`)
          return
        }
      }
    }
    setError('')
    const pgs = Array.from(new Set(displayQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
    const idx = pgs.indexOf(currentPage)
    if (idx < pgs.length - 1) {
      setCurrentPage(pgs[idx + 1])
      scrollToTop()
    }
  }

  const goToPrevPage = () => {
    setError('')
    const pgs = Array.from(new Set(displayQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
    const idx = pgs.indexOf(currentPage)
    if (idx > 0) {
      setCurrentPage(pgs[idx - 1])
      scrollToTop()
    }
  }

  // Delete old response to allow re-submission
  const deleteOldResponse = async () => {
    if (!existingResponse?.id) return false
    
    setDeletingResponse(true)
    try {
      const { error } = await supabase
        .from('form_responses')
        .delete()
        .eq('id', existingResponse.id)
      
      if (error) throw error
      return true
    } catch (err) {
      console.error('Error deleting response:', err)
      return false
    } finally {
      setDeletingResponse(false)
    }
  }

  // Handle retry with confirmation
  const handleRetry = async () => {
    if (existingResponse?.id) {
      // Delete old response first
      const deleted = await deleteOldResponse()
      if (!deleted) {
        setError('فشل في حذف الإجابة السابقة')
        return
      }
    }
    setSubmitted(false)
    setAnswers({})
    setShowRetryConfirm(false)
  }

  // Uses imported getQuestionMaxScore and calculateScore from scoringUtils

  // Auto-save answers with debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (isPreview) return
    if (form.enable_auto_save === false) return
    if (Object.keys(answers).length === 0) return

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      autoSave.saveDraft(answers)
    }, 1000) // 1-second debounce

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [answers])

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')

    // Validate required questions (visible only)
    for (const q of visibleQuestions) {
      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          const rows = matrixData.matrix_rows || []
          const rowAnswers = answers[q.id] || {}
          for (const row of rows) {
            if (row.required) {
              const rowVal = rowAnswers[row.id]
              if (!rowVal || (Array.isArray(rowVal) && rowVal.length === 0)) {
                setError(`يرجى الإجابة على الصف "${row.text}" في السؤال: ${q.text}`)
                setSubmitting(false)
                return
              }
            }
          }
        }
      } else {
        if (q.type === 'products_block') {
          const inlineGroups = normalizeProductGroups(q.options)
          const groups = inlineGroups.length > 0 ? inlineGroups : legacyProductGroups
          const productIds = groups.flatMap(group => (group.items || []).map(item => item.id))
          const selectedCount = productIds.reduce((sum, id) => sum + (cart[id] || 0), 0)
          if (q.required && selectedCount === 0) {
            setError(`يرجى اختيار منتج واحد على الأقل من: ${q.text}`)
            setSubmitting(false)
            return
          }
          continue
        }

        if (q.type === 'payment_info_block' || q.type === 'countdown_timer') {
          continue
        }

        const answer = answers[q.id]
        if (q.type === 'date_range' && q.required) {
          const rangeAnswer = typeof answer === 'object' ? answer as any : {}
          if (!rangeAnswer.from || !rangeAnswer.to) {
            setError(`يرجى تحديد بداية ونهاية النطاق في السؤال: ${q.text}`)
            setSubmitting(false)
            return
          }
        }

        if (q.required && (answer === undefined || answer === null || answer === '' || 
            (Array.isArray(answer) && answer.length === 0))) {
          setError(`يرجى الإجابة على السؤال: ${q.text}`)
          setSubmitting(false)
          return
        }

        // Appointment: validate both date and time
        if (q.type === 'appointment') {
          const appt = typeof answer === 'object' ? answer as any : {}
          const apptConfig = getAppointmentConfig(q)
          if (apptConfig.mode === 'auto') {
            const latestAutoAppointment = getAutoAppointment(q, bookedSlots)
            if (!latestAutoAppointment || appt.date !== latestAutoAppointment.date || appt.time !== latestAutoAppointment.time) {
              setError(`تم تحديث الموعد المتاح في السؤال: ${q.text}. يرجى تأكيد الموعد المقترح مرة أخرى قبل الإرسال.`)
              setSubmitting(false); return
            }
          }
          if (!appt.date || !appt.time) {
            setError(`يرجى اختيار التاريخ والوقت في السؤال: ${q.text}`)
            setSubmitting(false); return
          }
        }

        // Text Validation
        if (q.type === 'text' && answer !== undefined && answer !== null && answer !== '') {
          const opts: any[] = parseOptions(q.options)
          const meta = opts[0] || {}
          const vcat = meta.validation_category || ''
          const vt = meta.validation_type || ''
          const val = String(answer).trim()
          const vValue = meta.validation_value || ''
          const vMin = meta.validation_min || ''
          const vMax = meta.validation_max || ''

          if (vcat === 'name' || vt === 'name') {
             const requiredWords = parseInt(vValue) || 2;
             const words = val.split(/\s+/).filter(w => w.length > 0);
             if (words.length < requiredWords) {
               setError(`⚠️ "${q.text}" يجب أن يتكون من ${requiredWords} كلمات على الأقل (اسم ${vValue === '2' ? 'ثنائي' : vValue === '3' ? 'ثلاثي' : 'رباعي'}). مثال: "محمد أحمد"`);
               setSubmitting(false); return;
             }
          } else if (vt === 'email') {
             if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
               setError(`📧 "${q.text}" يرجى إدخال بريد إلكتروني صحيح. مثال: user@example.com`);
               setSubmitting(false); return;
             }
          } else if (vt === 'phone') {
             if (!/^[0-9\+\-\(\)\s]{8,20}$/.test(val)) {
               setError(`📞 "${q.text}" يرجى إدخال رقم هاتف صحيح. مثال: 0512345678`);
               setSubmitting(false); return;
             }
          } else if (vcat === 'number' || vt === 'is_number' || vt === 'whole_number' || vt === 'equal_to' || vt === 'not_equal_to' || vt === 'less_than' || vt === 'less_than_or_equal' || vt === 'greater_than' || vt === 'greater_than_or_equal' || vt === 'between' || vt === 'not_between') {
             if (vcat === 'number' || ['whole_number','is_number','equal_to','not_equal_to','less_than','less_than_or_equal','greater_than','greater_than_or_equal','between','not_between'].includes(vt)) {
               const num = Number(val);
               if (isNaN(num)) {
                 setError(`🔢 "${q.text}" يرجى إدخال أرقام فقط (مثال: 25)`);
                 setSubmitting(false); return;
               }
               if (vt === 'whole_number' && !Number.isInteger(num)) {
                 setError(`🔢 "${q.text}" يرجى إدخال رقم صحيح بدون كسور عشرية. مثال: 25`);
                 setSubmitting(false); return;
               }
               const numTarget = Number(vValue);
               if (vt === 'equal_to' && num !== numTarget) { setError(`🔢 "${q.text}" يجب أن يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'not_equal_to' && num === numTarget) { setError(`🔢 "${q.text}" يجب ألا يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'less_than' && num >= numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أقل من ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'less_than_or_equal' && num > numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أقل من أو يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'greater_than' && num <= numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أكبر من ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'greater_than_or_equal' && num < numTarget) { setError(`🔢 "${q.text}" يجب أن يكون أكبر من أو يساوي ${numTarget}`); setSubmitting(false); return; }
               if (vt === 'between' && (num < Number(vMin) || num > Number(vMax))) { setError(`🔢 "${q.text}" يجب أن يكون بين ${vMin} و ${vMax}`); setSubmitting(false); return; }
               if (vt === 'not_between' && (num >= Number(vMin) && num <= Number(vMax))) { setError(`🔢 "${q.text}" يجب ألا يكون بين ${vMin} و ${vMax}`); setSubmitting(false); return; }
             }
          }
          if (vcat === 'text_check') {
             if (vt === 'contains_word' && !val.includes(vValue)) { setError(`📝 "${q.text}" يجب أن يحتوي على "${vValue}"`); setSubmitting(false); return; }
             if (vt === 'does_not_contain' && val.includes(vValue)) { setError(`📝 "${q.text}" يجب ألا يحتوي على "${vValue}"`); setSubmitting(false); return; }
             if (vt === 'equal_to' && val !== vValue) { setError(`📝 "${q.text}" يجب أن يطابق "${vValue}" بالكامل`); setSubmitting(false); return; }
             if (vt === 'not_equal_to' && val === vValue) { setError(`📝 "${q.text}" يجب ألا يطابق "${vValue}"`); setSubmitting(false); return; }
          }
        }
      }
    }

    const { score, maxScore } = calculateScore(visibleQuestions, answers)

    if (isPreview) {
      setTimeout(() => {
        setSubmitted(true)
        setSubmitting(false)
      }, 1000)
      return
    }

    try {
      // Inject cart into answers
      const finalAnswers = { ...answers, __cart: allProducts.length > 0 ? cart : {} }

      // Check user limits if authenticated
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('banned, submission_limit')
          .eq('id', userId)
          .single()

        if (profile?.banned) {
          setError('تم حظر حسابك. لا يمكنك إرسال الردود.')
          setSubmitting(false)
          return
        }

        if (profile?.submission_limit !== -1 && profile?.submission_limit !== null && profile?.submission_limit !== undefined) {
          const { count } = await supabase
            .from('form_responses')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
          if (count !== null && count >= profile.submission_limit) {
            setError(`لقد وصلت إلى الحد الأقصى لعدد الردود المسموح بها (${profile.submission_limit}).`)
            setSubmitting(false)
            return
          }
        }
      }

      // If allow_multiple is false and there's existing response, update it
      // Otherwise always insert a new response
      let insertedId = ''
      if (!form.allow_multiple && existingResponse) {
        const { error: updateError } = await supabase
          .from('form_responses')
          .update({
            score,
            max_score: maxScore,
            answers: finalAnswers,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existingResponse.id)

        if (updateError) throw updateError
        insertedId = existingResponse.id
      } else {
        // Insert new response (for allow_multiple=true or no existing response)
        const insertData: any = {
          form_id: form.id,
          score,
          max_score: maxScore,
          answers: finalAnswers
        }

        if (userId) {
          insertData.user_id = userId
        } else {
          insertData.respondent_id = getRespondentId()
        }

        const { data: insertResult, error: insertError } = await supabase
          .from('form_responses')
          .insert(insertData)
          .select('id')
          .single()

        if (insertError) throw insertError
        insertedId = insertResult?.id || ''
      }

      // Send notifications (in-app dashboard & email)
      if (form.created_by) {
        // 1. Dashboard notification
        await supabase
          .from('notifications')
          .insert({
            user_id: form.created_by,
            title: 'رد جديد على نموذجك',
            body: `تلقيت رداً جديداً على نموذج "${form.name}"`,
            type: 'response',
            link: `/admin/results?formId=${form.id}`,
            is_read: false
          })

        // 2. Email notification via API route
        fetch('/api/forms/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ formId: form.id, responseId: insertedId })
        }).catch(err => console.error('Error sending email notification:', err))
      }

      // Clear draft after successful submit
      autoSave.clearDraft()

      // Evaluate conditional redirect rules
      if (form.redirect_rules && form.redirect_rules.length > 0) {
        const { url, message } = evaluateRedirect(
          answers,
          form.redirect_rules,
          form.default_redirect_url
        )
        if (message) setRedirectMessage(message)
        if (url) {
          // Delay redirect briefly to let confetti / thank-you show
          setTimeout(() => { window.location.href = url }, 2500)
        }
      } else if (form.default_redirect_url) {
        setTimeout(() => { window.location.href = form.default_redirect_url! }, 2500)
      }

      // Fetch total response count for this form
      const { count: totalCount } = await supabase
        .from('form_responses')
        .select('id', { count: 'exact', head: true })
        .eq('form_id', form.id)
      if (totalCount !== null) setTotalResponses(totalCount)

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ الإجابات')
    } finally {
      setSubmitting(false)
    }
  }

  // Appointment calendar functions imported from formFillerUtils

  if (isExpired && !submitted) {
    return <FormClosedScreen form={form} isPreview={isPreview} closedReason={closedReason} />
  }

  if (submitted) {
    return (
      <FormSubmittedScreen
        form={form}
        visibleQuestions={visibleQuestions}
        answers={answers}
        isPreview={isPreview}
        totalResponses={totalResponses}
        allUserResponses={allUserResponses}
        redirectMessage={redirectMessage}
        project={project}
        onNewSubmission={() => {
          if (form.allow_multiple) {
            setSubmitted(false)
            setAnswers({})
            setShowRetryConfirm(false)
          } else {
            setShowRetryConfirm(true)
          }
        }}
      />
    )
  }

  if (showRetryConfirm) {
    return (
      <RetryConfirmModal
        form={form}
        isPreview={isPreview}
        deletingResponse={deletingResponse}
        onCancel={() => setShowRetryConfirm(false)}
        onConfirm={handleRetry}
      />
    )
  }

  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 form-themed-container`}>
      {renderThemeStyles()}
      <FormFillerHeader
        form={form}
        isPreview={isPreview}
        timeLeft={timeLeft}
        visibleQuestions={answerableQuestions}
        totalPages={totalPages}
        pageIndex={pageIndex}
        answersCount={answersCount}
        onBack={() => { if (!isPreview) router.back() }}
      />

      <main className="max-w-3xl mx-auto px-4 py-8 form-themed-width">
        <FormFillerDraftBanner
          draftRestored={draftRestored}
          draftDismissed={draftDismissed}
          autoSave={autoSave}
          onStartFresh={() => { setDraftDismissed(true); setAnswers({}); autoSave.clearDraft() }}
        />

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 form-themed-card">
          <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">{form.name}</h2>
          <p className="text-gray-500 text-sm form-themed-description">{form.description || 'أجب على الأسئلة التالية'}</p>
          {project && (
            <div className="mt-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: project.color }} />
              <span className="text-gray-400 text-xs">{project.name}</span>
            </div>
          )}
        </div>

        <FormProductsSection
          productGroups={productGroups}
          cart={cart}
          cartTotal={cartTotal}
          cartCount={cartCount}
          offerEndStr={offerEndStr}
          offerCountdown={offerCountdown}
          questions={questions}
          submitted={submitted}
          setCart={setCart}
        />

        <FormOfferCountdownBanner
          offerEndStr={offerEndStr}
          offerCountdown={offerCountdown}
          questions={questions}
          submitted={submitted}
        />

        <FormFillerErrorAlert error={error} />

        <FormFillerQuestionGroup
          pageQuestions={pageQuestions}
          answers={answers}
          setAnswers={setAnswers}
          setCurrentQuestionIndex={setCurrentQuestionIndex}
          dropdownSearch={dropdownSearch}
          setDropdownSearch={setDropdownSearch}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          countdownNow={countdownNow}
          cart={cart}
          setCart={setCart}
          cartTotal={cartTotal}
          cartCount={cartCount}
          form={form}
          legacyProductGroups={legacyProductGroups}
          legacyPaymentMethods={legacyPaymentMethods}
          bookedSlots={bookedSlots}
          apptMonth={apptMonth}
          setApptMonth={setApptMonth}
          allProducts={allProducts}
          submitting={submitting}
          submitted={submitted}
          isPreview={isPreview}
        />

        <FormPaymentInfo
          isLastPage={isLastPage}
          questions={questions}
          paymentMethods={legacyPaymentMethods}
        />

        <FormNavigation
          isFirstPage={isFirstPage}
          isLastPage={isLastPage}
          submitting={submitting}
          pages={pages}
          currentPage={currentPage}
          form={form}
          answersCount={answersCount}
          answers={answers}
          project={project}
          autoSave={autoSave}
          onPrev={goToPrevPage}
          onNext={goToNextPage}
          onSubmit={handleSubmit}
          onPageClick={(p) => { setCurrentPage(p); scrollToTop() }}
        />

        {displayQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500">لا توجد أسئلة في هذا النموذج حالياً</p>
          </div>
        )}
      </main>
    </div>
  )
}
