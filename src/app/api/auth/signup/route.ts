import { NextRequest, NextResponse } from 'next/server'
import { insert, queryOne } from '@/lib/db'
import { hashPassword, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phone, gender } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور والاسم مطلوبون' }, { status: 400 })
    }

    const existing = await queryOne<any>('SELECT id FROM profiles WHERE email = ?', [email])
    if (existing) {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const id = crypto.randomUUID()

    await insert('profiles', {
      id,
      email,
      name: name,
      password_hash: passwordHash,
      phone: phone || '',
      gender: gender || '',
      role: 'volunteer',
      status: 'approved',
      created_at: new Date().toISOString(),
    })

    const token = signToken({ id, email, role: 'volunteer', name })
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      user: { id, email, name, role: 'volunteer' },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'حدث خطأ' }, { status: 500 })
  }
}
