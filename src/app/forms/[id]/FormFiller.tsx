'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useFormAutoSave, useConditionalRedirect, type RedirectRule } from '@/hooks/useFormFeatures'
import { DISPLAY_ONLY_QUESTION_TYPES, APPOINTMENT_META_ID } from '@/constants/questionTypes'
import { parseOptions, parseMatrixData, normalizeProductGroups, normalizePaymentMethods, formatCountdown, copyPaymentValue, type Question, type ProductGroup, type PaymentMethod, type VisibilityRule } from '@/lib/formFillerUtils'
import QuestionRenderer from '@/components/QuestionRenderer'

interface Form {
  id: string
  name: string
  description: string
  project_id: string
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
  // Get or generate a unique ID for anonymous users (stored in localStorage)
  const key = 'jotform_respondent_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
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

  const getAvailabilityStatus = () => {
    const availability = (form.page_titles as any)?._availability
    if (!availability?.enabled || isPreview) return { closed: false, reason: '' }

    const now = new Date()
    if (availability.mode === 'range') {
      const startsAt = availability.starts_at ? new Date(availability.starts_at) : null
      const endsAt = availability.ends_at ? new Date(availability.ends_at) : null
      if (startsAt && now < startsAt) return { closed: true, reason: 'النموذج لم يفتح بعد' }
      if (endsAt && now > endsAt) return { closed: true, reason: 'تم إغلاق النموذج' }
      return { closed: false, reason: '' }
    }

    const weekly = Array.isArray(availability.weekly) ? availability.weekly : []
    const today = String(now.getDay())
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const isOpen = weekly.some((slot: any) => {
      if (String(slot.day) !== today || !slot.start || !slot.end) return false
      const [startHour, startMinute] = String(slot.start).split(':').map(Number)
      const [endHour, endMinute] = String(slot.end).split(':').map(Number)
      const startMinutes = (startHour || 0) * 60 + (startMinute || 0)
      const endMinutes = (endHour || 0) * 60 + (endMinute || 0)
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes
    })

    return {
      closed: !isOpen,
      reason: 'النموذج مغلق الآن حسب جدول التشغيل'
    }
  }

  // Extract visibility_rules from question (may be in q.visibility_rules or inside options._visibility_rules)
  const getVisibilityRules = (q: any): VisibilityRule[] | undefined => {
    if (q.visibility_rules && q.visibility_rules.length > 0) return q.visibility_rules
    if (typeof q.options === 'string') {
      try {
        const opts = JSON.parse(q.options)
        if (opts && opts._visibility_rules && opts._visibility_rules.length > 0) return opts._visibility_rules
      } catch { return undefined }
    } else if (q.options && q.options._visibility_rules && q.options._visibility_rules.length > 0) {
      return q.options._visibility_rules
    }
    return undefined
  }

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

  // Multi-page computation (based on visible questions only)
  const pages = Array.from(new Set(visibleQuestions.map(q => q.page || 1))).sort((a, b) => a - b)
  const totalPages = pages.length
  const pageQuestions = visibleQuestions.filter(q => (q.page || 1) === currentPage)
  const pageIndex = pages.indexOf(currentPage)
  const isFirstPage = pageIndex <= 0
  const isLastPage = pageIndex >= totalPages - 1

