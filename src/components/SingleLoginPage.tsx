import React, { useState } from 'react'
import { Zap, Lock, Key, ArrowLeft, RefreshCw, XCircle, Eye, EyeOff, ShieldCheck, Building2 } from 'lucide-react'
import { AuthSession } from '../types'

interface SingleLoginPageProps {
  onSuccess: (session: AuthSession) => void
  onBackToHome: () => void
}

export default function SingleLoginPage({ onSuccess, onBackToHome }: SingleLoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      })

      const data = await res.json() as any
      if (!res.ok) {
        throw new Error(data.error || 'Invalid username or password')
      }

      onSuccess(data)
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  // Quick 1-click login for test users
  const quickLogin = async (user: string, pass: string) => {
    setUsername(user)
    setPassword(pass)
    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password: pass }),
      })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Login failed')
      onSuccess(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-center items-center px-4 py-8 font-sans relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top back button */}
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={onBackToHome}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <span className="text-[11px] text-slate-500 font-mono">
          Single Sign-On
        </span>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative z-10 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Zap className="w-7 h-7 text-white fill-white" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Sign In to Dark SS Maker
          </h2>
          <p className="text-xs text-slate-400">
            One single login page for Super Admin, Client Admins & Users
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-950/70 border border-rose-500/50 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Username or Client Code
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. Sohelahammad5853 or client_demo"
              required
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your account password"
                required
                className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black text-sm shadow-xl shadow-indigo-600/30 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Logins for Fast Access */}
        <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
          <p className="text-[10px] text-center text-slate-500 font-bold uppercase tracking-wider">
            Fast Access Credentials
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => quickLogin('Sohelahammad5853', 'Sr25800852*#')}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>👑</span>
              <span>Super Admin</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('client_demo', 'client123456')}
              className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>🏢</span>
              <span>Client Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
