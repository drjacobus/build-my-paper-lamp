import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/jobs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) {
    return NextResponse.json({ error: 'jobId required' }, { status: 400 })
  }

  const job = getJob(jobId)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  return NextResponse.json({
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    step: job.step,
    error: job.error,
    modelUrl: job.modelUrl,
  })
}
