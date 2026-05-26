export interface ProductItem {
  id: string
  name: string
  description?: string
  price: number
  image_url?: string
  available?: boolean
}

export interface ProductGroup {
  id: string
  name: string
  items: ProductItem[]
}

export interface PaymentMethod {
  id?: string
  method: string
  label: string
  value: string
  details?: string
}

export interface VisibilityRule {
  question_id: string
  operator: string
  value: string
}

export interface Question {
  id: string
  text: string
  type: string
  required: boolean
  points: number
  has_counter?: boolean
  options: any
  order_index: number
  row_group?: number | null
  page?: number
  visibility_rules?: VisibilityRule[]
}

export function extractOptionsArray(options: any): any[] {
  let parsed = options
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return []
    }
  }
  if (!Array.isArray(parsed)) return []
  if (parsed.length > 0 && parsed[parsed.length - 1]?._visibility_rules !== undefined) {
    return parsed.slice(0, -1)
  }
  return parsed
}

export function normalizeProductGroups(value: any): ProductGroup[] {
  const items = extractOptionsArray(value)
  if (items.length === 0) return []
  if ('items' in items[0]) {
    return items.map((group: any) => ({
      id: group.id || `g_${Math.random().toString(36).slice(2, 8)}`,
      name: group.name || '',
      items: Array.isArray(group.items) ? group.items : []
    }))
  }
  return [{
    id: 'g_default',
    name: 'المنتجات',
    items: items.map((item: any) => ({
      id: item.id,
      name: item.name || item.text || '',
      description: item.description || '',
      price: Number(item.price ?? item.points ?? 0),
      image_url: item.image_url || item.validation_value || '',
      available: item.available !== false
    }))
  }]
}

export function normalizePaymentMethods(value: any): PaymentMethod[] {
  const items = extractOptionsArray(value)
  return items.map((method: any) => ({
    id: method.id,
    method: method.method || method.validation_type || 'bank',
    label: method.label || method.text || '',
    value: method.value || method.validation_value || '',
    details: method.details || method.validation_min || ''
  })).filter((method: PaymentMethod) => method.label || method.value || method.details)
}

export async function copyPaymentValue(value: string) {
  if (!value) return
  try {
    await navigator.clipboard.writeText(value)
  } catch {
    const textarea = document.createElement('textarea')
    textarea.value = value
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
  }
}

export function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatCountdown(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export function parseOptions(options: any) {
  if (!options) return []
  if (typeof options === 'string') {
    try {
      return JSON.parse(options)
    } catch {
      return options
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
  if (typeof options === 'object' && Object.keys(options).some(k => !isNaN(Number(k)))) {
    return Object.values(options).filter((v: any) => typeof v === 'object' && !Array.isArray(v) && v !== null) as any[]
  }
  return options as any
}

export function parseMatrixData(q: any) {
  const options = parseOptions(q.options)
  if (options.matrix_rows && options.matrix_columns) return options
  if (options.length > 0 && options[0].sub_options) {
    return {
      matrix_rows: options.map((r: any) => ({ id: r.id, text: r.text, required: false })),
      matrix_columns: options[0].sub_options
    }
  }
  return null
}

export const ARABIC_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
export const ARABIC_DAYS = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']

export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

export function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function formatArabicTime(time24: string) {
  const parts = time24.split(':')
  const h = parseInt(parts[0]) || 0
  const m = parts[1] || '00'
  if (h === 0) return `12:${m} صباحاً`
  if (h < 12) return `${h}:${m} صباحاً`
  if (h === 12) return `12:${m} مساءاً`
  return `${h - 12}:${m} مساءاً`
}

import { APPOINTMENT_META_ID } from '@/constants/questionTypes'

export function getAppointmentConfig(question: Question) {
  const opts = parseOptions(question.options)
  const meta = opts.find((opt: any) => opt.id === APPOINTMENT_META_ID) || {}
  return {
    mode: meta.validation_type === 'custom' || meta.validation_type === 'auto' ? meta.validation_type : 'fixed',
    customBy: meta.validation_category === 'date' ? 'date' : 'weekday',
    single: meta.validation_value !== 'shared',
  }
}

export function getAppointmentSlots(question: Question) {
  return parseOptions(question.options).filter((opt: any) => opt.id !== APPOINTMENT_META_ID && opt.text)
}

export function getBookedAppointmentCount(questionId: string, bookedSlots: any) {
  const qSlots = bookedSlots[questionId]
  if (!qSlots) return 0
  return Object.values(qSlots).reduce((sum: number, daySlots: any) => sum + daySlots.length, 0)
}

export function getAutoAppointment(question: Question, bookedSlots: any) {
  const slot = getAppointmentSlots(question)[0]
  const startValue = slot?.validation_value || ''
  const intervalMinutes = Math.max(1, Number(slot?.validation_min) || 30)
  if (!startValue) return null
  const start = new Date(startValue)
  if (Number.isNaN(start.getTime())) return null
  const next = new Date(start.getTime() + getBookedAppointmentCount(question.id, bookedSlots) * intervalMinutes * 60000)
  const date = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`
  const time = `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`
  return { date, time, intervalMinutes }
}

export function getTimeSlotsForDate(question: Question, dateStr: string) {
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

export function isDateFullyBooked(dateStr: string, questionId: string, timeSlots: string[], bookedSlots: any, singleAppointment = true) {
  if (!singleAppointment) return false
  const qSlots = bookedSlots[questionId]
  if (!qSlots || !qSlots[dateStr]) return false
  return timeSlots.every(slot => qSlots[dateStr].includes(slot))
}

export function getAvailableTimeSlots(dateStr: string, questionId: string, timeSlots: string[], bookedSlots: any, singleAppointment = true) {
  if (!singleAppointment) return timeSlots
  const qSlots = bookedSlots[questionId]
  if (!qSlots || !qSlots[dateStr]) return timeSlots
  return timeSlots.filter(slot => !qSlots[dateStr].includes(slot))
}

export function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()
}

export function getVisibilityRules(q: any): VisibilityRule[] | undefined {
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

export function getAvailabilityStatus(pageTitles: Record<string, any>, isPreview = false) {
  const availability = pageTitles?._availability
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
