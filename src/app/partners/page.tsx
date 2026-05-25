'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import type { PartnerProfile, PartnerIdea } from '@/types'
import Link from 'next/link'
import PublicHeader from '@/components/PublicHeader'
import Image from 'next/image'
import { Globe, ExternalLink } from 'lucide-react'

const FacebookIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)
const LinkedinIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
)
const YoutubeIcon = (props: any) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
)

export default function PartnersPage() {
  const [partners, setPartners] = useState<(PartnerProfile & { 
    ideas?: PartnerIdea[]
    likes_count?: number
    liked_by_me?: boolean
    forms_count?: number
    templates_count?: number
    templates_preview?: any[]
    submissions_count?: number
  })[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user: u } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
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

      // Templates (approved) - fetch up to 6 for preview
      const { data: templatesList } = await supabase
        .from('user_templates')
        .select('*')
        .eq('created_by', p.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(6)

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
          .in('form_id', formIds.map((f: { id: string }) => f.id))
        submissionsCount = sc || 0
      }

      enriched.push({
        ...p,
        ideas: ideas || [],
        likes_count: likesCount || 0,
        liked_by_me: likedByMe,
        forms_count: formsCount || 0,
        templates_count: (templatesList || []).length || 0,
        templates_preview: templatesList || [],
        submissions_count: submissionsCount
      })
    }

    setPartners(enriched)
    setLoading(false)
  }

  const toggleLike = async (partnerId: string) => {
    if (!user) {
      // Visitor like: store in localStorage so the visitor can toggle likes
      try {
        const key = 'visitor_partner_likes'
        const raw = localStorage.getItem(key)
        const arr = raw ? JSON.parse(raw) : []
        const idx = arr.indexOf(partnerId)
        if (idx >= 0) {
          arr.splice(idx, 1)
        } else {
          arr.push(partnerId)
        }
        localStorage.setItem(key, JSON.stringify(arr))
        // Update UI by reloading data (will reflect visitor-like in counts)
        loadData()
      } catch (e) {
        console.warn('visitor like failed', e)
      }
      return
    }

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
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center pt-16">
        <PublicHeader />
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 pt-16">
      <PublicHeader />
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
  partner: PartnerProfile & { 
    ideas?: PartnerIdea[]
    likes_count?: number
    liked_by_me?: boolean
    forms_count?: number
    templates_count?: number
    templates_preview?: any[]
    submissions_count?: number
  }
  userId?: string
  onLike: (partnerId: string) => void
}) {
  // Separate social links from other links
  const socialLinks: { icon: any; url: string; color: string; label: string }[] = []
  if (partner.facebook_url) socialLinks.push({ icon: FacebookIcon, url: partner.facebook_url, color: 'hover:text-blue-600', label: 'فيسبوك' })
  if (partner.linkedin_url) socialLinks.push({ icon: LinkedinIcon, url: partner.linkedin_url, color: 'hover:text-blue-700', label: 'لينكدإن' })
  if (partner.youtube_url) socialLinks.push({ icon: YoutubeIcon, url: partner.youtube_url, color: 'hover:text-red-600', label: 'يوتيوب' })
  
  const otherLinks: { label: string; url: string }[] = []
  if (partner.other_links) {
    const parsed = typeof partner.other_links === 'string' ? JSON.parse(partner.other_links) : partner.other_links
    if (Array.isArray(parsed)) parsed.forEach((l: any) => otherLinks.push(l))
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all duration-300 flex flex-col h-full">
      {/* Card Header */}
      <div className="bg-gradient-to-l from-indigo-500 to-purple-600 p-5 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
        <div className="relative w-24 h-24 mx-auto mb-3">
          <div className="w-full h-full rounded-full border-4 border-white/50 overflow-hidden bg-white/20 shadow-inner">
            {partner.avatar_url ? (
              <Image 
                src={partner.avatar_url} 
                alt={partner.name} 
                width={96} 
                height={96} 
                className="w-full h-full object-cover"
                priority={false}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white text-3xl font-bold bg-indigo-400">
                {partner.name?.charAt(0) || '?'}
              </div>
            )}
          </div>
        </div>
        <h3 className="text-white font-bold text-xl mt-2 mb-1">{partner.name}</h3>
        {partner.company && <p className="text-indigo-100 text-sm font-medium">{partner.company}</p>}
      </div>

      {/* Social Icons - Now part of the header area for better visibility */}
      {socialLinks.length > 0 && (
        <div className="flex justify-center gap-4 py-3 bg-indigo-50/50 border-b border-gray-100">
          {socialLinks.map((link, i) => (
            <a
              key={i}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              title={link.label}
              className={`p-2 rounded-full bg-white shadow-sm text-gray-400 ${link.color} transition-all duration-200 hover:scale-110 active:scale-95`}
            >
              <link.icon className="w-5 h-5" />
            </a>
          ))}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-4 divide-x divide-gray-100 border-b border-gray-100 bg-white">
        <StatBox label="نماذج" value={partner.forms_count || 0} />
        <StatBox label="قوالب" value={partner.templates_count || 0} />
        <StatBox label="إجابات" value={partner.submissions_count || 0} />
        <StatBox label="إحالات" value={partner.referral_count || 0} />
      </div>

      <div className="flex-1">
        {/* Bio */}
        {partner.bio && (
          <div className="px-5 pt-4">
            <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 hover:line-clamp-none transition-all duration-300">{partner.bio}</p>
          </div>
        )}

        {/* Other Links */}
        {otherLinks.length > 0 && (
          <div className="px-5 pt-3 flex flex-wrap gap-2">
            {otherLinks.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] px-2.5 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-gray-100 flex items-center gap-1"
              >
                <Globe className="w-3 h-3" />
                {link.label}
              </a>
            ))}
          </div>
        )}

        {/* Ideas */}
        {partner.ideas && partner.ideas.length > 0 && (
          <div className="px-5 pt-4 pb-2">
            <h4 className="text-xs font-bold text-gray-800 mb-2 flex items-center gap-1.5">
              <span className="p-1 rounded bg-amber-100">
                <Globe className="w-3 h-3 text-amber-600" />
              </span>
              الأفكار والمقترحات
            </h4>
            <div className="space-y-2">
              {partner.ideas.slice(0, 2).map(idea => (
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
                    <p className="text-xs text-gray-700 leading-relaxed truncate">{idea.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Like Button + Referral */}
      <div className="px-5 py-4 flex items-center justify-between border-t border-gray-100 mt-auto">
        <VisitorLikeButton partner={partner} onLike={() => onLike(partner.id)} userId={userId} />

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
            <ExternalLink className="w-4 h-4" />
            رابط إحالة
          </button>
        )}
      </div>

      {/* Templates preview */}
      {partner.templates_preview && partner.templates_preview.length > 0 && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-3">
          <h4 className="text-xs font-bold text-gray-800 mb-2">قوالب المنشئ</h4>
          <div className="grid grid-cols-2 gap-2">
            {partner.templates_preview.slice(0, 4).map((t: any) => (
              <Link key={t.id} href={`/templates/${t.id}`} className="text-[10px] p-2 rounded-lg bg-gray-50 border border-gray-100 text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 truncate transition-all">
                {t.name}
              </Link>
            ))}
          </div>
        </div>
      )}
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

function VisitorLikeButton({ partner, onLike, userId }: any) {
  const isVisitor = !userId
  const [visitorLiked, setVisitorLiked] = useState(false)

  useEffect(() => {
    if (isVisitor) {
      try {
        const raw = localStorage.getItem('visitor_partner_likes')
        const arr = raw ? JSON.parse(raw) : []
        setVisitorLiked(arr.indexOf(partner.id) >= 0)
      } catch {
        setVisitorLiked(false)
      }
    }
  }, [partner.id, isVisitor])

  const displayCount = (partner.likes_count || 0) + (isVisitor && visitorLiked && !partner.liked_by_me ? 1 : 0)

  return (
    <button
      onClick={onLike}
      className={`flex items-center gap-1.5 text-sm font-medium transition-all ${
        (partner.liked_by_me || visitorLiked)
          ? 'text-red-500'
          : 'text-gray-400 hover:text-red-400'
      }`}
    >
      <svg className="w-5 h-5" fill={(partner.liked_by_me || visitorLiked) ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
      {displayCount}
    </button>
  )
}
