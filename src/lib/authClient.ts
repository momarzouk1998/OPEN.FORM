'use client'

export async function login(email: string, password: string) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function signup(data: {
  email: string
  password: string
  name: string
  phone?: string
  gender?: string
}) {
  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

export async function logout() {
  const res = await fetch('/api/auth/logout', { method: 'POST' })
  return res.json()
}
