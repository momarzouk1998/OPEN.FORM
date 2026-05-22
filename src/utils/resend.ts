const RESEND_API_URL = 'https://api.resend.com/emails'

interface SendEmailParams {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendEmail({ from, to, subject, html }: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY غير مضبوط في الإعدادات')
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(error)
  }

  return res.json()
}
