import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import SingleLoginPage from './components/SingleLoginPage'
import AdminPortal from './components/AdminPortal'
import BinanceReceipt from './components/BinanceReceipt'
import BkashReceipt from './components/BkashReceipt'
import NagadReceipt from './components/NagadReceipt'
import DynamicFormPanel from './components/DynamicFormPanel'
import DynamicToolRunner from './components/DynamicToolRunner'
import UserDashboard from './components/UserDashboard'
import PwaInstallModal from './components/PwaInstallModal'
import { toPng } from 'html-to-image'
import { ArrowLeft, Zap, LogOut, ShieldCheck, Home } from 'lucide-react'
import { AuthSession, DynamicService, TemplateType } from './types'

type AppView = 'landing' | 'login' | 'dashboard' | 'generator' | 'tool_runner'

function getInitialView(): AppView {
  if (typeof window === 'undefined') return 'landing'
  const searchParams = new URLSearchParams(window.location.search)
  const view = searchParams.get('view')
  const toolName = searchParams.get('name') || searchParams.get('tool')

  if (toolName) return 'tool_runner'
  if (view === 'login') return 'login'
  if (view === 'dashboard') return 'dashboard'
  if (searchParams.has('type')) return 'generator'

  return 'landing'
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView)
  const [activeToolSlug, setActiveToolSlug] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    const p = new URLSearchParams(window.location.search)
    return p.get('name') || p.get('tool') || ''
  })
  const [activeTemplate, setActiveTemplate] = useState<TemplateType>('binance')
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem('receipt_app_auth')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Sync session changes to localStorage
  const handleSaveSession = (newSession: AuthSession | null) => {
    setSession(newSession)
    if (newSession) {
      localStorage.setItem('receipt_app_auth', JSON.stringify(newSession))
      setCurrentView('dashboard')
    } else {
      localStorage.removeItem('receipt_app_auth')
      setCurrentView('landing')
    }
  }

  // Handle URL changes
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentView(getInitialView())
    }
    window.addEventListener('popstate', handleUrlChange)
    return () => window.removeEventListener('popstate', handleUrlChange)
  }, [])

  // Navigation handlers
  const goToLanding = () => {
    setCurrentView('landing')
    setActiveToolSlug('')
    const url = new URL(window.location.href)
    url.searchParams.delete('view')
    url.searchParams.delete('type')
    url.searchParams.delete('name')
    url.searchParams.delete('tool')
    window.history.pushState({}, '', url.toString())
  }

  const goToLogin = () => {
    setCurrentView('login')
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'login')
    window.history.pushState({}, '', url.toString())
  }

  const goToDashboard = () => {
    if (!session) {
      goToLogin()
      return
    }
    setCurrentView('dashboard')
    const url = new URL(window.location.href)
    url.searchParams.set('view', 'dashboard')
    window.history.pushState({}, '', url.toString())
  }

  // Select a service from landing page
  const handleSelectService = (service: DynamicService) => {
    const key = service.service_key.toLowerCase()
    if (key === 'bkash' || key === 'bk') {
      setActiveTemplate('bk')
      setCurrentView('generator')
      const url = new URL(window.location.href)
      url.searchParams.set('type', 'bk')
      window.history.pushState({}, '', url.toString())
    } else if (key === 'nagad' || key === 'ng') {
      setActiveTemplate('ng')
      setCurrentView('generator')
      const url = new URL(window.location.href)
      url.searchParams.set('type', 'ng')
      window.history.pushState({}, '', url.toString())
    } else if (key === 'binance') {
      setActiveTemplate('binance')
      setCurrentView('generator')
      const url = new URL(window.location.href)
      url.searchParams.set('type', 'binance')
      window.history.pushState({}, '', url.toString())
    } else {
      // Dynamic Custom API Tool Runner
      setActiveToolSlug(key)
      setCurrentView('tool_runner')
      const url = new URL(window.location.href)
      url.searchParams.set('name', key)
      window.history.pushState({}, '', url.toString())
    }
  }

  // 1-Click High-Res PNG Download
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

  // Check if we should hide navigation bars (for screenshotting / Puppeteer API)
  const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const hideNav = searchParams.get('hideNav') === 'true' || searchParams.get('clean') === '1'

  // 0. DYNAMIC TOOL RUNNER (For any Custom API Tools generated in the panel)
  if (currentView === 'tool_runner' && !hideNav) {
    return (
      <DynamicToolRunner
        toolSlug={activeToolSlug || searchParams.get('name') || searchParams.get('tool') || 'receipt'}
        onBack={goToLanding}
      />
    )
  }

  // 1. PROFESSIONAL LANDING PAGE (DEFAULT)
  if (currentView === 'landing' && !hideNav) {
    return (
      <>
        <LandingPage
          onGoToLogin={goToLogin}
          onGoToDashboard={goToDashboard}
          onSelectService={handleSelectService}
          session={session}
          onLogout={() => handleSaveSession(null)}
        />
        <PwaInstallModal
          isOpen={isInstallModalOpen}
          onClose={() => setIsInstallModalOpen(false)}
        />
      </>
    )
  }

  // 2. SINGLE LOGIN PAGE FOR ALL USERS
  if (currentView === 'login' && !hideNav) {
    return (
      <SingleLoginPage
        onSuccess={(authData) => handleSaveSession(authData)}
        onBackToHome={goToLanding}
      />
    )
  }

  // 3. DYNAMIC ROLE-BASED DASHBOARD (Super Admin / Client Admin / User)
  if (currentView === 'dashboard' && !hideNav) {
    // If not logged in, show single login page immediately
    if (!session) {
      return (
        <SingleLoginPage
          onSuccess={(authData) => handleSaveSession(authData)}
          onBackToHome={goToLanding}
        />
      )
    }

    // Role: User -> Dynamic Tool Generator Studio
    if (session.role === 'user') {
      return (
        <UserDashboard
          session={session}
          onSignOut={() => handleSaveSession(null)}
          onGoToHome={goToLanding}
        />
      )
    }

    // Role: superadmin or client_admin
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
        {/* Dashboard Top Header */}
        <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={goToLanding}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
            >
              <Home className="w-4 h-4 text-indigo-400" />
              <span>Website</span>
            </button>

            <div className="h-5 w-px bg-slate-800 hidden sm:block" />

            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-white">
                {session.role === 'superadmin' ? 'Master Control Dashboard' : 'Client Admin Dashboard'}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                session.role === 'superadmin' 
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                {session.role === 'superadmin' ? 'Super Admin' : 'Client Tenant'}
              </span>
            </div>
          </div>

          {/* User profile & Logout */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:inline">
              Logged in as <b className="text-white">{session.user?.username || session.tenant?.tenant_code || 'Admin'}</b>
            </span>

            <button
              onClick={() => handleSaveSession(null)}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-800 text-slate-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dashboard Main Content */}
        <main className="flex-1 flex justify-center items-start p-2 sm:p-6 pb-24">
          <AdminPortal
            session={session}
            onLogout={() => handleSaveSession(null)}
            onBackToApp={goToLanding}
          />
        </main>
      </div>
    )
  }

  // 4. GENERATOR VIEW (Statement receipt screen with form & download)
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Generator Top App Header */}
      {!hideNav && (
        <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-2.5 shadow-sm flex items-center justify-between">
          <button
            onClick={goToLanding}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </button>

          {/* Service Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTemplate('bk')}
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
              onClick={() => setActiveTemplate('ng')}
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
              onClick={() => setActiveTemplate('binance')}
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

          {/* Dashboard shortcut */}
          <button
            onClick={goToDashboard}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition cursor-pointer"
          >
            Dashboard
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
