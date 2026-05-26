import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const user_id = url.searchParams.get('user_id')
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const svc = createServiceClient()

    const { data: profile } = await svc.from('profiles').select(
      'points_balance, points_pending, commission_balance, commission_pending, total_referrals, active_referrals, total_points_earned, total_commission_earned, total_points_withdrawn, total_commission_withdrawn'
    ).eq('id', user_id).single()

    if (!profile) return NextResponse.json({ error: 'profile not found' }, { status: 404 })

    return NextResponse.json({
      points_balance: profile.points_balance || 0,
      points_pending: profile.points_pending || 0,
      commission_balance: profile.commission_balance || 0,
      commission_pending: profile.commission_pending || 0,
      total_referrals: profile.total_referrals || 0,
      active_referrals: profile.active_referrals || 0,
      total_points_earned: profile.total_points_earned || 0,
      total_commission_earned: profile.total_commission_earned || 0,
      total_points_withdrawn: profile.total_points_withdrawn || 0,
      total_commission_withdrawn: profile.total_commission_withdrawn || 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
