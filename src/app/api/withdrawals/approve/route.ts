import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { withdrawal_id, admin_id } = body
    if (!withdrawal_id || !admin_id) return NextResponse.json({ error: 'withdrawal_id and admin_id required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: wr, error: wrErr } = await svc.from('withdrawal_requests').select('*').eq('id', withdrawal_id).single()
    if (wrErr || !wr) return NextResponse.json({ error: 'withdrawal request not found' }, { status: 404 })
    if (wr.status !== 'pending') return NextResponse.json({ error: 'withdrawal already processed' }, { status: 400 })

    const { data: profile } = await svc.from('profiles').select('*').eq('id', wr.user_id).single()
    if (!profile) return NextResponse.json({ error: 'user not found' }, { status: 404 })

    if (wr.type === 'points') {
      const pointsToUse = wr.points_used || wr.amount_requested
      if ((profile.points_balance || 0) < pointsToUse) return NextResponse.json({ error: 'insufficient points balance' }, { status: 400 })

      await svc.from('profiles').update({
        points_balance: (profile.points_balance || 0) - pointsToUse,
        total_points_withdrawn: (profile.total_points_withdrawn || 0) + pointsToUse,
      }).eq('id', wr.user_id)
    } else {
      if ((profile.commission_balance || 0) < wr.amount_requested) return NextResponse.json({ error: 'insufficient commission balance' }, { status: 400 })

      await svc.from('profiles').update({
        commission_balance: (profile.commission_balance || 0) - wr.amount_requested,
        total_commission_withdrawn: (profile.total_commission_withdrawn || 0) + wr.amount_requested,
      }).eq('id', wr.user_id)
    }

    await svc.from('withdrawal_requests').update({
      status: 'paid',
      admin_id,
      processed_at: new Date().toISOString(),
    }).eq('id', withdrawal_id)

    await svc.from('admin_action_log').insert({
      admin_id,
      action_type: 'withdrawal_approve',
      target_id: withdrawal_id,
      target_type: 'withdrawal',
      old_value: { status: wr.status },
      new_value: { status: 'paid' },
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
