import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'
import { comparePassword, signToken } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبان' }, { status: 400 })
    }

    const user = await queryOne<any>('SELECT * FROM profiles WHERE email = ?', [email])
    if (!user) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    const valid = await comparePassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' }, { status: 401 })
    }

    if (user.status === 'pending') {
      return NextResponse.json({ error: 'حسابك قيد المراجعة، يرجى الانتظار حتى يتم الموافقة عليه', pending: true }, { status: 403 })
    }

    if (user.status === 'rejected') {
      return NextResponse.json({ error: 'تم رفض حسابك' }, { status: 403 })
    }

    if (user.banned) {
      return NextResponse.json({ error: 'حسابك محظور' }, { status: 403 })
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, name: user.name })
    const cookieStore = await cookies()
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'حدث خطأ' }, { status: 500 })
  }
}
