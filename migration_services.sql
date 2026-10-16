CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  icon_type TEXT DEFAULT 'emoji', -- 'emoji', 'image_url', 'svg'
  icon_val TEXT NOT NULL,
  bg_color TEXT DEFAULT '#4f46e5',
  api_url TEXT,
  category TEXT DEFAULT 'payment',
  is_active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial services if not exists
INSERT OR IGNORE INTO services (id, service_key, name, subtitle, icon_type, icon_val, bg_color, api_url, is_active, sort_order)
VALUES
(1, 'bkash', 'bKash', 'Send & Cash Out', 'emoji', '🌸', '#e2136e', '/bk', 1, 1),
(2, 'nagad', 'Nagad', 'Regular & Islamic', 'emoji', '🟠', '#f6921e', '/ng', 1, 2),
(3, 'binance', 'Binance', 'Binance Pay Receipts', 'emoji', '🟡', '#f3ba2f', '/binance', 1, 3);
