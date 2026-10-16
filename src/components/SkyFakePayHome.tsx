import React, { useState, useEffect } from 'react'
import { Zap, Shield, RefreshCw, PlusCircle, ExternalLink } from 'lucide-react'
import { AuthSession, DynamicService } from '../types'

interface SkyFakePayHomeProps {
  onSelectService: (service: DynamicService) => void
  onOpenAuth: () => void
  session: AuthSession | null
}

export default function SkyFakePayHome({ onSelectService, onOpenAuth, session }: SkyFakePayHomeProps) {
  const [services, setServices] = useState<DynamicService[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch dynamic services from Cloudflare D1
  const fetchServices = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/services')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.services)) {
        setServices(data.services)
      }
    } catch (err) {
      console.error('Failed to load services:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchServices()
  }, [])

  // Helper to render icon
  const renderIcon = (service: DynamicService) => {
    // If specific SVG for known services
    if (service.service_key === 'bkash') {
      return (
        <svg viewBox="0 0 100 100" className="w-12 h-12 fill-white">
          <polygon points="50,15 78,55 58,50 45,78 40,55 22,48" />
          <polygon points="45,78 68,85 58,50" opacity="0.85" />
        </svg>
      )
    }
    if (service.service_key === 'nagad') {
      return (
        <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-black text-2xl shadow-inner">
          ন
        </div>
      )
    }
    if (service.service_key === 'binance') {
      return (
        <svg viewBox="0 0 100 100" className="w-11 h-11 fill-white">
          <rect x="42" y="22" width="16" height="16" transform="rotate(45 50 30)" />
          <rect x="22" y="42" width="16" height="16" transform="rotate(45 30 50)" />
          <rect x="62" y="42" width="16" height="16" transform="rotate(45 70 50)" />
          <rect x="42" y="62" width="16" height="16" transform="rotate(45 50 70)" />
          <polygon points="50,42 58,50 50,58 42,50" />
        </svg>
      )
    }

    // Image URL icon
    if (service.icon_type === 'image_url' || service.icon_val.startsWith('http')) {
      return <img src={service.icon_val} alt={service.name} className="w-12 h-12 object-contain rounded-full" />
    }

    // Generic emoji or text icon
    return <span className="text-3xl">{service.icon_val || '⚡'}</span>
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching screenshot */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Blue Lightning Icon */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#4338ca] to-[#4f46e5] flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            Sky Fake Pay
          </span>
        </div>

        {/* Right Button: "Get Started" or "Dashboard" */}
        <button
          onClick={onOpenAuth}
          className="px-4 py-2 rounded-2xl bg-[#4f46e5] hover:bg-[#4338ca] text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
        >
          {session ? (
            <>
              <Shield className="w-4 h-4" />
              <span>{session.role === 'superadmin' ? 'Master Admin' : 'Dashboard'}</span>
            </>
          ) : (
            <>
              <span>Get Started</span>
            </>
          )}
        </button>
      </header>

      {/* Main Home Screen Cards Feed - Dynamically loaded from Cloudflare D1 */}
      <main className="flex-1 px-4 py-5 space-y-4">
        {isLoading ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-500" />
            <span className="text-xs font-semibold">Loading dynamic services from Cloudflare D1...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="py-16 text-center text-slate-500 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-3">
            <p className="text-sm font-bold text-slate-700">No services active yet</p>
            <p className="text-xs text-slate-400">
              Super Admin can add new APIs & services from the Admin Dashboard!
            </p>
            <button
              onClick={onOpenAuth}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md"
            >
              Add Service in Admin
            </button>
          </div>
        ) : (
          services.map((service) => (
            <button
              key={service.id}
              onClick={() => onSelectService(service)}
              className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
            >
              {/* Circular Badge with customizable background color */}
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-4 group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: service.bg_color || '#4f46e5',
                  boxShadow: `0 10px 25px -5px ${service.bg_color}40`,
                }}
              >
                {renderIcon(service)}
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-indigo-600 transition-colors">
                {service.name}
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {service.subtitle || 'Payment Statement & Generator'}
              </p>
            </button>
          ))
        )}

        {/* Dynamic footer status */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloudflare D1 Dynamic Service Feed</span>
          </p>
        </div>
      </main>
    </div>
  )
}
