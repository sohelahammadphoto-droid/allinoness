import React, { useState, useEffect } from 'react'
import { Download, Smartphone, Share2, PlusSquare, CheckCircle2, ShieldCheck } from 'lucide-react'

interface PwaInstallModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIos, setIsIos] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true)
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const iosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIos(iosDevice)

    // Listen for Android / Chrome beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      alert("To install on your phone, tap your browser's menu (⋮) and select 'Install app' or 'Add to Home screen'.")
      return
    }

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-150">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Smartphone className="w-8 h-8 text-black" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Install Dark SS Maker App</h3>
          <p className="text-xs text-slate-400 mt-1">
            Install on your Android or iPhone for full-screen offline use without browser address bars!
          </p>
        </div>

        {isInstalled ? (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>App is already installed on your device!</span>
          </div>
        ) : isIos ? (
          // iOS Safari instructions
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left space-y-2.5">
            <span className="text-xs font-bold text-amber-400 block">How to install on iPhone / iPad:</span>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Share2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>1. Tap the <b>Share</b> button in Safari</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>2. Scroll down & tap <b>"Add to Home Screen"</b></span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3. Tap <b>"Add"</b> in the top right</span>
            </div>
          </div>
        ) : (
          // Android / Chrome 1-Click Install Button
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-black font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install to Home Screen</span>
            </button>
            <p className="text-[10px] text-slate-500">
              Fast, light (&lt; 1 MB), no Play Store required
            </p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
        >
          Close
        </button>
      </div>
    </div>
  )
}