  useEffect(() => {
    const availabilityStatus = getAvailabilityStatus()
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

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

  const getQuestionMaxScore = (q: Question): number => {
    const opts = parseOptions(q.options)

    switch (q.type) {
      case 'text':
      case 'textarea':
        return q.points || 0
      case 'single_choice':
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'multiple_choice':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'dropdown':
        if (opts.dropdown_type === 'multiple') {
          return ((opts.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
            const opt = (opts.options || []).find((o: any) => o.id === id)
            return sum + (opt?.points || 0)
          }, 0)
        }
        if (opts.correct_option_ids?.length) {
          const opt = (opts.options || []).find((o: any) => o.id === opts.correct_option_ids[0])
          return opt?.points || 0
        }
        return Math.max(0, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'scale':
        return Math.max(10, ...(Array.isArray(opts) ? opts : []).map((o: any) => o.points || 0))
      case 'ranking':
        return (Array.isArray(opts) ? opts : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      case 'matrix': {
        const md = parseMatrixData(q)
        if (md) {
          const colSum = (md.matrix_columns || []).reduce((s: number, c: any) => s + (c.points || 0), 0)
          return colSum * (md.matrix_rows || []).length
        }
        return 0
      }
      default:
        return 0
    }
  }

  const calculateScore = () => {
    let score = 0
    let maxScore = 0

    visibleQuestions.forEach((q) => {
      const answer = answers[q.id]
      const options = parseOptions(q.options)

      if (q.type === 'matrix') {
        const matrixData = parseMatrixData(q)
        if (matrixData) {
          maxScore += (matrixData.matrix_columns || []).reduce((sum: number, col: any) => sum + (col.points || 0), 0) * (matrixData.matrix_rows || []).length
          const rowAnswers = answer || {}
          Object.values(rowAnswers).forEach((val: any) => {
            if (Array.isArray(val)) {
              val.forEach((colId: string) => {
                const col = (matrixData.matrix_columns || []).find((c: any) => c.id === colId)
                if (col) score += col.points || 0
              })
            } else if (val) {
              const col = (matrixData.matrix_columns || []).find((c: any) => c.id === val)
              if (col) score += col.points || 0
            }
          })
        }
        return
      }

      // Compute maxScore (always, regardless of answer)
      if (q.type === 'text' || q.type === 'textarea') {
        maxScore += q.points || 0
      } else if (q.type === 'single_choice') {
        maxScore += Math.max(0, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
      } else if (q.type === 'multiple_choice') {
        maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      } else if (q.type === 'ranking') {
        maxScore += (Array.isArray(options) ? options : []).reduce((sum: number, o: any) => sum + (o.points || 0), 0)
      } else if (q.type === 'scale') {
        maxScore += Math.max(10, ...(Array.isArray(options) ? options : []).map((o: any) => o.points || 0))
      } else if (q.type === 'dropdown') {
        const dropOpts = options.options || options
        if (Array.isArray(dropOpts)) {
          if (options.dropdown_type === 'multiple') {
            maxScore += ((options.correct_option_ids || []) as string[]).reduce((sum: number, id: string) => {
              const opt = dropOpts.find((o: any) => o.id === id)
              return sum + (opt?.points || 0)
            }, 0)
          } else if (options.correct_option_ids?.length) {
            const opt = dropOpts.find((o: any) => o.id === options.correct_option_ids[0])
            maxScore += opt?.points || 0
          } else {
            maxScore += Math.max(0, ...dropOpts.map((o: any) => o.points || 0))
          }
        }
      }

      if (answer === undefined || answer === null || answer === '') return

      if (q.type === 'single_choice' && options.length > 0) {
          const optId = typeof answer === 'object' ? (answer as any).option_id : answer
          const mainOption = options.find((opt: any) => opt.id === optId)
          if (mainOption) {
            if (q.has_counter && mainOption.counter_target) {
              const count = typeof answer === 'object' ? ((answer as any).count || 0) : 0
              if (count >= mainOption.counter_target) {
                score += mainOption.points || 0
              }
            } else {
              score += mainOption.points || 0
            }
          }
        } else if (q.type === 'multiple_choice' && options.length > 0 && Array.isArray(answer)) {
          answer.forEach((selectedId: string) => {
            const mainOption = options.find((opt: any) => opt.id === selectedId)
            if (mainOption) {
              score += mainOption.points || 0
            }
          })
        
        } else if (q.type === 'dropdown' && options.dropdown_type === 'multiple' && Array.isArray(answer)) {
          const dropOpts = options.options || []
          answer.forEach((id: string) => {
            const opt = dropOpts.find((o: any) => o.id === id)
            if (opt && (options.correct_option_ids || []).includes(id)) {
              score += opt.points || 0
            }
          })
        } else if (q.type === 'ranking' && Array.isArray(answer) && Array.isArray(options)) {
          answer.forEach((optId: string, pos: number) => {
            const correctOptAtPos = options[pos]
            if (correctOptAtPos && optId === correctOptAtPos.id) {
              score += correctOptAtPos.points || 0
            }
          })
        } else if (q.type === 'scale') {
          score += parseFloat(String(answer)) || 0
        } else if (q.type === 'text' || q.type === 'textarea') {
          score += String(answer).trim() ? (q.points || 0) : 0
        }
      })

    return { score, maxScore }
  }

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
            const latestAutoAppointment = getAutoAppointment(q)
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

    const { score, maxScore } = calculateScore()

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

        const { error: insertError } = await supabase
          .from('form_responses')
          .insert(insertData)

        if (insertError) throw insertError
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

  // Appointment calendar utility functions
  function getAppointmentConfig(question: Question) {
    const opts = parseOptions(question.options)
    const meta = opts.find((opt: any) => opt.id === APPOINTMENT_META_ID) || {}
    return {
      mode: meta.validation_type === 'custom' || meta.validation_type === 'auto' ? meta.validation_type : 'fixed',
      customBy: meta.validation_category === 'date' ? 'date' : 'weekday',
      single: meta.validation_value !== 'shared',
    }
  }

  function getAppointmentSlots(question: Question) {
    return parseOptions(question.options).filter((opt: any) => opt.id !== APPOINTMENT_META_ID && opt.text)
  }

  function getBookedAppointmentCount(questionId: string) {
    const qSlots = bookedSlots[questionId]
    if (!qSlots) return 0
    return Object.values(qSlots).reduce((sum, daySlots) => sum + daySlots.length, 0)
  }

  function getAutoAppointment(question: Question) {
    const slot = getAppointmentSlots(question)[0]
    const startValue = slot?.validation_value || ''
    const intervalMinutes = Math.max(1, Number(slot?.validation_min) || 30)
    if (!startValue) return null

    const start = new Date(startValue)
    if (Number.isNaN(start.getTime())) return null

    const next = new Date(start.getTime() + getBookedAppointmentCount(question.id) * intervalMinutes * 60000)
    const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
    const time = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
    return { date, time, intervalMinutes }
  }

  function getTimeSlotsForDate(question: Question, dateStr: string) {
    const config = getAppointmentConfig(question)
    const slots = getAppointmentSlots(question)
    if (config.mode === 'fixed') return slots.map((slot: any) => slot.text)

    if (config.customBy === 'date') {
      return slots
        .filter((slot: any) => (slot.validation_category || 'date') === 'date' && slot.validation_value === dateStr)
        .map((slot: any) => slot.text)
    }

    const weekday = String(new Date(dateStr + 'T00:00:00').getDay())
    return slots
      .filter((slot: any) => (slot.validation_category || 'weekday') !== 'date' && String(slot.validation_value || '0') === weekday)
      .map((slot: any) => slot.text)
  }

  function isDateFullyBooked(dateStr: string, questionId: string, timeSlots: string[], singleAppointment = true) {
    if (!singleAppointment) return false
    const qSlots = bookedSlots[questionId]
    if (!qSlots || !qSlots[dateStr]) return false
    return timeSlots.every(slot => qSlots[dateStr].includes(slot))
  }

  function getAvailableTimeSlots(dateStr: string, questionId: string, timeSlots: string[], singleAppointment = true) {
    if (!singleAppointment) return timeSlots
    const qSlots = bookedSlots[questionId]
    if (!qSlots || !qSlots[dateStr]) return timeSlots
    return timeSlots.filter(slot => !qSlots[dateStr].includes(slot))
  }

  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
  }

  if (isExpired && !submitted) {
    return (
      <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
        {renderThemeStyles()}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full text-center form-themed-card">
          <div className="w-16 h-16 mx-auto mb-5 bg-red-50 rounded-2xl flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 form-themed-text">النموذج غير متاح الآن</h2>
          <p className="text-gray-500 text-sm form-themed-description">{closedReason}</p>
        </div>
      </div>
    )
  }

  if (submitted) {
    const { score, maxScore } = calculateScore()
    const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    const siteUrl = 'https://forms.openappo.com'

    return (
      <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
        {renderThemeStyles()}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full text-center form-themed-card">
          <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1 form-themed-text">تم إرسال طلبك بنجاح ✅</h2>
          {redirectMessage && <p className="text-gray-500 text-sm mb-4 form-themed-description">{redirectMessage}</p>}
          {form.default_redirect_url || (form.redirect_rules && form.redirect_rules.length > 0) ? (
            <p className="text-xs text-gray-400 mb-5 animate-pulse">سيتم توجيهك خلال لحظات...</p>
          ) : null}

          {!form.default_redirect_url && (!form.redirect_rules || form.redirect_rules.length === 0) && (
            <>
              {/* Total Responses Count */}
              <div className="bg-gradient-to-l from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 mb-5">
                <p className="text-gray-600 text-sm mb-1">
                  صاحب هذا النموذج استقبل
                </p>
                <p className="text-3xl font-bold text-blue-700 font-mono" dir="ltr">
                  {totalResponses.toLocaleString()}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  طلب حتى الآن باستخدام <span className="font-bold text-blue-600">{form.name}</span>
                </p>
              </div>

              {/* Score (only if form has scoring and is test mode) */}
              {!!(form.page_titles as any)?._is_test && maxScore > 0 && (
                <div className={`rounded-2xl p-4 mb-5 border ${
                  percentage >= 70 ? 'bg-emerald-50 border-emerald-100' : percentage >= 50 ? 'bg-amber-50 border-amber-100' : 'bg-red-50 border-red-100'
                }`}>
                  <p className="text-gray-500 text-sm mb-1">درجتك</p>
                  <p className={`text-3xl font-bold ${
                    percentage >= 70 ? 'text-emerald-600' : percentage >= 50 ? 'text-amber-600' : 'text-red-600'
                  }`}>
                    {percentage}%
                  </p>
                  <p className="text-gray-400 text-xs mt-1">{score} من {maxScore} نقطة</p>
                </div>
              )}

              {form.allow_multiple && allUserResponses && allUserResponses.length > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-5">
                  <p className="text-blue-700 text-sm">
                    هذا التسجيل رقم {allUserResponses.length} في هذا الفورم
                  </p>
                </div>
              )}

              <div className="flex gap-3 mb-4">
                <Link
                  href={project ? `/projects/${project.id}` : '/dashboard'}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors text-sm"
                >
                  العودة
                </Link>
                <button
                  onClick={() => {
                    if (form.allow_multiple) {
                      setSubmitted(false)
                      setAnswers({})
                      setShowRetryConfirm(false)
                    } else {
                      setShowRetryConfirm(true)
                    }
                  }}
                  className="flex-1 py-3 bg-gradient-to-l from-blue-600 to-indigo-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg shadow-blue-500/25 text-sm"
                >
                  {form.allow_multiple ? 'تسجيل جديد' : 'إعادة المحاولة'}
                </button>
              </div>

              {/* Create Your Own Form */}
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3.5 bg-gradient-to-l from-emerald-500 to-green-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg shadow-emerald-500/30 text-sm"
              >
                أنشئ نموذجك مجانًا 🚀
              </a>
            </>
          )}
        </div>
      </div>
    )
  }

  // Confirmation Modal for retry
  if (showRetryConfirm) {
    return (
      <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 form-themed-container`}>
        {renderThemeStyles()}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 max-w-md w-full form-themed-card">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">تأكيد إعادة المحاولة</h2>
            <p className="text-gray-500 form-themed-description">
              هل أنت متأكد من حذف إجابتك السابقة وإعادة المحاولة؟
            </p>
            <p className="text-red-500 text-sm mt-2">
              سيتم حذف درجتك السابقة ولا يمكن استرجاعها
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowRetryConfirm(false)}
              className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              disabled={deletingResponse}
            >
              إلغاء
            </button>
            <button
              onClick={handleRetry}
              className="flex-1 py-3.5 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 shadow-lg shadow-red-500/25"
              disabled={deletingResponse}
            >
              {deletingResponse ? 'جاري الحذف...' : 'نعم، احذف وأعد المحاولة'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className={`${isPreview ? 'min-h-full' : 'min-h-screen'} bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50/30 form-themed-container`}>
      {renderThemeStyles()}
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-gray-100/80 sticky top-0 z-10">
        {isPreview && (
          <div className="bg-orange-500 text-white text-xs py-1.5 text-center font-bold tracking-wide">
            وضع المعاينة: يمكنك تجربة تعبئة النموذج، لن يتم حفظ الإجابات
          </div>
        )}
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => {
              if (isPreview) return
              router.back()
            }}
            disabled={isPreview}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            رجوع
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <h1 className="text-sm font-bold text-gray-800">{form.name}</h1>
          </div>
          <div className="flex items-center gap-3">
            {timeLeft !== null && !submitted && !isExpired && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                timeLeft < 60 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {formatTime(timeLeft)}
              </span>
            )}
            <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
              {visibleQuestions.length} سؤال
            </span>
          </div>
        </div>
        
        {/* Page Info */}
        <div className="px-4 py-1.5 bg-white/50 border-b border-gray-100/80">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            {totalPages > 1 && (
              <span className="text-xs text-gray-500">
                صفحة {pageIndex + 1} من {totalPages}
              </span>
            )}
            <span className={`text-xs ${totalPages > 1 ? '' : 'mr-auto'} text-gray-400`}>
              {Object.keys(answers).filter(k => visibleQuestions.some(q => q.id === k)).length} / {visibleQuestions.length} إجابة
            </span>
          </div>
        </div>
        {/* Progress Bar */}
        <div className="h-1 bg-gray-50">
          <div 
            className="h-full bg-gradient-to-l from-blue-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ 
              width: `${(Object.keys(answers).filter(k => visibleQuestions.some(q => q.id === k)).length / (visibleQuestions.length || 1)) * 100}%` 
            }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 form-themed-width">
        {/* Draft Restored Banner */}
        {draftRestored && !draftDismissed && (
          <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                تم استعادة مسودتك المحفوظة ({autoSave.getDraftAge()}) — يمكنك المتابعة من حيث توقفت.
              </span>
            </div>
            <button
              onClick={() => { setDraftDismissed(true); setAnswers({}); autoSave.clearDraft() }}
              className="mr-3 text-amber-600 hover:text-amber-900 font-medium whitespace-nowrap"
            >
              بدء من جديد
            </button>
          </div>
        )}

        {/* Form Header */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 form-themed-card">
          <h2 className="text-xl font-bold text-gray-900 mb-2 form-themed-text">{form.name}</h2>
          <p className="text-gray-500 text-sm form-themed-description">{form.description || 'أجب على الأسئلة التالية'}</p>
          {project && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: project.color }}
              />
              <span className="text-gray-400 text-xs">{project.name}</span>
            </div>
          )}
        </div>

        {/* Products (only if no products_block question type) */}
        {!questions?.some(q => q.type === 'products_block') && productGroups.length > 0 && !submitted && (
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 form-themed-card">
            <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              {/* Offer Countdown inline */}
              {(() => {
                const endStr = offerEndStr
                const cd = offerCountdown
                if (endStr && cd > 0) {
                  return <span className="mr-auto text-sm font-mono text-red-500 tracking-wider" dir="ltr">{formatCountdown(cd)}</span>
                }
                return null
              })()}
            </h3>
            {productGroups.map(group => (
              <div key={group.id} className="mb-6 last:mb-0">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-0.5 flex-1 bg-gradient-to-l from-blue-100 to-transparent rounded-full" />
                  <h4 className="text-sm font-bold text-gray-700 px-2">{group.name}</h4>
                  <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-100 to-transparent rounded-full" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.filter(p => p.available !== false).map((prod) => {
                    const qty = cart[prod.id] || 0
                    return (
                      <div key={prod.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all">
                        {prod.image_url && (
                          <div className="h-36 bg-gray-50 overflow-hidden relative">
                            <Image 
                              src={prod.image_url} 
                              alt={prod.name} 
                              fill
                              className="object-cover"
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="p-3">
                          <h4 className="font-bold text-gray-900 text-sm">{prod.name}</h4>
                          {prod.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{prod.description}</p>}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-lg font-bold text-blue-700">{prod.price.toLocaleString()} <span className="text-xs font-normal">EGP</span></span>
                            {qty > 0 ? (
                              <div className="flex items-center gap-2">
                                <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: Math.max(0, qty - 1) }))} className="w-7 h-7 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-red-200">−</button>
                                <span className="text-sm font-bold w-5 text-center">{qty}</span>
                                <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: qty + 1 }))} className="w-7 h-7 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-blue-200">+</button>
                              </div>
                            ) : (
                              <button onClick={() => setCart(prev => ({ ...prev, [prod.id]: 1 }))} className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">إضافة</button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            {cartCount > 0 && (
              <div className="mt-4 p-3 bg-gradient-to-l from-blue-50 to-indigo-50 rounded-xl border border-blue-100 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">إجمالي الطلب</p>
                  <p className="text-xl font-bold text-blue-700">{cartTotal.toLocaleString()} <span className="text-sm font-normal">EGP</span></p>
                </div>
                <p className="text-xs text-gray-500">{cartCount} منتج{cartCount > 1 ? 'ات' : ''}</p>
              </div>
            )}
          </div>
        )}

        {/* Offer Countdown (only if no countdown_timer question type) */}
        {!questions?.some(q => q.type === 'countdown_timer') && offerEndStr && offerCountdown > 0 && !submitted && (
          <div className="bg-gradient-to-l from-red-500 to-orange-500 rounded-2xl p-4 mb-6 shadow-lg text-center">
            <p className="text-white/80 text-xs mb-1">العرض ينتهي خلال</p>
            <p className="text-white text-3xl font-mono font-bold tracking-widest" dir="ltr">
              {formatCountdown(offerCountdown)}
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Questions */}
        <div className="space-y-4">
          {(() => {
            const qs = pageQuestions
            const groups: { group: number | null; questions: Question[]; startIndex: number }[] = []
            let currentGroup: number | null = null
            let currentItems: Question[] = []

            qs.forEach((q) => {
              const g = q.row_group ?? null
              if (g !== currentGroup && currentItems.length > 0) {
                groups.push({ group: currentGroup, questions: [...currentItems], startIndex: groups.reduce((acc, g) => acc + g.questions.length, 0) })
                currentItems = []
              }
              currentGroup = g
              currentItems.push(q)
            })
            if (currentItems.length > 0) {
              groups.push({ group: currentGroup, questions: currentItems, startIndex: groups.reduce((acc, g) => acc + g.questions.length, 0) })
            }

            const renderCard = (question: Question, idx: number) => (
              <div className="flex items-start gap-3 mb-4">
                <span className="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-xs shrink-0 form-themed-primary-bg">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-gray-900 form-themed-text">
                    {question.text}
                    {question.required && !DISPLAY_ONLY_QUESTION_TYPES.includes(question.type) && <span className="text-red-500 mr-1">*</span>}
                  </h3>
                  {question.type !== 'file_upload' && (
                    <p className="text-blue-500 text-xs mt-1 font-medium form-themed-primary-text">
                      {getQuestionMaxScore(question)} نقطة
                    </p>
                  )}
                </div>
              </div>
            )

            return groups.map((grp) => {
              if (grp.group !== null && grp.questions.length > 1) {
                return (
                  <div key={`row_${grp.group}`} className="flex gap-4">
                    {grp.questions.map((question, gi) => {
                      const idx = grp.startIndex + gi
                      return (
                        <div key={question.id} className="flex-1 min-w-0 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 form-themed-card form-themed-spacing">
                          {renderCard(question, idx)}
                          <QuestionRenderer
                            question={question}
                            index={idx}
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
                            errors={{}}
                            submitting={submitting}
                            submitted={submitted}
                            isPreview={isPreview}
                          />
                        </div>
                      )
                    })}
                  </div>
                )
              }
              return grp.questions.map((question, gi) => {
                const idx = grp.startIndex + gi
                return (
                  <div key={question.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 transition-all hover:shadow-md form-themed-card form-themed-spacing">
                    {renderCard(question, idx)}
                    <QuestionRenderer
                      question={question}
                      index={idx}
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
                      errors={{}}
                      submitting={submitting}
                      submitted={submitted}
                      isPreview={isPreview}
                    />
                  </div>
                )
              })
            })
          })()}
        </div>

        {/* Payment Info Display (only if no payment_info_block question type) */}
        {isLastPage && !questions?.some(q => q.type === 'payment_info_block') && legacyPaymentMethods.length > 0 && (() => {
          const paymentMethods = legacyPaymentMethods
          if (!paymentMethods || paymentMethods.length === 0) return null
          return (
          <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              طرق الدفع المتاحة
            </h4>
            <div className="space-y-2">
              {paymentMethods.map((pm: any, pi: number) => {
                const icons: Record<string, string> = { bank: '🏦', instapay: '📱', vodafone: '📞', wallet: '💳', payment_link: '🔗', custom: '💰' }
                const methodNames: Record<string, string> = { bank: 'حساب بنكي', instapay: 'إنستاباي', vodafone: 'فودافون كاش', wallet: 'محفظة إلكترونية', payment_link: 'رابط دفع', custom: 'طريقة دفع' }
                return (
                  <div key={pi} className="bg-white rounded-xl px-4 py-3 border border-amber-100">
                    <div className="flex items-start gap-3">
                    <span className="text-xl">{icons[pm.method] || '💳'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">{methodNames[pm.method] || pm.method}</p>
                      {pm.label && <p className="text-xs text-gray-500">{pm.label}</p>}
                      {pm.value && <p className="text-sm font-mono font-bold text-amber-700 mt-0.5 break-all" dir="ltr">{pm.value}</p>}
                      {pm.details && <p className="text-xs text-gray-500 mt-1">{pm.details}</p>}
                    </div>
                    {pm.value && (
                      <button
                        onClick={() => copyPaymentValue(pm.value)}
                        className="px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors shrink-0"
                      >
                        نسخ
                      </button>
                    )}
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-amber-600 mt-2">يرجى تحويل المبلغ على أحد الطرق أعلاه بعد تقديم النموذج</p>
          </div>
          )
        })()}

        {/* Navigation & Submit */}
        {pageQuestions.length > 0 && (
          <div className="mt-6 space-y-3">
            <div className="flex gap-3">
              {!isFirstPage && (
                <button
                  onClick={goToPrevPage}
                  className="flex-1 py-3.5 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                >
                  السابق
                </button>
              )}
              {!isLastPage && (
                <button
                  onClick={goToNextPage}
                  className="flex-1 py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 form-themed-primary-bg"
                >
                  التالي
                </button>
              )}
              {isLastPage && (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-4 font-semibold rounded-2xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg form-themed-primary-bg"
                  style={{
                    background: (form.page_titles as any)?._submit_button?.color
                      ? (form.page_titles as any)._submit_button.color
                      : 'linear-gradient(to left, #059669, #16a34a)',
                    color: (form.page_titles as any)?._submit_button?.textColor || '#ffffff',
                  }}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : (
                    (form.page_titles as any)?._submit_button?.text || 'حفظ الإجابات'
                  )}
                </button>
              )}
            </div>
            {/* "أكمل لاحقاً" button — saves draft and redirects to dashboard */}
            {!isPreview && form.enable_auto_save !== false && Object.keys(answers).length > 0 && (
              <button
                onClick={() => {
                  autoSave.saveDraft(answers)
                  router.push(project ? `/projects/${project.id}` : '/dashboard')
                }}
                className="w-full py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-medium hover:bg-amber-100 transition-colors text-sm flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                أكمل لاحقاً
              </button>
            )}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-2">
                {pages.map(p => (
                  <button
                    key={p}
                    onClick={() => {
                      setCurrentPage(p)
                      scrollToTop()
                    }}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      p === currentPage
                        ? 'bg-blue-600 w-6 form-themed-primary-bg'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={`صفحة ${p}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
