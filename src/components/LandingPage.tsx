import React, { useState, useEffect } from 'react'
import { 
  Zap, ArrowRight, ShieldCheck, Clock, Smartphone, Layers, 
  Sparkles, CheckCircle2, ChevronRight, Lock, ExternalLink, Globe, User, LogOut
} from 'lucide-react'
import { AuthSession, DynamicService } from '../types'

interface LandingPageProps {
  onGoToLogin: () => void
  onGoToDashboard: () => void
  onSelectService: (service: DynamicService) => void
  session: AuthSession | null
  onLogout?: () => void
}

export default function LandingPage({ onGoToLogin, onGoToDashboard, onSelectService, session, onLogout }: LandingPageProps) {
  const [services, setServices] = useState<DynamicService[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch('/api/services')
        const data = await res.json() as any
        if (data.success && Array.isArray(data.services)) {
          setServices(data.services)
        }
      } catch (err) {
        console.error('Failed to load services:', err)
      } finally {
        setIsLoadingServices(false)
      }
    }
    fetchServices()
  }, [])

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <nav className="sticky top-0 z-50 bg-[#070b14]/85 backdrop-blur-xl border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <span className="text-lg font-black text-white tracking-tight block">
                Dark SS Maker
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 -mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Cloudflare D1 Online
              </span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
            <a href="#services" className="hover:text-white transition">APIs & Services</a>
            <a href="#features" className="hover:text-white transition">Platform Features</a>
            <a href="#licensing" className="hover:text-white transition">Monthly Licensing</a>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400">
              v2.5 Production
            </span>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2">
            {session ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={onGoToDashboard}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {session.role === 'superadmin' ? 'Master Control' : session.role === 'client_admin' ? 'Client Admin' : 'User Studio'}
                  </span>
                </button>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-800 text-slate-400 text-xs font-bold transition flex items-center cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={onGoToLogin}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In / Login</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs font-semibold text-slate-300 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Next-Gen Multi-Tenant API & Statement Suite</span>
            <span className="w-1 h-1 rounded-full bg-slate-500" />
            <span className="text-indigo-400 font-bold">Fast Edge D1</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Generate Statement Receipts with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-amber-300 to-rose-400">
              Real-Time Dynamic APIs
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
            The ultra-fast SaaS platform for statement generation and dynamic API management. Built on Cloudflare D1 edge database with monthly client licensing, live countdown timers, and mobile PWA installation.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={session ? onGoToDashboard : onGoToLogin}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <span>{session ? 'Open Your Dashboard' : 'Get Started Now'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="#services"
              className="py-3 px-5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 font-semibold text-sm transition"
            >
              Explore Connected APIs
            </a>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4 max-w-lg mx-auto pt-8">
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-white font-mono block">0.2s</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Edge Latency</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono block">100%</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Dynamic D1</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
              <span className="text-xl sm:text-2xl font-black text-emerald-400 font-mono block">24/7</span>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">PWA Mobile</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. DYNAMIC SERVICES & APIS SECTION */}
      <section id="services" className="py-16 px-4 sm:px-6 bg-slate-950/60 border-t border-slate-800/80">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
              Connected Services
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dynamic Payment & Statement APIs
            </h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Services added dynamically by the Super Administrator via Cloudflare D1 appear here instantly.
            </p>
          </div>

          {isLoadingServices ? (
            <div className="py-16 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <span>Fetching dynamic APIs from Cloudflare D1...</span>
            </div>
          ) : services.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center max-w-md mx-auto space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 mx-auto flex items-center justify-center">
                <Layers className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">No Services Configured Yet</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Log in as Super Administrator to add your first API or payment service (Name, Logo, API URL). It will display here automatically!
              </p>
              <button
                onClick={onGoToLogin}
                className="mt-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition"
              >
                Sign In to Add Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onSelectService(service)}
                  className="bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 text-center shadow-lg transition-all active:scale-[0.98] group cursor-pointer flex flex-col items-center justify-center"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl text-white shadow-lg mb-4 group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: service.bg_color || '#4f46e5' }}
                  >
                    {service.icon_val || '⚡'}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {service.subtitle || 'Statement Service'}
                  </p>

                  <span className="mt-4 text-[11px] font-semibold text-indigo-400 flex items-center gap-1">
                    <span>Open Generator</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. PLATFORM FEATURES */}
      <section id="features" className="py-16 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Architecture & Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Engineered for Speed, Control & Aesthetics
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Feature 1 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Monthly License Countdown</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client Admin panels feature a live ticking countdown timer (Days : Hours : Mins : Secs) to monitor plan validity with automated access locking on expiration.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Dynamic Parameter Studio</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Super Admins can define new fields, select dropdown options, and custom API endpoints directly in Cloudflare D1 without modifying frontend code.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Multi-Tenant User Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Client Admins can create end-user accounts, monitor generation limits, and toggle instant Ban/Unban switches with real-time feedback.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. MONTHLY LICENSING / PRICING PREVIEW */}
      <section id="licensing" className="py-16 px-4 sm:px-6 bg-slate-950/70 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900/90 to-slate-900/90 border border-indigo-500/30 rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-4 max-w-lg">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Monthly Agency Subscription
                </span>
                <h3 className="text-2xl sm:text-3xl font-black text-white">
                  Ready to Start Your Custom Client Agency?
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Get dedicated Client Admin access with full user management, custom API generators, and live countdown license tracking.
                </p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>30-Day Renewable Licenses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Up to 100 Managed Users</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Instant PNG Downloads</span>
                  </div>
                </div>
              </div>

              <div className="text-center shrink-0">
                <button
                  onClick={onGoToLogin}
                  className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm shadow-xl shadow-indigo-600/30 active:scale-95 transition cursor-pointer"
                >
                  Access Client Portal
                </button>
                <span className="text-[10px] text-slate-400 block mt-2">
                  Single Sign-On for Super Admin & Clients
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FOOTER */}
      <footer className="mt-auto py-8 px-4 sm:px-6 border-t border-slate-900 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span className="font-bold text-slate-400">Dark SS Maker</span>
          <span>•</span>
          <span>Cloudflare Pages & D1 Edge</span>
        </div>
        <p className="text-[11px] text-slate-600">
          © {new Date().getFullYear()} Dark SS Maker. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
