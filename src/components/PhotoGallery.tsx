'use client'

import { CapturedPhoto } from '@/types'

interface Props {
  photos: CapturedPhoto[]
  onDelete: (id: string) => void
}

export default function PhotoGallery({ photos, onDelete }: Props) {
  if (photos.length === 0) return null

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-amber-800">
          Captured photos ({photos.length})
        </h3>
        {photos.length >= 10 && (
          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
            ✓ Ready to process
          </span>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {photos.map((photo, index) => (
          <div key={photo.id} className="relative group aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.dataUrl}
              alt="Captured"
              className="w-full h-full object-cover rounded-lg"
            />
            <div className="absolute left-1 top-1 bg-black/60 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {index + 1}
            </div>
            <button
              onClick={() => onDelete(photo.id)}
              className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-active:opacity-100 touch-manipulation"
              aria-label="Delete photo"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
