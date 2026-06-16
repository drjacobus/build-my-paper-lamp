import { NextResponse } from 'next/server'
import fs from 'fs'
import { JOB_DIR } from '@/lib/jobs'

export const dynamic = 'force-dynamic'

export async function GET() {
  const jobDirReady = fs.existsSync(JOB_DIR)
  return NextResponse.json({
    ok: true,
    jobDir: JOB_DIR,
    jobDirReady,
  })
}
