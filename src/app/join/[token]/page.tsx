'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

export default function JoinPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<'loading' | 'checking' | 'joining' | 'success' | 'error'>('loading')
  const [errorMsg, setErrorMsg] = useState('')
  const [projectName, setProjectName] = useState('')
  const token = params.token as string

  useEffect(() => {
    if (!token) return
    initJoin()
  }, [token])

  const initJoin = async () => {
    setStatus('checking')

    const { data: invite } = await supabase
      .from('project_invites')
      .select('*')
      .eq('token', token)
      .maybeSingle()

    if (!invite) {
      setStatus('error')
      setErrorMsg('رابط الدعوة غير صالح أو منتهي الصلاحية')
      return
    }

    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', invite.project_id)
      .single()

    setProjectName(project?.name || '')

    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      setStatus('error')
      setErrorMsg('انتهت صلاحية رابط الدعوة')
      return
    }

    if (invite.max_uses > 0 && invite.use_count >= invite.max_uses) {
      setStatus('error')
      setErrorMsg('تم استخدام رابط الدعوة لأقصى عدد مرات مسموح به')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push(`/register?invite=${token}`)
      return
    }

    setStatus('joining')

    try {
      const res = await fetch('/api/join-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, userId: user.id }),
      })
      const result = await res.json()

      if (result.success) {
        setStatus('success')
        setTimeout(() => router.push(`/projects/${result.project_id}`), 2000)
      } else {
        setStatus('error')
        const msgs: Record<string, string> = {
          invite_not_found: 'رابط الدعوة غير صالح',
          invite_expired: 'انتهت صلاحية رابط الدعوة',
          invite_max_uses: 'تم استخدام رابط الدعوة لأقصى عدد مرات',
          already_member: 'أنت عضو في هذا المشروع بالفعل',
        }
        setErrorMsg(msgs[result.error || ''] || result.error || 'حدث خطأ أثناء الانضمام للمشروع')
      }
    } catch {
      setStatus('error')
      setErrorMsg('حدث خطأ أثناء الانضمام للمشروع')
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {status === 'loading' || status === 'checking' || status === 'joining' ? (
            <div className="py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
              <p className="text-gray-600">
                {status === 'checking' ? 'جاري التحقق من رابط الدعوة...' : 'جاري الانضمام إلى المشروع...'}
              </p>
            </div>
          ) : status === 'success' ? (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">تم الانضمام بنجاح!</h2>
              <p className="text-gray-500 mb-4">تمت إضافتك إلى مشروع {projectName}</p>
              <p className="text-sm text-gray-400">جاري تحويلك إلى المشروع...</p>
            </div>
          ) : (
            <div className="py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">فشل الانضمام</h2>
              <p className="text-gray-500 mb-6">{errorMsg}</p>
              <Link
                href="/dashboard"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                العودة إلى الرئيسية
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
