'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { PartnerIdea, PartnerLike, Referral, UserTemplate, PartnerProfile } from '@/types'
import { toast } from '@/lib/toast'

export default function AdminPartnersPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [partners, setPartners] = useState<PartnerProfile[]>([])
  const [ideas, setIdeas] = useState<PartnerIdea[]>([])
  const [templates, setTemplates] = useState<UserTemplate[]>([])
  const [nonPartners, setNonPartners] = useState<PartnerProfile[]>([])
  const [newIdeaText, setNewIdeaText] = useState('')
  const [newIdeaPartner, setNewIdeaPartner] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user: u } } = await supabase.auth.getUser()
    if (!u) { setLoading(false); return }
    setUser(u)
    const { data: p } = await supabase.from('profiles').select('*').eq('id', u.id).single()
    if (!p || p.role !== 'admin') { setLoading(false); return }
    setProfile(p)
    fetchData()
  }

  // Fetch data
  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const supabase = createClient()
    setLoading(true)
    const { data: partnersData } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, company, bio, facebook_url, linkedin_url, youtube_url, other_links, referral_code, referral_count, is_partner, created_at')
      .eq('is_partner', true)
      .order('referral_count', { ascending: false })
    if (partnersData) setPartners(partnersData as PartnerProfile[])

    // Fetch a small list of recent non-partners to allow "Make partner"
    const { data: nonPartnersData } = await supabase
      .from('profiles')
      .select('id, name, email, avatar_url, created_at')
      .neq('is_partner', true)
      .order('created_at', { ascending: false })
      .limit(12)
    if (nonPartnersData) setNonPartners(nonPartnersData as PartnerProfile[])

    const { data: ideasData } = await supabase
      .from('partner_ideas')
      .select('id, partner_id, text, implemented, created_at, profiles(name, avatar_url)')
      .order('created_at', { ascending: false })
    if (ideasData) setIdeas(ideasData as PartnerIdea[])

    const { data: templatesData } = await supabase
      .from('user_templates')
      .select('id, created_by, name, description, approved, created_at, profiles!created_by!inner(name, avatar_url), forms!form_id!inner(id, name)')
      .eq('approved', false)
      .order('created_at', { ascending: false })
    if (templatesData) setTemplates(templatesData as UserTemplate[])

    setLoading(false)
  }

  async function togglePartner(userId: string, currentStatus: boolean) {
    const supabase = createClient()
    const { error } = await supabase.from('profiles').update({ is_partner: !currentStatus }).eq('id', userId)
    if (!error) await fetchData(); else { toast('حدث خطأ أثناء تحديث الحالة'); console.error(error) }
  }

  async function addIdeaForPartner() {
    if (!newIdeaText.trim() || !newIdeaPartner) { toast('اختر الشريك واكتب الفكرة'); return }
    const supabase = createClient()
    const { error } = await supabase.from('partner_ideas').insert({ partner_id: newIdeaPartner, text: newIdeaText })
    if (error) { toast('حدث خطأ أثناء إضافة الفكرة'); console.error(error) } else {
      setNewIdeaText('')
      setNewIdeaPartner(null)
      await fetchData()
    }
  }

  async function approveIdea(ideaId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('partner_ideas').update({ implemented: true }).eq('id', ideaId)
    if (!error) await fetchData(); else { toast('حدث خطأ أثناء الموافقة على الفكرة'); console.error(error) }
  }

  async function approveTemplate(templateId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('user_templates').update({ approved: true }).eq('id', templateId)
    if (!error) await fetchData(); else { toast('حدث خطأ أثناء الموافقة على القالب'); console.error(error) }
  }

  if (loading) {
    return <div className="p-8">جاري التحميل...</div>
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">غير مصرح بالدخول</div>
  }

  if (!profile || profile.role !== 'admin') {
    return <div className="p-8 text-center text-red-500">ليس لديك صلاحية الوصول</div>
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">إدارة شركاء النجاح</h1>
            <Link href="/admin" className="px-4 py-2 bg-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-300">
              terug إلى لوحة التحكم
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 mb-8">
          <div className="lg:col-span-3">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">قائمة الشركاء</h2>
              </div>
              <div className="overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الصورة</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الاسم</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الشركة</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">عدد الإحالات</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الحالة</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {partners.map(partner => (
                      <tr key={partner.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="h-10 w-10 flex-shrink-0 relative">
                            {partner.avatar_url ? (
                              <Image 
                                src={partner.avatar_url} 
                                alt={partner.name} 
                                fill
                                className="rounded-full object-cover" 
                                loading="lazy"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                                {partner.name?.charAt(0) || '?'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{partner.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.company || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{partner.referral_count || 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            شريك
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => togglePartner(partner.id, partner.is_partner ?? false)}
                            className={`px-3 py-1 text-sm font-medium rounded border ${partner.is_partner ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
                          >
                            {partner.is_partner ? 'إزالة' : 'جعل شريك'}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {partners.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                          لا يوجد شركاء بعد
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="lg:col-span-1">
            <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-900">الأفكار والمقترحات</h2>
              </div>
              <div className="space-y-4 p-4">
                {ideas.map(idea => (
                  <div key={idea.id} className="border rounded-xl p-4 bg-gray-50">
                    <div className="flex items-start space-x-3">
                      <div className="h-10 w-10 flex-shrink-0 relative">
                        {idea.profiles?.[0]?.avatar_url ? (
                          <Image 
                            src={idea.profiles[0].avatar_url} 
                            alt={idea.profiles[0].name} 
                            fill
                            className="rounded-full object-cover" 
                            loading="lazy"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium">
                            {idea.profiles?.[0]?.name?.charAt(0) || '?'}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{idea.text}</h3>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${idea.implemented ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {idea.implemented ? 'منفذ' : 'قيد المراجعة'}
                          </span>
                          <button
                            onClick={() => approveIdea(idea.id)}
                            disabled={idea.implemented}
                            className={`ml-2 px-3 py-1 text-sm font-medium rounded border ${idea.implemented ? 'bg-gray-200 text-gray-400' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`}
                          >
                            {idea.implemented ? 'تم التنفيذ' : 'موافق'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ideas.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد أفكار جديدة
                  </div>
                )}
              </div>
            </section>
              <section className="bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">مستخدمون جدد (غير شركاء)</h2>
                </div>
                <div className="p-4 space-y-3">
                  {nonPartners.map(np => (
                    <div key={np.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm">{np.name?.charAt(0) || '?'}</div>
                        <div>
                          <div className="text-sm font-medium">{np.name}</div>
                          <div className="text-xs text-gray-400">{np.email}</div>
                        </div>
                      </div>
                      <button onClick={() => togglePartner(np.id, false)} className="px-3 py-1 bg-green-100 text-green-800 rounded-lg">جعل شريك</button>
                    </div>
                  ))}
                  {nonPartners.length === 0 && <div className="text-gray-400 text-sm">لا يوجد مستخدمين جدد</div>}
                </div>
              </section>
          </div>
        </div>

        <section className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">القوالب في انتظار الموافقة</h2>
          </div>
          <div className="space-y-4 p-4">
                <div className="mb-4 p-3 bg-white rounded-xl border">
                  <h4 className="text-sm font-medium mb-2">إضافة فكرة لشريك</h4>
                  <div className="flex gap-2">
                    <select value={newIdeaPartner || ''} onChange={(e) => setNewIdeaPartner(e.target.value)} className="flex-1 px-3 py-2 border rounded-lg">
                      <option value="">اختر الشريك</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      {nonPartners.map(p => <option key={p.id} value={p.id}>{p.name} (غير شريك)</option>)}
                    </select>
                    <button onClick={addIdeaForPartner} className="px-3 py-2 bg-blue-600 text-white rounded-lg">إضافة</button>
                  </div>
                  <textarea value={newIdeaText} onChange={(e) => setNewIdeaText(e.target.value)} placeholder="نص الفكرة..." className="mt-3 w-full px-3 py-2 border rounded-lg" />
                </div>
            {templates.map(template => (
              <div key={template.id} className="border rounded-xl p-4 bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="h-10 w-10 flex-shrink-0 relative">
                    {template.profiles?.[0]?.avatar_url ? (
                      <Image 
                        src={template.profiles[0].avatar_url} 
                        alt={template.profiles[0].name} 
                        fill
                        className="rounded-full object-cover" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 font-medium">
                        {template.profiles?.[0]?.name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{template.name}</h3>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">{template.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        القالب بناءً على النموذج: <span className="font-medium">{template.forms?.[0]?.name}</span>
                      </span>
                      <button
                        onClick={() => approveTemplate(template.id)}
                        className="px-3 py-1 text-sm font-medium rounded border bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        موافق
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                لا توجد قوالب في انتظار الموافقة
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}