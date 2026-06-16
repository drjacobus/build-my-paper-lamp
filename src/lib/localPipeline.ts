import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { JOB_DIR, createJob, updateJob } from '@/lib/jobs'

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3'

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

export function jobDir(jobId: string) {
  return path.join(JOB_DIR, jobId)
}

export function startLocalPipeline(jobId: string) {
  const dir = jobDir(jobId)
  const script = path.join(process.cwd(), 'poc/scripts/run-mvp-pipeline.py')

  updateJob(jobId, {
    status: 'scanning',
    progress: 5,
    step: 'Segmenting object from photos',
  })

  const child = spawn(PYTHON_BIN, [script, '--job-dir', dir, '--python', PYTHON_BIN], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    console.log(`[pipeline:${jobId}] ${text}`)
    if (text.includes('make-ai-foreground-masks.py')) {
      updateJob(jobId, { progress: 15, step: 'Creating AI segmentation masks' })
    } else if (text.includes('build-turntable-visual-hull.py')) {
      updateJob(jobId, { progress: 45, step: 'Building visual-hull mesh' })
    } else if (text.includes('render-faceted-shell.py')) {
      updateJob(jobId, { progress: 70, step: 'Simplifying faceted shell' })
    } else if (text.includes('export-connected-nets.py')) {
      updateJob(jobId, { progress: 88, step: 'Exporting printable SVG net' })
    }
  })

  child.stderr.on('data', (chunk) => {
    console.error(`[pipeline:${jobId}] ${chunk.toString()}`)
  })

  child.on('close', (code) => {
    const outputDir = path.join(dir, 'output')
    const modelPath = path.join(outputDir, 'paperlamp-model.glb')
    const svgPath = path.join(outputDir, 'paperlamp-net.svg')

    if (code === 0 && fs.existsSync(modelPath) && fs.existsSync(svgPath)) {
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        step: 'Paper lamp design ready',
        modelUrl: `/api/model?jobId=${encodeURIComponent(jobId)}`,
        modelPath,
        svgPath,
      })
      return
    }

    updateJob(jobId, {
      status: 'failed',
      progress: 100,
      step: 'Processing failed',
      error: `Pipeline exited with code ${code}`,
    })
  })
}

export async function createLocalJob(files: File[], jobId: string) {
  const dir = jobDir(jobId)
  const imageDir = path.join(dir, 'images')
  ensureDir(imageDir)

  for (const [index, file] of files.entries()) {
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const outPath = path.join(imageDir, `photo_${String(index).padStart(3, '0')}.${ext}`)
    const buffer = Buffer.from(await file.arrayBuffer())
    fs.writeFileSync(outPath, buffer)
  }

  const job = createJob(jobId, files.length)
  startLocalPipeline(jobId)
  return job
}
