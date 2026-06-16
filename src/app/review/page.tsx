'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type Complexity = 'simple' | 'medium' | 'detailed'

const COMPLEXITY: Array<{ key: Complexity; label: string; desc: string }> = [
  { key: 'simple', label: 'Simple', desc: 'Fewer pieces, softer detail' },
  { key: 'medium', label: 'Medium', desc: 'Balanced first test' },
  { key: 'detailed', label: 'Detailed', desc: 'More facets, slower' },
]

function ReviewContent() {
  const router = useRouter()
  const params = useSearchParams()
  const jobId = params.get('jobId') ?? ''
  const contactSheetUrl = params.get('contactSheetUrl') ?? (jobId ? `/api/contact-sheet?jobId=${encodeURIComponent(jobId)}` : '')
  const [complexity, setComplexity] = useState<Complexity>('medium')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function startReconstruction() {
    if (!jobId) return
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, complexity }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.error || `Could not start reconstruction (${res.status})`)
      }
      router.push(`/processing?jobId=${encodeURIComponent(jobId)}`)
    } catch (err) {
      setStarting(false)
      setError(err instanceof Error ? err.message : 'Could not start reconstruction')
    }
  }

  if (!jobId) {
    return (
      <main className="min-h-screen bg-amber-50 px-4 py-10 max-w-sm mx-auto text-center text-amber-700">
        No job found. <a href="/capture" className="underline">Start over</a>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <a href="/capture" className="text-amber-600 text-2xl leading-none">←</a>
        <div>
          <h1 className="text-lg font-bold text-amber-900">Review Segmentation</h1>
          <p className="text-xs text-amber-600">White areas become the 3D silhouette</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-amber-100 mb-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={contactSheetUrl}
          alt="AI segmentation preview"
          className="w-full max-h-96 object-contain rounded-xl bg-white"
        />
      </div>

      <div className="bg-amber-100 rounded-2xl p-4 mb-5">
        <h2 className="text-sm font-bold text-amber-900 mb-2">Before continuing</h2>
        <ul className="text-xs text-amber-700 list-disc list-inside space-y-1">
          <li>The full object should be white in most frames.</li>
          <li>Background should be mostly black.</li>
          <li>Bad masks usually mean the 3D model will be bad.</li>
        </ul>
      </div>

      <div className="mb-5">
        <h2 className="text-sm font-bold text-amber-900 mb-3">Shell complexity</h2>
        <div className="grid grid-cols-3 gap-2">
          {COMPLEXITY.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setComplexity(item.key)}
              className={`rounded-2xl p-3 text-left border transition-colors ${
                complexity === item.key
                  ? 'bg-amber-500 border-amber-500 text-white'
                  : 'bg-white border-amber-200 text-amber-800'
              }`}
            >
              <div className="text-sm font-bold">{item.label}</div>
              <div className={`text-[11px] mt-1 ${complexity === item.key ? 'text-amber-50' : 'text-amber-500'}`}>
                {item.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={startReconstruction}
        disabled={starting}
        className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-200 disabled:text-amber-400 text-white font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg"
      >
        {starting ? 'Starting…' : 'Generate Paper Model'}
      </button>

      <a
        href="/capture"
        className="block w-full text-center border-2 border-amber-300 text-amber-700 font-semibold py-3 rounded-2xl mt-3"
      >
        Retake Photos
      </a>
    </main>
  )
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ReviewContent />
    </Suspense>
  )
}
