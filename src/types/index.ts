export type JobStatus =
  | 'idle'
  | 'uploading'
  | 'uploaded'
  | 'scanning'
  | 'review'
  | 'generating_svg'
  | 'completed'
  | 'failed'

export interface Job {
  jobId: string
  status: JobStatus
  progress: number
  step: string
  error?: string
  modelUrl?: string
  modelPath?: string
  contactSheetUrl?: string
  contactSheetPath?: string
  svgPath?: string
  svgData?: string
  photoCount?: number
  createdAt: number
}

export interface UploadResponse {
  jobId: string
  photoCount: number
  estimatedTime: number
}

export interface StatusResponse {
  jobId: string
  status: JobStatus
  progress: number
  step: string
  error?: string
  modelUrl?: string
}

export interface CapturedPhoto {
  id: string
  dataUrl: string
  blob: Blob
  timestamp: number
}
