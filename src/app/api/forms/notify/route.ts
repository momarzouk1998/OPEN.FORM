import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/resend'

export async function POST(req: NextRequest) {
  try {
    const { formId } = await req.json()
    if (!formId) return NextResponse.json({ error: 'formId is required' }, { status: 400 })

    const supabase = createServiceClient()

    // Fetch form details
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, name, created_by, page_titles')
      .eq('id', formId)
      .single()

    if (formError || !form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 })
    }

    // Check if email notifications are enabled
    const emailNotificationsEnabled = !!(form.page_titles as any)?._email_notifications
    if (!emailNotificationsEnabled) {
      return NextResponse.json({ skipped: true, reason: 'email_notifications_disabled' })
    }

    if (!form.created_by) {
      return NextResponse.json({ skipped: true, reason: 'no_creator' })
    }

    // Fetch creator profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', form.created_by)
      .single()

    if (profileError || !profile?.email) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 })
    }

    // Send email notification
    await sendEmail({
      from: 'OpenApp Forms <noreply@openapp.com>',
      to: profile.email,
      subject: `رد جديد على نموذج "${form.name}"`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 32px; border-radius: 16px;">
          <div style="background: linear-gradient(135deg, #2563eb, #4f46e5); padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">📋 رد جديد على نموذجك</h1>
          </div>
          <div style="background: white; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 12px;">مرحباً <strong>${profile.name || 'عزيزي المستخدم'}</strong>،</p>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              تلقيت رداً جديداً على نموذج <strong style="color: #2563eb;">"${form.name}"</strong>.
            </p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://openapp.com'}/admin/results?formId=${form.id}"
               style="display: inline-block; background: linear-gradient(135deg, #2563eb, #4f46e5); color: white; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 15px;">
              عرض الرد
            </a>
          </div>
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            يمكنك إيقاف هذه الإشعارات من إعدادات النموذج.
          </p>
        </div>
      `
    })

    return NextResponse.json({ sent: true })
  } catch (error: any) {
    console.error('[notify] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
