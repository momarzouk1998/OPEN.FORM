import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { queryOne } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'ahla-shabab-jwt-secret-2026'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  status: string
  avatar_url?: string
  phone?: string
  gender?: string
  banned?: boolean
  form_limit?: number
  submission_limit?: number
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signToken(user: Partial<AuthUser>): string {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): { userId: string; email: string; role: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as any
  } catch {
    return null
  }
}

export async function getUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (!token) return null

  const payload = verifyToken(token)
  if (!payload) return null

  const user = await queryOne<any>('SELECT * FROM profiles WHERE id = ?', [payload.userId])
  if (!user || user.status !== 'approved') return null
  if (user.banned) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    avatar_url: user.avatar_url,
    phone: user.phone,
    gender: user.gender,
    banned: user.banned,
    form_limit: user.form_limit,
    submission_limit: user.submission_limit,
  }
}
