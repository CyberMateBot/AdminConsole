import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const PORT = Number(process.env.PORT) || 3000

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

function apiBaseUrl() {
  return (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

    if (url.pathname === '/config.js') {
      const base = apiBaseUrl()
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
      res.end(`window.__APP_CONFIG__={apiBaseUrl:${JSON.stringify(base)}}`)
      return
    }

    if (url.pathname.startsWith('/api/')) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({
        error: 'API_BASE_URL is not configured on Admin Panel service',
        hint: 'Set API_BASE_URL=https://your-backend.up.railway.app in Railway variables',
      }))
      return
    }

    let file = decodeURIComponent(url.pathname)
    if (file === '/') file = '/index.html'

    let filePath = join(ROOT, file)
    let data

    try {
      data = await readFile(filePath)
    } catch {
      data = await readFile(join(ROOT, 'index.html'))
      file = '/index.html'
    }

    res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(500).end('Internal Server Error')
  }
}).listen(PORT, () => {
  const base = apiBaseUrl()
  console.log(`Listening on ${PORT}`)
  if (base) {
    console.log(`API proxy target: ${base}/api`)
  } else {
    console.warn('WARNING: API_BASE_URL is empty — admin panel cannot reach backend')
  }
})
