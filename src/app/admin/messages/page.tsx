'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from '@/lib/toast'

const TYPE_MAP: Record<string, string> = { complaint: '📢 شكوى', suggestion: '💡 اقتراح', inquiry: '❓ استفسار' }
const STATUS_MAP: Record<string, string> = { unread: 'غير مقروء', read: 'مقروء', replied: 'تم الرد' }

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (!profile || profile.role !== 'admin') { router.push('/dashboard'); return }

      const { data } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
      setMessages(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('contact_messages').update({ status }).eq('id', id)
    if (error) { toast('فشل التحديث'); return }
    setMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    toast('تم التحديث', 'success')
  }

  const deleteMessage = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الرسالة؟')) return
    const { error } = await supabase.from('contact_messages').delete().eq('id', id)
    if (error) { toast('فشل الحذف'); return }
    setMessages(prev => prev.filter(m => m.id !== id))
    toast('تم الحذف', 'success')
  }

  const filtered = filter === 'unread' ? messages.filter(m => m.status === 'unread') : messages

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent" />
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">رسائل التواصل</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>الكل ({messages.length})</button>
            <button onClick={() => setFilter('unread')} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>غير المقروء ({messages.filter(m => m.status === 'unread').length})</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-lg font-medium">لا توجد رسائل</p>
          </div>
        ) : filtered.map(msg => (
          <div key={msg.id} className={`bg-white rounded-2xl p-5 border ${msg.status === 'unread' ? 'border-blue-200 shadow-md' : 'border-gray-100 shadow-sm'}`}>
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                <span className="text-lg">{TYPE_MAP[msg.type] || '❓'}</span>
                <div>
                  <p className="font-bold text-gray-900">{msg.name}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                    <span>{msg.email}</span>
                    {msg.phone && <><span>•</span><span dir="ltr">{msg.phone}</span></>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                  msg.status === 'unread' ? 'bg-blue-100 text-blue-700' :
                  msg.status === 'read' ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'
                }`}>{STATUS_MAP[msg.status]}</span>
                <span className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4">{msg.message}</p>
            <div className="flex items-center gap-2">
              {msg.status === 'unread' && (
                <button onClick={() => updateStatus(msg.id, 'read')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors">تعليم كمقروء</button>
              )}
              {msg.status !== 'replied' && (
                <button onClick={() => window.open(`mailto:${msg.email}`, '_blank')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors">الرد عبر البريد</button>
              )}
              <button onClick={() => deleteMessage(msg.id)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors">حذف</button>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
