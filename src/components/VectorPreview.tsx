'use client'

import { useEffect, useState } from 'react'

interface Props {
  modelUrl: string
  jobId: string
  onSvgReady: (svg: string) => void
}

export default function VectorPreview({ modelUrl, jobId, onSvgReady }: Props) {
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [svgData, setSvgData] = useState<string | null>(null)

  useEffect(() => {
    async function loadSVG() {
      try {
        const response = await fetch(`/api/download?jobId=${encodeURIComponent(jobId)}`)
        if (!response.ok) throw new Error('SVG net is not ready')
        const svg = await response.text()
        setSvgData(svg)
        setStatus('done')
        onSvgReady(svg)
      } catch (err) {
        console.error('SVG load error:', err)
        setStatus('error')
      }
    }
    loadSVG()
  }, [modelUrl, jobId, onSvgReady])

  return (
    <div className="w-full">
      {status === 'loading' && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-amber-700">Loading printable SVG net…</p>
        </div>
      )}

      {status === 'done' && svgData && (
        <div className="bg-white rounded-2xl p-4 border-2 border-amber-200">
          <div
            className="w-full"
            style={{ aspectRatio: '1' }}
            dangerouslySetInnerHTML={{ __html: svgData }}
          />
          <p className="text-xs text-center text-amber-600 mt-2">
            Connected papercraft SVG net — tap Download below
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center text-red-600 py-8">
          <p>SVG net could not be loaded.</p>
          <p className="text-sm text-red-400 mt-1">Try reloading the page.</p>
        </div>
      )}
    </div>
  )
}
