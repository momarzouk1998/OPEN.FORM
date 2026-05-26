import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { withdrawal_id, admin_id, reason } = body
    if (!withdrawal_id || !admin_id) return NextResponse.json({ error: 'withdrawal_id and admin_id required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: wr, error: wrErr } = await svc.from('withdrawal_requests').select('*').eq('id', withdrawal_id).single()
    if (wrErr || !wr) return NextResponse.json({ error: 'withdrawal request not found' }, { status: 404 })
    if (wr.status !== 'pending') return NextResponse.json({ error: 'withdrawal already processed' }, { status: 400 })

    await svc.from('withdrawal_requests').update({
      status: 'rejected',
      admin_id,
      admin_note: reason || 'مرفوض',
      processed_at: new Date().toISOString(),
    }).eq('id', withdrawal_id)

    await svc.from('admin_action_log').insert({
      admin_id,
      action_type: 'withdrawal_reject',
      target_id: withdrawal_id,
      target_type: 'withdrawal',
      old_value: { status: wr.status },
      new_value: { status: 'rejected' },
      note: reason,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
