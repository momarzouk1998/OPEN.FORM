import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, plan_id, referred_by, admin_id } = body
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const svc = createServiceClient()

    const planPriceGross = 500
    const taxAmount = 61.40
    const planPriceNet = 438.60
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: sub, error: subErr } = await svc.from('subscriptions').insert({
      user_id,
      plan_id: plan_id || 'pro',
      plan_price_gross: planPriceGross,
      plan_price_net: planPriceNet,
      tax_amount: taxAmount,
      status: 'active',
      expires_at: expiresAt,
      referred_by: referred_by || null,
      renewal_count: 0,
    }).select().single()

    if (subErr) return NextResponse.json({ error: subErr.message }, { status: 500 })

    if (referred_by) {
      const grossCommission = planPriceNet * 0.20
      const taxDeducted = grossCommission * 0.14
      const netCommission = grossCommission - taxDeducted
      const roundedNet = Math.round(netCommission * 100) / 100
      const availableAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()

      const { error: commErr } = await svc.from('agent_commissions').insert({
        agent_id: referred_by,
        client_id: user_id,
        subscription_id: sub.id,
        renewal_number: 1,
        gross_commission: Math.round(grossCommission * 100) / 100,
        tax_deducted: Math.round(taxDeducted * 100) / 100,
        net_commission: roundedNet,
        status: 'pending',
        available_at: availableAt,
      })

      if (!commErr) {
        const { data: agent } = await svc.from('profiles').select('commission_pending, total_referrals, active_referrals').eq('id', referred_by).single()
        if (agent) {
          await svc.from('profiles').update({
            commission_pending: (agent.commission_pending || 0) + roundedNet,
            total_referrals: (agent.total_referrals || 0) + 1,
            active_referrals: (agent.active_referrals || 0) + 1,
          }).eq('id', referred_by)
        }
      }
    }

    await svc.from('admin_action_log').insert({
      admin_id: admin_id || user_id,
      action_type: 'subscription_create',
      target_id: sub.id,
      target_type: 'subscription',
      new_value: { user_id, plan_id, expires_at: expiresAt, referred_by },
    })

    return NextResponse.json({ ok: true, subscription: sub })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
