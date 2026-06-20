import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..', 'dist')
const HOST = process.env.HOST || '0.0.0.0'
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
  const raw = process.env.API_BASE_URL
    || process.env.VITE_API_BASE_URL
    || process.env.VITE_API_URL
    || ''
  return raw.replace(/\/$/, '')
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

async function serveIndex(res) {
  let html = await readFile(join(ROOT, 'index.html'), 'utf8')
  html = injectConfig(html)
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(html)
}

function proxyApi(req, res, pathname, search) {
  const base = apiBaseUrl()
  if (!base) {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({
      error: 'API_BASE_URL is not configured on Admin Panel service',
      hint: 'Set API_BASE_URL=https://your-backend.up.railway.app in Railway variables',
    }))
    return
  }

  const target = new URL(`${pathname}${search}`, `${base}/`)
  const transport = target.protocol === 'https:' ? httpsRequest : httpRequest

  const headers = { ...req.headers, host: target.host }
  delete headers.connection

  const proxyReq = transport(
    {
      protocol: target.protocol,
      hostname: target.hostname,
      port: target.port || (target.protocol === 'https:' ? 443 : 80),
      path: `${target.pathname}${target.search}`,
      method: req.method,
      headers,
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
      proxyRes.pipe(res)
    },
  )

  proxyReq.on('error', (err) => {
    console.error('API proxy error:', err.message)
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Backend unreachable', detail: err.message }))
    }
  })

  req.pipe(proxyReq)
}

if (!existsSync(join(ROOT, 'index.html'))) {
  console.error(`FATAL: ${join(ROOT, 'index.html')} not found. Run "npm run build" before start.`)
  process.exit(1)
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

    if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
      proxyApi(req, res, url.pathname, url.search)
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
  } catch (err) {
    console.error('Request error:', err)
    if (!res.headersSent) res.writeHead(500).end('Internal Server Error')
  }
}).listen(PORT, HOST, () => {
  const base = apiBaseUrl()
  console.log(`Listening on http://${HOST}:${PORT}`)
  console.log(`Serving static files from ${ROOT}`)
  if (base) {
    console.log(`API proxy target: ${base}`)
  } else {
    console.warn('WARNING: API_BASE_URL is empty — /api requests will return 502')
  }
})
