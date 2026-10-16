import { useState, useEffect } from 'react'
import SkyFakePayHome from './components/SkyFakePayHome'
import BinanceReceipt from './components/BinanceReceipt'
import BkashReceipt from './components/BkashReceipt'
import NagadReceipt from './components/NagadReceipt'
import AdminPortal from './components/AdminPortal'
import DynamicFormPanel from './components/DynamicFormPanel'
import PwaInstallModal from './components/PwaInstallModal'
import { toPng } from 'html-to-image'
import { ArrowLeft, Zap, Download } from 'lucide-react'
import { AuthSession } from './types'

type AppView = 'home' | 'generator' | 'admin'
type TemplateType = 'binance' | 'bk' | 'ng'

function getInitialState(): { view: AppView; template: TemplateType } {
  if (typeof window === 'undefined') return { view: 'home', template: 'binance' }

  const pathname = window.location.pathname.toLowerCase()
  const searchParams = new URLSearchParams(window.location.search)
  const queryType = (searchParams.get('type') || searchParams.get('app') || '').toLowerCase()

  if (queryType === 'bk' || queryType === 'bkash' || pathname.startsWith('/bk')) {
    return { view: 'generator', template: 'bk' }
  }
  if (queryType === 'ng' || queryType === 'nagad' || pathname.startsWith('/ng')) {
    return { view: 'generator', template: 'ng' }
  }
  if (queryType === 'binance' || pathname.startsWith('/binance')) {
    return { view: 'generator', template: 'binance' }
  }

  // If specific receipt params exist, open generator directly
  if (searchParams.has('usd') || searchParams.has('orderId')) {
    return { view: 'generator', template: 'binance' }
  }
  if (searchParams.has('fee') || searchParams.has('sender')) {
    return { view: 'generator', template: 'bk' }
  }
  if (searchParams.has('metaTime1') || searchParams.has('meta1')) {
    return { view: 'generator', template: 'ng' }
  }

  return { view: 'home', template: 'binance' }
}

export default function App() {
  const initial = getInitialState()
  const [currentView, setCurrentView] = useState<AppView>(initial.view)
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>(initial.template)
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null)

  // Load session from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('receipt_app_auth')
      if (stored) setSession(JSON.parse(stored))
    } catch {}
  }, [currentView])

  // Handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      const updated = getInitialState()
      setCurrentView(updated.view)
      setActiveTemplate(updated.template)
    }
    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  // Select Template from Home
  const handleSelectTemplate = (template: TemplateType) => {
    setActiveTemplate(template)
    setCurrentView('generator')
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('type', template)
    window.history.pushState({}, '', currentUrl.toString())
  }

  // Go back to Home
  const handleGoHome = () => {
    setCurrentView('home')
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.delete('type')
    window.history.pushState({}, '', currentUrl.toString())
  }

  // Global Download
  const handleGlobalDownload = async () => {
    setIsDownloading(true)
    try {
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

  // 1. HOME VIEW (Matches uploaded screenshot - 100% dynamic services from D1)
  const handleSelectService = (service: any) => {
    if (service.service_key === 'bkash' || service.service_key === 'bk') {
      handleSelectTemplate('bk')
    } else if (service.service_key === 'nagad' || service.service_key === 'ng') {
      handleSelectTemplate('ng')
    } else if (service.service_key === 'binance') {
      handleSelectTemplate('binance')
    } else if (service.api_url && service.api_url.startsWith('http')) {
      window.open(service.api_url, '_blank')
    } else {
      handleSelectTemplate('binance')
    }
  }

  if (currentView === 'home' && !hideNav) {
    return (
      <div className="min-h-screen bg-[#f8fafc]">
        <SkyFakePayHome
          onSelectService={handleSelectService}
          onOpenAuth={() => setCurrentView('admin')}
          session={session}
        />
        <PwaInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </div>
    )
  }

  // 2. ADMIN PORTAL VIEW
  if (currentView === 'admin' && !hideNav) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        {/* Top Header */}
        <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          <span className="text-sm font-extrabold text-white">
            Admin & Client Portal
          </span>

          <div className="w-16" />
        </header>

        <main className="flex-1 flex justify-center items-start">
          <AdminPortal onBackToApp={handleGoHome} />
        </main>
      </div>
    )
  }

  // 3. GENERATOR VIEW (bKash / Nagad / Binance receipt screen with form & download)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Generator Top App Header */}
      {!hideNav && (
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 shadow-sm flex items-center justify-between">
          <button
            onClick={handleGoHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* Service Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSelectTemplate('bk')}
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
              onClick={() => handleSelectTemplate('ng')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTemplate === 'ng'
                  ? 'bg-[#f6921e] text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🟠</span>
              <span className="hidden sm:inline">Nagad</span>
            </button>

            <button
              onClick={() => handleSelectTemplate('binance')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTemplate === 'binance'
                  ? 'bg-amber-400 text-black shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>🟡</span>
              <span className="hidden sm:inline">Binance</span>
            </button>
          </div>

          {/* Admin shortcut */}
          <button
            onClick={() => setCurrentView('admin')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Admin
          </button>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center items-center p-2 sm:p-4 pb-28">
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
      </main>

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  )
}
