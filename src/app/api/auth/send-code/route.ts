import { NextResponse } from 'next/server'
import { createServiceClient } from '@/utils/supabase/server'
import { sendEmail } from '@/utils/resend'

// Simple in-memory rate limiting: max 1 request per email per 60 seconds
const rateLimitMap = new Map<string, number>()
const RATE_LIMIT_MS = 60_000

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'البريد الإلكتروني غير صحيح' }, { status: 400 })
    }

    // Rate limit check
    const lastSent = rateLimitMap.get(email.toLowerCase())
    if (lastSent && Date.now() - lastSent < RATE_LIMIT_MS) {
      const remaining = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSent)) / 1000)
      return NextResponse.json({ error: `يرجى الانتظار ${remaining} ثانية قبل طلب كود جديد` }, { status: 429 })
    }

    // Detect email provider
    const domain = email.split('@')[1]?.toLowerCase()
    const allowedProviders = ['gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'icloud.com', 'me.com', 'yahoo.com', 'ymail.com']

    if (!allowedProviders.includes(domain)) {
      return NextResponse.json({
        error: 'يُرجى استخدام بريد إلكتروني من: Gmail, Outlook, Hotmail, iCloud, أو Yahoo'
      }, { status: 400 })
    }

    // Generate 6-digit code using crypto
    const code = crypto.randomInt(100000, 999999).toString()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes

    // Store code in Supabase (service role bypasses RLS)
    const supabase = createServiceClient()
    const { error: dbError } = await supabase
      .from('verification_codes')
      .upsert(
        { email, code, expires_at: expiresAt },
        { onConflict: 'email' }
      )

    if (dbError) {
      console.error('DB error:', dbError)
      return NextResponse.json({ error: 'خطأ في تخزين كود التحقق' }, { status: 500 })
    }

    // Send email via Resend
    await sendEmail({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@openappo.com',
      to: email,
      subject: '🔐 كود التحقق - Forms.OpenappO',
      html: `
        <div dir="rtl" style="font-family: 'Cairo', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8fafc; border-radius: 16px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #12D8D8, #0ebaba); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px;">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <h1 style="font-size: 22px; color: #1e293b; margin: 0;">كود التحقق من البريد الإلكتروني</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
            <p style="font-size: 15px; color: #475569; margin: 0 0 16px;">مرحباً،</p>
            <p style="font-size: 15px; color: #475569; margin: 0 0 20px;">استخدم الكود التالي للتحقق من بريدك الإلكتروني:</p>
            <div style="text-align: center; margin: 24px 0; letter-spacing: 8px;">
              <span style="font-size: 36px; font-weight: bold; color: #12D8D8; background: #ecfdff; padding: 12px 24px; border-radius: 12px; display: inline-block;">${code}</span>
            </div>
            <p style="font-size: 13px; color: #94a3b8; margin: 0;">هذا الكود صالح لمدة <strong>10 دقائق</strong> فقط.</p>
            <p style="font-size: 13px; color: #94a3b8; margin: 8px 0 0;">إذا لم تطلب هذا الكود، يمكنك تجاهل هذه الرسالة.</p>
          </div>
          <p style="text-align: center; font-size: 12px; color: #cbd5e1; margin-top: 20px;">© ${new Date().getFullYear()} Forms.OpenappO - جميع الحقوق محفوظة</p>
        </div>
      `
    })

    // Update rate limit on success
    rateLimitMap.set(email.toLowerCase(), Date.now())

    return NextResponse.json({ success: true, message: 'تم إرسال كود التحقق إلى بريدك الإلكتروني' })
  } catch (error) {
    console.error('Send code error:', error)
    const message = error instanceof Error ? error.message : 'حدث خطأ أثناء إرسال الكود'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
