import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const user_id = url.searchParams.get('user_id')
    if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })

    const svc = createServiceClient()

    const [templatePoints, commissions, withdrawals] = await Promise.all([
      svc.from('template_points')
        .select('*')
        .eq('template_owner_id', user_id)
        .order('created_at', { ascending: false })
        .limit(100),
      svc.from('agent_commissions')
        .select('*')
        .eq('agent_id', user_id)
        .order('created_at', { ascending: false })
        .limit(100),
      svc.from('withdrawal_requests')
        .select('*')
        .eq('user_id', user_id)
        .order('requested_at', { ascending: false })
        .limit(100),
    ])

    return NextResponse.json({
      template_points: templatePoints.data || [],
      commissions: commissions.data || [],
      withdrawals: withdrawals.data || [],
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
