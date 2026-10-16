export type TemplateType = 'binance' | 'bk' | 'ng'

export interface DynamicField {
  id: number
  template_code: string
  field_key: string
  field_label: string
  field_type: 'text' | 'number' | 'select' | 'date' | 'time' | 'boolean'
  default_value: string
  placeholder: string
  options?: string[]
  options_json?: string
  is_required: number
  section: string
  sort_order: number
}

export interface TemplateInfo {
  id: number
  code: string
  name: string
  icon: string
  color: string
  is_active: number
  sort_order: number
  fields: DynamicField[]
}

export interface TenantUser {
  id: number
  tenant_id: number
  username: string
  password_hash: string
  full_name: string
  is_banned: number
  daily_limit: number
  generation_count: number
  created_at: string
}

export interface TenantInfo {
  id: number
  tenant_code: string
  name: string
  email: string
  password_hash?: string
  expires_at: string
  status: 'active' | 'suspended' | 'expired'
  max_users: number
  notes?: string
  is_expired?: boolean
  remaining_ms?: number
  expires_timestamp?: number
  user_count?: number
  banned_count?: number
  stats?: {
    total_users: number
    banned_users: number
  }
}

export interface AuthSession {
  token: string
  role: 'superadmin' | 'client_admin' | 'user'
  user?: {
    id: number
    username: string
    name?: string
    full_name?: string
  }
  tenant?: TenantInfo
  isExpired?: boolean
}
