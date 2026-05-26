'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

/**
 * Hook: useFormAutoSave
 * Saves form answers to localStorage automatically on every change.
 * Returns saved answers on mount so the user can continue where they left off.
 */
export function useFormAutoSave(formId: string) {
  const storageKey = `openapp_form_draft_${formId}`

  // Load draft answers from localStorage on first render
  const loadDraft = useCallback((): Record<string, any> => {
    if (typeof window === 'undefined') return {}
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        return parsed?.answers || {}
      }
    } catch (e) {
      console.error('Error loading draft from localStorage:', e)
    }
    return {}
  }, [storageKey])

  // Save answers + timestamp to localStorage
  const saveDraft = useCallback((answers: Record<string, any>) => {
    if (typeof window === 'undefined') return
    if (Object.keys(answers).length === 0) return
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        answers,
        savedAt: new Date().toISOString()
      }))
    } catch (e) {
      console.error('Error saving draft to localStorage:', e)
    }
  }, [storageKey])

  // Get how long ago the draft was saved (returns human-readable string)
  const getDraftAge = useCallback((): string | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed?.savedAt) return null
      const diff = Date.now() - new Date(parsed.savedAt).getTime()
      const mins = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)
      if (days > 0) return `منذ ${days} يوم`
      if (hours > 0) return `منذ ${hours} ساعة`
      if (mins > 0) return `منذ ${mins} دقيقة`
      return 'منذ لحظات'
    } catch (e) {
      console.error('Error reading draft age from localStorage:', e)
      return null
    }
  }, [storageKey])

  // Clear the draft (after successful submit)
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(storageKey)
    } catch (e) {
      console.error('Error clearing draft from localStorage:', e)
    }
  }, [storageKey])

  const hasDraft = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    const draft = loadDraft()
    return Object.keys(draft).length > 0
  }, [loadDraft])

  return { loadDraft, saveDraft, getDraftAge, clearDraft, hasDraft }
}


/**
 * Hook: useConditionalRedirect
 * Evaluates redirect rules after form submission.
 * Rules are stored in form_settings.redirect_rules as an array:
 * [{ question_id, operator, value, redirect_url, message }, ...]
 * Falls back to default_redirect_url if no rule matches.
 */
export interface RedirectRule {
  question_id: string
  operator: 'equals' | 'contains' | 'not_equals'
  value: string
  redirect_url: string
  message?: string   // optional custom thank-you message
}

export function useConditionalRedirect() {
  const evaluate = useCallback((
    answers: Record<string, any>,
    rules: RedirectRule[],
    defaultUrl?: string
  ): { url: string | null; message: string | null } => {
    for (const rule of rules) {
      const answerRaw = answers[rule.question_id]
      // Normalize: could be string, array, object
      const answerStr = Array.isArray(answerRaw)
        ? answerRaw.join(',')
        : typeof answerRaw === 'object' && answerRaw !== null
        ? (answerRaw as any).option_id || JSON.stringify(answerRaw)
        : String(answerRaw ?? '')

      let matches = false
      switch (rule.operator) {
        case 'equals':
          matches = answerStr === rule.value
          break
        case 'not_equals':
          matches = answerStr !== rule.value
          break
        case 'contains':
          matches = answerStr.toLowerCase().includes(rule.value.toLowerCase())
          break
      }

      if (matches) {
        return { url: rule.redirect_url, message: rule.message || null }
      }
    }

    return { url: defaultUrl || null, message: null }
  }, [])

  return { evaluate }
}
