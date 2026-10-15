import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    localReceiptApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname || '', './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
  preview: {
    host: '0.0.0.0',
    port: parseInt(process.env.PORT || '8443'),
  },
})

/** Local dev middleware for /api/receipt, /api/binance, /api/bk, /api/ng using puppeteer-core */
function localReceiptApiPlugin(): Plugin {
  return {
    name: 'local-receipt-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const reqUrl = req.url || ''
        const urlObj = new URL(reqUrl, `http://${req.headers.host || 'localhost:8443'}`)
        const pathname = urlObj.pathname

        const isReceiptRoute = [
          '/api/receipt',
          '/api/receipt.png',
          '/api/binance',
          '/api/bk',
          '/api/bkash',
          '/api/ng',
          '/api/nagad',
        ].includes(pathname)

        if (!isReceiptRoute) return next()

        try {
          const puppeteer = await import('puppeteer-core')
          const chromium = await import('@sparticuz/chromium')

          let type = urlObj.searchParams.get('type') || urlObj.searchParams.get('app')
          if (!type) {
            if (pathname.includes('binance')) type = 'binance'
            else if (pathname.includes('bk')) type = 'bk'
            else if (pathname.includes('ng')) type = 'ng'
            else type = 'binance'
          }

          const searchParams = new URLSearchParams(urlObj.searchParams)
          searchParams.set('type', type)

          const port = server.config.server.port || 8443
          const targetUrl = `http://localhost:${port}/?${searchParams.toString()}`

          const executablePath = await chromium.default.executablePath()
          const browser = await puppeteer.default.launch({
            args: chromium.default.args,
            defaultViewport: { width: 500, height: 950, deviceScaleFactor: 2 },
            executablePath: executablePath || undefined,
            headless: true,
          })

          const page = await browser.newPage()
          await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 })

          const cardElement = await page.$('#receipt-card')
          const imageBuffer = cardElement
            ? await cardElement.screenshot({ type: 'png' })
            : await page.screenshot({ type: 'png' })

          await browser.close()

          res.statusCode = 200
          res.setHeader('Content-Type', 'image/png')
          res.setHeader('Cache-Control', 'no-cache')
          res.end(imageBuffer)
        } catch (err) {
          console.error('Dev Image API Error:', err)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Failed to generate image', details: String(err) }))
        }
      })
    },
  }
}
