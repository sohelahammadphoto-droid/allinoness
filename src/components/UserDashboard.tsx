import React, { useState, useEffect } from 'react'
import { 
  Home, LogOut, Zap, Download, RefreshCw, AlertTriangle, 
  CheckCircle, Sparkles, ArrowLeft, ArrowRight, Grid,
  Image as ImageIcon, MessageSquare, Plus, Trash2, ChevronRight,
  Clock, Calendar, Smartphone
} from 'lucide-react'
import { AuthSession, DynamicService } from '../types'
import { ApiParameter } from './DynamicApiToolGenerator'
import PwaInstallModal from './PwaInstallModal'

function getCurrentBdTime(): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

function getCurrentBdDateTime(): string {
  const now = new Date()
  const d = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
  return d.replace(',', '')
}

function formatBdDateTime(d: Date): string {
  const str = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dhaka',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d)
  return str.replace(',', '')
}

function extractDateForInput(val: string): string {
  if (!val) return ''
  const m = val.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (m) {
    const day = m[1].padStart(2, '0')
    const mon = m[2].padStart(2, '0')
    const yr = m[3]
    return `${yr}-${mon}-${day}`
  }
  return ''
}

function extractTimeForInput(val: string): string {
  if (!val) return ''
  const m = val.match(/(\d{1,2}):(\d{2})/)
  if (m) {
    const hh = m[1].padStart(2, '0')
    const mm = m[2]
    return `${hh}:${mm}`
  }
  return ''
}

interface UserDashboardProps {
  session: AuthSession
  onSignOut: () => void
  onGoToHome: () => void
}

