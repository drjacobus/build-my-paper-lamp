import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import { getJob } from '@/lib/jobs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const job = getJob(jobId)
  if (!job?.modelPath || !fs.existsSync(job.modelPath)) {
    return NextResponse.json({ error: 'Model not ready' }, { status: 404 })
  }

  return new NextResponse(fs.readFileSync(job.modelPath), {
    status: 200,
    headers: {
      'Content-Type': 'model/gltf-binary',
      'Cache-Control': 'no-store',
    },
  })
}
