'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function RegisterForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [codeLoading, setCodeLoading] = useState(false)
  const [emailProvider, setEmailProvider] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('invite')
  const supabase = createClient()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  const validate = () => {
    if (!formData.name.trim()) {
      setError('يرجى إدخال الاسم الكامل')
      return false
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح')
      return false
    }
    if (!emailVerified) {
      setError('يرجى التحقق من البريد الإلكتروني أولاً')
      return false
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError('يرجى إدخال رقم هاتف صحيح')
      return false
    }
    if (formData.password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('كلمتا المرور غير متطابقتين')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validate()) return

    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          }
        }
      })

      if (signUpError) throw signUpError

       if (data.user) {
         // Handle referral code from search params
         const referralCode = searchParams.get('ref')
         
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: formData.email,
              name: formData.name,
              phone: formData.phone,
              role: 'volunteer',
              status: 'approved'
            })
           .eq('id', data.user.id)

         if (profileError) console.error('Profile update error:', profileError)

         // If referral code exists, call server API to record referral atomically
         if (referralCode) {
           try {
             await fetch('/api/referrals/complete', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ referralCode, referredId: data.user.id, referredEmail: formData.email })
             })
           } catch (err) {
             console.warn('Referral recording failed', err)
           }
         }

         await supabase.auth.signInWithPassword({
           email: formData.email,
           password: formData.password
         })

         router.push(inviteToken ? `/join/${inviteToken}` : '/dashboard')
       }
    } catch (error: any) {
      console.error('Registration error:', error)
      setError(error.message || 'حدث خطأ أثناء التسجيل')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-gradient-to-br from-blue-200/30 to-indigo-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-200/20 to-blue-200/30 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200/50">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            </div>
            <span className="font-bold text-xl text-gray-800">Forms<span className="text-blue-600">.OpenappO</span></span>
          </Link>
        </div>

        {/* Register Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
            <p className="text-gray-500 mt-1">ابدأ في إنشاء نماذج احترافية اليوم</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="محمد أحمد"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => {
                    handleChange(e)
                    setCodeSent(false)
                    setEmailVerified(false)
                    setVerificationCode('')
                    const domain = e.target.value.split('@')[1]?.toLowerCase()
                    if (domain === 'gmail.com') setEmailProvider('📧 Gmail')
                    else if (['outlook.com', 'hotmail.com', 'live.com'].includes(domain)) setEmailProvider('📧 Outlook/Hotmail')
                    else if (['icloud.com', 'me.com'].includes(domain)) setEmailProvider('📧 iCloud')
                    else if (['yahoo.com', 'ymail.com'].includes(domain)) setEmailProvider('📧 Yahoo')
                    else setEmailProvider('')
                  }}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="example@gmail.com"
                  required
                  disabled={emailVerified}
                />
                {emailProvider && !emailVerified && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm text-gray-600">{emailProvider}</span>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!formData.email.includes('@')) { setError('يرجى إدخال بريد إلكتروني صحيح'); return }
                        setCodeLoading(true)
                        setError('')
                        try {
                          const res = await fetch('/api/auth/send-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: formData.email })
                          })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error)
                          setCodeSent(true)
                        } catch (err: any) {
                          setError(err.message)
                        } finally {
                          setCodeLoading(false)
                        }
                      }}
                      disabled={codeLoading}
                      className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {codeLoading ? 'جاري الإرسال...' : 'إرسال كود التحقق'}
                    </button>
                  </div>
                )}
                {codeSent && !emailVerified && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl">
                    <p className="text-xs text-blue-700 mb-2">تم إرسال كود من 6 أرقام إلى بريدك. أدخله أدناه:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="flex-1 px-3 py-2 bg-white border border-blue-200 rounded-lg text-center text-lg font-bold tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="000000"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (verificationCode.length !== 6) { setError('يرجى إدخال الكود كاملاً'); return }
                          setCodeLoading(true)
                          setError('')
                          try {
                            const res = await fetch('/api/auth/verify-code', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ email: formData.email, code: verificationCode })
                            })
                            const data = await res.json()
                            if (!res.ok) throw new Error(data.error)
                            setEmailVerified(true)
                          } catch (err: any) {
                            setError(err.message)
                          } finally {
                            setCodeLoading(false)
                          }
                        }}
                        disabled={codeLoading || verificationCode.length !== 6}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {codeLoading ? '...' : 'تأكيد'}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setCodeLoading(true)
                        setError('')
                        try {
                          const res = await fetch('/api/auth/send-code', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ email: formData.email })
                          })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error)
                        } catch (err: any) {
                          setError(err.message)
                        } finally {
                          setCodeLoading(false)
                        }
                      }}
                      className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                      إعادة إرسال الكود
                    </button>
                  </div>
                )}
                {emailVerified && (
                  <div className="mt-2 flex items-center gap-1.5 text-green-700 text-sm">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    تم التحقق من البريد الإلكتروني
                  </div>
                )}
                {!emailProvider && !emailVerified && formData.email.includes('@') && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-xs text-amber-800 mb-2">
                      يرجى استخدام بريد إلكتروني حقيقي من Gmail, Outlook, iCloud, أو Yahoo. للتواصل والدعم:
                    </p>
                    <a
                      href="https://wa.me/201558282760"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                      تواصل معنا عبر واتساب
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">رقم الهاتف</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="01xxxxxxxxx"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="6 أحرف على الأقل"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">تأكيد كلمة المرور</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أعد إدخالها"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-l from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري إنشاء الحساب...
                </span>
              ) : (
                'إنشاء الحساب مجاناً'
              )}
            </button>

            <div className="text-center pt-2">
              <p className="text-gray-500 text-sm">
                لديك حساب بالفعل؟{' '}
                <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  سجل دخولك
                </Link>
              </p>
            </div>
          </form>
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">
          بالتسجيل أنت توافق على{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700">الشروط والأحكام</Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
