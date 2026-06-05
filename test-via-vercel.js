// Tests the full upload → status flow against a deployed Vercel URL.
// Usage: TEST_URL=https://build-my-paper-lamp.vercel.app node test-via-vercel.js
//
// Uses a locally-generated synthetic JPEG so no external image CDN needed.

const https = require('https')
const http = require('http')

const BASE = process.env.TEST_URL || 'http://localhost:3000'
const PHOTO_COUNT = 20

// Generate a minimal valid JPEG buffer (~600 bytes, 1×1 red pixel)
function makeSyntheticJpeg() {
  // SOI + APP0 + DQT + SOF0 + DHT + SOS + image data + EOI
  // This is the canonical minimal JFIF 1×1 JPEG
  const hex =
    'ffd8ffe000104a46494600010100000100010000' +
    'ffdb004300080606070605080707070909080a0c' +
    '140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20' +
    '242e2720222c231c1c2837292c30313434341f27' +
    '393d38323c2e333432ffc0000b080001000101011' +
    '100ffc4001f0000010501010101010100000000000' +
    '00000010203040506070809ffda00080101000003' +
    '01007f4bffd9'

  // Minimal 1x1 JPEG in base64
  const b64 = Buffer.from(
    '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U' +
    'HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA' +
    'AhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgUE/8QAHRAAAgIDAQEBAAAAAAAAAAAAAQID' +
    'BAURIf/EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMB' +
    'AAIRAXEAP3FqvL+s2RW3W3PVIg2fQAAAAAAAAAAAAAAAAA//2Q==',
    'base64'
  )
  return b64
}

function postMultipart(url, photos) {
  return new Promise((resolve, reject) => {
    const boundary = '----TestBoundary' + Date.now()
    const parts = []
    for (let i = 0; i < photos.length; i++) {
      const filename = `photo_${String(i).padStart(4, '0')}.jpg`
      parts.push(Buffer.from(
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="photos"; filename="${filename}"\r\n` +
        `Content-Type: image/jpeg\r\n\r\n`
      ))
      parts.push(photos[i])
      parts.push(Buffer.from('\r\n'))
    }
    parts.push(Buffer.from(`--${boundary}--\r\n`))
    const body = Buffer.concat(parts)

    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    const req = client.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': String(body.byteLength),
      },
    }, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString()
        try { resolve({ status: res.statusCode, data: JSON.parse(text) }) }
        catch { resolve({ status: res.statusCode, data: text }) }
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const client = parsed.protocol === 'https:' ? https : http
    client.get(url, (res) => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString()
        try { resolve(JSON.parse(text)) } catch { resolve(text) }
      })
    }).on('error', reject)
  })
}

async function run() {
  console.log(`=== Paper Lamp Upload Test ===`)
  console.log(`Target: ${BASE}\n`)

  const photo = makeSyntheticJpeg()
  console.log(`Synthetic JPEG: ${photo.byteLength} bytes, first4=${photo.slice(0,4).toString('hex')}`)

  const photos = Array.from({ length: PHOTO_COUNT }, () => photo)
  console.log(`Uploading ${PHOTO_COUNT} photos to ${BASE}/api/upload...\n`)

  const { status, data } = await postMultipart(`${BASE}/api/upload`, photos)
  console.log(`Upload HTTP ${status}:`, JSON.stringify(data, null, 2))

  if (data.demo) {
    console.log('\n⚠️  Demo mode — KIRI_API_KEY not set on server')
    return
  }
  if (data.error) {
    console.log('\n❌ Upload error:', data.error)
    return
  }

  const { jobId, projectId } = data
  console.log(`\n✅ Uploaded! projectId=${projectId} jobId=${jobId}`)
  console.log('Polling /api/status every 5s...\n')

  for (let i = 0; i < 12; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const s = await getJson(`${BASE}/api/status?projectId=${encodeURIComponent(projectId)}`)
    const t = new Date().toLocaleTimeString()
    console.log(`[${t}] status=${s.status} stage=${s.stage ?? ''} progress=${s.progress ?? 0}%`)
    if (s.status === 'completed') {
      console.log(`\n✅ Complete! modelUrl=${s.modelUrl}`)
      return
    }
    if (s.status === 'failed') {
      console.log(`\n❌ Failed: ${s.error}`)
      return
    }
  }
  console.log('\n⏰ Timed out after 60s of polling')
}

run().catch(err => { console.error('Fatal:', err.message); process.exit(1) })
