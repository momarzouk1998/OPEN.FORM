import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'البريد الإلكتروني والكود مطلوبان' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Get the stored code
    const { data, error } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('email', email)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'لم يتم إرسال كود لهذا البريد. يرجى طلب كود جديد' }, { status: 400 })
    }

    // Check if expired
    if (new Date(data.expires_at) < new Date()) {
      // Delete expired code
      await supabase.from('verification_codes').delete().eq('email', email)
      return NextResponse.json({ error: 'انتهت صلاحية الكود. يرجى طلب كود جديد' }, { status: 400 })
    }

    // Check if code matches
    if (data.code !== code) {
      return NextResponse.json({ error: 'الكود غير صحيح. يرجى المحاولة مرة أخرى' }, { status: 400 })
    }

    // Delete used code
    await supabase.from('verification_codes').delete().eq('email', email)

    return NextResponse.json({ success: true, message: 'تم التحقق من البريد الإلكتروني بنجاح' })
  } catch (error) {
    console.error('Verify code error:', error)
    return NextResponse.json({ error: 'حدث خطأ أثناء التحقق من الكود' }, { status: 500 })
  }
}