export default function UserDashboard({ session, onSignOut, onGoToHome }: UserDashboardProps) {
  const [tools, setTools] = useState<DynamicService[]>([])
  // selectedToolKey is null initially so user sees the professional Apps Grid!
  const [selectedToolKey, setSelectedToolKey] = useState<string | null>(null)
  const [selectedTool, setSelectedTool] = useState<any | null>(null)
  const [fields, setFields] = useState<ApiParameter[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  
  // PWA Install Modal state
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false)

  // 2nd Message Toggle and Values (for Nagad & bKash)
  const [showSecondMsg, setShowSecondMsg] = useState(false)
  const [secondMsgValues, setSecondMsgValues] = useState<Record<string, string>>({})

  const [isLoadingTools, setIsLoadingTools] = useState(true)
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  const [userGenerations, setUserGenerations] = useState<number>(session.user?.generation_count || 0)

  // Fetch initial user generation count from backend
  useEffect(() => {
    if (!session.user?.id) return
    const fetchUserStats = async () => {
      try {
        const tenantId = session.user?.tenant_id || session.tenant?.id || '1'
        const res = await fetch(`/api/admin/users?tenant_id=${tenantId}`)
        const data = await res.json() as any
        if (data.success && Array.isArray(data.users)) {
          const me = data.users.find((u: any) => u.id === session.user?.id)
          if (me && typeof me.generation_count === 'number') {
            setUserGenerations(me.generation_count)
          }
        }
      } catch (e) {
        // quiet ignore
      }
    }
    fetchUserStats()
  }, [session.user?.id])

  // Record generation to Cloudflare D1
  const recordGeneration = async () => {
    try {
      const userId = session?.user?.id
      if (!userId) return

      setUserGenerations(prev => prev + 1)

      const res = await fetch('/api/user/record-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          tenant_id: session?.user?.tenant_id || session?.tenant?.id,
          template_code: selectedToolKey || selectedTool?.tool_slug || 'receipt',
          summary_info: `Tool: ${selectedTool?.name || selectedToolKey}, Amount: ${formValues['amount'] || ''}`,
        })
      })
      const data = await res.json() as any
      if (data.success && typeof data.generation_count === 'number') {
        setUserGenerations(data.generation_count)
      }
    } catch (e) {
      console.warn('Failed to record generation:', e)
    }
  }

  // 1. Fetch available dynamic tools from D1 database
  useEffect(() => {
    const fetchTools = async () => {
      setIsLoadingTools(true)
      try {
        const res = await fetch('/api/services')
        const data = await res.json() as any
        if (data.success && Array.isArray(data.services)) {
          setTools(data.services)
        } else {
          setTools([])
        }
      } catch (err: any) {
        console.error('Failed to load services:', err)
        setErrorMessage('টুলস লোড করতে সমস্যা হয়েছে: ' + err.message)
      } finally {
        setIsLoadingTools(false)
      }
    }
    fetchTools()
  }, [])

  // 2. When user selects a tool, fetch its metadata and parameters
  useEffect(() => {
    if (!selectedToolKey) {
      setSelectedTool(null)
      setFields([])
      setFormValues({})
      setSecondMsgValues({})
      setShowSecondMsg(false)
      setGeneratedImageUrl(null)
      setErrorMessage('')
      return
    }

    const fetchToolDetails = async () => {
      setIsLoadingFields(true)
      setErrorMessage('')
      setGeneratedImageUrl(null)
      setShowSecondMsg(false)
      setSecondMsgValues({})
      try {
        const res = await fetch(`/api/services?key=${encodeURIComponent(selectedToolKey)}`)
        const data = await res.json() as any
        if (data.success && data.service) {
          setSelectedTool(data.service)
          const fList: ApiParameter[] = (data.service.fields || []).map((f: any) => ({
            field_key: f.field_key,
            field_label: f.field_label,
            field_type: f.field_type || 'text',
            placeholder: f.placeholder || '',
            is_required: f.is_required === 1,
          }))
          setFields(fList)

          // Initial values are strictly BLANK (empty string) as requested!
          const initialVals: Record<string, string> = {}
          fList.forEach((f) => {
            initialVals[f.field_key] = ''
          })
          setFormValues(initialVals)
        } else {
          setErrorMessage('টুলটি খুঁজে পাওয়া যায়নি')
        }
      } catch (err: any) {
        setErrorMessage('টুল প্যারামিটার লোড করতে ব্যর্থ: ' + err.message)
      } finally {
        setIsLoadingFields(false)
      }
    }

    fetchToolDetails()
  }, [selectedToolKey])

  const handleInputChange = (key: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [key]: val }))
  }

  const handleSecondMsgChange = (key: string, val: string) => {
    setSecondMsgValues((prev) => ({ ...prev, [key]: val }))
  }

  // Detect whether current tool is Nagad or bKash
  const isNg = Boolean(
    selectedToolKey?.toLowerCase().includes('nagad') || 
    selectedToolKey?.toLowerCase().includes('ng')
  )
  const isBk = Boolean(
    selectedToolKey?.toLowerCase().includes('bkash') || 
    selectedToolKey?.toLowerCase().includes('bk')
  )
  const isNgOrBk = isNg || isBk

  // 3. Generate screenshot by calling the connected API
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsGenerating(true)

    try {
      if (!selectedTool) throw new Error('টুল সিলেক্ট করা নেই')

      const targetUrl = selectedTool.api_url?.trim()
      if (!targetUrl) {
        throw new Error('এই টুলে কোনো Target API URL সেট করা নেই। অ্যাডমিন প্যানেল থেকে API লিঙ্ক দিন।')
      }

      // Safely parse URL and apply form parameters
      const urlObj = new URL(targetUrl, window.location.origin)

      // Auto-set type for ng/bk
      if (isNg) {
        urlObj.searchParams.set('type', 'ng')
      } else if (isBk) {
        urlObj.searchParams.set('type', 'bk')
      }

      // Apply 1st message parameters
      Object.entries(formValues).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          urlObj.searchParams.set(k, v)
        }
      })

      // For bKash / Nagad statement receipts: auto-handle status bar time & 2nd message count
      if (isNgOrBk) {
        const currentBdTime = getCurrentBdTime()
        urlObj.searchParams.set('time', formValues['time'] || currentBdTime)
        urlObj.searchParams.set('clock', formValues['time'] || currentBdTime)

        if (!formValues['date']) {
          urlObj.searchParams.set('date', getCurrentBdDateTime())
        }

        if (showSecondMsg) {
          urlObj.searchParams.set('count', '2')
          urlObj.searchParams.set('msgCount', '2')
          Object.entries(secondMsgValues).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
              urlObj.searchParams.set(k, v)
            }
          })
          if (secondMsgValues['time2']) {
            urlObj.searchParams.set('clock2', secondMsgValues['time2'])
          }
        } else {
          urlObj.searchParams.set('count', '1')
          urlObj.searchParams.delete('msgCount')
          urlObj.searchParams.delete('amount2')
          urlObj.searchParams.delete('sender2')
          urlObj.searchParams.delete('trxId2')
          urlObj.searchParams.delete('ref2')
          urlObj.searchParams.delete('balance2')
          urlObj.searchParams.delete('fee2')
          urlObj.searchParams.delete('time2')
          urlObj.searchParams.delete('clock2')
          urlObj.searchParams.delete('date2')
        }
      }

      const finalUrl = urlObj.toString()

      // Fetch via backend proxy to bypass browser CORS restrictions
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`
      
      let res: Response
      try {
        res = await fetch(proxyUrl)
      } catch (proxyErr) {
        // Fallback to direct fetch
        res = await fetch(finalUrl)
      }

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API Error (${res.status}): ${errText || res.statusText}`)
      }

      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('image/')) {
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setGeneratedImageUrl(objectUrl)
        recordGeneration()
      } else {
        const data = await res.json() as any
        const img = data.image || data.imageUrl || data.url || data.screenshot || data.data
        if (img) {
          setGeneratedImageUrl(img)
          recordGeneration()
        } else {
          throw new Error(data.error || data.message || 'API কোনো ছবি প্রদান করেনি')
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'রিকুয়েস্ট পাঠাতে ব্যর্থ হয়েছে')
    } finally {
      setIsGenerating(false)
    }
  }

  // 4. One-click PNG Download
  const handleDownload = () => {
    if (!generatedImageUrl) return
    const a = document.createElement('a')
    a.href = generatedImageUrl
    a.download = `${selectedToolKey || 'receipt'}-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onGoToHome}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition cursor-pointer"
          >
            <Home className="w-4 h-4 text-indigo-400" />
            <span>Home</span>
          </button>
          
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white">Statement Studio</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {session.user?.tenant_name || 'User Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile-Friendly Install App Header Button */}
          <button
            onClick={() => setIsInstallModalOpen(true)}
            className="px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            title="Install App on Phone"
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xs:inline sm:inline">Install App</span>
            <span className="xs:hidden sm:hidden">Install</span>
          </button>

          {/* User Live Receipts / API Calls Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold shadow-sm" title="Total receipts created / API calls by you">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{userGenerations} Receipts</span>
          </div>

          <span className="text-xs text-slate-400 hidden md:inline">
            User: <b className="text-white">{session.user?.full_name || session.user?.username}</b>
          </span>
          <button
            onClick={onSignOut}
            className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-rose-950/60 hover:text-rose-400 border border-slate-800 text-slate-400 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* VIEW 1: PROFESSIONAL APPS HUB (When no tool is opened yet) */}
        {!selectedToolKey && (
          <div className="space-y-6 animate-fadeIn">
            {/* Hub Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-indigo-950/40 border border-indigo-900/40 p-6 sm:p-8 shadow-2xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10 max-w-2xl space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700/60 text-[11px] font-bold text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Available Receipt & Statement Applications</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  Welcome to Your Statement Studio
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Select an application below to open its generator form, enter custom details, and download instant high-resolution receipts.
                </p>
              </div>
            </div>

            {/* Install App Banner (Mobile & Desktop) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900 to-indigo-950/40 border border-amber-500/30 shadow-xl">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-black shadow-lg shadow-amber-500/25 shrink-0 mx-auto sm:mx-0">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-white flex items-center gap-2 justify-center sm:justify-start">
                    <span>Install Mobile App</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                      PWA Fast
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    আপনার অ্যান্ড্রয়েড বা আইফোনে ইনস্টল করে ব্রাউজার বার ছাড়া ফুল-স্ক্রিনে সরাসরি ব্যবহার করুন।
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs shadow-lg shadow-amber-500/25 transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Install App on Phone</span>
              </button>
            </div>

            {/* Apps Grid */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Grid className="w-4 h-4 text-indigo-400" />
                  <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                    Generator Applications ({tools.length})
                  </h2>
                </div>
                <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  All APIs Active
                </span>
              </div>

              {isLoadingTools ? (
                <div className="min-h-[200px] flex flex-col justify-center items-center bg-[#0b101e] border border-slate-800 rounded-2xl p-8">
                  <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mb-3" />
                  <p className="text-xs font-bold text-slate-400">অ্যাপ্লিকেশন লোড হচ্ছে...</p>
                </div>
              ) : tools.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                  <p className="text-sm font-bold text-white">কোনো টুল যুক্ত নেই</p>
                  <p className="text-xs text-slate-400">অ্যাডমিন প্যানেল থেকে টুল যুক্ত করার সাথে সাথেই এখানে কার্ড আকারে দৃশ্যমান হবে।</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {tools.map((tool) => (
                    <div
                      key={tool.service_key}
                      onClick={() => setSelectedToolKey(tool.service_key)}
                      className="group relative bg-[#0b101e] hover:bg-[#0f172a] border border-slate-800 hover:border-indigo-500/60 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between cursor-pointer active:scale-98"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-2xl shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform duration-300">
                            {tool.icon_val || '🚀'}
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-400">
                            Online
                          </span>
                        </div>

                        <div>
                          <h3 className="text-base font-black text-white group-hover:text-indigo-300 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            {tool.subtitle || 'Click to open generator and create receipts'}
                          </p>
                        </div>
                      </div>

                      <div className="pt-5 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          /{tool.service_key}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 group-hover:text-white transition-colors">
                          <span>Open Tool</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: TOOL GENERATOR STUDIO (When an app is clicked/selected) */}
        {selectedToolKey && (
          <div className="space-y-5 animate-fadeIn">
            {/* Back button and Tool Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
              <button
                onClick={() => setSelectedToolKey(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 hover:text-white text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 text-indigo-400" />
                <span>← Back to All Apps</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>{selectedTool?.icon_val || '🚀'}</span>
                  <span>{selectedTool?.name || 'Loading Tool...'}</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 hidden sm:inline">
                  {selectedToolKey}
                </span>
              </div>
            </div>

            {/* Studio Body: Left Blank Form + Right Live Image Output */}
            {isLoadingFields ? (
              <div className="min-h-[300px] flex flex-col justify-center items-center bg-[#0b101e] border border-slate-800/90 rounded-2xl p-8">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
                <p className="text-xs font-bold text-slate-400">টুল প্যারামিটার লোড হচ্ছে...</p>
              </div>
            ) : selectedTool ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column: Input Form (Strictly Blank Initially) */}
                <div className="lg:col-span-5 bg-[#0b101e] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
                  <div className="pb-3 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                        <span>{selectedTool.icon_val || '🚀'}</span>
                        <span>{selectedTool.name}</span>
                      </h2>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {selectedTool.subtitle || 'সবগুলো ফিল্ড সঠিকভাবে পূরণ করুন'}
                      </p>
                    </div>
                  </div>

                  {/* 2nd Message Toggle Button for Nagad & bKash */}
                  {isNgOrBk && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-indigo-900/50">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-800/40 flex items-center justify-center text-indigo-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">Need 2nd Message?</p>
                          <p className="text-[10px] text-slate-400">২টি মেসেজ একসাথে তৈরি করতে চান?</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowSecondMsg(!showSecondMsg)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          showSecondMsg
                            ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                            : 'bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {showSecondMsg ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Showing 2 Msgs</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Need 2nd Msg</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleGenerate} className="space-y-4">
                    {/* Message 1 Header */}
                    {isNgOrBk && showSecondMsg && (
                      <div className="flex items-center gap-2 pb-1 border-b border-slate-800 text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                        <span>💬 1st Message Details (১ম মেসেজ)</span>
                      </div>
                    )}

                    {/* Message 1 Dynamic Fields */}
                    {fields.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                        এই টুলে অতিরিক্ত কোনো ইনপুট নেই। সরাসরি নিচের বাটন চাপুন।
                      </div>
                    ) : (
                      fields
                        .filter(f => f.field_key !== 'type' && f.field_key !== 'time' && f.field_key !== 'clock') // Hide Status Bar Time as it auto-populates with current time
                        .map((field) => {
                          // Select Dropdown + Picker for DATE & TIME
                          // Select Date & Time (Calendar & Time Pickers + Manual Text input)
                          if (field.field_key === 'date') {
                            const dateVal = formValues['date'] || ''
                            const parsedDateInput = extractDateForInput(dateVal)
                            const parsedTimeInput = extractTimeForInput(dateVal)

                            const handleDatePartChange = (newDateStr: string) => {
                              if (!newDateStr) return
                              const [y, m, d] = newDateStr.split('-')
                              const currentTime = parsedTimeInput || getCurrentBdTime()
                              handleInputChange('date', `${d}/${m}/${y} ${currentTime}`)
                            }

                            const handleTimePartChange = (newTimeStr: string) => {
                              if (!newTimeStr) return
                              if (parsedDateInput) {
                                const [y, m, d] = parsedDateInput.split('-')
                                handleInputChange('date', `${d}/${m}/${y} ${newTimeStr}`)
                              } else {
                                const nowStr = getCurrentBdDateTime()
                                const [dPart] = nowStr.split(' ')
                                handleInputChange('date', `${dPart} ${newTimeStr}`)
                              }
                            }

                            return (
                              <div key={field.field_key} className="space-y-2.5 p-3 rounded-2xl bg-slate-900/40 border border-slate-800/80">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                                    <span>{field.field_label || 'Date & Time (তারিখ ও সময়)'}</span>
                                    {field.is_required && <span className="text-rose-400 ml-1">*</span>}
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => handleInputChange('date', getCurrentBdDateTime())}
                                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-950/60 hover:bg-emerald-900/60 px-2 py-0.5 rounded-md border border-emerald-900/50 transition"
                                  >
                                    <Clock className="w-3 h-3 text-emerald-400" />
                                    <span>বর্তমান সময় (Set Current)</span>
                                  </button>
                                </div>

                                {/* 2-Column Pickers: Date and Time */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  <div className="space-y-1">
                                    <span className="block text-[11px] font-semibold text-slate-300">
                                      তারিখ নির্বাচন (Select Date):
                                    </span>
                                    <input
                                      type="date"
                                      value={parsedDateInput}
                                      onChange={(e) => handleDatePartChange(e.target.value)}
                                      className="w-full bg-[#070b14] border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500 cursor-pointer transition font-mono"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <span className="block text-[11px] font-semibold text-slate-300">
                                      সময় নির্বাচন (Select Time):
                                    </span>
                                    <input
                                      type="time"
                                      value={parsedTimeInput}
                                      onChange={(e) => handleTimePartChange(e.target.value)}
                                      className="w-full bg-[#070b14] border border-slate-700/80 hover:border-slate-600 rounded-xl px-3 py-2 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-indigo-500 cursor-pointer transition font-mono"
                                    />
                                  </div>
                                </div>

                                {/* Editable formatted text input */}
                                <div className="space-y-1">
                                  <span className="block text-[10px] text-slate-400">
                                    তারিখ ও সময় (সরাসরি লিখেও এডিট করতে পারেন):
                                  </span>
                                  <input
                                    type="text"
                                    value={formValues['date'] || ''}
                                    onChange={(e) => handleInputChange('date', e.target.value)}
                                    placeholder={field.placeholder || "e.g. 16/10/2026 19:01"}
                                    className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition font-mono"
                                  />
                                </div>
                              </div>
                            )
                          }

                          // Default inputs
                          return (
                            <div key={field.field_key} className="space-y-1.5">
                              <label className="block text-xs font-bold text-slate-300">
                                {field.field_label || field.field_key}
                                {field.is_required && <span className="text-rose-400 ml-1">*</span>}
                              </label>
                              <input
                                type={
                                  field.field_type === 'number'
                                    ? 'number'
                                    : field.field_type === 'date'
                                    ? 'date'
                                    : field.field_type === 'time'
                                    ? 'time'
                                    : 'text'
                                }
                                value={formValues[field.field_key] || ''}
                                onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                                placeholder={field.placeholder || `Enter ${field.field_label || field.field_key}`}
                                required={field.is_required}
                                className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                              />
                            </div>
                          )
                        })
                    )}

                    {/* Message 2 Dynamic Fields (Visible only when showSecondMsg is true) */}
                    {isNgOrBk && showSecondMsg && (
                      <div className="space-y-4 pt-4 border-t border-dashed border-indigo-900/60 animate-fadeIn">
                        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                          <h3 className="text-xs font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                            <span>📩 2nd Message Details (২য় মেসেজ)</span>
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowSecondMsg(false)}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>

                        {/* 2nd Amount */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            2nd Amount (৳) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={secondMsgValues['amount2'] || ''}
                            onChange={(e) => handleSecondMsgChange('amount2', e.target.value)}
                            placeholder="e.g. 2,000.00"
                            required={showSecondMsg}
                            className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* 2nd Sender */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            2nd Sender Mobile Number <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={secondMsgValues['sender2'] || ''}
                            onChange={(e) => handleSecondMsgChange('sender2', e.target.value)}
                            placeholder="e.g. 01718727784"
                            required={showSecondMsg}
                            className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* 2nd TrxID */}
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-slate-300">
                            2nd Transaction ID (TrxID) <span className="text-rose-400">*</span>
                          </label>
                          <input
                            type="text"
                            value={secondMsgValues['trxId2'] || ''}
                            onChange={(e) => handleSecondMsgChange('trxId2', e.target.value)}
                            placeholder="e.g. 86K2MNPQ"
                            required={showSecondMsg}
                            className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                          />
                        </div>

                        {/* 2nd Ref & Balance Grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                              2nd Ref
                            </label>
                            <input
                              type="text"
                              value={secondMsgValues['ref2'] || ''}
                              onChange={(e) => handleSecondMsgChange('ref2', e.target.value)}
                              placeholder="e.g. N/A"
                              className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                              2nd Balance (৳)
                            </label>
                            <input
                              type="text"
                              value={secondMsgValues['balance2'] || ''}
                              onChange={(e) => handleSecondMsgChange('balance2', e.target.value)}
                              placeholder="e.g. 7,026.59"
                              className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            />
                          </div>
                        </div>

                        {/* If bKash: 2nd Fee */}
                        {isBk && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-slate-300">
                              2nd Fee (৳)
                            </label>
                            <input
                              type="text"
                              value={secondMsgValues['fee2'] || ''}
                              onChange={(e) => handleSecondMsgChange('fee2', e.target.value)}
                              placeholder="e.g. 0.00"
                              className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                            />
                          </div>
                        )}

                        {/* 2nd Time & Date Grid (Dual Type or Select) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-300">
                                2nd Time (সময়)
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSecondMsgChange('time2', getCurrentBdTime())}
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>Now</span>
                              </button>
                            </div>
                            <div className="relative flex items-center">
                              <input
                                type="text"
                                value={secondMsgValues['time2'] || ''}
                                onChange={(e) => handleSecondMsgChange('time2', e.target.value)}
                                placeholder="Type (19:05) or pick"
                                className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl pl-3 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                              />
                              <input
                                type="time"
                                onChange={(e) => {
                                  if (e.target.value) handleSecondMsgChange('time2', e.target.value)
                                }}
                                className="absolute right-2 opacity-60 hover:opacity-100 cursor-pointer w-5 h-5 border-0 bg-transparent text-white"
                                title="Pick time"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 p-2.5 rounded-xl bg-slate-900/40 border border-slate-800/80">
                            <div className="flex items-center justify-between">
                              <label className="block text-xs font-bold text-slate-300 flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-emerald-400" />
                                <span>2nd Date & Time (২য় তারিখ ও সময়)</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleSecondMsgChange('date2', getCurrentBdDateTime())}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-900/50"
                              >
                                <Clock className="w-2.5 h-2.5" />
                                <span>Set Now</span>
                              </button>
                            </div>

                            {/* 2-Column Pickers: Date and Time for 2nd message */}
                            {(() => {
                              const d2Val = secondMsgValues['date2'] || ''
                              const parsedD2Input = extractDateForInput(d2Val)
                              const parsedT2Input = extractTimeForInput(d2Val)

                              const handleD2DateChange = (newDateStr: string) => {
                                if (!newDateStr) return
                                const [y, m, d] = newDateStr.split('-')
                                const currentTime = parsedT2Input || secondMsgValues['time2'] || getCurrentBdTime()
                                handleSecondMsgChange('date2', `${d}/${m}/${y} ${currentTime}`)
                              }

                              const handleD2TimeChange = (newTimeStr: string) => {
                                if (!newTimeStr) return
                                if (parsedD2Input) {
                                  const [y, m, d] = parsedD2Input.split('-')
                                  handleSecondMsgChange('date2', `${d}/${m}/${y} ${newTimeStr}`)
                                } else {
                                  const nowStr = getCurrentBdDateTime()
                                  const [dPart] = nowStr.split(' ')
                                  handleSecondMsgChange('date2', `${dPart} ${newTimeStr}`)
                                }
                              }

                              return (
                                <>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                      <span className="block text-[10px] text-slate-400">তারিখ:</span>
                                      <input
                                        type="date"
                                        value={parsedD2Input}
                                        onChange={(e) => handleD2DateChange(e.target.value)}
                                        className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <span className="block text-[10px] text-slate-400">সময়:</span>
                                      <input
                                        type="time"
                                        value={parsedT2Input}
                                        onChange={(e) => handleD2TimeChange(e.target.value)}
                                        className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-white [color-scheme:dark] focus:outline-none focus:border-emerald-500 cursor-pointer font-mono"
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-1 pt-1">
                                    <span className="block text-[10px] text-slate-400">২য় তারিখ ও সময় টেক্সট:</span>
                                    <input
                                      type="text"
                                      value={secondMsgValues['date2'] || ''}
                                      onChange={(e) => handleSecondMsgChange('date2', e.target.value)}
                                      placeholder="e.g. 16/10/2026 19:05"
                                      className="w-full bg-[#070b14] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
                                    />
                                  </div>
                                </>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    )}

                    {errorMessage && (
                      <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <span>{errorMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>স্ক্রিনশট তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>
                            {showSecondMsg
                              ? 'Generate 2-Message Screenshot'
                              : (selectedTool.subtitle || 'Generate Screenshot')}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Right Column: Live Output & Download Area */}
                <div className="lg:col-span-7 bg-[#0b101e] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center min-h-[420px]">
                  {generatedImageUrl ? (
                    <div className="w-full space-y-4">
                      {/* Status & Quick Download */}
                      <div className="flex items-center justify-between gap-2 bg-emerald-950/40 border border-emerald-800/50 p-2.5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" />
                          <span>
                            {showSecondMsg ? '২-মেসেজ স্ক্রিনশট সফলভাবে তৈরি হয়েছে' : 'স্ক্রিনশট সফলভাবে জেনারেট হয়েছে'}
                          </span>
                        </span>
                        <button
                          onClick={handleDownload}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>ডাউনলোড</span>
                        </button>
                      </div>

                      {/* Rendered Image */}
                      <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black/80 flex justify-center p-3">
                        <img
                          src={generatedImageUrl}
                          alt="Generated Screenshot"
                          className="max-h-[520px] w-auto object-contain rounded-lg shadow-lg"
                        />
                      </div>

                      {/* Big 1-Click Download Button */}
                      <button
                        onClick={handleDownload}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>১-ক্লিকে হাই-কোয়ালিটি PNG ডাউনলোড করুন</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-12 px-4 space-y-3 max-w-sm">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/60 border border-indigo-900/60 flex items-center justify-center text-2xl text-indigo-400 shadow-inner">
                        <ImageIcon className="w-8 h-8 text-indigo-400" />
                      </div>
                      <h3 className="text-sm font-bold text-white">লাইভ স্ক্রিনশট আউটপউট</h3>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        বামে খালি ফিল্ডগুলো পূরণ করে বাটনে ক্লিক করলেই লাইভ API থেকে প্রস্তুত ছবি এখানে প্রদর্শিত হবে।
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </main>
      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </div>
  )
}
