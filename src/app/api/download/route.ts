import { NextRequest, NextResponse } from 'next/server'
import { getJob } from '@/lib/jobs'
import fs from 'fs'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const jobId = searchParams.get('jobId')

  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const job = getJob(jobId)
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  if (job.svgPath && fs.existsSync(job.svgPath)) {
    return new NextResponse(fs.readFileSync(job.svgPath, 'utf8'), {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="lamp-${jobId.slice(0, 8)}.svg"`,
        'Cache-Control': 'no-store',
      },
    })
  }
  if (!job.svgData) return NextResponse.json({ error: 'SVG not ready' }, { status: 404 })

  return new NextResponse(job.svgData, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Content-Disposition': `attachment; filename="lamp-${jobId.slice(0, 8)}.svg"`,
      'Cache-Control': 'no-store',
    },
  })
}

// Called from the client to save generated SVG back to the job record
export async function POST(req: NextRequest) {
  try {
    const { jobId, svgData } = await req.json()
    if (!jobId || !svgData) {
      return NextResponse.json({ error: 'jobId and svgData required' }, { status: 400 })
    }

    const { updateJob } = await import('@/lib/jobs')
    updateJob(jobId, { svgData, status: 'completed' })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save SVG' }, { status: 500 })
  }
}
