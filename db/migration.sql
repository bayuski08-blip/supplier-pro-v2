-- =============================================
-- Migration Script: Update schema sesuai PRD2
-- Pendekatan: ALTER TABLE (data aman)
-- =============================================

-- ========== 1. PRODUCTS: tambah kolom unit ==========
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(255) DEFAULT 'pcs';

-- ========== 2. CUSTOMERS: tambah kolom baru & rename ==========
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alamat_lengkap TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_number VARCHAR(255);
ALTER TABLE customers RENAME COLUMN credit_limit TO credit_lmt;

-- ========== 3. VENDORS: tambah kolom baru ==========
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS id_number VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS alamat_lengkap TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS nama_bank VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS nomor_rek VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pemilik_rek VARCHAR(255);

-- ========== 4. USERS: tambah kolom baru & rename ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
ALTER TABLE users RENAME COLUMN password TO password_hash;

-- ========== 5. INVOICES -> SALES_INVOICES ==========
ALTER TABLE invoices RENAME TO sales_invoices;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS due_date VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_type VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);
ALTER TABLE sales_invoices RENAME COLUMN paid TO paid_amount;
ALTER TABLE sales_invoices RENAME COLUMN type TO payment_type;

-- ========== 6. PURCHASES -> PURCHASE_ORDERS ==========
ALTER TABLE purchases RENAME TO purchase_orders;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_type VARCHAR(255);
ALTER TABLE purchase_orders RENAME COLUMN paid TO paid_amount;
ALTER TABLE purchase_orders RENAME COLUMN type TO payment_type;

-- ========== 7. CREATE tabel-tabel baru ==========

-- Stock Adjustments
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id VARCHAR(255) PRIMARY KEY,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  quantity INTEGER NOT NULL,
  reason TEXT,
  adjustment_date DATE DEFAULT CURRENT_DATE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id VARCHAR(255) PRIMARY KEY,
  invoice_id VARCHAR(255) REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  price NUMERIC NOT NULL
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id VARCHAR(255) PRIMARY KEY,
  purchase_order_id VARCHAR(255) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id VARCHAR(255) REFERENCES products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  cost NUMERIC NOT NULL
);

-- Cash Transactions
CREATE TABLE IF NOT EXISTS cash_transactions (
  id VARCHAR(255) PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('IN', 'OUT')),
  category VARCHAR(255),
  description TEXT,
  amount NUMERIC NOT NULL,
  method VARCHAR(255)
);
