import React, { useState, useEffect } from 'react'
import { ArrowLeft, Zap, Download, RefreshCw, AlertTriangle, CheckCircle, ShieldCheck } from 'lucide-react'
import { ApiTool, ApiParameter } from './DynamicApiToolGenerator'

interface DynamicToolRunnerProps {
  toolSlug: string
  onBack: () => void
}

export default function DynamicToolRunner({ toolSlug, onBack }: DynamicToolRunnerProps) {
  const [tool, setTool] = useState<ApiTool | null>(null)
  const [fields, setFields] = useState<ApiParameter[]>([])
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  // Fetch tool definition from backend
  useEffect(() => {
    const fetchToolData = async () => {
      setIsLoading(true)
      try {
        const res = await fetch(`/api/services?key=${encodeURIComponent(toolSlug)}`)
        const data = await res.json() as any
        if (data.success && data.service) {
          setTool(data.service)
          const fList: ApiParameter[] = (data.service.fields || []).map((f: any) => ({
            field_key: f.field_key,
            field_label: f.field_label,
            field_type: f.field_type || 'text',
            placeholder: f.placeholder || '',
            is_required: f.is_required === 1,
          }))
          setFields(fList)

          // Initial values with clean placeholder defaults
          const initialVals: Record<string, string> = {}
          fList.forEach(f => {
            const rawPl = f.placeholder || ''
            initialVals[f.field_key] = rawPl.replace(/^e\.g\.\s*/i, '').trim()
          })
          setFormValues(initialVals)
        } else {
          setErrorMessage('টুলটি খুঁজে পাওয়া যায়নি')
        }
      } catch (err: any) {
        setErrorMessage('ডাটা লোড করতে সমস্যা হয়েছে: ' + err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (toolSlug) fetchToolData()
  }, [toolSlug])

  const handleInputChange = (key: string, val: string) => {
    setFormValues(prev => ({ ...prev, [key]: val }))
  }

  // Generate screenshot from API
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setIsGenerating(true)

    try {
      if (!tool) throw new Error('Tool metadata missing')

      let targetUrl = tool.api_url?.trim()
      if (!targetUrl) {
        throw new Error('এই টুলে কোনো Target API URL সেট করা নেই। অ্যাডমিন প্যানেল থেকে API লিঙ্ক যোগ করুন।')
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
        res = await fetch(finalUrl)
      }

      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`API Error (${res.status}): ${errText || res.statusText}`)
      }

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('image/')) {
        // Direct image response
        const blob = await res.blob()
        const objectUrl = URL.createObjectURL(blob)
        setGeneratedImageUrl(objectUrl)
      } else {
        // JSON response
        const data = await res.json() as any
        const img = data.image || data.imageUrl || data.url || data.screenshot || data.data
        if (img) {
          setGeneratedImageUrl(img)
        } else {
          throw new Error(data.error || data.message || 'API কোনো ছবি রিটার্ন করেনি')
        }
      }

      // Record generation in Cloudflare D1
      try {
        const storedAuth = localStorage.getItem('receipt_app_auth')
        if (storedAuth) {
          const authObj = JSON.parse(storedAuth)
          if (authObj?.user?.id) {
            fetch('/api/user/record-generation', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                user_id: authObj.user.id,
                tenant_id: authObj.user.tenant_id || authObj.tenant?.id,
                template_code: toolSlug || 'receipt',
                summary_info: `Tool: ${tool?.name || toolSlug}`,
              })
            }).catch(() => {})
          }
        }
      } catch (recErr) {}
    } catch (err: any) {
      setErrorMessage(err.message || 'রিকুয়েস্ট পাঠাতে ব্যর্থ হয়েছে')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!generatedImageUrl) return
    const a = document.createElement('a')
    a.href = generatedImageUrl
    a.download = `${toolSlug}-screenshot-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-center items-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-3" />
        <p className="text-sm font-bold text-slate-400">টুল লোড হচ্ছে...</p>
      </div>
    )
  }

  if (!tool) {
    return (
      <div className="min-h-screen bg-[#070b14] text-white flex flex-col justify-center items-center p-4 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-400 mb-3" />
        <h2 className="text-lg font-black mb-2">টুল পাওয়া যায়নি</h2>
        <p className="text-xs text-slate-400 mb-4">{errorMessage || 'নির্দিষ্ট টুলটি ডি১ ডাটাবেজে উপস্থিত নেই।'}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white"
        >
          হোম পেজে ফিরে যান
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-3 sm:p-6 font-sans">
      {/* Header */}
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 mb-6 pb-3 border-b border-slate-800/80">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-indigo-400 font-bold bg-indigo-950/50 px-2.5 py-1 rounded-lg border border-indigo-900/50">/{tool.service_key}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Form Panel */}
        <div className="bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="mb-5 text-center sm:text-left">
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight mb-1">
              {tool.name}
            </h1>
            <p className="text-xs text-slate-400">
              প্রয়োজনীয় তথ্য দিন এবং সাবমিট বাটনে চাপ দিন
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-4">
            {fields.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                এই টুলে কোনো ইনপুট প্যারামিটার নেই। সরাসরি বাটন চাপুন।
              </p>
            ) : (
              fields.map((field) => (
                <div key={field.field_key} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300">
                    {field.field_label || field.field_key}
                    {field.is_required && <span className="text-rose-400 ml-1">*</span>}
                  </label>
                  <input
                    type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : field.field_type === 'time' ? 'time' : 'text'}
                    value={formValues[field.field_key] || ''}
                    onChange={(e) => handleInputChange(field.field_key, e.target.value)}
                    placeholder={field.placeholder || `Enter ${field.field_label || field.field_key}`}
                    required={field.is_required}
                    className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              ))
            )}

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>জেনারেট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <span>🚀</span>
                  <span>{tool.subtitle || 'Fake Screenshot'}</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Output Preview */}
        <div className="bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col items-center justify-center min-h-[360px]">
          {generatedImageUrl ? (
            <div className="w-full space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>স্ক্রিনশট সফলভাবে তৈরি হয়েছে</span>
                </span>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>PNG ডাউনলোড</span>
                </button>
              </div>

              <div className="border border-slate-800 rounded-xl overflow-hidden shadow-2xl bg-black flex justify-center">
                <img
                  src={generatedImageUrl}
                  alt="Generated Screenshot"
                  className="max-h-[500px] w-auto object-contain rounded-lg"
                />
              </div>

              <button
                onClick={handleDownload}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>১-ক্লিকে হাই-কোয়ালিটি ডাউনলোড (PNG)</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/50 border border-indigo-900/50 flex items-center justify-center text-2xl text-indigo-400">
                📸
              </div>
              <h3 className="text-sm font-bold text-white">লাইভ স্ক্রিনশট আউটপুট</h3>
              <p className="text-xs text-slate-500 max-w-xs">
                বামে প্রয়োজনীয় প্যারামিটার লিখে বাটন চাপলেই আসল API থেকে তৈরি ছবি এখানে দেখতে পাবেন এবং ডাউনলোড করতে পারবেন।
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
