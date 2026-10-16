import React, { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CountdownTimerProps {
  targetDate: string | Date
  onExpire?: () => void
  label?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isExpired: boolean
}

function calculateRemaining(target: string | Date): TimeRemaining {
  const targetTime = typeof target === 'string' 
    ? new Date(target.replace(' ', 'T') + (target.endsWith('Z') ? '' : 'Z')).getTime()
    : target.getTime()

  const now = Date.now()
  const diff = targetTime - now

  if (diff <= 0 || isNaN(diff)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isExpired: true }
  }

  const seconds = Math.floor((diff / 1000) % 60)
  const minutes = Math.floor((diff / 1000 / 60) % 60)
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, totalMs: diff, isExpired: false }
}

export default function CountdownTimer({ targetDate, onExpire, label = 'Subscription Validity' }: CountdownTimerProps) {
  const [remaining, setRemaining] = useState<TimeRemaining>(() => calculateRemaining(targetDate))

  useEffect(() => {
    const timer = setInterval(() => {
      const updated = calculateRemaining(targetDate)
      setRemaining(updated)
      if (updated.isExpired && onExpire) {
        onExpire()
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [targetDate, onExpire])

  const pad = (n: number) => String(n).padStart(2, '0')

  if (remaining.isExpired) {
    return (
      <div className="bg-rose-950/60 border border-rose-600/60 rounded-2xl p-4 text-center shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 text-rose-400 font-bold mb-1">
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>Subscription Expired</span>
        </div>
        <p className="text-xs text-rose-300/80">
          Your monthly license has concluded. Please contact your Super Administrator to renew.
        </p>
      </div>
    )
  }

  // Warning when less than 3 days
  const isUrgent = remaining.days < 3

  return (
    <div className={`rounded-2xl p-4 border shadow-xl backdrop-blur-md transition-all ${
      isUrgent
        ? 'bg-amber-950/40 border-amber-500/50 text-amber-200'
        : 'bg-gradient-to-br from-slate-900/90 to-slate-950/90 border-slate-700/60 text-slate-100'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${isUrgent ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-300 block">{label}</span>
            <span className="text-[10px] text-slate-400">Monthly License Live Countdown</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Active</span>
        </div>
      </div>

      {/* Countdown Digits Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl py-2 px-1 shadow-inner">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-400 block">
            {pad(remaining.days)}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Days</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl py-2 px-1 shadow-inner">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white block">
            {pad(remaining.hours)}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Hours</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl py-2 px-1 shadow-inner">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white block">
            {pad(remaining.minutes)}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Mins</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-700/80 rounded-xl py-2 px-1 shadow-inner">
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-emerald-400 block animate-pulse">
            {pad(remaining.seconds)}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400">Secs</span>
        </div>
      </div>
    </div>
  )
}
