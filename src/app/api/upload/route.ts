import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { uploadImages, pickEvenly } from '@/lib/kiri'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('photos') as File[]

    if (files.length < 5) {
      return NextResponse.json({ error: 'Minimum 5 photos required' }, { status: 400 })
    }

    const jobId = uuidv4()

    // Demo mode: no API key configured
    if (!process.env.KIRI_API_KEY) {
      return NextResponse.json({ jobId, demo: true, photoCount: files.length })
    }

    // Read files into buffers, then pick 20-30 evenly-spaced photos
    // (Kiri requires min 20; keeping it ≤30 avoids Vercel body-size limits)
    const buffers: Buffer[] = []
    for (const file of files) {
      const arr = await file.arrayBuffer()
      const buf = Buffer.from(arr)
      console.log(`[upload] file "${file.name}" size=${file.size} buf=${buf.byteLength}`)
      buffers.push(buf)
    }

    const selected = pickEvenly(buffers, Math.min(30, Math.max(20, buffers.length)))
    console.log(`[upload] ${files.length} photos received → sending ${selected.length} to Kiri, total bytes=${selected.reduce((s, b) => s + b.byteLength, 0)}`)

    const serializeId = await uploadImages(selected)
    console.log(`[upload] Kiri serialize ID: ${serializeId}`)

    return NextResponse.json({ jobId, projectId: serializeId, photoCount: selected.length })
  } catch (err) {
    console.error('[upload] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
