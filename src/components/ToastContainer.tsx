'use client'

import { useState, useEffect } from 'react'
import { subscribeToast, type Toast } from '@/lib/toast'

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsub = subscribeToast((t: Toast) => {
      setToasts(prev => [...prev, t])
      setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id))
      }, 4000)
    })
    return unsub
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 start-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all animate-slide-up flex items-center gap-2 ${
            t.type === 'success' ? 'bg-emerald-600 text-white' :
            t.type === 'error' ? 'bg-red-600 text-white' :
            'bg-blue-600 text-white'
          }`}
        >
          {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          {t.message}
        </div>
      ))}
    </div>
  )
}
