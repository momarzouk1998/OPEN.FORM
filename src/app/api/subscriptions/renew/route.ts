import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subscription_id, admin_id } = body
    if (!subscription_id || !admin_id) return NextResponse.json({ error: 'subscription_id and admin_id required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: sub, error: subErr } = await svc.from('subscriptions').select('*').eq('id', subscription_id).single()
    if (subErr || !sub) return NextResponse.json({ error: 'subscription not found' }, { status: 404 })

    const oldExpiresAt = sub.expires_at
    const oldRenewalCount = sub.renewal_count
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    const newRenewalCount = (oldRenewalCount || 0) + 1

    const { error: updateErr } = await svc.from('subscriptions').update({
      expires_at: newExpiresAt,
      renewed_at: new Date().toISOString(),
      renewal_count: newRenewalCount,
      status: 'active',
    }).eq('id', subscription_id)

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

    // Create commission if referred
    if (sub.referred_by) {
      const commissionRate = newRenewalCount === 1 ? 0.20 : 0.10
      const grossCommission = (sub.plan_price_net || 438.60) * commissionRate
      const taxDeducted = grossCommission * 0.14
      const netCommission = grossCommission - taxDeducted
      const roundedNet = Math.round(netCommission * 100) / 100
      const availableAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString()

      const { error: commErr } = await svc.from('agent_commissions').insert({
        agent_id: sub.referred_by,
        client_id: sub.user_id,
        subscription_id: sub.id,
        renewal_number: newRenewalCount,
        gross_commission: Math.round(grossCommission * 100) / 100,
        tax_deducted: Math.round(taxDeducted * 100) / 100,
        net_commission: roundedNet,
        status: 'pending',
        available_at: availableAt,
      })

      if (!commErr) {
        const { data: agent } = await svc.from('profiles').select('commission_pending').eq('id', sub.referred_by).single()
        if (agent) {
          await svc.from('profiles').update({
            commission_pending: (agent.commission_pending || 0) + roundedNet,
          }).eq('id', sub.referred_by)
        }
      }
    }

    await svc.from('admin_action_log').insert({
      admin_id,
      action_type: 'subscription_renew',
      target_id: sub.id,
      target_type: 'subscription',
      old_value: { expires_at: oldExpiresAt, renewal_count: oldRenewalCount },
      new_value: { expires_at: newExpiresAt, renewal_count: newRenewalCount },
    })

    return NextResponse.json({ ok: true, expires_at: newExpiresAt, renewal_count: newRenewalCount })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
