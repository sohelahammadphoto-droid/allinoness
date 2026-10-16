import React from 'react'
import { Smartphone, ShieldCheck, DownloadCloud, ReceiptText } from 'lucide-react'

export type NavTab = 'generator' | 'admin' | 'install'

interface MobileBottomNavProps {
  activeTab: NavTab
  onSelectTab: (tab: NavTab) => void
  hasAdminSession?: boolean
}

export default function MobileBottomNav({ activeTab, onSelectTab, hasAdminSession }: MobileBottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-xl px-4 py-2 safe-bottom">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {/* Tab 1: Receipt Generator */}
        <button
          onClick={() => onSelectTab('generator')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'generator'
              ? 'text-amber-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'generator' ? 'bg-amber-500/20' : ''}`}>
            <ReceiptText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Generator</span>
        </button>

        {/* Tab 2: Admin Portal */}
        <button
          onClick={() => onSelectTab('admin')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer relative ${
            activeTab === 'admin'
              ? 'text-rose-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'admin' ? 'bg-rose-500/20' : ''}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Admin Portal</span>
          {hasAdminSession && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
          )}
        </button>

        {/* Tab 3: Install App */}
        <button
          onClick={() => onSelectTab('install')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all cursor-pointer ${
            activeTab === 'install'
              ? 'text-blue-400 scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition ${activeTab === 'install' ? 'bg-blue-500/20' : ''}`}>
            <Smartphone className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold tracking-tight">Install App</span>
        </button>
      </div>
    </nav>
  )
}
