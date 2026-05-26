import type { QuestionOption } from '@/types'
import type { ProductGroup } from '@/components/ProductGroupsEditor'
import type { PaymentMethod } from '@/components/PaymentMethodsEditor'
import { APPOINTMENT_META_ID } from '@/constants/questionTypes'
import type { Question, FormData } from './types'

export const parseOptions = (options: any): any[] => {
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

export const extractVisibilityRules = (options: any): any[] => {
  const raw = typeof options === 'string' ? (() => {
    try { return JSON.parse(options) } catch { return [] }
  })() : options
  if (Array.isArray(raw)) {
    return raw[raw.length - 1]?._visibility_rules || []
  }
  return raw?._visibility_rules || []
}

export const normalizeProductGroups = (value: any): ProductGroup[] => {
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
    name: 'المنتجات',
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

export const normalizePaymentMethods = (value: any): PaymentMethod[] => {
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

export const getAppointmentConfig = (options: any) => {
  const opts = parseOptions(options)
  const meta = opts.find((opt: any) => opt.id === APPOINTMENT_META_ID) || {}
  return {
    mode: meta.validation_type === 'custom' || meta.validation_type === 'auto' ? meta.validation_type : 'fixed',
    customBy: meta.validation_category === 'date' ? 'date' : 'weekday',
    single: meta.validation_value !== 'shared',
  }
}

export const getAppointmentSlots = (options: any) => {
  return parseOptions(options).filter((opt: any) => opt.id !== APPOINTMENT_META_ID)
}

export const setAppointmentOptions = (question: Question, configUpdates: any = {}, slots?: any[]) => {
  const currentConfig = { ...getAppointmentConfig(question.options), ...configUpdates }
  const currentSlots = slots ?? getAppointmentSlots(question.options)
  return {
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
  }
}

export const addAppointmentSlot = (question: Question) => {
  const config = getAppointmentConfig(question.options)
  const slots = getAppointmentSlots(question.options)
  return setAppointmentOptions(question, {}, [
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

export const updateAppointmentSlot = (question: Question, slotIndex: number, updates: any) => {
  const slots = getAppointmentSlots(question.options).map((slot: any, index: number) =>
    index === slotIndex ? { ...slot, ...updates } : slot
  )
  return setAppointmentOptions(question, {}, slots)
}

export const removeAppointmentSlot = (question: Question, slotIndex: number) => {
  return setAppointmentOptions(question, {}, getAppointmentSlots(question.options).filter((_: any, index: number) => index !== slotIndex))
}

export const getAvailabilitySettings = (formData: FormData) => {
  return (formData as any)._availability || {
    enabled: false,
    mode: 'weekly',
    weekly: [{ day: '0', start: '09:00', end: '17:00' }],
    starts_at: '',
    ends_at: '',
  }
}

export const updateAvailabilitySettings = (formData: FormData, updates: any): FormData => {
  const current = getAvailabilitySettings(formData)
  return { ...formData, _availability: { ...current, ...updates } } as FormData
}

export const updateWeeklyAvailability = (formData: FormData, index: number, updates: any): FormData => {
  const current = getAvailabilitySettings(formData)
  return {
    ...formData,
    _availability: {
      ...current,
      weekly: (current.weekly || []).map((slot: any, i: number) =>
        i === index ? { ...slot, ...updates } : slot
      )
    }
  } as FormData
}

export const addWeeklyAvailability = (formData: FormData): FormData => {
  const current = getAvailabilitySettings(formData)
  return {
    ...formData,
    _availability: {
      ...current,
      weekly: [...(current.weekly || []), { day: '0', start: '09:00', end: '17:00' }]
    }
  } as FormData
}

export const removeWeeklyAvailability = (formData: FormData, index: number): FormData => {
  const current = getAvailabilitySettings(formData)
  return {
    ...formData,
    _availability: {
      ...current,
      weekly: (current.weekly || []).filter((_: any, i: number) => i !== index)
    }
  } as FormData
}
