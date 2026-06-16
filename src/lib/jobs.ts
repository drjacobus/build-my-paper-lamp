// Simple file-based job store. Works for the single-container MVP.
// For multi-instance production, swap this for Postgres/Redis plus object storage.

import fs from 'fs'
import path from 'path'
import { Job, JobStatus } from '@/types'

export const JOB_DIR = process.env.LAMP_JOB_DIR || '/tmp/lamp-jobs'

function ensureDir() {
  if (!fs.existsSync(JOB_DIR)) fs.mkdirSync(JOB_DIR, { recursive: true })
}

function jobPath(jobId: string) {
  return path.join(JOB_DIR, `${jobId}.json`)
}

export function saveJob(job: Job): void {
  ensureDir()
  fs.writeFileSync(jobPath(job.jobId), JSON.stringify(job), 'utf8')
}

export function getJob(jobId: string): Job | null {
  ensureDir()
  const p = jobPath(jobId)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Job
  } catch {
    return null
  }
}

export function updateJob(jobId: string, updates: Partial<Job>): Job | null {
  const job = getJob(jobId)
  if (!job) return null
  const updated = { ...job, ...updates }
  saveJob(updated)
  return updated
}

export function createJob(jobId: string, photoCount: number): Job {
  const job: Job = {
    jobId,
    status: 'uploaded' as JobStatus,
    progress: 0,
    step: 'Waiting to start',
    photoCount,
    createdAt: Date.now(),
  }
  saveJob(job)
  return job
}
