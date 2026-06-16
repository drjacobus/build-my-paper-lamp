'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { CapturedPhoto } from '@/types'
import { v4 as uuidv4 } from 'uuid'

interface Props {
  onPhotos: (photos: CapturedPhoto[]) => void
  photos: CapturedPhoto[]
}

export default function Camera({ onPhotos, photos }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startCamera() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionDenied(true)
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => setCameraReady(true)
      }
    } catch {
      setPermissionDenied(true)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return

    const remaining = Math.max(0, 15 - photos.length)
    const selected = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remaining)

    const loaded = await Promise.all(
      selected.map(
        (file) =>
          new Promise<CapturedPhoto>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                id: uuidv4(),
                dataUrl: String(reader.result),
                blob: file,
                timestamp: Date.now(),
              })
            }
            reader.readAsDataURL(file)
          })
      )
    )

    onPhotos([...photos, ...loaded].slice(0, 15))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function choosePhotos() {
    fileInputRef.current?.click()
  }

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const photo: CapturedPhoto = { id: uuidv4(), dataUrl, blob, timestamp: Date.now() }
      onPhotos([...photos, photo])
      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate(50)
      setFlash(true)
      setTimeout(() => setFlash(false), 150)
    }, 'image/jpeg', 0.85)
  }, [photos, onPhotos])

  if (permissionDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4 text-center px-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
        <div className="text-5xl">📷</div>
        <p className="text-amber-800 font-medium">Camera access denied</p>
        <p className="text-sm text-amber-600">
          Local network camera access can be blocked by the browser. Choose 10–15 photos from your library instead.
        </p>
        <button
          type="button"
          onClick={choosePhotos}
          disabled={photos.length >= 15}
          className="bg-amber-500 text-white font-bold px-6 py-3 rounded-2xl shadow disabled:bg-amber-200 disabled:text-amber-400"
        >
          Choose Photos
        </button>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {flash && <div className="absolute inset-0 bg-white opacity-60 pointer-events-none" />}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full">
          {photos.length} / 15
        </div>
        {/* Crosshair guide */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-24 border-2 border-white/40 rounded-lg" />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Capture button */}
      <div className="flex justify-center mt-6">
        <button
          onClick={capture}
          disabled={!cameraReady || photos.length >= 15}
          className="w-20 h-20 rounded-full bg-white border-4 border-amber-400 shadow-lg active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center"
          aria-label="Take photo"
        >
          <div className="w-14 h-14 rounded-full bg-amber-400" />
        </button>
      </div>

      <p className="text-center text-sm text-amber-700 mt-3">
        Walk around your object once — aim for 10–15 clean photos
      </p>
      <button
        type="button"
        onClick={choosePhotos}
        disabled={photos.length >= 15}
        className="mt-4 w-full border-2 border-amber-300 text-amber-700 font-semibold py-3 rounded-2xl disabled:opacity-40"
      >
        Choose from Photos
      </button>
    </div>
  )
}
