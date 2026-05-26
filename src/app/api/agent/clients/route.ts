import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const agent_id = url.searchParams.get('agent_id')
    if (!agent_id) return NextResponse.json({ error: 'agent_id required' }, { status: 400 })

    const svc = createServiceClient()

    // Get all clients who registered under this agent
    const { data: subscriptions } = await svc.from('subscriptions')
      .select('*, profiles!inner(id, name, email, avatar_url)')
      .eq('referred_by', agent_id)
      .order('created_at', { ascending: false })

    // Get all commissions for this agent
    const { data: commissions } = await svc.from('agent_commissions')
      .select('*')
      .eq('agent_id', agent_id)
      .order('created_at', { ascending: false })

    const clients = (subscriptions || []).map(sub => {
      const clientCommissions = (commissions || []).filter(c => c.client_id === sub.user_id)
      const totalCommission = clientCommissions
        .filter(c => c.status === 'available' || c.status === 'paid')
        .reduce((sum, c) => sum + (c.net_commission || 0), 0)

      return {
        user_id: sub.user_id,
        name: (sub.profiles as any)?.name,
        email: (sub.profiles as any)?.email,
        joined_at: sub.created_at,
        status: sub.status,
        expires_at: sub.expires_at,
        total_commission: Math.round(totalCommission * 100) / 100,
        commissions: clientCommissions,
      }
    })

    return NextResponse.json({ clients })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
