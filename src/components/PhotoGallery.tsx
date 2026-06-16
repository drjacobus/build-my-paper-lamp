'use client'

import { CapturedPhoto } from '@/types'
import { CAPTURE_GUIDE_STEPS, MIN_CAPTURE_PHOTOS } from '@/lib/captureGuide'

interface Props {
  photos: CapturedPhoto[]
  onDelete: (id: string) => void
  onMove: (id: string, direction: -1 | 1) => void
}

export default function PhotoGallery({ photos, onDelete, onMove }: Props) {
  if (photos.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-800">
          Captured photos ({photos.length})
        </h3>
        {photos.length >= MIN_CAPTURE_PHOTOS && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Ready to process
          </span>
        )}
      </div>
      <p className="text-xs text-amber-600 mb-3">
        Arrange the photos in one smooth turn around the object. Each slot below matches the guided angle.
      </p>
      <div className="grid grid-cols-3 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="rounded-xl bg-white border border-amber-100 p-1.5 shadow-sm">
            <div className="relative aspect-square">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.dataUrl}
                alt={`Slot ${index + 1}: ${CAPTURE_GUIDE_STEPS[index] ?? 'Extra angle'}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute left-1 top-1 bg-black/60 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                {index + 1}
              </div>
              <button
                onClick={() => onDelete(photo.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white text-sm flex items-center justify-center touch-manipulation shadow"
                aria-label={`Delete slot ${index + 1}`}
              >
                ×
              </button>
            </div>
            <div className="mt-1 text-[10px] leading-tight text-amber-800 font-semibold min-h-7">
              {CAPTURE_GUIDE_STEPS[index] ?? 'Extra angle'}
            </div>
            <div className="mt-1 grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onMove(photo.id, -1)}
                disabled={index === 0}
                className="h-7 rounded-lg bg-amber-50 text-amber-700 disabled:text-amber-200 disabled:bg-amber-50 font-bold"
                aria-label={`Move slot ${index + 1} earlier`}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => onMove(photo.id, 1)}
                disabled={index === photos.length - 1}
                className="h-7 rounded-lg bg-amber-50 text-amber-700 disabled:text-amber-200 disabled:bg-amber-50 font-bold"
                aria-label={`Move slot ${index + 1} later`}
              >
                →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
