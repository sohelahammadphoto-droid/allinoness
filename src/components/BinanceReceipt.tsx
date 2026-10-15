import { useRef, useCallback, useState, useEffect } from 'react'
import { Copy, Download, RefreshCw } from 'lucide-react'
import { toPng } from 'html-to-image'

const generateRandomOrderId = () => {
  const prefix = '386'
  let rest = ''
  for (let i = 0; i < 15; i++) {
    rest += Math.floor(Math.random() * 10)
  }
  return prefix + rest
}

const getRandomSpeed = () => {
  const isMB = Math.random() > 0.85
  const val = (Math.random() * (isMB ? 3.5 : 85.0) + 1.2).toFixed(1)
  return { val, unit: isMB ? 'MB/s' : 'KB/s' }
}

const getRandomBattery = () => {
  return Math.floor(Math.random() * 60) + 35 // 35% to 95%
}

const getUrlParams = () => {
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const initialSpeed = getRandomSpeed()
  const initialBattery = getRandomBattery()

  return {
    usd: searchParams.get('usd') || '21',
    name: searchParams.get('name') || 'Tonmoykhan',
    number: searchParams.get('number') || '1007670536',
    orderId: searchParams.get('orderId') || searchParams.get('order_id') || generateRandomOrderId(),
    speedVal: searchParams.get('speed') || initialSpeed.val,
    speedUnit: searchParams.get('unit') || initialSpeed.unit,
    battery: parseInt(searchParams.get('battery') || String(initialBattery), 10),
    signalBars: parseInt(searchParams.get('signal') || String(Math.floor(Math.random() * 2) + 3), 10),
  }
}

