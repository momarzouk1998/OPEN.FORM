import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { user_id, type, amount, payment_method, payment_account } = body
    if (!user_id || !type || !amount || !payment_method || !payment_account) {
      return NextResponse.json({ error: 'user_id, type, amount, payment_method, payment_account required' }, { status: 400 })
    }
    if (!['points', 'commission'].includes(type)) return NextResponse.json({ error: 'invalid type' }, { status: 400 })
    if (!['instapay', 'vodafone_cash', 'orange_cash', 'etisalat_cash'].includes(payment_method)) {
      return NextResponse.json({ error: 'invalid payment_method' }, { status: 400 })
    }

    const svc = createServiceClient()

    const { data: profile } = await svc.from('profiles').select('points_balance, commission_balance').eq('id', user_id).single()
    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    let taxDeducted = 0
    let netAmount = 0
    let pointsUsed = null

    if (type === 'points') {
      if ((profile.points_balance || 0) < 100) return NextResponse.json({ error: 'الحد الأدنى للسحب 100 نقطة' }, { status: 400 })
      if (amount > (profile.points_balance || 0)) return NextResponse.json({ error: 'الرصيد غير كافٍ' }, { status: 400 })
      taxDeducted = amount * 0.14
      netAmount = amount - taxDeducted
      pointsUsed = amount
    } else {
      if ((profile.commission_balance || 0) < 500) return NextResponse.json({ error: 'الحد الأدنى للسحب 500 جنيه' }, { status: 400 })
      if (amount > (profile.commission_balance || 0)) return NextResponse.json({ error: 'الرصيد غير كافٍ' }, { status: 400 })
      taxDeducted = 0
      netAmount = amount
    }

    const { data: withdrawal, error: wErr } = await svc.from('withdrawal_requests').insert({
      user_id,
      type,
      amount_requested: amount,
      amount_after_tax: Math.round(netAmount * 100) / 100,
      tax_deducted: Math.round(taxDeducted * 100) / 100,
      points_used: pointsUsed,
      payment_method,
      payment_account,
      status: 'pending',
    }).select().single()

    if (wErr) return NextResponse.json({ error: wErr.message }, { status: 500 })

    return NextResponse.json({ ok: true, withdrawal })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
