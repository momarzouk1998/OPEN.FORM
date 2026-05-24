import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { templateId } = body
    if (!templateId) return NextResponse.json({ error: 'templateId required' }, { status: 400 })

    const svc = createServiceClient()
    const rpcRes = await svc.rpc('increment_user_template_usage', { tpl_id: templateId })
    if (rpcRes.error) return NextResponse.json({ error: rpcRes.error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
