PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  phone TEXT UNIQUE,
  password_hash TEXT,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
, referral_code TEXT, referred_by INTEGER);
CREATE TABLE password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  token TEXT UNIQUE,
  expires_at TEXT,
  used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE kitchen_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1), -- single-row settings table (id=1)
  kitchen_open_time TEXT DEFAULT '08:00',
  kitchen_close_time TEXT DEFAULT '22:00',
  global_cutoff_minutes INTEGER DEFAULT 15,
  prep_time_default_minutes INTEGER DEFAULT 20,
  next_day_cutoff_time TEXT DEFAULT '23:30',
  allow_subscriptions INTEGER DEFAULT 1,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  discount_type TEXT, -- 'flat' or 'percent'
  discount_value REAL,
  min_order_amount REAL DEFAULT 0,
  valid_from TEXT,
  valid_to TEXT,
  is_active INTEGER DEFAULT 1,
  user_specific INTEGER DEFAULT 0,
  allowed_user_ids TEXT, -- JSON array of user IDs
  item_specific INTEGER DEFAULT 0,
  allowed_variant_ids TEXT, -- JSON array of variant IDs
  usage_limit INTEGER,
  times_used INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  variant_id INTEGER,
  product_id INTEGER,
  name TEXT,
  variant_name TEXT,
  qty INTEGER,
  price_per_unit REAL,
  total_price REAL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT,
  phone TEXT,
  house TEXT,
  street TEXT,
  area TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  latitude REAL,
  longitude REAL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE carts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE,            -- Added Unique Constraint
  cart_key TEXT, 
  cart_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_no TEXT UNIQUE,
  user_id INTEGER,
  cart_snapshot TEXT,
  address_snapshot TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  amount_subtotal REAL,
  shipping_amount REAL,
  discount_amount REAL,
  tax_amount REAL DEFAULT 0,
  amount_total REAL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_payment_status TEXT,
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
  order_status TEXT DEFAULT 'created', -- created, confirmed, preparing, out_for_delivery, delivered, cancelled
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE TABLE order_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER,
  status TEXT,
  note TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE
);
CREATE TABLE product_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_id INTEGER NOT NULL,
    variant_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    order_no TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_title TEXT,            -- OPTIONAL Phase 1
    review_text TEXT,             -- Provisioned for Phase 2
    is_anonymous INTEGER DEFAULT 0,  -- Provisioned
    images TEXT DEFAULT NULL,     -- JSON array provisioned
    helpful_votes INTEGER DEFAULT 0, -- Provisioned
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'rejected')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    
    -- 🔥 FOREIGN KEYS
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY(variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE,
    
    -- 🔥 Business rules
    UNIQUE(user_id, order_id, variant_id)
);
CREATE TABLE geo_cache (
    cache_key TEXT PRIMARY KEY,
    result TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE mithora_feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  visit_reason TEXT,
  found_required TEXT,
  pricing_feedback TEXT,
  checked_competitor TEXT,
  competitor_price TEXT,
  
  customer_name TEXT,
  customer_phone TEXT,
  
  source_page TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
, additional_comment TEXT);
CREATE TABLE pin_reset_otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  email TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE signup_otps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  otp_salt TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  used INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
, verified INTEGER NOT NULL DEFAULT 0);
