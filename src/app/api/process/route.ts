import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/jobs'

export async function POST(req: NextRequest) {
  try {
    const { jobId } = await req.json()
    if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

    const job = getJob(jobId)
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

    return NextResponse.json({ jobId, status: job.status })
  } catch (err) {
    console.error('Process error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Processing failed' },
      { status: 500 }
    )
  }
}
