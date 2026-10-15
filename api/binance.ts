import type { VercelRequest, VercelResponse } from '@vercel/node'
import receiptHandler from './receipt'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  req.query.type = 'binance'
  return receiptHandler(req, res)
}
