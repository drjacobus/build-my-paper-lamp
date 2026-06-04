'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Camera from '@/components/Camera'
import PhotoGallery from '@/components/PhotoGallery'
import { CapturedPhoto } from '@/types'

const MIN_PHOTOS = 15
const MAX_PHOTOS = 25

// Resize + compress a photo blob to stay within Vercel's 4.5MB function limit.
// 1024px wide at 80% JPEG quality → ~150KB per photo.
async function compressPhoto(blob: Blob): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const MAX = 1024
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      const canvas = document.createElement('canvas')
      canvas.width  = Math.round(img.width  * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      canvas.toBlob(
        (compressed) => resolve(compressed ?? blob),
        'image/jpeg',
        0.8
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(blob) }
    img.src = url
  })
}

export default function CapturePage() {
  const router = useRouter()
  const [photos, setPhotos] = useState<CapturedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadLabel, setUploadLabel] = useState('Uploading…')
  const [error, setError] = useState<string | null>(null)

  const handleDelete = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const handlePhotos = useCallback((newPhotos: CapturedPhoto[]) => {
    setPhotos(newPhotos.slice(0, MAX_PHOTOS))
  }, [])

  async function handleProcess() {
    if (photos.length < MIN_PHOTOS) return
    setUploading(true)
    setError(null)

    try {
      // Compress all photos client-side before uploading
      setUploadLabel('Compressing photos…')
      const compressed = await Promise.all(photos.map(p => compressPhoto(p.blob)))

      setUploadLabel('Uploading…')
      const formData = new FormData()
      compressed.forEach((blob, i) => formData.append('photos', blob, `photo_${i}.jpg`))

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        let errMsg = 'Upload failed'
        try {
          const body = await res.json()
          errMsg = typeof body.error === 'string' ? body.error : `Upload failed (${res.status})`
        } catch { errMsg = `Upload failed (${res.status})` }
        throw new Error(errMsg)
      }
      const data = await res.json()

      const url = data.demo
        ? `/processing?jobId=${data.jobId}&demo=true`
        : `/processing?jobId=${data.jobId}&projectId=${encodeURIComponent(data.projectId)}`

      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setUploading(false)
    }
  }

  const ready = photos.length >= MIN_PHOTOS

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-6 max-w-sm mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="text-amber-600 text-2xl leading-none">←</a>
        <div>
          <h1 className="text-lg font-bold text-amber-900">Capture Photos</h1>
          <p className="text-xs text-amber-600">Walk around your object — all angles</p>
        </div>
      </div>

      <div className="mb-5">
        <div className="flex justify-between text-xs text-amber-700 mb-1">
          <span>{photos.length} / {MAX_PHOTOS} photos</span>
          <span>{photos.length < MIN_PHOTOS ? `Need at least ${MIN_PHOTOS}` : 'Ready to process'}</span>
        </div>
        <div className="w-full bg-amber-100 rounded-full h-2">
          <div
            className="bg-amber-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((photos.length / MIN_PHOTOS) * 100, 100)}%` }}
          />
        </div>
      </div>

      <Camera photos={photos} onPhotos={handlePhotos} />
      <PhotoGallery photos={photos} onDelete={handleDelete} />

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 pb-8">
        <button
          onClick={handleProcess}
          disabled={!ready || uploading}
          className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-200 disabled:text-amber-400 text-white font-bold text-lg py-4 rounded-2xl transition-colors shadow-lg"
        >
          {uploading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {uploadLabel}
            </span>
          ) : ready ? (
            `Process ${photos.length} Photos →`
          ) : (
            `${MIN_PHOTOS - photos.length} more photos needed`
          )}
        </button>
      </div>
    </main>
  )
}
