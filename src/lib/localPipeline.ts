import fs from 'fs'
import path from 'path'
import { spawn } from 'child_process'
import { JOB_DIR, createJob, getJob, updateJob } from '@/lib/jobs'

const PYTHON_BIN = process.env.PYTHON_BIN || 'python3'

function ensureDir(dir: string) {
  fs.mkdirSync(dir, { recursive: true })
}

export function jobDir(jobId: string) {
  return path.join(JOB_DIR, jobId)
}

function tailPush(tail: string[], text: string) {
  tail.push(text)
  while (tail.join('').length > 2500) tail.shift()
}

function failJob(jobId: string, code: number | null, stderrTail: string[]) {
  const detail = stderrTail.join('').trim()
  updateJob(jobId, {
    status: 'failed',
    progress: 100,
    step: 'Processing failed',
    error: detail
      ? `Pipeline exited with code ${code}. ${detail.slice(-1200)}`
      : `Pipeline exited with code ${code}`,
  })
}

export function startSegmentation(jobId: string) {
  const dir = jobDir(jobId)
  const imageDir = path.join(dir, 'images')
  const outputDir = path.join(dir, 'output')
  const maskDir = path.join(dir, 'masks-ai-isnet')
  const script = path.join(process.cwd(), 'poc/scripts/make-ai-foreground-masks.py')
  const contactSheetPath = path.join(outputDir, 'segmentation-contact-sheet.jpg')
  const stderrTail: string[] = []

  ensureDir(outputDir)
  updateJob(jobId, {
    status: 'scanning',
    progress: 12,
    step: 'Creating AI segmentation masks',
  })

  const child = spawn(PYTHON_BIN, [
    script,
    '--image-dir',
    imageDir,
    '--output-dir',
    maskDir,
    '--model',
    'isnet-general-use',
    '--contact-sheet',
    contactSheetPath,
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    console.log(`[segment:${jobId}] ${chunk.toString()}`)
  })

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    console.error(`[segment:${jobId}] ${text}`)
    tailPush(stderrTail, text)
  })

  child.on('close', (code) => {
    if (code === 0 && fs.existsSync(contactSheetPath)) {
      updateJob(jobId, {
        status: 'review',
        progress: 30,
        step: 'Review segmentation before reconstruction',
        contactSheetUrl: `/api/contact-sheet?jobId=${encodeURIComponent(jobId)}`,
        contactSheetPath,
      })
      return
    }
    failJob(jobId, code, stderrTail)
  })
}

export function startLocalPipeline(
  jobId: string,
  complexity: 'simple' | 'medium' | 'detailed' = 'medium',
  coloredSvg = false,
) {
  const dir = jobDir(jobId)
  const script = path.join(process.cwd(), 'poc/scripts/run-mvp-pipeline.py')
  const stderrTail: string[] = []
  const faceCount = complexity === 'simple' ? 180 : complexity === 'detailed' ? 520 : 320
  const resolution = complexity === 'detailed' ? 112 : 96

  const job = getJob(jobId)
  if (!job || job.status === 'completed' || job.status === 'scanning') return

  updateJob(jobId, {
    status: 'scanning',
    progress: 35,
    step: 'Building visual-hull mesh',
  })

  const child = spawn(PYTHON_BIN, [
    script,
    '--job-dir',
    dir,
    '--python',
    PYTHON_BIN,
    '--skip-segmentation',
    '--resolution',
    String(resolution),
    '--face-count',
    String(faceCount),
    ...(coloredSvg ? ['--colored-svg'] : []),
  ], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  child.stdout.on('data', (chunk) => {
    const text = chunk.toString()
    console.log(`[pipeline:${jobId}] ${text}`)
    if (text.includes('build-turntable-visual-hull.py')) {
      updateJob(jobId, { progress: 45, step: 'Building visual-hull mesh' })
    } else if (text.includes('render-faceted-shell.py')) {
      updateJob(jobId, { progress: 70, step: 'Simplifying faceted shell' })
    } else if (text.includes('export-connected-nets.py')) {
      updateJob(jobId, { progress: 88, step: 'Exporting printable SVG net' })
    }
  })

  child.stderr.on('data', (chunk) => {
    const text = chunk.toString()
    console.error(`[pipeline:${jobId}] ${text}`)
    tailPush(stderrTail, text)
  })

  child.on('close', (code) => {
    const outputDir = path.join(dir, 'output')
    const modelPath = path.join(outputDir, 'paperlamp-model.glb')
    const svgPath = path.join(outputDir, 'paperlamp-net.svg')
    const contactSheetPath = path.join(outputDir, 'segmentation-contact-sheet.jpg')

    if (code === 0 && fs.existsSync(modelPath) && fs.existsSync(svgPath)) {
      updateJob(jobId, {
        status: 'completed',
        progress: 100,
        step: 'Paper lamp design ready',
        modelUrl: `/api/model?jobId=${encodeURIComponent(jobId)}`,
        contactSheetUrl: fs.existsSync(contactSheetPath)
          ? `/api/contact-sheet?jobId=${encodeURIComponent(jobId)}`
          : undefined,
        modelPath,
        svgPath,
        contactSheetPath: fs.existsSync(contactSheetPath) ? contactSheetPath : undefined,
      })
      return
    }

    failJob(jobId, code, stderrTail)
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
  startSegmentation(jobId)
  return job
}
