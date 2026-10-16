import React, { useState, useEffect } from 'react'
import { 
  ShieldCheck, UserPlus, Users, Key, LogOut, CheckCircle2, 
  XCircle, Plus, Trash2, Calendar, RefreshCw,
  Lock, Eye, EyeOff, Building2
} from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import DynamicApiToolGenerator from './DynamicApiToolGenerator'
import { AuthSession, TenantInfo, TenantUser } from '../types'

interface AdminPortalProps {
  onBackToApp?: () => void
  session: AuthSession
  onLogout: () => void
}

export default function AdminPortal({ onBackToApp, session, onLogout }: AdminPortalProps) {
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
  // Super Admin data (STRICTLY 2 TABS: Tool Generator & Client Admins)
  const [superTab, setSuperTab] = useState<'builder' | 'tenants'>('builder')
  const [tenantsList, setTenantsList] = useState<TenantInfo[]>([])
  const [isLoadingTenants, setIsLoadingTenants] = useState(false)
  const [isCreateTenantModalOpen, setIsCreateTenantModalOpen] = useState(false)
  
  // New Tenant form
  const [newTenantCode, setNewTenantCode] = useState('')
  const [newTenantName, setNewTenantName] = useState('')
  const [newTenantPassword, setNewTenantPassword] = useState('')
  const [newTenantDays, setNewTenantDays] = useState('30')
  const [newTenantMaxUsers, setNewTenantMaxUsers] = useState('100')

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
    try {
      const tenantsRes = await fetch('/api/super/tenants')
      const tenantsData = await tenantsRes.json() as any
      if (tenantsData.success) {
        setTenantsList(tenantsData.tenants)
      }
    } catch (err) {
      console.error('Error fetching super admin data:', err)
    } finally {
      setIsLoadingTenants(false)
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



  // Filter users
  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(userSearch.toLowerCase()) || 
    (u.full_name && u.full_name.toLowerCase().includes(userSearch.toLowerCase()))
  )

  // RENDER: Not Logged In
  if (!session) {
    return (
      <div className="py-16 text-center text-slate-400">
        <p className="text-sm mb-3">Please sign in to access the dashboard.</p>
        <button
          onClick={onLogout}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
        >
          Go to Sign In
        </button>
      </div>
    )
  }

  // RENDER: CLIENT ADMIN DASHBOARD
  if (session.role === 'client_admin') {
    const currentTenant = subscription || session.tenant
    const totalTenantGenerations = users.reduce((acc, u) => acc + (Number(u.generation_count) || 0), 0)

    return (
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-6 pb-28 space-y-5">
        {/* Tenant Profile Banner */}
        <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-black text-base">
              {currentTenant?.name?.charAt(0) || 'A'}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                <span>{currentTenant?.name || 'Client Admin'}</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-mono">
                  {currentTenant?.tenant_code}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">Organization Monthly License Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              currentTenant?.status === 'expired'
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {currentTenant?.status === 'expired' ? 'Expired' : 'Active License'}
            </span>
          </div>
        </div>

        {/* 1. Prominent Live Countdown Timer */}
        {currentTenant?.expires_at && (
          <CountdownTimer 
            targetDate={currentTenant.expires_at}
            label={`${currentTenant.name} Subscription`}
          />
        )}

        {/* 2. Tenant Stats Overview (Total Users, Total API Calls, Active, Banned) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 text-center">
            <span className="text-lg font-black text-white block">
              {users.length} <span className="text-xs font-normal text-slate-400">/ {currentTenant?.max_users || 100}</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Users</span>
          </div>

          <div className="bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/30 rounded-xl p-3 text-center shadow-sm">
            <span className="text-lg font-black text-amber-400 block flex items-center justify-center gap-1">
              <span>⚡</span> {totalTenantGenerations}
            </span>
            <span className="text-[10px] uppercase font-bold text-amber-300/90">Total API Calls</span>
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-white">{user.username}</span>
                        
                        {/* Distinct User API Calls / Receipt Count Badge */}
                        <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm" title="Total receipts created / API calls by this user">
                          <span>⚡</span>
                          <span>{user.generation_count || 0} made</span>
                        </span>

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
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{user.full_name || 'End User'}</span>
                        <span>•</span>
                        <span className="text-amber-400 font-medium">Total API Calls: <b className="text-white">{user.generation_count || 0}</b></span>
                      </div>
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

  // RENDER: DYNAMIC API TOOL GENERATOR PANEL (Matching user screenshot)
  if (session.role === 'superadmin' && superTab === 'builder') {
    return (
      <DynamicApiToolGenerator
        activeTab="builder"
        onSwitchTab={(tab) => setSuperTab(tab)}
        tenantsCount={tenantsList.length}
        onBackToDashboard={() => setSuperTab('tenants')}
        onOpenTool={(slug) => {
          if (onBackToApp) onBackToApp()
        }}
      />
    )
  }

  // RENDER: SUPER ADMINISTRATOR PANEL (STRICTLY 2 TABS: Tool Generator & Client Admins)
  return (
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 pb-28 space-y-6">
      {/* Super Admin Status Banner with 2 TABS ONLY */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white flex items-center justify-center font-black text-lg shadow-md shadow-rose-600/20">
            👑
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <span>Super Administrator Control</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                Cloudflare D1 Live
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-400">
                Tool Generator & Client Admin License Management
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-sm">
                <span>⚡</span>
                <span>Total System API Calls: {tenantsList.reduce((acc, t) => acc + (t.total_generations || 0), 0)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* STRICTLY 2 TABS */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
          <button
            onClick={() => setSuperTab('builder')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800/60 transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>🚀</span>
            <span>Tool Generator</span>
          </button>

          <button
            onClick={() => setSuperTab('tenants')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 text-white shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Client Admins ({tenantsList.length})</span>
          </button>
        </div>
      </div>

      {/* CLIENT ADMINS & MONTHLY SUBSCRIPTION MANAGEMENT */}
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
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-slate-400">
                        👥 Users: <b className="text-white">{tenant.user_count || 0}</b> / {tenant.max_users}
                      </span>
                      <span className="text-[11px] text-amber-400 font-bold flex items-center gap-1">
                        <span>⚡</span>
                        <span>Receipts / API Calls: <b className="text-white">{tenant.total_generations || 0}</b></span>
                      </span>
                    </div>

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

    </div>
  )
}
