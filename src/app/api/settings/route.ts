import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const rows = await query<any[]>('SELECT key_name, `value` FROM app_settings')
    const settings: Record<string, string> = {}
    rows.forEach((row: any) => {
      if (row.value) settings[row.key_name] = row.value
    })
    return NextResponse.json({ settings })
  } catch (e: any) {
    return NextResponse.json({ settings: {}, error: e.message })
  }
}
