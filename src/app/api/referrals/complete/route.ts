import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { referralCode, referredId, referredEmail } = body
    if (!referralCode || !referredId) return NextResponse.json({ error: 'referralCode and referredId required' }, { status: 400 })

    const svc = createServiceClient()

    // Try to call a DB function if present to ensure atomicity
    const { data: rpcData, error: rpcErr } = await svc.rpc('increment_referral', { referral_code: referralCode, referred_id: referredId, referred_email: referredEmail })
    if (rpcErr) {
      // Fallback: do operations sequentially with service role client
      const { data: referrer } = await svc.from('profiles').select('id, referral_count').eq('referral_code', referralCode).single()
      if (!referrer) return NextResponse.json({ error: 'referrer not found' }, { status: 404 })

      const { error: insertErr } = await svc.from('referrals').insert({ referrer_id: referrer.id, referred_email: referredEmail, referred_id: referredId, status: 'completed' })
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 })

      const { error: updateErr } = await svc.from('profiles').update({ referral_count: (referrer.referral_count || 0) + 1 }).eq('id', referrer.id)
      if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 })

      // Set referred_by on the referred user's profile for agent commission tracking
      await svc.from('profiles').update({ referred_by: referrer.id }).eq('id', referredId)

      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true, data: rpcData })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
