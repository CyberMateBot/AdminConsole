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

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
])

function apiBaseUrl() {
  return (process.env.API_BASE_URL || process.env.VITE_API_BASE_URL || '').replace(/\/$/, '')
}

function injectConfig(html) {
  const base = apiBaseUrl()
  const tag = `<script>window.__APP_CONFIG__={apiBaseUrl:${JSON.stringify(base)}}</script>`
  const withoutConfigScript = html.replace(/\s*<script[^>]*src=["']\/config\.js["'][^>]*><\/script>/i, '')
  if (withoutConfigScript.includes('__APP_CONFIG__')) {
    return withoutConfigScript.replace(
      /<script>window\.__APP_CONFIG__[^<]*<\/script>/,
      tag,
    )
  }
  return withoutConfigScript.replace('<head>', `<head>\n    ${tag}`)
}

function safeFilePath(pathname) {
  const relative = pathname.replace(/^\/+/, '')
  const filePath = join(ROOT, relative)
  const normalizedRoot = join(ROOT)
  if (!filePath.startsWith(normalizedRoot)) return null
  return filePath
}

async function readRequestBody(req) {
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  if (chunks.length === 0) return undefined
  return Buffer.concat(chunks)
}

function buildProxyHeaders(req) {
  const headers = {}
  for (const [key, value] of Object.entries(req.headers)) {
    if (value === undefined) continue
    const lower = key.toLowerCase()
    if (HOP_BY_HOP.has(lower)) continue
    if (lower === 'host') continue
    headers[key] = value
  }
  return headers
}

async function proxyApi(req, res, url) {
  const base = apiBaseUrl()
  if (!base) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({
      error: 'API_BASE_URL is not configured on Admin Panel service',
      hint: 'Set API_BASE_URL=https://your-backend.up.railway.app in Railway variables',
    }))
    return
  }

  const targetUrl = `${base}${url.pathname}${url.search}`

  try {
    const body = req.method === 'GET' || req.method === 'HEAD'
      ? undefined
      : await readRequestBody(req)

    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: buildProxyHeaders(req),
      body,
      redirect: 'manual',
    })

    const responseHeaders = {}
    upstream.headers.forEach((value, key) => {
      const lower = key.toLowerCase()
      if (HOP_BY_HOP.has(lower)) return
      responseHeaders[key] = value
    })

    res.writeHead(upstream.status, responseHeaders)
    const responseBody = Buffer.from(await upstream.arrayBuffer())
    res.end(responseBody)
  } catch (error) {
    console.error('API proxy error:', targetUrl, error)
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({
      error: 'Failed to reach backend API',
      hint: `Check API_BASE_URL (${base}) and that the backend service is running`,
    }))
  }
}

async function serveIndex(res) {
  let html = await readFile(join(ROOT, 'index.html'), 'utf8')
  html = injectConfig(html)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

createServer(async (req, res) => {
  try {
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`)

    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' })
      res.end('ok')
      return
    }

    if (url.pathname === '/config.js') {
      const base = apiBaseUrl()
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' })
      res.end(`window.__APP_CONFIG__={apiBaseUrl:${JSON.stringify(base)}}`)
      return
    }

    if (url.pathname.startsWith('/api/')) {
      await proxyApi(req, res, url)
      return
    }

    let file = decodeURIComponent(url.pathname)
    if (file === '/') {
      await serveIndex(res)
      return
    }

    const filePath = safeFilePath(file)
    if (!filePath) {
      res.writeHead(403).end('Forbidden')
      return
    }

    let data

    try {
      data = await readFile(filePath)
    } catch {
      await serveIndex(res)
      return
    }

    if (file === '/index.html') {
      await serveIndex(res)
      return
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
    console.log(`API proxy target: ${base}`)
  } else {
    console.warn('WARNING: API_BASE_URL is empty — /api requests will return 502')
  }
})
