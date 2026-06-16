'use client'

import { useEffect, useRef, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

const PIPELINE_STAGES = [
  { min: 0, label: 'Photos uploaded' },
  { min: 10, label: 'Creating AI segmentation masks' },
  { min: 35, label: 'Building visual-hull mesh' },
  { min: 65, label: 'Simplifying faceted shell' },
  { min: 85, label: 'Exporting printable SVG net' },
  { min: 100, label: 'Complete!' },
]

function stageIndex(progress: number) {
  let index = 0
  for (let i = 0; i < PIPELINE_STAGES.length; i++) {
    if (progress >= PIPELINE_STAGES[i].min) index = i
  }
  return index
}

function useElapsed() {
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function StageIcon({ state }: { state: 'done' | 'active' | 'pending' }) {
  if (state === 'done') {
    return (
      <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )
  }
  if (state === 'active') {
    return (
      <div className="w-6 h-6 shrink-0 relative">
        <div className="w-6 h-6 rounded-full border-2 border-amber-200" />
        <div className="w-6 h-6 rounded-full border-2 border-t-amber-500 border-r-amber-400 border-b-transparent border-l-transparent animate-spin absolute inset-0" />
      </div>
    )
  }
  return (
    <div className="w-6 h-6 rounded-full border-2 border-amber-200 shrink-0" />
  )
}

function ProcessingContent() {
  const router = useRouter()
  const params = useSearchParams()
  const jobId = params.get('jobId') ?? ''

  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Queued for processing')
  const [failed, setFailed] = useState(false)
  const [failMsg, setFailMsg] = useState('')
  const [timedOut, setTimedOut] = useState(false)
  const doneRef = useRef(false)
  const elapsedSecs = useRef(0)
  const elapsed = useElapsed()

  // Timeout counter
  useEffect(() => {
    const id = setInterval(() => {
      elapsedSecs.current += 1
      if (elapsedSecs.current >= 900 && !doneRef.current) setTimedOut(true)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Persist so users can close and come back
  useEffect(() => {
    if (jobId) {
      localStorage.setItem('lamp_jobId', jobId)
    }
  }, [jobId])

  // Poll /api/status every 3 seconds
  useEffect(() => {
    if (!jobId) return

    const id = setInterval(async () => {
      if (doneRef.current) return
      try {
        const res = await fetch(`/api/status?jobId=${encodeURIComponent(jobId)}`)
        const data = await res.json()

        if (data.status === 'failed') {
          doneRef.current = true
          clearInterval(id)
          setFailed(true)
          setFailMsg(data.error ?? 'Scan failed')
          return
        }
        if (data.status === 'completed') {
          doneRef.current = true
          clearInterval(id)
          setProgress(100)
          setTimeout(() => {
            const target = new URL('/results', window.location.origin)
            target.searchParams.set('jobId', jobId)
            if (data.modelUrl) target.searchParams.set('modelUrl', data.modelUrl)
            if (data.contactSheetUrl) target.searchParams.set('contactSheetUrl', data.contactSheetUrl)
            router.push(`${target.pathname}${target.search}`)
          }, 800)
          return
        }
        if (typeof data.progress === 'number') setProgress(data.progress)
        if (data.step) setStep(data.step)
      } catch {
        // network hiccup — keep polling
      }
    }, 3000)
    return () => clearInterval(id)
  }, [jobId, router])

  if (!jobId) {
    return (
      <div className="text-center pt-20 text-amber-700">
        No job found. <a href="/capture" className="underline">Start over</a>
      </div>
    )
  }

  if (failed) {
    return (
      <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😞</div>
        <h2 className="text-xl font-bold text-red-700 mb-2">Processing failed</h2>
        <p className="text-sm text-red-500 mb-4 text-center whitespace-pre-wrap break-words max-w-sm">{failMsg}</p>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-left max-w-sm">
          <p className="text-sm font-semibold text-red-700 mb-2">Most common fixes</p>
          <ul className="text-xs text-red-600 list-disc list-inside space-y-1">
            <li>Use 10-15 images of one object only.</li>
            <li>Keep the object fully visible and centered.</li>
            <li>Avoid top-down-only shots and duplicate angles.</li>
            <li>Use a plain or high-contrast background.</li>
          </ul>
        </div>
        <a href="/capture" className="bg-amber-500 text-white font-bold px-8 py-3 rounded-2xl">
          Try again
        </a>
      </main>
    )
  }

  const currentStageIdx = stageIndex(progress)
  const displayProgress = Math.round(progress)

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center px-6 max-w-sm mx-auto">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full border-4 border-amber-100 flex items-center justify-center">
          <div className="w-28 h-28 absolute rounded-full border-4 border-t-amber-500 border-r-amber-400 border-b-transparent border-l-transparent animate-spin" />
          <div className="text-4xl">🏮</div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-amber-900 mb-1">Generating paper model</h2>
      <p className="text-xs text-amber-400 mb-6">Elapsed: {elapsed}</p>

      {/* Progress bar */}
      <div className="w-full mb-8">
        <div className="w-full bg-amber-100 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full transition-all duration-1000"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
      </div>

      <div className="w-full space-y-4">
        {PIPELINE_STAGES.map((s, i) => {
          const state = i < currentStageIdx ? 'done' : i === currentStageIdx ? 'active' : 'pending'
          return (
            <div key={s.label} className="flex items-center gap-3">
              <StageIcon state={state} />
              <span className={`text-sm font-medium ${
                state === 'done'    ? 'text-amber-800' :
                state === 'active'  ? 'text-amber-600' :
                                      'text-amber-300'
              }`}>
                {i === currentStageIdx ? step : s.label}
              </span>
            </div>
          )
        })}
      </div>

      {!timedOut && (
        <div className="mt-8 bg-amber-100 rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-amber-600 font-medium">Cloud worker is processing your photos</p>
          <p className="text-xs text-amber-400 mt-0.5">Usually takes a few minutes — you can close this page and come back</p>
        </div>
      )}

      {timedOut && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
          <p className="text-sm text-red-700 font-medium">Taking longer than expected</p>
          <p className="text-xs text-red-500 mt-1 mb-3">The worker may still finish. You can close this page and come back later.</p>
          <a href="/capture" className="inline-block bg-amber-500 text-white text-sm font-bold px-5 py-2 rounded-xl">
            Start over
          </a>
        </div>
      )}
    </main>
  )
}

export default function ProcessingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-amber-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProcessingContent />
    </Suspense>
  )
}
