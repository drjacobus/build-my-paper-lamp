'use client'

import { useCallback, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ModelViewer from '@/components/ModelViewer'
import VectorPreview from '@/components/VectorPreview'

function ResultsContent() {
  const params = useSearchParams()
  const jobId = params.get('jobId') ?? ''
  const modelUrl = params.get('modelUrl') ?? ''

  const [svgData, setSvgData] = useState<string | null>(null)
  const [tab, setTab] = useState<'3d' | 'svg'>('3d')

  const resolvedModelUrl = modelUrl ||
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Duck/glTF-Binary/Duck.glb'

  const handleSvgReady = useCallback((svg: string) => {
    setSvgData(svg)
    setTab('svg')
  }, [])

  function downloadSVG() {
    if (!svgData) return
    const blob = new Blob([svgData], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lamp-${jobId.slice(0, 8) || 'design'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function downloadFromServer() {
    const res = await fetch(`/api/download?jobId=${jobId}`)
    if (!res.ok) { downloadSVG(); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lamp-${jobId.slice(0, 8)}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!jobId && !modelUrl) {
    return (
      <div className="text-center pt-20 text-amber-700">
        No results to show. <a href="/capture" className="underline">Start over</a>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-6 max-w-sm mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <a href="/" className="text-amber-600 text-2xl leading-none">←</a>
        <div>
          <h1 className="text-lg font-bold text-amber-900">Your Lamp Design</h1>
          <p className="text-xs text-amber-600">3D shell & printable SVG net</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-amber-100 rounded-xl p-1 mb-5">
        <button
          onClick={() => setTab('3d')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === '3d' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-600'
          }`}
        >
          3D Preview
        </button>
        <button
          onClick={() => setTab('svg')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === 'svg' ? 'bg-white text-amber-900 shadow-sm' : 'text-amber-600'
          }`}
        >
          SVG Net {svgData && '✓'}
        </button>
      </div>

      {/* 3D Viewer */}
      {tab === '3d' && (
        <div className="mb-5">
          <ModelViewer modelUrl={resolvedModelUrl} />
          <p className="text-xs text-center text-amber-500 mt-2">Drag to rotate · Pinch to zoom</p>
        </div>
      )}

      {/* SVG Generator + Preview */}
      {tab === 'svg' && (
        <div className="mb-5">
          <VectorPreview
            modelUrl={resolvedModelUrl}
            jobId={jobId}
            onSvgReady={handleSvgReady}
          />
        </div>
      )}

      {/* Generate SVG prompt if on 3D tab */}
      {tab === '3d' && !svgData && (
        <div className="bg-amber-100 rounded-2xl p-4 mb-5 text-center">
          <p className="text-sm text-amber-800 mb-3">
            Ready to inspect the printable SVG net?
          </p>
          <button
            onClick={() => setTab('svg')}
            className="bg-amber-500 text-white font-semibold px-6 py-2.5 rounded-xl text-sm"
          >
            Show SVG Net →
          </button>
        </div>
      )}

      {/* Download */}
      {svgData && (
        <button
          onClick={downloadSVG}
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg mb-4"
        >
          ⬇ Download SVG
        </button>
      )}

      {/* Start over */}
      <a
        href="/capture"
        className="block w-full text-center border-2 border-amber-300 text-amber-700 font-semibold py-3 rounded-2xl"
      >
        Create another lamp
      </a>

      {/* Instructions */}
      <div className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-semibold text-amber-900 mb-2 text-sm">What to do with your SVG</h3>
        <ol className="text-xs text-amber-700 space-y-1 list-decimal list-inside">
          <li>Open in Inkscape or Adobe Illustrator</li>
          <li>Scale to your desired lamp size</li>
          <li>Send to a laser cutter or print as a cutting template</li>
          <li>Cut, score fold lines, and glue</li>
          <li>Add a small LED light inside — done! 🏮</li>
        </ol>
      </div>
    </main>
  )
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-amber-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>}>
      <ResultsContent />
    </Suspense>
  )
}
