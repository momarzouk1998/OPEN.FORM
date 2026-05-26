import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json()
    if (!userId || !password) {
      return NextResponse.json({ error: 'userId و password مطلوبين' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error } = await supabase.auth.admin.updateUserById(userId, { password })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, password })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
