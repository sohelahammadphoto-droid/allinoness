import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, UserPlus, Users, Key, LogOut, CheckCircle2, 
  XCircle, Plus, Trash2, Calendar, RefreshCw, Sliders, 
  Settings, ChevronRight, Lock, Eye, EyeOff, Sparkles, Building2,
  Zap, Globe, Edit3, Layers
} from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import { AuthSession, TenantInfo, TenantUser, TemplateInfo, DynamicField, DynamicService } from '../types'

interface AdminPortalProps {
  onBackToApp?: () => void
}

export default function AdminPortal({ onBackToApp }: AdminPortalProps) {
  const [session, setSession] = useState<AuthSession | null>(() => {
    try {
      const stored = localStorage.getItem('receipt_app_auth')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  // Login form state
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [selectedRole, setSelectedRole] = useState<'client_admin' | 'superadmin'>('client_admin')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Client Admin data
  const [subscription, setSubscription] = useState<TenantInfo | null>(null)
  const [users, setUsers] = useState<TenantUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newFullName, setNewFullName] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Super Admin data
  const [superTab, setSuperTab] = useState<'tenants' | 'services' | 'parameters'>('services')
  const [tenantsList, setTenantsList] = useState<TenantInfo[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false)
  
  // New Tenant form
  const [newTenantCode, setNewTenantCode] = useState('')
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantPassword, setNewTenantPassword] = useState('')
  const [newTenantDays, setNewTenantDays] = useState('30')
  const [newTenantMaxUsers, setNewTenantMaxUsers] = useState('100')

  // Dynamic Services (D1)
  const [servicesList, setServicesList] = useState<DynamicService[]>([])
  const [isLoadingServices, setIsLoadingServices] = useState(false)
  const [isCreateServiceModalOpen, setIsCreateServiceModalOpen] = useState(false)
  const [newServiceKey, setNewServiceKey] = useState('')
  const [newServiceName, setNewServiceName] = useState('')
  const [newServiceSubtitle, setNewServiceSubtitle] = useState('')
  const [newServiceIconType, setNewServiceIconType] = useState<'emoji' | 'image_url'>('emoji')
  const [newServiceIconVal, setNewServiceIconVal] = useState('⚡')
  const [newServiceBgColor, setNewServiceBgColor] = useState('#4f46e5')
  const [newServiceApiUrl, setNewServiceApiUrl] = useState('')

  // Dynamic Parameters (D1)
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [activeParamTemplate, setActiveParamTemplate] = useState<'binance' | 'bkash' | 'nagad'>('binance')
  const [isAddFieldModalOpen, setIsAddFieldModalOpen] = useState(false)
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldType, setNewFieldType] = useState<'text' | 'number' | 'select' | 'time' | 'boolean'>('text')
  const [newFieldDefault, setNewFieldDefault] = useState('')
  const [newFieldPlaceholder, setNewFieldPlaceholder] = useState('')
  const [newFieldOptions, setNewFieldOptions] = useState('')
  const [newFieldSection, setNewFieldSection] = useState<'general' | 'message2'>('general')

  // Save session
  const saveSession = (newSession: AuthSession | null) => {
    setSession(newSession)
    if (newSession) {
      localStorage.setItem('receipt_app_auth', JSON.stringify(newSession))
    } else {
      localStorage.removeItem('receipt_app_auth')
    }
  }

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role: selectedRole
        })
      })

      const data = await res.json() as any
      if (!res.ok) {
        throw new Error(data.error || 'Login failed')
      }

      saveSession(data)
    } catch (err: any) {
      setLoginError(err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Quick Preset Login
  const quickLogin = async (role: 'client_admin' | 'superadmin') => {
    const creds = role === 'superadmin' 
      ? { user: 'superadmin', pass: 'superpass2026' }
      : { user: 'client_demo', pass: 'client123456' }
    
    setUsername(creds.user)
    setPassword(creds.pass)
    setSelectedRole(role)

    setIsLoggingIn(true)
    setLoginError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: creds.user,
          password: creds.pass,
          role
        })
      })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Login failed')
      saveSession(data)
    } catch (err: any) {
      setLoginError(err.message)
    } finally {
      setIsLoggingIn(false)
    }
  }

  // Fetch Client Admin Data
  const fetchClientAdminData = async () => {
    if (!session || session.role !== 'client_admin' || !session.tenant) return
    setIsLoadingUsers(true)
    try {
      const subRes = await fetch(`/api/admin/subscription?tenant_id=${session.tenant.id}`)
      const subData = await subRes.json() as any
      if (subData.success) {
        setSubscription(subData.tenant)
      }

      const usersRes = await fetch(`/api/admin/users?tenant_id=${session.tenant.id}`)
      const usersData = await usersRes.json() as any
      if (usersData.success) {
        setUsers(usersData.users)
      }
    } catch (err) {
      console.error('Error fetching tenant data:', err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  // Fetch Super Admin Data
  const fetchSuperAdminData = async () => {
    if (!session || session.role !== 'superadmin') return
    setIsLoadingTenants(true)
    setIsLoadingServices(true)
    try {
      // 1. Tenants
      const tenantsRes = await fetch('/api/super/tenants')
      const tenantsData = await tenantsRes.json() as any
      if (tenantsData.success) {
        setTenantsList(tenantsData.tenants)
      }

      // 2. Services from D1
      const servicesRes = await fetch('/api/services?all=true')
      const servicesData = await servicesRes.json() as any
      if (servicesData.success) {
        setServicesList(servicesData.services)
      }

      // 3. Templates with Dynamic Fields from D1
      const tplRes = await fetch('/api/templates')
      const tplData = await tplRes.json() as any
      if (tplData.success) {
        setTemplates(tplData.templates)
      }
    } catch (err) {
      console.error('Error fetching super admin data:', err)
    } finally {
      setIsLoadingTenants(false)
      setIsLoadingServices(false)
    }
  }

  useEffect(() => {
    if (session?.role === 'client_admin') {
      fetchClientAdminData()
    } else if (session?.role === 'superadmin') {
      fetchSuperAdminData()
    }
  }, [session])

  // Client Admin: Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.tenant) return

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_id: session.tenant.id,
          username: newUsername.trim(),
          password: newPassword.trim(),
          full_name: newFullName.trim() || newUsername.trim(),
        })
      })

      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to create user')

      setIsAddUserModalOpen(false)
      setNewUsername('')
      setNewPassword('')
      setNewFullName('')
      fetchClientAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Client Admin: Toggle Ban/Unban User
  const handleToggleBan = async (user: TenantUser) => {
    const nextBanned = user.is_banned === 1 ? 0 : 1
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          action: 'toggle_ban',
          is_banned: nextBanned,
        })
      })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to update user status')

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_banned: nextBanned } : u))
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Client Admin: Delete User
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to remove this user?')) return
    try {
      const res = await fetch(`/api/admin/users?user_id=${userId}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to delete user')
      setUsers(prev => prev.filter(u => u.id !== userId))
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Create Client Admin / Tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/super/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenant_code: newTenantCode.trim(),
          name: newTenantName.trim(),
          password: newTenantPassword.trim(),
          days: Number(newTenantDays) || 30,
          max_users: Number(newTenantMaxUsers) || 100,
        })
      })

      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to create client admin')

      setIsCreateTenantModalOpen(false)
      setNewTenantCode('')
      setNewTenantName('')
      setNewTenantPassword('')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Extend Tenant Subscription (+30 Days)
  const handleExtendTenant = async (tenantId: number, days: number = 30) => {
    try {
      const res = await fetch('/api/super/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend',
          tenant_id: tenantId,
          days,
          status: 'active'
        })
      })

      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to extend subscription')

      alert(`Subscription successfully extended by ${days} days!`)
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Delete Tenant
  const handleDeleteTenant = async (tenantId: number) => {
    if (!confirm('Are you sure you want to delete this tenant and all their users?')) return
    try {
      const res = await fetch(`/api/super/tenants?id=${tenantId}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to delete tenant')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Add Dynamic Service / API to D1
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_key: newServiceKey.trim().toLowerCase(),
          name: newServiceName.trim(),
          subtitle: newServiceSubtitle.trim() || 'Payment & Statement',
          icon_type: newServiceIconType,
          icon_val: newServiceIconVal.trim(),
          bg_color: newServiceBgColor.trim() || '#4f46e5',
          api_url: newServiceApiUrl.trim() || `/${newServiceKey}`,
          is_active: 1,
        })
      })

      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to save service')

      alert(`Service "${newServiceName}" added! It now appears on the Home Page!`)
      setIsCreateServiceModalOpen(false)
      setNewServiceKey('')
      setNewServiceName('')
      setNewServiceSubtitle('')
      setNewServiceIconVal('⚡')
      setNewServiceApiUrl('')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Delete Service from D1
  const handleDeleteService = async (serviceId: number) => {
    if (!confirm('Remove this service from the home page?')) return
    try {
      const res = await fetch(`/api/services?id=${serviceId}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to delete service')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Add Dynamic Parameter to D1
  const handleAddDynamicField = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let optionsArray: string[] | undefined
      if (newFieldType === 'select') {
        optionsArray = newFieldOptions
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      }

      const res = await fetch('/api/templates/fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_code: activeParamTemplate,
          field_key: newFieldKey.trim(),
          field_label: newFieldLabel.trim(),
          field_type: newFieldType,
          default_value: newFieldDefault.trim(),
          placeholder: newFieldPlaceholder.trim(),
          options: optionsArray,
          section: newFieldSection,
        })
      })

      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to save dynamic parameter')

      alert('Dynamic parameter added successfully to D1!')
      setIsAddFieldModalOpen(false)
      setNewFieldKey('')
      setNewFieldLabel('')
      setNewFieldDefault('')
      setNewFieldPlaceholder('')
      setNewFieldOptions('')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Super Admin: Delete Dynamic Parameter from D1
  const handleDeleteDynamicField = async (fieldId: number) => {
    if (!confirm('Delete this dynamic parameter?')) return
    try {
      const res = await fetch(`/api/templates/fields?id=${fieldId}`, { method: 'DELETE' })
      const data = await res.json() as any
      if (!res.ok) throw new Error(data.error || 'Failed to delete parameter')
      fetchSuperAdminData()
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Filter users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  )

  // RENDER: Not Logged In
  if (!session) {
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-6 pb-24">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/20 mb-3">
            <Lock className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Admin & Client Portal</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access subscription countdown, user controls & dynamic services
          </p>
        </div>

        {/* Role Selector */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => setSelectedRole('client_admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'client_admin'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Client Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedRole('superadmin')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              selectedRole === 'superadmin'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Super Administrator</span>
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-xl space-y-4">
          {loginError && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-medium flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {selectedRole === 'superadmin' ? 'Admin Username' : 'Tenant Code / Username'}
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={selectedRole === 'superadmin' ? 'superadmin' : 'client_demo'}
              required
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold text-sm shadow-lg shadow-amber-500/20 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoggingIn ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Log In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Demo Fast Logins for Testing */}
        <div className="mt-5 space-y-2">
          <p className="text-[11px] text-center text-slate-500 font-semibold uppercase tracking-wider">
            Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => quickLogin('client_admin')}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>🏢</span>
              <span>Client Admin</span>
            </button>
            <button
              onClick={() => quickLogin('superadmin')}
              className="py-2.5 px-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>👑</span>
              <span>Super Admin</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // RENDER: CLIENT ADMIN DASHBOARD
  if (session.role === 'client_admin') {
    const currentTenant = subscription || session.tenant

    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-28 space-y-5">
        {/* Top Header */}
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-lg">
              {currentTenant?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-1.5">
                <span>{currentTenant?.name || 'Client Admin'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono">
                  {currentTenant?.tenant_code}
                </span>
              </h2>
              <span className="text-xs text-slate-400">Monthly License Portal</span>
            </div>
          </div>

          <button
            onClick={() => saveSession(null)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Prominent Live Countdown Timer */}
        {currentTenant?.expires_at && (
          <CountdownTimer 
            targetDate={currentTenant.expires_at}
            label={`${currentTenant.name} Subscription`}
          />
        )}

        {/* 2. Tenant Stats Overview */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-lg font-black text-white block">
              {users.length} <span className="text-xs font-normal text-slate-400">/ {currentTenant?.max_users || 100}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Users</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-lg font-black text-emerald-400 block">
              {users.filter(u => u.is_banned === 0).length}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Active</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-lg font-black text-rose-400 block">
              {users.filter(u => u.is_banned === 1).length}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Banned</span>
          </div>
        </div>

        {/* 3. User Management Section */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Managed Client Users</h3>
            </div>

            <button
              onClick={() => setIsAddUserModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          </div>

          {/* Search bar */}
          <input
            type="text"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search users by name or username..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition"
          />

          {/* User List */}
          {isLoadingUsers ? (
            <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
              <span>Loading users from Cloudflare D1...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              No users found. Tap "Create User" to add your first user.
            </div>
          ) : (
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      user.is_banned === 1 
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{user.username}</span>
                        {user.is_banned === 1 ? (
                          <span className="text-[10px] bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                            Banned
                          </span>
                        ) : (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-semibold">
                            Active
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 block">{user.full_name || 'End User'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleBan(user)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        user.is_banned === 1
                          ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {user.is_banned === 1 ? 'Unban' : 'Ban User'}
                    </button>

                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Delete User"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal: Create User */}
        {isAddUserModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-amber-400" />
                  <span>Create New End User</span>
                </h3>
                <button 
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="e.g. user_tonmoy"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="e.g. Tonmoy Khan"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter user password"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddUserModalOpen(false)}
                    className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    )
  }

  // RENDER: SUPER ADMINISTRATOR PANEL
  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Super Admin Top Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-rose-500/30 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-black text-xl shadow-md">
            👑
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Super Administrator</span>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                MASTER
              </span>
            </h2>
            <span className="text-xs text-slate-400">Dynamic Services & Monthly Licensing Studio</span>
          </div>
        </div>

        <button
          onClick={() => saveSession(null)}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-400 transition"
          title="Log Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* 3-Mode Switcher */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 gap-1">
        <button
          onClick={() => setSuperTab('services')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            superTab === 'services'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Dynamic Services & APIs ({servicesList.length})</span>
        </button>

        <button
          onClick={() => setSuperTab('tenants')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            superTab === 'tenants'
              ? 'bg-rose-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Client Admins ({tenantsList.length})</span>
        </button>

        <button
          onClick={() => setSuperTab('parameters')}
          className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 ${
            superTab === 'parameters'
              ? 'bg-amber-500 text-black shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Parameters (D1)</span>
        </button>
      </div>

      {/* TAB 1: DYNAMIC SERVICES & APIS (Super Admin adds service name, icon, API to display on Home) */}
      {superTab === 'services' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Home Page Dynamic Services & Connected APIs</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Services added here appear on the Home screen in real-time
              </p>
            </div>

            <button
              onClick={() => setIsCreateServiceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Dynamic Service</span>
            </button>
          </div>

          {isLoadingServices ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              <span>Fetching dynamic services from Cloudflare D1...</span>
            </div>
          ) : servicesList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              No services added yet. Tap "Add Dynamic Service" to create your first API/Service card!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servicesList.map((service) => (
                <div
                  key={service.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold text-white shadow-md shrink-0"
                      style={{ backgroundColor: service.bg_color || '#4f46e5' }}
                    >
                      {service.icon_val || '⚡'}
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>{service.name}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {service.service_key}
                        </span>
                      </h4>
                      <span className="text-xs text-slate-400 block">{service.subtitle || 'Service'}</span>
                      <span className="text-[10px] text-indigo-400 font-mono mt-0.5 block">
                        Target: {service.api_url || `/${service.service_key}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      service.is_active === 1
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {service.is_active === 1 ? 'Live' : 'Hidden'}
                    </span>

                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                      title="Delete Service"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CLIENT ADMINS & MONTHLY SUBSCRIPTION MANAGEMENT */}
      {superTab === 'tenants' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Client Admin Portals & Monthly Licenses
            </h3>
            <button
              onClick={() => setIsCreateTenantModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-rose-600/20 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Client Admin</span>
            </button>
          </div>

          {isLoadingTenants ? (
            <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-rose-400" />
              <span>Fetching Client Admins from Cloudflare D1...</span>
            </div>
          ) : tenantsList.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs bg-slate-900/50 rounded-2xl border border-slate-800">
              No Client Admins created yet. Tap "Add Client Admin" to issue a monthly license.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tenantsList.map((tenant) => (
                <div
                  key={tenant.id}
                  className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3.5 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <span>{tenant.name}</span>
                        <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                          {tenant.tenant_code}
                        </span>
                      </h4>
                      <span className="text-[11px] text-slate-400">{tenant.email || 'No email registered'}</span>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      tenant.is_expired
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {tenant.is_expired ? 'Expired' : 'Active'}
                    </span>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                      <span>Expires: {tenant.expires_at}</span>
                      <span className="font-semibold text-amber-400">
                        {tenant.is_expired ? 'Expired' : `${Math.ceil((tenant.remaining_ms || 0) / 86400000)} days left`}
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${tenant.is_expired ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${Math.min(100, Math.max(5, ((tenant.remaining_ms || 0) / (30 * 86400000)) * 100))}%` }} 
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs text-slate-400">
                      👥 Users: <b className="text-white">{tenant.user_count || 0}</b> / {tenant.max_users}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleExtendTenant(tenant.id, 30)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition flex items-center gap-1"
                        title="Extend 1 month"
                      >
                        <Calendar className="w-3 h-3" />
                        <span>+30 Days</span>
                      </button>

                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Delete Tenant"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DYNAMIC PARAMETER BUILDER */}
      {superTab === 'parameters' && (
        <div className="space-y-4">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveParamTemplate('binance')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeParamTemplate === 'binance' ? 'bg-amber-400 text-black' : 'text-slate-400'
              }`}
            >
              🟡 Binance Pay
            </button>
            <button
              onClick={() => setActiveParamTemplate('bkash')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeParamTemplate === 'bkash' ? 'bg-[#e2136e] text-white' : 'text-slate-400'
              }`}
            >
              🌸 bKash
            </button>
            <button
              onClick={() => setActiveParamTemplate('nagad')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
                activeParamTemplate === 'nagad' ? 'bg-[#f6921e] text-white' : 'text-slate-400'
              }`}
            >
              🟠 Nagad
            </button>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200">
              Dynamic Parameters & Select Options for {activeParamTemplate.toUpperCase()}
            </h3>

            <button
              onClick={() => setIsAddFieldModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Dynamic Option / Field</span>
            </button>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            {(() => {
              const currentTpl = templates.find(t => t.code === activeParamTemplate)
              const fields = currentTpl?.fields || []

              if (fields.length === 0) {
                return (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No dynamic fields found for this template in D1.
                  </div>
                )
              }

              return (
                <div className="space-y-2">
                  {fields.map((field) => (
                    <div
                      key={field.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                          {field.sort_order}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{field.field_label}</span>
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                              {field.field_key}
                            </span>
                            <span className="text-[9px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.2 rounded">
                              {field.field_type}
                            </span>
                          </div>
                          
                          {field.options && field.options.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 flex-wrap">
                              <span className="text-[10px] text-slate-400">Options:</span>
                              {field.options.map((opt, i) => (
                                <span key={i} className="text-[9px] bg-slate-800 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                                  {opt}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteDynamicField(field.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition"
                        title="Delete parameter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* MODAL: Create New Dynamic Service / API */}
      {isCreateServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Add Dynamic Service / API to Home Screen</span>
              </h3>
              <button 
                onClick={() => setIsCreateServiceModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddService} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Service Key</label>
                  <input
                    type="text"
                    value={newServiceKey}
                    onChange={(e) => setNewServiceKey(e.target.value)}
                    placeholder="e.g. rocket, upay, paypal"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    placeholder="e.g. Rocket Pay"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle</label>
                <input
                  type="text"
                  value={newServiceSubtitle}
                  onChange={(e) => setNewServiceSubtitle(e.target.value)}
                  placeholder="e.g. Send Money & Cash Out"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Icon Emoji or Image URL</label>
                  <input
                    type="text"
                    value={newServiceIconVal}
                    onChange={(e) => setNewServiceIconVal(e.target.value)}
                    placeholder="e.g. 🚀 or 💳 or image URL"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newServiceBgColor}
                      onChange={(e) => setNewServiceBgColor(e.target.value)}
                      className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    />
                    <input
                      type="text"
                      value={newServiceBgColor}
                      onChange={(e) => setNewServiceBgColor(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Route / API URL</label>
                <input
                  type="text"
                  value={newServiceApiUrl}
                  onChange={(e) => setNewServiceApiUrl(e.target.value)}
                  placeholder="e.g. /bk or /ng or /binance or https://api..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateServiceModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-500 transition"
                >
                  Save Service to D1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create New Client Admin */}
      {isCreateTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-rose-400" />
                <span>Create New Client Admin (Monthly License)</span>
              </h3>
              <button 
                onClick={() => setIsCreateTenantModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tenant Code (Unique ID)</label>
                <input
                  type="text"
                  value={newTenantCode}
                  onChange={(e) => setNewTenantCode(e.target.value)}
                  placeholder="e.g. agency_sohel"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Company / Client Name</label>
                <input
                  type="text"
                  value={newTenantName}
                  onChange={(e) => setNewTenantName(e.target.value)}
                  placeholder="e.g. Sohel Digital Media"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Password</label>
                <input
                  type="password"
                  value={newTenantPassword}
                  onChange={(e) => setNewTenantPassword(e.target.value)}
                  placeholder="Enter secure password"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subscription (Days)</label>
                  <select
                    value={newTenantDays}
                    onChange={(e) => setNewTenantDays(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="30">30 Days (1 Month)</option>
                    <option value="60">60 Days (2 Months)</option>
                    <option value="90">90 Days (3 Months)</option>
                    <option value="365">365 Days (1 Year)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Max Users Allowed</label>
                  <input
                    type="number"
                    value={newTenantMaxUsers}
                    onChange={(e) => setNewTenantMaxUsers(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTenantModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition"
                >
                  Create Client Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Add Dynamic Parameter & Option to D1 */}
      {isAddFieldModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Add Dynamic Parameter to {activeParamTemplate.toUpperCase()}</span>
              </h3>
              <button 
                onClick={() => setIsAddFieldModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDynamicField} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Field Key (API param)</label>
                  <input
                    type="text"
                    value={newFieldKey}
                    onChange={(e) => setNewFieldKey(e.target.value)}
                    placeholder="e.g. coin, fee, ref"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Display Label</label>
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    placeholder="e.g. Cryptocurrency"
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Field Type</label>
                  <select
                    value={newFieldType}
                    onChange={(e) => setNewFieldType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="text">Text Input</option>
                    <option value="number">Number Input</option>
                    <option value="select">Select Dropdown (Options)</option>
                    <option value="time">Time / Clock</option>
                    <option value="boolean">Boolean Switch (Dual Msg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Section</label>
                  <select
                    value={newFieldSection}
                    onChange={(e) => setNewFieldSection(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="general">Primary / General</option>
                    <option value="message2">Secondary Message</option>
                  </select>
                </div>
              </div>

              {newFieldType === 'select' && (
                <div>
                  <label className="block text-xs font-semibold text-amber-300 mb-1">
                    Dropdown Options (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={newFieldOptions}
                    onChange={(e) => setNewFieldOptions(e.target.value)}
                    placeholder="e.g. USDT, BTC, ETH, BNB, SOL"
                    required
                    className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Separate multiple choices with commas
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Default Value</label>
                  <input
                    type="text"
                    value={newFieldDefault}
                    onChange={(e) => setNewFieldDefault(e.target.value)}
                    placeholder="Default text"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={newFieldPlaceholder}
                    onChange={(e) => setNewFieldPlaceholder(e.target.value)}
                    placeholder="Placeholder hint"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddFieldModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold hover:bg-amber-400 transition"
                >
                  Save to D1
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
