const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_API_URL = 'https://api.resend.com/emails'

interface SendEmailParams {
  from: string
  to: string
  subject: string
  html: string
}

export async function sendEmail({ from, to, subject, html }: SendEmailParams) {
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
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
