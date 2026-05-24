'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { PartnerProfile, PartnerIdea } from '@/types'
import Link from 'next/link'

export default function PartnersPage() {
  const [partners, setPartners] = useState<(PartnerProfile & { ideas?: PartnerIdea[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u)

    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_partner', true)
      .order('name')

    if (!profiles) { setLoading(false); return }

    const enriched: any[] = []

    for (const p of profiles) {
      // Ideas
      const { data: ideas } = await supabase
        .from('partner_ideas')
        .select('*')
        .eq('partner_id', p.id)
        .order('created_at', { ascending: false })

      // Likes count
      const { count: likesCount } = await supabase
        .from('partner_likes')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', p.id)

      // Liked by me
      let likedByMe = false
      if (u) {
        const { data: like } = await supabase
          .from('partner_likes')
          .select('id')
          .eq('partner_id', p.id)
          .eq('user_id', u.id)
          .maybeSingle()
        likedByMe = !!like
      }

      // Forms count
      const { count: formsCount } = await supabase
        .from('forms')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', p.id)

      // Templates count
      const { count: templatesCount } = await supabase
        .from('user_templates')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', p.id)

      // Total submissions on all forms
      const { data: formIds } = await supabase
        .from('forms')
        .select('id')
        .eq('created_by', p.id)

      let submissionsCount = 0
      if (formIds && formIds.length > 0) {
        const { count: sc } = await supabase
          .from('form_responses')
          .select('*', { count: 'exact', head: true })
          .in('form_id', formIds.map(f => f.id))
        submissionsCount = sc || 0
      }

      enriched.push({
        ...p,
        ideas: ideas || [],
        likes_count: likesCount || 0,
        liked_by_me: likedByMe,
        forms_count: formsCount || 0,
        templates_count: templatesCount || 0,
        submissions_count: submissionsCount
      })
    }

    setPartners(enriched)
    setLoading(false)
  }

  const toggleLike = async (partnerId: string) => {
    if (!user) return
    const { data: existing } = await supabase
      .from('partner_likes')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (existing) {
      await supabase.from('partner_likes').delete().eq('id', existing.id)
    } else {
      await supabase.from('partner_likes').insert({ partner_id: partnerId, user_id: user.id })
    }
    loadData()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-l from-indigo-600 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-3">🚀 شركاء النجاح</h1>
          <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
            نخبة من منشئي النماذج المتميزين الذين يساهمون في إثراء المنصة بأفكارهم وإبداعاتهم
          </p>
          <div className="flex items-center justify-center gap-2 mt-4 text-indigo-200 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            <span>{partners.length} شريك</span>
          </div>
        </div>
      </div>

      {/* Partners Grid */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {partners.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">لا يوجد شركاء حتى الآن</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {partners.map(partner => (
              <PartnerCard
                key={partner.id}
                partner={partner}
                userId={user?.id}
                    onLike={() => toggleLike(partner.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function PartnerCard({
  partner,
  userId,
  onLike
}: {
  partner: PartnerProfile & { ideas?: PartnerIdea[] }
  userId?: string
  onLike: (partnerId: string) => void
}) {
  // Build other links array from partner fields
  const otherLinks: { label: string; url: string }[] = []
  if (partner.facebook_url) otherLinks.push({ label: 'فيسبوك', url: partner.facebook_url })
  if (partner.linkedin_url) otherLinks.push({ label: 'لينكدإن', url: partner.linkedin_url })
  if (partner.youtube_url) otherLinks.push({ label: 'يوتيوب', url: partner.youtube_url })
  if (partner.other_links) {
    const parsed = typeof partner.other_links === 'string' ? JSON.parse(partner.other_links) : partner.other_links
    if (Array.isArray(parsed)) parsed.forEach((l: any) => otherLinks.push(l))
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300">
      {/* Card Header */}
      <div className="bg-gradient-to-l from-indigo-500 to-purple-600 p-5 text-center">
        <div className="w-20 h-20 mx-auto rounded-full border-4 border-white/50 overflow-hidden bg-white/20">
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt={partner.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
              {partner.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
        <h3 className="text-white font-bold text-lg mt-3">{partner.name}</h3>
        {partner.company && <p className="text-indigo-200 text-sm">{partner.company}</p>}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100">
        <StatBox label="نماذج" value={partner.forms_count || 0} />
        <StatBox label="قوالب" value={partner.templates_count || 0} />
        <StatBox label="إجابات" value={partner.submissions_count || 0} />
        <StatBox label="إحالات" value={partner.referral_count || 0} />
      </div>

      {/* Bio */}
      {partner.bio && (
        <div className="px-5 pt-4">
          <p className="text-gray-600 text-sm leading-relaxed">{partner.bio}</p>
        </div>
      )}

      {/* Social Links */}
      {otherLinks.length > 0 && (
        <div className="px-5 pt-3 flex flex-wrap gap-2">
          {otherLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      )}

      {/* Ideas */}
      {partner.ideas && partner.ideas.length > 0 && (
        <div className="px-5 pt-4 pb-2">
          <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1z" />
            </svg>
            الأفكار والمقترحات
          </h4>
          <div className="space-y-2">
            {partner.ideas.map(idea => (
              <div
                key={idea.id}
                className="flex items-start gap-2 p-2.5 rounded-xl bg-gray-50 border border-gray-100"
              >
                <span className={`mt-0.5 w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                  idea.implemented
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-300'
                }`}>
                  {idea.implemented && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-relaxed">{idea.text}</p>
                  <span className={`text-[10px] font-medium ${
                    idea.implemented ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    {idea.implemented ? '✓ تم التنفيذ' : '○ قيد الانتظار'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Like Button + Referral */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 mt-3">
        <button
          onClick={() => onLike(partner.id)}
          className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
            partner.liked_by_me
              ? 'text-red-500'
              : 'text-gray-400 hover:text-red-400'
          }`}
        >
          <svg className="w-5 h-5" fill={partner.liked_by_me ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          {partner.likes_count || 0}
        </button>

        {partner.referral_code && (
          <button
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/register?ref=${partner.referral_code}`
              )
              alert('تم نسخ رابط الإحالة!')
            }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
            </svg>
            رابط إحالة
          </button>
        )}
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="py-3 text-center">
      <p className="text-lg font-bold text-gray-800">{value.toLocaleString()}</p>
      <p className="text-[10px] text-gray-400">{label}</p>
    </div>
  )
}
