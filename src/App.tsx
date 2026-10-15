import { useState, useEffect } from 'react'
import BinanceReceipt from './components/BinanceReceipt'
import BkashReceipt from './components/BkashReceipt'
import NagadReceipt from './components/NagadReceipt'

type TemplateType = 'binance' | 'bk' | 'ng'

function getActiveTemplate(): TemplateType {
  if (typeof window === 'undefined') return 'binance'

  const pathname = window.location.pathname.toLowerCase()
  const searchParams = new URLSearchParams(window.location.search)
  const queryType = (searchParams.get('type') || searchParams.get('app') || '').toLowerCase()

  if (queryType === 'bk' || queryType === 'bkash' || pathname.startsWith('/bk')) {
    return 'bk'
  }
  if (queryType === 'ng' || queryType === 'nagad' || pathname.startsWith('/ng')) {
    return 'ng'
  }
  if (queryType === 'binance' || pathname.startsWith('/binance')) {
    return 'binance'
  }

  // Auto-detect based on parameter names
  if (searchParams.has('usd') || searchParams.has('orderId')) return 'binance'
  if (searchParams.has('fee')) return 'bk'
  if (searchParams.has('metaTime1') || searchParams.has('meta1')) return 'ng'

  return 'binance'
}

export default function App() {
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(getActiveTemplate)

  useEffect(() => {
    const handleUrlChange = () => {
      setActiveTemplate(getActiveTemplate())
    }
    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  const switchTemplate = (tpl: TemplateType) => {
    setActiveTemplate(tpl)
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('type', tpl)
    window.history.pushState({}, '', currentUrl.toString())
  }

  // Check if we should hide the top navigation bar (e.g. for API screenshotting)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const hideNav = searchParams.get('hideNav') === 'true' || searchParams.get('clean') === '1'

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Template Navigation Switcher */}
      {!hideNav && (
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800 text-sm sm:text-base">Receipt Studio</span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full border border-gray-200 hidden sm:inline-block">
              All-In-One Vercel API
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => switchTemplate('binance')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTemplate === 'binance'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <span>🟡</span>
              <span>Binance</span>
            </button>

            <button
              onClick={() => switchTemplate('bk')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTemplate === 'bk'
                  ? 'bg-[#e2136e] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <span>🌸</span>
              <span>bKash</span>
            </button>

            <button
              onClick={() => switchTemplate('ng')}
              className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTemplate === 'ng'
                  ? 'bg-[#f6921e] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'
              }`}
            >
              <span>🟠</span>
              <span>Nagad</span>
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center">
        {activeTemplate === 'binance' && <BinanceReceipt />}
        {activeTemplate === 'bk' && <BkashReceipt />}
        {activeTemplate === 'ng' && <NagadReceipt />}
      </main>
    </div>
  )
}
