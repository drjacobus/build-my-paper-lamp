#!/usr/bin/env node
// Standalone Kiri Engine upload tester — run from YOUR machine, not Claude's environment.
//
// Usage:
//   KIRI_API_KEY=kiri_xxx node test-kiri-standalone.js photo1.jpg photo2.jpg ...
//
// If you don't pass photos, it downloads 20 sample images from the web.
// Tries multiple field names and upload strategies to find what works.

const https = require('https')
const http  = require('http')
const fs    = require('fs')
const path  = require('path')

const API_KEY = process.env.KIRI_API_KEY
if (!API_KEY) {
  console.error('ERROR: set KIRI_API_KEY env var before running')
  console.error('  e.g.  KIRI_API_KEY=kiri_xxx node test-kiri-standalone.js')
  process.exit(1)
}

const BASE = 'https://api.kiriengine.app/api'

// ── helpers ──────────────────────────────────────────────────────────────────

function fetchBuf(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects === 0) return reject(new Error('Too many redirects: ' + url))
    const client = url.startsWith('https') ? https : http
    client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href
        res.resume()
        return fetchBuf(next, redirects - 1).then(resolve).catch(reject)
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    }).on('error', reject)
  })
}

function postRaw(url, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': String(body.byteLength) },
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString() }))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

function buildMultipart(photos, fieldName) {
  const boundary = '----KiriBoundary' + Date.now()
  const parts = []
  for (let i = 0; i < photos.length; i++) {
    const filename = `photo_${String(i).padStart(4, '0')}.jpg`
    const data = Buffer.from(photos[i])
    parts.push(Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"\r\n` +
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

async function tryUpload(photos, fieldName, label) {
  const { body, contentType } = buildMultipart(photos, fieldName)
  process.stdout.write(`  [${label}] field="${fieldName}" photos=${photos.length} body=${body.byteLength}B ... `)
  try {
    const { status, text } = await postRaw(
      `${BASE}/v1/open/photo/image`,
      body,
      { Authorization: `Bearer ${API_KEY}`, 'Content-Type': contentType }
    )
    const snippet = text.slice(0, 200).replace(/\n/g, ' ')
    console.log(`HTTP ${status}: ${snippet}`)
    return { ok: status >= 200 && status < 300, status, text }
  } catch (e) {
    console.log(`ERROR: ${e.message}`)
    return { ok: false, error: e.message }
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Kiri Engine Standalone Tester ===')
  console.log(`API key: ${API_KEY.slice(0, 12)}...${API_KEY.slice(-4)}\n`)

  // 1. Get photos
  let photos = []
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'))

  if (args.length > 0) {
    console.log(`Loading ${args.length} photos from disk...`)
    for (const f of args) {
      const buf = fs.readFileSync(path.resolve(f))
      console.log(`  ${path.basename(f)}: ${buf.byteLength} bytes, first4=${buf.slice(0,4).toString('hex')}`)
      photos.push(buf)
    }
  } else {
    console.log('No photos provided — downloading 5 sample images and repeating to 20...')
    const SAMPLE_URLS = [
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png',
      'https://www.w3schools.com/css/img_5terre.jpg',
      'https://www.w3schools.com/css/img_forest.jpg',
      'https://www.w3schools.com/css/img_lights.jpg',
      'https://www.w3schools.com/css/img_mountains.jpg',
    ]
    const bufs = []
    for (let i = 0; i < SAMPLE_URLS.length; i++) {
      process.stdout.write(`  Fetching sample ${i+1}/${SAMPLE_URLS.length}... `)
      try {
        const b = await fetchBuf(SAMPLE_URLS[i])
        console.log(`${b.byteLength}B first4=${b.slice(0,4).toString('hex')}`)
        bufs.push(b)
      } catch(e) {
        console.log(`FAILED: ${e.message}`)
      }
    }
    if (bufs.length === 0) {
      console.error('\nCould not download any sample images. Pass real JPEG files as arguments.')
      process.exit(1)
    }
    // cycle to reach 20
    photos = Array.from({ length: 20 }, (_, i) => bufs[i % bufs.length])
  }

  // ensure we have at least 20 by cycling
  if (photos.length < 20) {
    const orig = [...photos]
    while (photos.length < 20) photos.push(orig[photos.length % orig.length])
    console.log(`  → cycled to ${photos.length} photos to meet Kiri minimum`)
  }
  console.log(`\nTotal photos: ${photos.length}\n`)

  // 2. Try different field names
  console.log('── Strategy 1: all photos in one request, different field names ──')
  const fieldNames = ['file', 'files', 'image', 'images', 'photo', 'photos']
  let winner = null
  for (const name of fieldNames) {
    const result = await tryUpload(photos, name, 'batch')
    if (result.ok) {
      try {
        const json = JSON.parse(result.text)
        if (json.code === 0) { winner = { fieldName: name, serializeId: json.data?.serialize }; break }
        console.log(`    ↑ code=${json.code} msg=${json.msg}`)
      } catch { console.log('    ↑ non-JSON response') }
    }
    await new Promise(r => setTimeout(r, 300))
  }

  if (winner) {
    console.log(`\n✅ SUCCESS  field="${winner.fieldName}" serializeId=${winner.serializeId}`)
    return
  }

  // 3. Try uploading photos one at a time
  console.log('\n── Strategy 2: one photo per request (field="file") ──')
  for (let count of [1, 5]) {
    const subset = photos.slice(0, count)
    const result = await tryUpload(subset, 'file', `${count}-photo`)
    if (result.ok) {
      try {
        const json = JSON.parse(result.text)
        if (json.code === 0) {
          console.log(`\n✅ Works with ${count} photo(s)! serializeId=${json.data?.serialize}`)
          break
        }
        console.log(`    ↑ code=${json.code} msg=${json.msg}`)
      } catch {}
    }
    await new Promise(r => setTimeout(r, 300))
  }

  // 4. Check auth
  console.log('\n── Strategy 3: check auth with GET /v1/open/model/getStatus ──')
  await new Promise((resolve, reject) => {
    https.get(`${BASE}/v1/open/model/getStatus?serialize=test`, {
      headers: { Authorization: `Bearer ${API_KEY}` }
    }, res => {
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => {
        console.log(`  GET status check: HTTP ${res.statusCode}: ${Buffer.concat(chunks).toString().slice(0,200)}`)
        resolve()
      })
    }).on('error', e => { console.log(`  ERROR: ${e.message}`); resolve() })
  })

  console.log('\n── Summary ──')
  console.log('Paste ALL output above and share it — it will show exactly what Kiri rejects.')
}

main().catch(e => { console.error('Fatal:', e); process.exit(1) })
