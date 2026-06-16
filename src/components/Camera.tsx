'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { CapturedPhoto } from '@/types'
import { CAPTURE_GUIDE_STEPS, MAX_CAPTURE_PHOTOS } from '@/lib/captureGuide'
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
  const [cameraLoading, setCameraLoading] = useState(true)
  const [flash, setFlash] = useState(false)

  useEffect(() => {
    startCamera()
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  async function startCamera() {
    try {
      setCameraLoading(true)
      setPermissionDenied(false)
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionDenied(true)
        setCameraLoading(false)
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => undefined)
          setCameraReady(true)
          setCameraLoading(false)
        }
      }
      setCameraReady(true)
      setCameraLoading(false)
    } catch {
      setPermissionDenied(true)
      setCameraReady(false)
      setCameraLoading(false)
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return

    const remaining = Math.max(0, MAX_CAPTURE_PHOTOS - photos.length)
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

    onPhotos([...photos, ...loaded].slice(0, MAX_CAPTURE_PHOTOS))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function choosePhotos() {
    fileInputRef.current?.click()
  }

  const capture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) {
      startCamera()
      return
    }
    const video = videoRef.current
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      video.play().catch(() => undefined)
      setCameraReady(false)
      setTimeout(() => setCameraReady(true), 300)
      return
    }
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')!.drawImage(video, 0, 0)

    canvas.toBlob((blob) => {
      if (!blob) return
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      const photo: CapturedPhoto = { id: uuidv4(), dataUrl, blob, timestamp: Date.now() }
      onPhotos([...photos, photo].slice(0, MAX_CAPTURE_PHOTOS))
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
          Open the HTTPS tunnel URL on your phone for live camera capture, or choose photos from your library.
        </p>
        <button
          type="button"
          onClick={choosePhotos}
          disabled={photos.length >= MAX_CAPTURE_PHOTOS}
          className="bg-amber-500 text-white font-bold px-6 py-3 rounded-2xl shadow disabled:bg-amber-200 disabled:text-amber-400"
        >
          Choose Photos
        </button>
      </div>
    )
  }

  const currentStep = Math.min(photos.length, CAPTURE_GUIDE_STEPS.length - 1)
  const nextLabel = CAPTURE_GUIDE_STEPS[currentStep]
  const done = photos.length >= MAX_CAPTURE_PHOTOS

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
      <div className="bg-white rounded-2xl p-4 mb-4 border border-amber-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            Guided capture
          </span>
          <span className="text-xs text-amber-500">{photos.length} / {MAX_CAPTURE_PHOTOS}</span>
        </div>
        <div className="text-lg font-bold text-amber-900">
          {done ? 'Capture complete' : `Slot ${photos.length + 1}: ${nextLabel}`}
        </div>
        <p className="text-xs text-amber-600 mt-1">
          {done
            ? 'Continue to segmentation when ready.'
            : 'Take this angle next. The thumbnails below keep the same slot order.'}
        </p>
        <div className="grid grid-cols-12 gap-1 mt-3">
          {CAPTURE_GUIDE_STEPS.map((label, index) => (
            <div
              key={label}
              className={`h-2 rounded-full ${index < photos.length ? 'bg-amber-500' : index === photos.length ? 'bg-amber-300' : 'bg-amber-100'}`}
            />
          ))}
        </div>
        {!done && (
          <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-[11px] leading-4 text-amber-700">
            Keep the object centered, stay about the same distance away, and move around the object instead of rotating the phone angle randomly.
          </div>
        )}
      </div>

      <div className="relative bg-black rounded-2xl overflow-hidden aspect-[3/4]">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onCanPlay={() => {
            setCameraReady(true)
            setCameraLoading(false)
          }}
          className="w-full h-full object-cover"
        />
        {flash && <div className="absolute inset-0 bg-white opacity-60 pointer-events-none" />}
        {cameraLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-amber-100">Starting camera…</div>
            </div>
          </div>
        )}
        {/* Photo count badge */}
        <div className="absolute top-3 right-3 bg-black/60 text-white text-sm font-bold px-3 py-1 rounded-full">
          {photos.length} / {MAX_CAPTURE_PHOTOS}
        </div>
        {!done && (
          <div className="absolute left-3 bottom-3 right-3 bg-black/60 text-white text-sm font-semibold px-3 py-2 rounded-xl text-center">
            Next slot: {photos.length + 1} · {nextLabel}
          </div>
        )}
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
          disabled={done}
          className="w-20 h-20 rounded-full bg-white border-4 border-amber-400 shadow-lg active:scale-95 transition-transform disabled:opacity-40 flex items-center justify-center"
          aria-label="Take photo"
        >
          <div className={`w-14 h-14 rounded-full ${cameraReady ? 'bg-amber-400' : 'bg-amber-200'}`} />
        </button>
      </div>

      <p className="text-center text-sm text-amber-700 mt-3">
        Take one photo at each guide step. Avoid changing distance.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-amber-700">
        <div className="rounded-xl bg-white border border-amber-100 px-3 py-2">Good light, low shadows</div>
        <div className="rounded-xl bg-white border border-amber-100 px-3 py-2">No zoom between shots</div>
        <div className="rounded-xl bg-white border border-amber-100 px-3 py-2">Whole object visible</div>
        <div className="rounded-xl bg-white border border-amber-100 px-3 py-2">Retake blurry photos</div>
      </div>
      <button
        type="button"
        onClick={choosePhotos}
        disabled={done}
        className="mt-4 w-full border-2 border-amber-300 text-amber-700 font-semibold py-3 rounded-2xl disabled:opacity-40"
      >
        Choose from Photos
      </button>
    </div>
  )
}
