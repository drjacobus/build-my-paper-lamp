export const CAPTURE_GUIDE_STEPS = [
  'Front',
  'Front right',
  'Right side',
  'Back right',
  'Back',
  'Back left',
  'Left side',
  'Front left',
  'Slightly above front',
  'Slightly above right',
  'Slightly above back',
  'Slightly above left',
] as const

export const MIN_CAPTURE_PHOTOS = 10
export const MAX_CAPTURE_PHOTOS = CAPTURE_GUIDE_STEPS.length
