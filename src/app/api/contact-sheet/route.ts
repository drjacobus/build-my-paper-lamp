import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getJob } from '@/lib/jobs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const job = getJob(jobId)
  if (!job?.contactSheetPath || !fs.existsSync(job.contactSheetPath)) {
    return NextResponse.json({ error: 'Segmentation preview not ready' }, { status: 404 })
  }

  return new NextResponse(fs.readFileSync(job.contactSheetPath), {
    status: 200,
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'no-store',
    },
  })
}
