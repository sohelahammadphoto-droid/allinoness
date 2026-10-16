import React, { useState, useEffect } from 'react'
import { 
  Home, LogOut, Zap, Download, RefreshCw, AlertTriangle, 
  CheckCircle, Sparkles, SlidersHorizontal, Image as ImageIcon 
} from 'lucide-react'
import { AuthSession, DynamicService } from '../types'
import { ApiParameter } from './DynamicApiToolGenerator'

interface UserDashboardProps {
  session: AuthSession
  onSignOut: () => void
  onGoToHome: () => void
}

export default function UserDashboard({ session, onSignOut, onGoToHome }: UserDashboardProps) {
  const [tools, setTools] = useState<DynamicService[]>([])
  const [selectedToolKey, setSelectedToolKey] = useState<string>('')
  const [selectedTool, setSelectedTool] = useState<any | null>(null)
  const [fields, setFields] = useState<ApiParameter[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  
  const [isLoadingTools, setIsLoadingTools] = useState(true)
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string>('')

  // 1. Fetch available dynamic tools from D1 database
  useEffect(() => {
    const fetchTools = async () => {
      setIsLoadingTools(true)
      try {
        const res = await fetch('/api/services')
        const data = await res.json() as any
        if (data.success && Array.isArray(data.services) && data.services.length > 0) {
          setTools(data.services)
          setSelectedToolKey(data.services[0].service_key)
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

  // 2. When selected tool changes, fetch its metadata and parameters
  useEffect(() => {
    if (!selectedToolKey) return

    const fetchToolDetails = async () => {
      setIsLoadingFields(true)
      setErrorMessage('')
      setGeneratedImageUrl(null)
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

          // Pre-populate initial values from placeholders or defaults
          const initialVals: Record<string, string> = {}
          fList.forEach((f) => {
            const rawPl = f.placeholder || ''
            const cleanVal = rawPl.replace(/^e\.g\.\s*/i, '').trim()
            initialVals[f.field_key] = cleanVal
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
      Object.entries(formValues).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          urlObj.searchParams.set(k, v)
        }
      })
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
      } else {
        const data = await res.json() as any
        const img = data.image || data.imageUrl || data.url || data.screenshot || data.data
        if (img) {
          setGeneratedImageUrl(img)
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
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold text-white">Statement Studio</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {session.user?.tenant_name || 'User Workspace'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 hidden sm:inline">
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

      {/* Main Studio Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 space-y-6">
        {/* Dynamic Tool Selector Buttons */}
        <div className="bg-[#0b101e] border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-xl">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Available Tools & Generators
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {tools.length} Tools Connected
            </span>
          </div>

          {isLoadingTools ? (
            <div className="flex items-center gap-2 py-2 text-slate-400 text-xs">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>টুলস লোড হচ্ছে...</span>
            </div>
          ) : tools.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              বর্তমানে কোনো সক্রিয় টুল নেই। অ্যাডমিন প্যানেল থেকে টুল যুক্ত করা হলে তা এখানে স্বয়ংক্রিয়ভাবে দেখাবে।
            </div>
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-thin">
              {tools.map((tool) => {
                const isSelected = selectedToolKey === tool.service_key
                return (
                  <button
                    key={tool.service_key}
                    onClick={() => setSelectedToolKey(tool.service_key)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-600/30 scale-102 border border-indigo-400/30'
                        : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span className="text-sm">{tool.icon_val || '🚀'}</span>
                    <span>{tool.name}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Studio Body: Left Dynamic Form + Right Live Image Preview */}
        {isLoadingFields ? (
          <div className="min-h-[300px] flex flex-col justify-center items-center bg-[#0b101e] border border-slate-800/90 rounded-2xl p-8">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
            <p className="text-xs font-bold text-slate-400">টুল প্যারামিটার লোড হচ্ছে...</p>
          </div>
        ) : selectedTool ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Dynamic Parameter Form */}
            <div className="lg:col-span-5 bg-[#0b101e] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <span>{selectedTool.icon_val || '🚀'}</span>
                    <span>{selectedTool.name}</span>
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {selectedTool.subtitle || 'ফর্ম পূরণ করে সাবমিট করুন'}
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {selectedTool.service_key}
                </span>
              </div>

              <form onSubmit={handleGenerate} className="space-y-4">
                {fields.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-400">
                    এই টুলে অতিরিক্ত কোনো ইনপুট নেই। সরাসরি নিচের বাটন চাপুন।
                  </div>
                ) : (
                  fields.map((field) => (
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
                  ))
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
                      <span>{selectedTool.subtitle || 'Generate Screenshot'}</span>
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
                      <span>স্ক্রিনশট সফলভাবে জেনারেট হয়েছে</span>
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
                    বামে প্রয়োজনীয় তথ্য পূরণ করে <b>"{selectedTool.subtitle || 'Generate'}"</b> বাটনে ক্লিক করলেই লাইভ API কল হয়ে তৈরি ছবি এখানে প্রদর্শিত হবে।
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
