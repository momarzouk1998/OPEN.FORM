import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId مطلوب' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
