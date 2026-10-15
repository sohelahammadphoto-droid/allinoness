import type { VercelRequest, VercelResponse } from '@vercel/node'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:8443'
    const searchParams = new URLSearchParams()

    let type = 'binance'

    Object.entries(req.query).forEach(([key, val]) => {
      const value = typeof val === 'string' ? val : Array.isArray(val) && val[0] ? val[0] : ''
      if (key === 'type' || key === 'app') {
        type = value.toLowerCase()
      } else if (value) {
        searchParams.set(key, value)
      }
    })

    // Auto-detect type if not explicitly set
    if (!req.query.type && !req.query.app) {
      if (req.query.amount && (req.query.metaTime1 || req.query.meta1)) {
        type = 'ng'
      } else if (req.query.amount || req.query.fee) {
        type = 'bk'
      } else if (req.query.usd || req.query.orderId) {
        type = 'binance'
      }
    }

    searchParams.set('type', type)
    searchParams.set('hideNav', 'true')

    const targetUrl = `${protocol}://${host}/?${searchParams.toString()}`

    const executablePath = await chromium.executablePath()

    const browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 500, height: 950, deviceScaleFactor: 2 },
      executablePath: executablePath || undefined,
      headless: true,
    })

    const page = await browser.newPage()
    await page.goto(targetUrl, { waitUntil: 'networkidle0', timeout: 15000 })

    const cardElement = await page.$('#receipt-card')
    let imageBuffer: Buffer

    if (cardElement) {
      imageBuffer = (await cardElement.screenshot({ type: 'png' })) as Buffer
    } else {
      imageBuffer = (await page.screenshot({ type: 'png' })) as Buffer
    }

    await browser.close()

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate')
    res.status(200).send(imageBuffer)
  } catch (err) {
    console.error('Unified Receipt Image API Error:', err)
    res.status(500).json({ error: 'Failed to generate receipt image', details: String(err) })
  }
}
