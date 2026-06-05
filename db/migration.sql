-- =============================================
-- Migration Script: Update schema sesuai PRD2
-- Pendekatan: ALTER TABLE (data aman)
-- =============================================

-- ========== 1. PRODUCTS: tambah kolom unit ==========
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit VARCHAR(255) DEFAULT 'pcs';

-- ========== 2. CUSTOMERS: tambah kolom baru & rename ==========
ALTER TABLE customers ADD COLUMN IF NOT EXISTS alamat_lengkap TEXT;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS id_number VARCHAR(255);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'credit_limit'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'credit_lmt'
  ) THEN
    ALTER TABLE customers RENAME COLUMN credit_limit TO credit_lmt;
  END IF;
END $$;

-- ========== 3. VENDORS: tambah kolom baru ==========
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS id_number VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS alamat_lengkap TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS nama_bank VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS nomor_rek VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pemilik_rek VARCHAR(255);

-- ========== 4. USERS: tambah kolom baru ==========
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;
-- Rename password -> password_hash (data tetap aman)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users RENAME COLUMN password TO password_hash;
  END IF;
END $$;

-- ========== 5. RENAME invoices -> sales_invoices ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sales_invoices')
  THEN
    ALTER TABLE invoices RENAME TO sales_invoices;
  END IF;
END $$;

-- Tambah kolom baru di sales_invoices
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS tax NUMERIC DEFAULT 0;
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS due_date VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_type VARCHAR(255);
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_method VARCHAR(255);

-- Rename kolom 'paid' -> 'paid_amount' jika belum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_invoices' AND column_name = 'paid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_invoices' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE sales_invoices RENAME COLUMN paid TO paid_amount;
  END IF;
END $$;

-- Rename kolom 'type' -> 'payment_type' jika masih 'type' (skip jika sudah ada payment_type)
-- Kita sudah menambahkan payment_type di atas, jadi kita copy data lama lalu drop
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'sales_invoices' AND column_name = 'type'
  ) THEN
    UPDATE sales_invoices SET payment_type = type WHERE payment_type IS NULL;
    ALTER TABLE sales_invoices DROP COLUMN type;
  END IF;
END $$;

-- ========== 6. RENAME purchases -> purchase_orders ==========
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchases')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purchase_orders')
  THEN
    ALTER TABLE purchases RENAME TO purchase_orders;
  END IF;
END $$;

-- Tambah kolom baru di purchase_orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS due_date VARCHAR(255);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_type VARCHAR(255);

-- Rename kolom 'paid' -> 'paid_amount' jika belum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_orders' AND column_name = 'paid'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_orders' AND column_name = 'paid_amount'
  ) THEN
    ALTER TABLE purchase_orders RENAME COLUMN paid TO paid_amount;
  END IF;
END $$;

-- Copy type -> payment_type lalu drop type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'purchase_orders' AND column_name = 'type'
  ) THEN
    UPDATE purchase_orders SET payment_type = type WHERE payment_type IS NULL;
    ALTER TABLE purchase_orders DROP COLUMN type;
  END IF;
END $$;

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
