import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { subscription_id, admin_id, reason } = body
    if (!subscription_id || !admin_id) return NextResponse.json({ error: 'subscription_id and admin_id required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: sub, error: subErr } = await svc.from('subscriptions').select('*').eq('id', subscription_id).single()
    if (subErr || !sub) return NextResponse.json({ error: 'subscription not found' }, { status: 404 })

    const daysSincePayment = sub.renewed_at
      ? Math.floor((Date.now() - new Date(sub.renewed_at).getTime()) / (1000 * 60 * 60 * 24))
      : Math.floor((Date.now() - new Date(sub.started_at).getTime()) / (1000 * 60 * 60 * 24))

    // If more than 35 days, no commission deduction
    if (daysSincePayment <= 35) {
      // Cancel pending commissions for this subscription
      const { data: pendingComms } = await svc.from('agent_commissions')
        .select('*')
        .eq('subscription_id', sub.id)
        .eq('status', 'pending')

      if (pendingComms) {
        for (const comm of pendingComms) {
          await svc.from('agent_commissions').update({ status: 'cancelled', type: 'refund_deduction' }).eq('id', comm.id)

          const { data: agent } = await svc.from('profiles').select('commission_pending').eq('id', comm.agent_id).single()
          if (agent) {
            await svc.from('profiles').update({
              commission_pending: Math.max(0, (agent.commission_pending || 0) - (comm.net_commission || 0)),
            }).eq('id', comm.agent_id)
          }
        }
      }

      // Cancel pending template points for this user
      const { data: pendingPoints } = await svc.from('template_points')
        .select('*')
        .eq('copied_by_id', sub.user_id)
        .eq('status', 'pending')

      if (pendingPoints) {
        for (const pt of pendingPoints) {
          await svc.from('template_points').update({ status: 'cancelled' }).eq('id', pt.id)

          const { data: owner } = await svc.from('profiles').select('points_pending').eq('id', pt.template_owner_id).single()
          if (owner) {
            await svc.from('profiles').update({
              points_pending: Math.max(0, (owner.points_pending || 0) - pt.points),
            }).eq('id', pt.template_owner_id)
          }
        }
      }
    }

    await svc.from('subscriptions').update({ status: 'cancelled' }).eq('id', subscription_id)

    await svc.from('admin_action_log').insert({
      admin_id,
      action_type: 'subscription_cancel',
      target_id: sub.id,
      target_type: 'subscription',
      old_value: { status: sub.status, expires_at: sub.expires_at },
      new_value: { status: 'cancelled' },
      note: reason || 'استرجاع',
    })

    return NextResponse.json({ ok: true, days_since_payment: daysSincePayment })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
