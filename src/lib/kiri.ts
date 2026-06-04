// Kiri Engine API client
// Docs: https://docs.kiriengine.app
// Auth: Bearer token in Authorization header
// Host allowlist must include your Vercel domain in the Kiri developer portal

const BASE_URL = 'https://api.kiriengine.app/api'

function authHeader() {
  return { Authorization: `Bearer ${process.env.KIRI_API_KEY ?? ''}` }
}

// Status codes returned by getStatus
// -1 = failed, 0 = queued, 1-3 = processing, 4 = complete
export function parseStatus(code: number): { status: string; progress: number; stage: string } {
  if (code === -1) return { status: 'failed',    progress: 0,   stage: 'failed'    }
  if (code === 0)  return { status: 'queued',    progress: 10,  stage: 'queued'    }
  if (code === 1)  return { status: 'processing', progress: 35, stage: 'analysing' }
  if (code === 2)  return { status: 'processing', progress: 60, stage: 'building'  }
  if (code === 3)  return { status: 'processing', progress: 85, stage: 'finalising'}
  if (code === 4)  return { status: 'completed', progress: 100, stage: 'completed' }
  return { status: 'processing', progress: 10, stage: 'queued' }
}

// Pick n evenly-spaced items from an array
export function pickEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length <= n) return arr
  return Array.from({ length: n }, (_, i) =>
    arr[Math.round((i * (arr.length - 1)) / (n - 1))]
  )
}

// Upload images and return the serialize ID
export async function uploadImages(photos: Buffer[]): Promise<string> {
  const form = new FormData()
  for (let i = 0; i < photos.length; i++) {
    // .slice() forces a copy into a plain ArrayBuffer, avoiding SharedArrayBuffer issues
    const bytes = new Uint8Array(photos[i]).slice()
    console.log(`[kiri upload] photo ${i}: ${bytes.byteLength} bytes`)
    const blob = new Blob([bytes], { type: 'image/jpeg' })
    form.append('files', blob, `photo_${String(i).padStart(4, '0')}.jpg`)
  }

  const res = await fetch(`${BASE_URL}/v1/open/photo/image`, {
    method: 'POST',
    headers: authHeader(),
    body: form,
  })

  const text = await res.text()
  console.log(`[kiri upload] status=${res.status} body=${text.slice(0, 300)}`)
  if (!res.ok) throw new Error(`Kiri upload failed: ${res.status} ${text}`)

  let data: Record<string, unknown>
  try { data = JSON.parse(text) } catch { throw new Error(`Kiri upload non-JSON: ${text}`) }

  if (data.code !== 0) throw new Error(`Kiri upload error: ${data.msg ?? text}`)

  const serializeId = (data.data as Record<string, unknown>)?.serialize as string
  if (!serializeId) throw new Error(`Kiri upload returned no serialize ID: ${text}`)

  return serializeId
}

// Poll processing status
export async function getStatus(serializeId: string): Promise<{ status: string; progress: number; stage: string }> {
  const res = await fetch(
    `${BASE_URL}/v1/open/model/getStatus?serialize=${encodeURIComponent(serializeId)}`,
    { headers: authHeader() }
  )

  const text = await res.text()
  if (!res.ok) throw new Error(`Kiri status failed: ${res.status} ${text}`)

  let data: Record<string, unknown>
  try { data = JSON.parse(text) } catch { throw new Error(`Kiri status non-JSON: ${text}`) }

  if (data.code !== 0) throw new Error(`Kiri status error: ${data.msg ?? text}`)

  const code = (data.data as Record<string, unknown>)?.status as number ?? -1
  return parseStatus(code)
}

// Get a 60-minute download URL for the completed model zip
export async function getDownloadUrl(serializeId: string): Promise<string> {
  const res = await fetch(
    `${BASE_URL}/v1/open/model/getModelZip?serialize=${encodeURIComponent(serializeId)}`,
    { headers: authHeader() }
  )

  const text = await res.text()
  if (!res.ok) throw new Error(`Kiri download failed: ${res.status} ${text}`)

  let data: Record<string, unknown>
  try { data = JSON.parse(text) } catch { throw new Error(`Kiri download non-JSON: ${text}`) }

  if (data.code !== 0) throw new Error(`Kiri download error: ${data.msg ?? text}`)

  const url = (data.data as Record<string, unknown>)?.url as string
  if (!url) throw new Error(`Kiri download returned no URL: ${text}`)

  return url
}
