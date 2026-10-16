import React, { useState, useEffect } from 'react'
import { 
  Sliders, Download, RefreshCw, Sparkles, Check, 
  ChevronDown, ChevronUp, Layers, Clock, Phone, Hash
} from 'lucide-react'
import { DynamicField, TemplateInfo } from '../types'

interface DynamicFormPanelProps {
  activeTemplate: 'binance' | 'bk' | 'ng'
  onDownload: () => void
  isDownloading?: boolean
}

export default function DynamicFormPanel({ activeTemplate, onDownload, isDownloading }: DynamicFormPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [dynamicFields, setDynamicFields] = useState<DynamicField[]>([])
  const [isLoadingFields, setIsLoadingFields] = useState(false)
  const [formValues, setFormValues] = useState<Record<string, string>>({})

  // Map 'bk' -> 'bkash', 'ng' -> 'nagad'
  const templateCode = activeTemplate === 'bk' ? 'bkash' : activeTemplate === 'ng' ? 'nagad' : 'binance'

  // Read current search params into state
  const syncFromUrl = () => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const values: Record<string, string> = {}
    params.forEach((val, key) => {
      values[key] = val
    })
    setFormValues(values)
  }

  useEffect(() => {
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [activeTemplate])

  // Fetch dynamic fields from D1
  useEffect(() => {
    const fetchFields = async () => {
      setIsLoadingFields(true)
      try {
        const res = await fetch('/api/templates')
        const data = await res.json() as any
        if (data.success && data.templates) {
          const matched = data.templates.find((t: TemplateInfo) => t.code === templateCode)
          if (matched && matched.fields) {
            setDynamicFields(matched.fields)
          }
        }
      } catch (err) {
        console.warn('Could not fetch D1 fields, using fallbacks:', err)
      } finally {
        setIsLoadingFields(false)
      }
    }
    fetchFields()
  }, [templateCode])

  // Update a field both in state and in URL query
  const handleFieldChange = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
    const currentUrl = new URL(window.location.href)
    if (value === '' || value === undefined) {
      currentUrl.searchParams.delete(key)
    } else {
      currentUrl.searchParams.set(key, value)
    }
    window.history.pushState({}, '', currentUrl.toString())
  }

  // Generate random transaction ID
  const generateRandomTrx = (fieldKey: string) => {
    let rand = ''
    if (templateCode === 'binance') {
      rand = '386' + Math.floor(100000000000000 + Math.random() * 900000000000000)
    } else if (templateCode === 'bkash') {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      for (let i = 0; i < 10; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length))
    } else {
      const chars = '789ABCDEFGHJKLMNPQRSTUVWXYZ'
      for (let i = 0; i < 8; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    handleFieldChange(fieldKey, rand)
  }

  const isDualMsg = formValues['second'] === 'true' || formValues['msg2'] === 'true'

  return (
    <>
      {/* Floating Mobile Action Buttons Bar */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 w-full max-w-sm px-4 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-900/95 border border-slate-700/80 text-white font-bold text-xs shadow-2xl backdrop-blur-xl flex items-center justify-center gap-2 active:scale-95 transition"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>{isOpen ? 'Close Form' : 'Edit Receipt Data'}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </button>

        <button
          onClick={onDownload}
          disabled={isDownloading}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition cursor-pointer"
        >
          {isDownloading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PNG</span>
            </>
          )}
        </button>
      </div>

      {/* Dynamic Slide-up Sheet / Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-200">
            {/* Sheet Handle for Mobile */}
            <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Customize {templateCode.toUpperCase()} Receipt</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  Real-time preview & Cloudflare D1 synced parameters
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Fields */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              {/* PRIMARY SECTION */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 block">
                  Primary Parameters
                </span>

                {dynamicFields
                  .filter(f => f.section !== 'message2')
                  .map((field) => {
                    const currentVal = formValues[field.field_key] !== undefined 
                      ? formValues[field.field_key] 
                      : field.default_value

                    if (field.field_type === 'select' && field.options && field.options.length > 0) {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            {field.field_label}
                          </label>
                          <select
                            value={currentVal}
                            onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                          >
                            {field.options.map((opt, i) => (
                              <option key={i} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      )
                    }

                    if (field.field_key === 'trxId' || field.field_key === 'orderId') {
                      return (
                        <div key={field.id}>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">
                            {field.field_label}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={currentVal}
                              onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                              placeholder={field.placeholder || 'Transaction ID'}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                            />
                            <button
                              type="button"
                              onClick={() => generateRandomTrx(field.field_key)}
                              className="px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition flex items-center gap-1"
                              title="Generate Random"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Rand</span>
                            </button>
                          </div>
                        </div>
                      )
                    }

                    return (
                      <div key={field.id}>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          {field.field_label}
                        </label>
                        <input
                          type={field.field_type === 'number' ? 'text' : 'text'}
                          value={currentVal}
                          onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                          placeholder={field.placeholder || `Enter ${field.field_label.toLowerCase()}`}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    )
                  })}
              </div>

              {/* DUAL MESSAGE TRIGGER (For bKash & Nagad) */}
              {(templateCode === 'bkash' || templateCode === 'nagad') && (
                <div className="pt-3 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div>
                      <span className="text-xs font-bold text-white block">Dual Message Trigger</span>
                      <span className="text-[10px] text-slate-400">Display 2nd transaction statement bubble</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleFieldChange('second', isDualMsg ? 'false' : 'true')}
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                        isDualMsg ? 'bg-emerald-500' : 'bg-slate-800'
                      }`}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                          isDualMsg ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Secondary Fields */}
                  {isDualMsg && (
                    <div className="space-y-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-pink-400 block">
                        Secondary Message Parameters
                      </span>

                      {dynamicFields
                        .filter(f => f.section === 'message2' && f.field_key !== 'second')
                        .map((field) => {
                          const currentVal = formValues[field.field_key] !== undefined 
                            ? formValues[field.field_key] 
                            : field.default_value

                          if (field.field_key === 'trxId2') {
                            return (
                              <div key={field.id}>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">
                                  {field.field_label}
                                </label>
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={currentVal}
                                    onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                                    placeholder={field.placeholder || 'TrxID 2'}
                                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => generateRandomTrx(field.field_key)}
                                    className="px-3 rounded-xl bg-slate-800 text-amber-400 text-xs font-bold"
                                  >
                                    Rand
                                  </button>
                                </div>
                              </div>
                            )
                          }

                          return (
                            <div key={field.id}>
                              <label className="block text-xs font-semibold text-slate-300 mb-1">
                                {field.field_label}
                              </label>
                              <input
                                type="text"
                                value={currentVal}
                                onChange={(e) => handleFieldChange(field.field_key, e.target.value)}
                                placeholder={field.placeholder || field.field_label}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                              />
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800 flex gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
              >
                Done
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  onDownload()
                }}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
