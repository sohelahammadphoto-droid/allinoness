import React, { useState, useEffect } from 'react'
import { Zap, Shield, RefreshCw, PlusCircle, Sparkles, Layers } from 'lucide-react'
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
    if (service.icon_type === 'image_url' || service.icon_val.startsWith('http')) {
      return <img src={service.icon_val} alt={service.name} className="w-12 h-12 object-contain rounded-full" />
    }
    return <span className="text-3xl">{service.icon_val || '⚡'}</span>
  }

  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching user screenshot */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          {/* Blue Lightning Icon */}
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#4338ca] to-[#4f46e5] flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Zap className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            Dark SS Maker
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
            <span className="text-xs font-semibold">Connecting to Cloudflare D1...</span>
          </div>
        ) : services.length === 0 ? (
          // Empty State ready for user's APIs
          <div className="bg-white rounded-3xl p-7 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] text-center space-y-4 my-auto">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-inner">
              <Layers className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">
                No APIs Connected Yet
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto leading-relaxed">
                Log in to the Admin Dashboard to add your custom APIs, payment services, and parameters. They will appear here dynamically!
              </p>
            </div>

            <button
              onClick={onOpenAuth}
              className="py-3 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition inline-flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{session ? 'Go to Admin & Add API' : 'Get Started / Admin Login'}</span>
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
            <span>Dark SS Maker • Cloudflare D1 Dynamic</span>
          </p>
        </div>
      </main>
    </div>
  )
}
