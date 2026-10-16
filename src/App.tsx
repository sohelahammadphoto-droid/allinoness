import { useState, useEffect } from 'react'
import BinanceReceipt from './components/BinanceReceipt'
import BkashReceipt from './components/BkashReceipt'
import NagadReceipt from './components/NagadReceipt'
import AdminPortal from './components/AdminPortal'
import MobileBottomNav, { NavTab } from './components/MobileBottomNav'
import DynamicFormPanel from './components/DynamicFormPanel'
import PwaInstallModal from './components/PwaInstallModal'
import { toPng } from 'html-to-image'
import { Smartphone, ShieldCheck, Download, Sparkles } from 'lucide-react'

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
  const [activeTab, setActiveTab] = useState<NavTab>('generator')
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [hasAdminSession, setHasAdminSession] = useState(false)

  // Check admin session
  useEffect(() => {
    try {
      const session = localStorage.getItem('receipt_app_auth')
      setHasAdminSession(!!session)
    } catch {
      setHasAdminSession(false)
    }
  }, [activeTab])

  // URL sync
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

  // Handle Tab Select
  const handleSelectTab = (tab: NavTab) => {
    if (tab === 'install') {
      setIsInstallModalOpen(true)
    } else {
      setActiveTab(tab)
    }
  }

  // 1-Click High-Res PNG Download
  const handleGlobalDownload = async () => {
    setIsDownloading(true)
    try {
      // Find the card container
      const cardEl = document.querySelector('#receipt-card, #binance-card, .phone, .screen-frame') as HTMLElement
      if (!cardEl) {
        alert('Receipt card element not found for capture.')
        return
      }

      const dataUrl = await toPng(cardEl, {
        cacheBust: true,
        pixelRatio: 2.5,
      })

      const link = document.createElement('a')
      link.download = `receipt-${activeTemplate}-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err: any) {
      console.error('Download failed:', err)
      alert('Could not generate receipt image: ' + err.message)
    } finally {
      setIsDownloading(false)
    }
  }

  // Check if we should hide navigation bars (e.g. for API screenshotting / Puppeteer)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const hideNav = searchParams.get('hideNav') === 'true' || searchParams.get('clean') === '1'

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-black">
      {/* Top Mobile App Header */}
      {!hideNav && (
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-md shadow-amber-500/20 font-black text-black text-sm">
              ⚡
            </div>
            <div>
              <span className="font-extrabold text-white text-sm sm:text-base tracking-tight block">
                Receipt Studio
              </span>
              <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloudflare D1 Online
              </span>
            </div>
          </div>

          {/* Template Switcher (only in generator tab) */}
          {activeTab === 'generator' ? (
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => switchTemplate('binance')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTemplate === 'binance'
                    ? 'bg-amber-400 text-black shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🟡</span>
                <span className="hidden sm:inline">Binance</span>
              </button>

              <button
                onClick={() => switchTemplate('bk')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTemplate === 'bk'
                    ? 'bg-[#e2136e] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🌸</span>
                <span className="hidden sm:inline">bKash</span>
              </button>

              <button
                onClick={() => switchTemplate('ng')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  activeTemplate === 'ng'
                    ? 'bg-[#f6921e] text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>🟠</span>
                <span className="hidden sm:inline">Nagad</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setActiveTab('generator')}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition"
            >
              ← Back to App
            </button>
          )}
        </header>
      )}

      {/* Main App Content */}
      <main className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 pb-28">
        {activeTab === 'generator' ? (
          <div className="w-full flex flex-col items-center">
            {activeTemplate === 'binance' && <BinanceReceipt hideControls={hideNav} />}
            {activeTemplate === 'bk' && <BkashReceipt hideControls={hideNav} />}
            {activeTemplate === 'ng' && <NagadReceipt hideControls={hideNav} />}

            {/* Dynamic Form Panel for Live Data customization & 1-tap download */}
            {!hideNav && (
              <DynamicFormPanel
                activeTemplate={activeTemplate}
                onDownload={handleGlobalDownload}
                isDownloading={isDownloading}
              />
            )}
          </div>
        ) : (
          <AdminPortal onBackToApp={() => setActiveTab('generator')} />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      {!hideNav && (
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          hasAdminSession={hasAdminSession}
        />
      )}

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  )
}
