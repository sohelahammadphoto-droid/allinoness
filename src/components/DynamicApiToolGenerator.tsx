import React, { useState, useEffect } from 'react'
import { 
  Plus, Trash2, ArrowLeft, Save, Sparkles, Check, 
  ExternalLink, Edit3, Eye, Layers, Zap
} from 'lucide-react'

export interface ApiParameter {
  id?: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'date' | 'time' | 'select'
  placeholder: string
  is_required: boolean
}

export interface ApiTool {
  id?: number
  service_key: string
  name: string
  subtitle?: string // button name
  category?: string
  api_url: string
  icon_val?: string
  is_active: number
  fields?: any[]
}

interface DynamicApiToolGeneratorProps {
  onBackToDashboard: () => void
  onOpenTool?: (slug: string) => void
}

export default function DynamicApiToolGenerator({ onBackToDashboard, onOpenTool }: DynamicApiToolGeneratorProps) {
  // Form State
  const [editingId, setEditingId] = useState<number | null>(null)
  const [toolTitle, setToolTitle] = useState('Vercel Receipt Generator')
  const [toolSlug, setToolSlug] = useState('receipt')
  const [buttonName, setButtonName] = useState('Fake Screenshot')
  const [targetApiUrl, setTargetApiUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Dynamic Parameters list
  const [parameters, setParameters] = useState<ApiParameter[]>([
    {
      id: '1',
      field_key: 'amount',
      field_label: 'Amount (TK)',
      field_type: 'number',
      placeholder: 'e.g. 500',
      is_required: true,
    }
  ])

  // Existing Tools List
  const [toolsList, setToolsList] = useState<ApiTool[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Load tools from D1
  const fetchTools = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/services?all=true&include_fields=true')
      const data = await res.json() as any
      if (data.success && Array.isArray(data.services)) {
        setToolsList(data.services)
      }
    } catch (err: any) {
      console.error('Failed to load tools:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTools()
  }, [])

  // Auto slugify title if slug wasn't manually customized
  const handleTitleChange = (val: string) => {
    setToolTitle(val)
    if (!editingId) {
      const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
      setToolSlug(autoSlug || 'tool')
    }
  }

  // Add parameter row
  const addParameter = () => {
    setParameters([
      ...parameters,
      {
        id: Date.now().toString(),
        field_key: '',
        field_label: '',
        field_type: 'text',
        placeholder: '',
        is_required: false,
      }
    ])
  }

  // Remove parameter row
  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, idx) => idx !== index))
  }

  // Update parameter field
  const updateParameter = (index: number, key: keyof ApiParameter, value: any) => {
    const updated = [...parameters]
    updated[index] = { ...updated[index], [key]: value }
    setParameters(updated)
  }

  // Load tool for editing
  const handleEditTool = (tool: ApiTool) => {
    setEditingId(tool.id || null)
    setToolTitle(tool.name)
    setToolSlug(tool.service_key)
    setButtonName(tool.subtitle || 'Fake Screenshot')
    setTargetApiUrl(tool.api_url || '')
    setIsActive(tool.is_active === 1)

    if (Array.isArray(tool.fields) && tool.fields.length > 0) {
      setParameters(tool.fields.map((f: any, idx: number) => ({
        id: idx.toString(),
        field_key: f.field_key,
        field_label: f.field_label,
        field_type: f.field_type || 'text',
        placeholder: f.placeholder || '',
        is_required: f.is_required === 1,
      })))
    } else {
      setParameters([])
    }

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset form to blank new tool
  const resetForm = () => {
    setEditingId(null)
    setToolTitle('')
    setToolSlug('')
    setButtonName('Fake Screenshot')
    setTargetApiUrl('')
    setIsActive(true)
    setParameters([
      {
        id: '1',
        field_key: 'amount',
        field_label: 'Amount (TK)',
        field_type: 'number',
        placeholder: 'e.g. 500',
        is_required: true,
      }
    ])
  }

  // Save tool to backend
  const handleSaveTool = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')
    setSaveSuccess(false)

    if (!toolTitle.trim() || !toolSlug.trim()) {
      setErrorMessage('পেজের শিরোনাম এবং ইউআরএল শর্ট নেম (Slug) আবশ্যক!')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        id: editingId,
        service_key: toolSlug.trim().toLowerCase(),
        name: toolTitle.trim(),
        subtitle: buttonName.trim() || 'Fake Screenshot',
        category: 'free',
        api_url: targetApiUrl.trim(),
        caption: '',
        icon_type: 'emoji',
        icon_val: '⚡',
        is_active: isActive ? 1 : 0,
        sort_order: 1,
        parameters: parameters.filter(p => p.field_key.trim().length > 0).map((p, idx) => ({
          field_key: p.field_key.trim(),
          field_label: p.field_label.trim() || p.field_key.trim(),
          field_type: p.field_type,
          placeholder: p.placeholder.trim(),
          is_required: p.is_required ? 1 : 0,
          sort_order: idx + 1
        }))
      }

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json() as any
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'টুল সেভ করতে সমস্যা হয়েছে')
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      fetchTools()
    } catch (err: any) {
      setErrorMessage(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  // Delete tool
  const handleDeleteTool = async (id: number) => {
    if (!confirm('আপনি কি নিশ্চিত যে এই টুলটি মুছে ফেলতে চান?')) return

    try {
      const res = await fetch(`/api/services?id=${id}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (data.success) {
        if (editingId === id) resetForm()
        fetchTools()
      } else {
        alert(data.error || 'মুছে ফেলতে ব্যর্থ হয়েছে')
      }
    } catch (err: any) {
      alert(err.message)
    }
  }

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-3 sm:p-6 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <span className="text-xl">🚀</span>
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Dynamic API Tool Generator Panel</span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Live Builder
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              যেকোনো কাস্টম API লিঙ্ক দিয়ে স্বয়ংক্রিয় ডায়নামিক স্ক্রিনশট জেনারেটর টুল তৈরি করুন
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editingId && (
            <button
              onClick={resetForm}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-bold transition cursor-pointer"
            >
              + নতুন টুল তৈরি
            </button>
          )}
          <button
            onClick={onBackToDashboard}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-indigo-600/30 hover:border-indigo-500/50 border border-slate-800 text-indigo-400 hover:text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Setup Form | Right Live Preview & Tools List */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Setup Diary (7 cols) */}
        <div className="lg:col-span-7 bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h2 className="text-base font-extrabold text-white">
                {editingId ? 'এপিআই পেজ এডিট করুন' : 'নতুন API পেজ সেটআপ ডায়েরি'}
              </h2>
            </div>
            {editingId && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Editing ID: #{editingId}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveTool} className="space-y-4">
            {/* 1 & 2: Title and Slug */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ১. পেজের শিরোনাম (Tool Title):
                </label>
                <input
                  type="text"
                  value={toolTitle}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="উদাহরণ: Vercel Receipt Generator"
                  required
                  className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">ইউজাররা সেকশন উপরে এই শিরোনামটি দেখতে পাবে।</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  ২. ইউআরএল শর্ট নেম (Slug):
                </label>
                <input
                  type="text"
                  value={toolSlug}
                  onChange={(e) => setToolSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                  placeholder="উদাহরণ: receipt"
                  required
                  className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-indigo-300 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                />
                <p className="text-[10px] text-indigo-400/80 mt-1">
                  লিংক তৈরি হবে: <span className="font-mono">/tool?name={toolSlug || '...'}</span>
                </p>
              </div>
            </div>

            {/* 3: Button Name */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ৩. জেনারেট বাটন নেম (Button Name):
              </label>
              <input
                type="text"
                value={buttonName}
                onChange={(e) => setButtonName(e.target.value)}
                placeholder="Fake Screenshot"
                className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[10px] text-slate-500 mt-1">রিসিট/ছবি তৈরির জন্য বাটনের টেক্সট।</p>
            </div>

            {/* 4: Target API URL */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                ৪. টার্গেট API URL (Target API Address):
              </label>
              <input
                type="text"
                value={targetApiUrl}
                onChange={(e) => setTargetApiUrl(e.target.value)}
                placeholder="উদাহরণ: https://your-app.vercel.app/api/receipt অথবা /bot/money/binance.php"
                className="w-full bg-[#080d1a] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                এখানে আপনার আসল API লিঙ্ক দিন। সিস্টেম স্বয়ংক্রিয়ভাবে নিচের প্যারামিটারগুলো এর সাথে যুক্ত করে ছবি রিকুয়েস্ট পাঠাবে।
              </p>
            </div>

            {/* 5: Dynamic Form Fields / Parameters Builder */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300">
                    ৫. ফর্ম ইনপুট ফিল্ড ও এপিআই প্যারামিটারসমূহ (Dynamic Builder):
                  </label>
                  <p className="text-[10px] text-slate-500">
                    যতগুলো প্যারামিটার প্রয়োজন, নিচে ➕ Add Parameter দিয়ে যোগ করুন।
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addParameter}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Parameter</span>
                </button>
              </div>

              {/* Parameter Rows */}
              <div className="space-y-2 bg-[#080d1a] p-3 rounded-xl border border-slate-800">
                {parameters.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">
                    কোনো প্যারামিটার যোগ করা হয়নি। উপরে ➕ Add Parameter বাটনে চাপ দিন।
                  </p>
                ) : (
                  parameters.map((param, index) => (
                    <div key={param.id || index} className="grid grid-cols-12 gap-1.5 sm:gap-2 items-center bg-[#0d1424] p-2 rounded-lg border border-slate-800/80">
                      {/* Param Key */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={param.field_key}
                          onChange={(e) => updateParameter(index, 'field_key', e.target.value)}
                          placeholder="key (e.g. amount)"
                          className="w-full bg-[#070b14] border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-indigo-300 font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Field Label */}
                      <div className="col-span-3">
                        <input
                          type="text"
                          value={param.field_label}
                          onChange={(e) => updateParameter(index, 'field_label', e.target.value)}
                          placeholder="Label (Amount)"
                          className="w-full bg-[#070b14] border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Field Type */}
                      <div className="col-span-2">
                        <select
                          value={param.field_type}
                          onChange={(e) => updateParameter(index, 'field_type', e.target.value)}
                          className="w-full bg-[#070b14] border border-slate-700/80 rounded-md px-1.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
                        >
                          <option value="text">Text</option>
                          <option value="number">Num</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="select">Select</option>
                        </select>
                      </div>

                      {/* Placeholder */}
                      <div className="col-span-2">
                        <input
                          type="text"
                          value={param.placeholder}
                          onChange={(e) => updateParameter(index, 'placeholder', e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full bg-[#070b14] border border-slate-700/80 rounded-md px-2 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      {/* Required Checkbox */}
                      <div className="col-span-1 flex items-center justify-center">
                        <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer" title="Required Field">
                          <input
                            type="checkbox"
                            checked={param.is_required}
                            onChange={(e) => updateParameter(index, 'is_required', e.target.checked)}
                            className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                          />
                          <span className="hidden sm:inline">Req</span>
                        </label>
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          className="p-1.5 rounded bg-rose-950/40 text-rose-400 hover:bg-rose-900/60 transition cursor-pointer"
                          title="Remove Parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 6: Active checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="active_status"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="active_status" className="text-xs font-bold text-slate-200 cursor-pointer">
                ৬. এই পেজটি চালু রাখুন (Active)
              </label>
            </div>

            {/* Error & Success Notice */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}
            {saveSuccess && (
              <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>টুলটি সফলভাবে সেভ হয়েছে এবং অবিলম্বে লাইভ কার্যকর হয়েছে!</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'সংরক্ষণ করা হচ্ছে...' : '💾 ডায়নামিক API টুল সেভ করুন'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-Time Live Preview & Existing Tools (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Real-Time Live Preview Mockup */}
          <div className="bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📱</span>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  লাইভ ডেমো প্রদর্শনী (Real-Time Live Preview)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400 font-mono animate-pulse">● Live Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-4">
              বামে টাইপ করার সাথে সাথে ইউজারের পেজটি ঠিক কেমন দেখাবে তা ডানপাশে দেখুন:
            </p>

            {/* Preview Card */}
            <div className="bg-[#080d1a] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-inner">
              <div className="text-center space-y-1 mb-4">
                <h4 className="text-base font-black text-white tracking-tight">
                  {toolTitle || 'আপনার পেজের শিরোনাম'}
                </h4>
                <p className="text-[11px] text-slate-400">
                  প্রয়োজনীয় তথ্য দিন এবং সাবমিট বাটনে চাপ দিন
                </p>
              </div>

              {/* Render Preview Dynamic Fields */}
              <div className="space-y-3 mb-4">
                {parameters.length === 0 ? (
                  <div className="text-center py-3 text-xs text-slate-600 border border-dashed border-slate-800 rounded-xl">
                    প্যারামিটার যোগ করলে এখানে ইনপুট দেখা যাবে
                  </div>
                ) : (
                  parameters.map((param, idx) => (
                    <div key={idx} className="space-y-1">
                      <label className="block text-[11px] font-bold text-slate-300">
                        {param.field_label || param.field_key || `Parameter ${idx + 1}`}
                        {param.is_required && <span className="text-rose-400 ml-1">*</span>}
                      </label>
                      <input
                        type={param.field_type === 'number' ? 'number' : param.field_type === 'date' ? 'date' : param.field_type === 'time' ? 'time' : 'text'}
                        placeholder={param.placeholder || `Enter ${param.field_label || param.field_key}`}
                        disabled
                        className="w-full bg-[#0d1424] border border-slate-700/70 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 opacity-90"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Live Preview Button */}
              <button
                type="button"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-default"
              >
                <span>🚀</span>
                <span>{buttonName || 'Fake Screenshot'}</span>
              </button>
            </div>
          </div>

          {/* Existing Tools Table */}
          <div className="bg-[#0d1424] border border-slate-800/90 rounded-2xl p-4 sm:p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📋</span>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  তৈরি করা অন্যান্য টুল সমূহের তালিকা:
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-bold">
                মোট: {toolsList.length}
              </span>
            </div>

            {isLoading ? (
              <p className="text-xs text-slate-500 text-center py-4">লোড হচ্ছে...</p>
            ) : toolsList.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">
                এখনো কোনো কাস্টম টুল তৈরি করা হয়নি।
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="pb-2 font-bold">Title / Slug</th>
                      <th className="pb-2 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {toolsList.map((tool) => (
                      <tr key={tool.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 pr-2">
                          <p className="font-bold text-white text-xs">{tool.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">{tool.service_key}</p>
                        </td>
                        <td className="py-2.5 pl-2 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => handleEditTool(tool)}
                            className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 transition text-[11px] font-bold cursor-pointer"
                            title="Edit Tool"
                          >
                            Edit
                          </button>
                          {tool.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTool(tool.id!)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-400 transition text-[11px] font-bold cursor-pointer"
                              title="Delete Tool"
                            >
                              ✕
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
