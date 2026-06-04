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

// Pick exactly n items from arr, cycling if arr is shorter than n
export function pickEvenly<T>(arr: T[], n: number): T[] {
  if (arr.length === 0) return []
  return Array.from({ length: n }, (_, i) =>
    arr.length <= n
      ? arr[i % arr.length]
      : arr[Math.round((i * (arr.length - 1)) / (n - 1))]
  )
}

// Build multipart body manually — bypasses Node.js FormData serialization quirks
function buildMultipart(photos: Buffer[]): { body: Buffer; contentType: string } {
  const boundary = '----KiriBoundary' + Date.now()
  const parts: Buffer[] = []

  for (let i = 0; i < photos.length; i++) {
    const filename = `photo_${String(i).padStart(4, '0')}.jpg`
    // Ensure clean copy from Buffer pool
    const data = Buffer.from(photos[i])
    console.log(`[kiri upload] photo ${i}: ${data.byteLength} bytes, first4=${data.slice(0,4).toString('hex')}`)
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      `Content-Type: image/jpeg\r\n\r\n`
    ))
    parts.push(data)
    parts.push(Buffer.from('\r\n'))
  }
  parts.push(Buffer.from(`--${boundary}--\r\n`))

  return {
    body: Buffer.concat(parts),
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

// Upload images and return the serialize ID
export async function uploadImages(photos: Buffer[]): Promise<string> {
  const { body, contentType } = buildMultipart(photos)
  console.log(`[kiri upload] total multipart body: ${body.byteLength} bytes`)

  const res = await fetch(`${BASE_URL}/v1/open/photo/image`, {
    method: 'POST',
    headers: {
      ...authHeader(),
      'Content-Type': contentType,
      'Content-Length': String(body.byteLength),
    },
    body: new Uint8Array(body),
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
