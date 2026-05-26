import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { template_id, copied_by_id } = body
    if (!template_id || !copied_by_id) return NextResponse.json({ error: 'template_id and copied_by_id required' }, { status: 400 })

    const svc = createServiceClient()

    // Check if template is approved
    const { data: template } = await svc.from('user_templates').select('*').eq('id', template_id).single()
    if (!template) return NextResponse.json({ error: 'template not found' }, { status: 404 })
    if (!template.approved) return NextResponse.json({ ok: true, note: 'template not approved, no points' })

    // Check if copier has active paid subscription
    const { data: activeSub } = await svc.from('subscriptions')
      .select('id')
      .eq('user_id', copied_by_id)
      .eq('status', 'active')
      .gte('expires_at', new Date().toISOString())
      .limit(1)
      .maybeSingle()

    if (!activeSub) return NextResponse.json({ ok: true, note: 'copier has no active subscription, no points' })

    // Check unique constraint manually (for friendlier error)
    const { data: existing } = await svc.from('template_points')
      .select('id')
      .eq('template_id', template_id)
      .eq('copied_by_id', copied_by_id)
      .maybeSingle()

    if (existing) return NextResponse.json({ ok: true, note: 'already counted' })

    const points = 10
    const availableAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()

    const { error: ptErr } = await svc.from('template_points').insert({
      template_owner_id: template.created_by,
      template_id: template.id,
      copied_by_id,
      subscription_id: activeSub.id,
      points,
      status: 'pending',
      available_at: availableAt,
    })

    if (ptErr) {
      if (ptErr.message?.includes('unique') || ptErr.message?.includes('duplicate')) {
        return NextResponse.json({ ok: true, note: 'already counted' })
      }
      return NextResponse.json({ error: ptErr.message }, { status: 500 })
    }

    // Increment owner's pending points
    const { data: owner } = await svc.from('profiles').select('points_pending, total_points_earned').eq('id', template.created_by).single()
    if (owner) {
      await svc.from('profiles').update({
        points_pending: (owner.points_pending || 0) + points,
        total_points_earned: (owner.total_points_earned || 0) + points,
      }).eq('id', template.created_by)
    }

    // Increment template usage count
    await svc.from('user_templates').update({
      usage_count: (template.usage_count || 0) + 1,
    }).eq('id', template_id)

    return NextResponse.json({ ok: true, points, available_at: availableAt })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
