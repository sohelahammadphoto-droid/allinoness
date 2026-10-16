import React from 'react'
import { Zap, ChevronRight, User, LogIn, Shield, Sparkles } from 'lucide-react'
import { AuthSession } from '../types'

interface SkyFakePayHomeProps {
  onSelectTemplate: (template: 'binance' | 'bk' | 'ng') => void
  onOpenAuth: () => void
  session: AuthSession | null
}

export default function SkyFakePayHome({ onSelectTemplate, onOpenAuth, session }: SkyFakePayHomeProps) {
  return (
    <div className="w-full max-w-md mx-auto min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans">
      {/* Top Header matching screenshot */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
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

      {/* Main Home Screen Cards Feed matching screenshot */}
      <main className="flex-1 px-4 py-5 space-y-4">
        {/* Card 1: bKash */}
        <button
          onClick={() => onSelectTemplate('bk')}
          className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
        >
          {/* bKash Origami Bird Badge */}
          <div className="w-20 h-20 rounded-full bg-[#e2136e] flex items-center justify-center shadow-lg shadow-pink-500/20 mb-4 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 100 100" className="w-12 h-12 fill-white">
              {/* Origami bird shape */}
              <polygon points="50,15 78,55 58,50 45,78 40,55 22,48" />
              <polygon points="45,78 68,85 58,50" opacity="0.85" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#e2136e] transition-colors">
            bKash
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Send & Cash Out
          </p>
        </button>

        {/* Card 2: Nagad */}
        <button
          onClick={() => onSelectTemplate('ng')}
          className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
        >
          {/* Nagad Logo Circular Badge */}
          <div className="w-20 h-20 rounded-full bg-[#fdf2e9] border border-orange-100 flex items-center justify-center shadow-lg shadow-orange-500/10 mb-4 group-hover:scale-105 transition-transform">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#f97316] to-[#ea580c] flex items-center justify-center text-white font-black text-2xl shadow-inner">
              ন
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#f97316] transition-colors">
            Nagad
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Regular & Islamic
          </p>
        </button>

        {/* Card 3: Binance */}
        <button
          onClick={() => onSelectTemplate('binance')}
          className="w-full bg-white rounded-3xl p-6 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] active:scale-[0.98] transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
        >
          {/* Binance Yellow Circular Badge */}
          <div className="w-20 h-20 rounded-full bg-[#f3ba2f] flex items-center justify-center shadow-lg shadow-amber-500/25 mb-4 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 100 100" className="w-11 h-11 fill-white">
              {/* Binance Diamond / Cube logo */}
              <rect x="42" y="22" width="16" height="16" transform="rotate(45 50 30)" />
              <rect x="22" y="42" width="16" height="16" transform="rotate(45 30 50)" />
              <rect x="62" y="42" width="16" height="16" transform="rotate(45 70 50)" />
              <rect x="42" y="62" width="16" height="16" transform="rotate(45 50 70)" />
              <polygon points="50,42 58,50 50,58 42,50" />
            </svg>
          </div>

          <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-[#d97706] transition-colors">
            Binance
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Binance Pay Receipts
          </p>
        </button>

        {/* PWA / App info hint */}
        <div className="pt-2 text-center">
          <p className="text-[11px] text-slate-400">
            Tap any service to customize statement & download PNG receipt
          </p>
        </div>
      </main>
    </div>
  )
}
