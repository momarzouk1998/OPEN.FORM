import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'لم يتم اختيار ملف' }, { status: 400 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'يجب اختيار ملف صورة' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`

    const uploadDir = join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const bytes = await file.arrayBuffer()
    await writeFile(join(uploadDir, fileName), Buffer.from(bytes))

    const url = `/uploads/${fileName}`

    return NextResponse.json({ url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'حدث خطأ أثناء رفع الملف' }, { status: 500 })
  }
}
