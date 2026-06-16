import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createLocalJob } from '@/lib/localPipeline'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const files = formData.getAll('photos') as File[]

    if (files.length < 10) {
      return NextResponse.json({ error: 'Minimum 10 photos required' }, { status: 400 })
    }

    const jobId = uuidv4()
    await createLocalJob(files, jobId)
    return NextResponse.json({ jobId, photoCount: files.length })
  } catch (err) {
    console.error('[upload] error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Upload failed' },
      { status: 500 }
    )
  }
}
