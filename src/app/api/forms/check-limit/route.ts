import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function GET() {
  try {
    const supabase = createServiceClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('banned, form_limit')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'الحساب غير موجود' }, { status: 404 })
    }

    if (profile.banned) {
      return NextResponse.json({ error: 'حسابك محظور', banned: true }, { status: 403 })
    }

    if (profile.form_limit === -1 || profile.form_limit === null || profile.form_limit === undefined) {
      return NextResponse.json({ allowed: true })
    }

    const { count } = await supabase
      .from('forms')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)

    if (count !== null && count >= profile.form_limit) {
      return NextResponse.json({ error: 'لقد تجاوزت الحد المسموح من النماذج', limit: profile.form_limit, allowed: false }, { status: 403 })
    }

    return NextResponse.json({ allowed: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
