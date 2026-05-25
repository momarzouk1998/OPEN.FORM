import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { name, email, phone, type, message } = await req.json()

    if (!name || !email || !type || !message) {
      return NextResponse.json({ error: 'جميع الحقول المطلوبة يجب أن تكون مليئة' }, { status: 400 })
    }

    if (!['complaint', 'suggestion', 'inquiry'].includes(type)) {
      return NextResponse.json({ error: 'نوع الرسالة غير صحيح' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { error } = await supabase.from('contact_messages').insert({ name, email, phone, type, message })

    if (error) {
      console.error('Contact insert error:', error)
      return NextResponse.json({ error: 'حدث خطأ أثناء إرسال الرسالة' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'تم إرسال رسالتك بنجاح، سنتواصل معك قريباً' })
  } catch (err: any) {
    console.error('Contact API error:', err)
    return NextResponse.json({ error: err.message || 'حدث خطأ' }, { status: 500 })
  }
}