export default function BinanceReceipt({ hideControls = false }: { hideControls?: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const [params, setParams] = useState(getUrlParams)
  const [copiedOrderId, setCopiedOrderId] = useState(false)

  const getBDTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      timeZone: 'Asia/Dhaka',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  const [currentTime, setCurrentTime] = useState(getBDTime)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getBDTime())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const speedTimer = setInterval(() => {
      const searchParams = new URLSearchParams(window.location.search)
      if (!searchParams.has('speed')) {
        const newSpeed = getRandomSpeed()
        setParams((prev) => ({
          ...prev,
          speedVal: newSpeed.val,
          speedUnit: newSpeed.unit,
        }))
      }
    }, 4000)
    return () => clearInterval(speedTimer)
  }, [])

  useEffect(() => {
    const handleUrlChange = () => {
      setParams(getUrlParams())
    }
    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  const handleDownload = useCallback(() => {
    if (cardRef.current === null) return

    toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a')
        link.download = `binance-receipt-${params.orderId}.png`
        link.href = dataUrl
        link.click()
      })
      .catch((err) => {
        console.error('Failed to download image:', err)
      })
  }, [cardRef, params.orderId])

  const randomizeAll = () => {
    const newSpeed = getRandomSpeed()
    const newBattery = getRandomBattery()
    const newSignal = Math.floor(Math.random() * 2) + 3

    setParams((prev) => ({
      ...prev,
      orderId: generateRandomOrderId(),
      speedVal: newSpeed.val,
      speedUnit: newSpeed.unit,
      battery: newBattery,
      signalBars: newSignal,
    }))
  }

  const copyOrderIdText = () => {
    navigator.clipboard.writeText(params.orderId)
    setCopiedOrderId(true)
    setTimeout(() => setCopiedOrderId(false), 2000)
  }

  return (
    <div className="flex flex-col items-center justify-center p-2 sm:p-4">
      {!hideControls && (
        <div className="mb-4 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full font-medium shadow-md hover:bg-gray-800 transition-all cursor-pointer active:scale-95 text-sm"
          >
            <Download size={16} />
            <span>Download Binance Receipt</span>
          </button>

          <button
            onClick={randomizeAll}
            className="flex items-center gap-2 bg-white text-gray-800 border border-gray-300 px-4 py-2.5 rounded-full font-medium shadow-sm hover:bg-gray-50 transition-all cursor-pointer active:scale-95 text-sm"
          >
            <RefreshCw size={16} />
            <span>Randomize Status</span>
          </button>
        </div>
      )}

      {/* Card UI */}
      <div
        id="receipt-card"
        ref={cardRef}
        className="relative bg-white overflow-hidden flex flex-col shadow-xl rounded-2xl"
        style={{ width: 390, minHeight: 844, fontFamily: 'sans-serif' }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-5 pt-3 pb-1">
          <span className="text-sm font-semibold text-black">{currentTime}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs text-black font-medium">{params.speedVal}</span>
            <span className="text-[10px] text-black leading-none">{params.speedUnit}</span>

            {/* Dynamic Signal bars */}
            <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
              <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#333" opacity={params.signalBars >= 1 ? 1 : 0.3} />
              <rect x="4" y="5" width="3" height="7" rx="0.5" fill="#333" opacity={params.signalBars >= 2 ? 1 : 0.3} />
              <rect x="8" y="2" width="3" height="10" rx="0.5" fill="#333" opacity={params.signalBars >= 3 ? 1 : 0.3} />
              <rect x="12" y="0" width="3" height="12" rx="0.5" fill="#333" opacity={params.signalBars >= 4 ? 1 : 0.3} />
            </svg>

            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" fill="#333"/>
              <path d="M5 7.5C5.9 6.6 6.9 6 8 6s2.1.6 3 1.5" stroke="#333" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              <path d="M2.5 5C4 3.5 5.9 2.5 8 2.5s4 1 5.5 2.5" stroke="#333" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
            </svg>

            {/* Dynamic Battery */}
            <div className="flex items-center">
              <div className="relative border border-gray-500 rounded-sm overflow-hidden flex items-center justify-center" style={{ width: 22, height: 11 }}>
                <div
                  className="absolute inset-0 bg-gray-800"
                  style={{ width: `${Math.min(100, Math.max(10, params.battery))}%` }}
                />
                <span className="relative z-10 text-[8px] font-bold text-white leading-none">
                  {params.battery}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Back arrow */}
        <div className="px-4 pt-1 pb-2">
          <button className="p-1">
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M21 9H1M1 9L9 1M1 9L9 17" stroke="#222" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Success icon area */}
        <div className="flex flex-col items-center pt-4 pb-2">
          <div className="relative flex items-center justify-center" style={{ width: 160, height: 140 }}>
            {[
              { top: 10, left: 30, size: 5, color: '#ccc' },
              { top: 5, left: 70, size: 4, color: '#ccc' },
              { top: 10, right: 28, size: 5, color: '#ccc' },
              { top: 40, left: 10, size: 4, color: '#ccc' },
              { top: 40, right: 10, size: 4, color: '#ccc' },
              { bottom: 20, left: 20, size: 4, color: '#ccc' },
              { bottom: 20, right: 20, size: 4, color: '#ccc' },
              { bottom: 8, left: 65, size: 4, color: '#ccc' },
            ].map((dot, i) => (
              <div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: dot.size,
                  height: dot.size,
                  background: dot.color,
                  top: (dot as any).top,
                  bottom: (dot as any).bottom,
                  left: (dot as any).left,
                  right: (dot as any).right,
                }}
              />
            ))}
            {[
              { top: 0, left: 55, size: 6, color: '#F0B90B' },
              { top: 30, right: 5, size: 6, color: '#F0B90B' },
              { bottom: 5, left: 40, size: 5, color: '#F0B90B' },
            ].map((dot, i) => (
              <div
                key={`y${i}`}
                className="absolute"
                style={{
                  width: dot.size,
                  height: dot.size,
                  background: dot.color,
                  clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  top: (dot as any).top,
                  bottom: (dot as any).bottom,
                  left: (dot as any).left,
                  right: (dot as any).right,
                }}
              />
            ))}
            <div
              className="absolute rounded-full"
              style={{
                width: 96,
                height: 96,
                background: 'rgba(111, 207, 151, 0.18)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="absolute flex items-center justify-center rounded-full"
              style={{
                width: 72,
                height: 72,
                background: '#2ECC88',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            >
              <svg width="34" height="26" viewBox="0 0 34 26" fill="none">
                <path d="M2 13L12 23L32 2" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mt-2">Payment Successful</h2>

          <p className="text-4xl font-bold text-gray-900 mt-3">
            {params.usd}<span className="ml-1">USDT</span>
          </p>

          <p className="text-sm text-gray-400 text-center mt-3 px-10 leading-5">
            The recipient can check the balance in the Funding Account
          </p>
        </div>

        <div className="mx-4 mt-5 border-t border-gray-100" />

        <div className="px-4 mt-4 space-y-5">
          <div className="flex items-start justify-between">
            <span className="text-sm text-gray-400">To</span>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">Nickname: {params.name}</p>
              <p className="text-sm text-gray-900">{params.number}</p>
              <button className="text-sm font-medium mt-1" style={{ color: '#F0B90B' }}>
                Add Alias
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Order ID</span>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-gray-900">{params.orderId}</span>
              <button onClick={copyOrderIdText} title="Copy Order ID">
                <Copy size={14} className={`cursor-pointer ${copiedOrderId ? 'text-amber-500' : 'text-gray-400'}`} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Payment Method</span>
            <span className="text-sm text-gray-900">Spot Account</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Paid With</span>
            <span className="text-sm font-semibold text-gray-900">{params.usd} USDT</span>
          </div>
        </div>

        <div className="mx-4 mt-6 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-gray-900 leading-5 flex-1 pr-4">
            Enjoy Up to 50% Off in Hot Deals
          </p>
          <div className="relative flex-shrink-0" style={{ width: 56, height: 50 }}>
            <div
              className="absolute rounded-lg flex items-center justify-center"
              style={{
                width: 46,
                height: 36,
                background: '#e8e8e8',
                top: 4,
                left: 0,
              }}
            >
              <div className="w-8 h-8 bg-gray-300 rounded flex items-center justify-center">
                <span className="text-lg font-bold text-gray-500">%</span>
              </div>
            </div>
            {[
              { top: 0, right: 0, size: 14 },
              { top: 14, right: 2, size: 12 },
              { top: 28, right: 4, size: 11 },
            ].map((coin, i) => (
              <div
                key={i}
                className="absolute rounded-full border-2 border-yellow-600"
                style={{
                  width: coin.size,
                  height: coin.size,
                  background: '#F0B90B',
                  top: coin.top,
                  right: coin.right,
                }}
              />
            ))}
          </div>
        </div>

        <div className="px-4 mt-6">
          <button
            className="w-full rounded-xl py-4 text-base font-semibold text-black"
            style={{ background: '#F0B90B' }}
          >
            Send Another Transaction
          </button>
        </div>

        <div className="flex items-center justify-center gap-14 py-4 mt-auto">
          <div className="w-4 h-4 bg-gray-400 rounded-sm" />
          <div className="w-5 h-5 rounded-full border-2 border-gray-400" />
          <div
            className="w-0 h-0"
            style={{
              borderTop: '8px solid transparent',
              borderBottom: '8px solid transparent',
              borderLeft: '14px solid #9ca3af',
            }}
          />
        </div>
      </div>
    </div>
  )
}
