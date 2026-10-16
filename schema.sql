-- D1 Schema for Receipt Studio Mobile App & Multi-Tenant SaaS
CREATE TABLE IF NOT EXISTS super_admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT DEFAULT 'Super Administrator',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  expires_at DATETIME NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'suspended', 'expired'
  max_users INTEGER DEFAULT 100,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  is_banned INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 500,
  generation_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, username)
);

CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS template_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_code TEXT NOT NULL,
  field_key TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text', -- 'text', 'number', 'select', 'date', 'time', 'boolean'
  default_value TEXT,
  placeholder TEXT,
  options_json TEXT, -- JSON array of strings for select options
  is_required INTEGER DEFAULT 0,
  section TEXT DEFAULT 'general',
  sort_order INTEGER DEFAULT 1,
  UNIQUE(template_code, field_key)
);

CREATE TABLE IF NOT EXISTS generation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER,
  user_id INTEGER,
  template_code TEXT NOT NULL,
  summary_info TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Super Admin (admin / superpass2026)
INSERT OR IGNORE INTO super_admins (id, username, password_hash, name)
VALUES (1, 'superadmin', 'superpass2026', 'Master Administrator');

-- Seed Initial Client Admin (tenant with 30-day countdown)
INSERT OR IGNORE INTO tenants (id, tenant_code, name, email, password_hash, expires_at, status, max_users, notes)
VALUES (1, 'client_demo', 'VIP Agency Admin', 'client@demo.com', 'client123456', datetime('now', '+30 days'), 'active', 100, 'Monthly Plan Subscriber');

-- Seed Initial End User under client_demo
INSERT OR IGNORE INTO users (id, tenant_id, username, password_hash, full_name, is_banned)
VALUES (1, 1, 'user1', 'user123456', 'Agent User One', 0);

-- Seed Templates
INSERT OR IGNORE INTO templates (id, code, name, icon, color, is_active, sort_order)
VALUES 
(1, 'binance', 'Binance Pay', '🟡', '#F3BA2F', 1, 1),
(2, 'bkash', 'bKash Statement', '🌸', '#E2136E', 1, 2),
(3, 'nagad', 'Nagad Statement', '🟠', '#F6921E', 1, 3);

-- Seed Dynamic Fields for Binance
INSERT OR IGNORE INTO template_fields (template_code, field_key, field_label, field_type, default_value, placeholder, options_json, section, sort_order)
VALUES
('binance', 'usd', 'Amount (USD)', 'number', '125.00', 'Enter USD amount', NULL, 'general', 1),
('binance', 'orderId', 'Order ID', 'text', '20240918112345892', 'Order ID', NULL, 'general', 2),
('binance', 'time', 'Timestamp (BD Time)', 'text', '', 'e.g. 11:45 PM or leave blank for now', NULL, 'general', 3),
('binance', 'coin', 'Cryptocurrency', 'select', 'USDT', 'Select coin', '["USDT", "BTC", "ETH", "BNB", "USDC"]', 'general', 4),
('binance', 'status', 'Status', 'select', 'Completed', 'Select status', '["Completed", "Processing", "Pending"]', 'general', 5);

-- Seed Dynamic Fields for bKash
INSERT OR IGNORE INTO template_fields (template_code, field_key, field_label, field_type, default_value, placeholder, options_json, section, sort_order)
VALUES
('bkash', 'amount', 'Primary Amount (৳)', 'number', '1500.00', 'Amount in BDT', NULL, 'general', 1),
('bkash', 'trxId', 'Primary TrxID', 'text', 'BL9A7X5D2K', 'Primary Transaction ID', NULL, 'general', 2),
('bkash', 'phone', 'Sender/Recipient Phone', 'text', '01712345678', 'Mobile number', NULL, 'general', 3),
('bkash', 'second', 'Enable Dual Message', 'boolean', 'false', '', NULL, 'message2', 4),
('bkash', 'amount2', 'Secondary Amount (৳)', 'number', '2500.00', 'Second message amount', NULL, 'message2', 5),
('bkash', 'trxId2', 'Secondary TrxID', 'text', 'BL9A7X999Z', 'Second message TrxID', NULL, 'message2', 6),
('bkash', 'time', 'Custom Time', 'text', '', 'e.g. 02:30 PM (blank = live BD time)', NULL, 'general', 7);

-- Seed Dynamic Fields for Nagad
INSERT OR IGNORE INTO template_fields (template_code, field_key, field_label, field_type, default_value, placeholder, options_json, section, sort_order)
VALUES
('nagad', 'amount', 'Primary Amount (৳)', 'number', '3200.00', 'Amount in BDT', NULL, 'general', 1),
('nagad', 'trxId', 'Primary TrxID', 'text', '78KL2MN9', 'Nagad TrxID', NULL, 'general', 2),
('nagad', 'phone', 'Customer Phone', 'text', '01812345678', 'Mobile number', NULL, 'general', 3),
('nagad', 'second', 'Enable Dual Message', 'boolean', 'false', '', NULL, 'message2', 4),
('nagad', 'amount2', 'Secondary Amount (৳)', 'number', '1800.00', 'Second message amount', NULL, 'message2', 5),
('nagad', 'trxId2', 'Secondary TrxID', 'text', '78KL2XYZ', 'Second message TrxID', NULL, 'message2', 6),
('nagad', 'time', 'Custom Time', 'text', '', 'e.g. 05:15 PM (blank = live BD time)', NULL, 'general', 7);
