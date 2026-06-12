-- =============================================
-- Migration Script: Master Data & PRD2 Schema Updates
-- =============================================

-- ========== 1. CREATE MASTER TABLES ==========
CREATE TABLE IF NOT EXISTS product_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS product_units (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS customer_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS vendor_categories (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_types (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL
);

-- ========== 2. SEED MASTER DATA (Default fallback) ==========
INSERT INTO product_categories (id, name) VALUES ('PC-1', 'Minuman'), ('PC-2', 'Makanan'), ('PC-3', 'Sembako'), ('PC-4', 'Lainnya') ON CONFLICT DO NOTHING;
INSERT INTO product_units (id, name) VALUES ('PU-1', 'pcs'), ('PU-2', 'box'), ('PU-3', 'botol'), ('PU-4', 'dus'), ('PU-5', 'pack'), ('PU-6', 'sak'), ('PU-7', 'kg'), ('PU-8', 'karton') ON CONFLICT DO NOTHING;
INSERT INTO customer_categories (id, name) VALUES ('CC-1', 'Reseller'), ('CC-2', 'Warung'), ('CC-3', 'Kafe'), ('CC-4', 'Toko') ON CONFLICT DO NOTHING;
INSERT INTO vendor_categories (id, name) VALUES ('VC-1', 'Minuman'), ('VC-2', 'Makanan'), ('VC-3', 'Sembako'), ('VC-4', 'Non-Pangan') ON CONFLICT DO NOTHING;
INSERT INTO payment_types (id, name) VALUES ('PT-1', 'Tunai'), ('PT-2', 'Tempo'), ('PT-4', 'Transfer') ON CONFLICT DO NOTHING;


-- ========== 3. MIGRATE PRODUCTS ==========
-- Note: SQLite / Postgres have different levels of support for altering to FKs. 
-- We add the new FK columns first.
ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id VARCHAR(255) REFERENCES product_categories(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_id VARCHAR(255) REFERENCES product_units(id) ON DELETE SET NULL;
-- After adding, the application should migrate data from category -> category_id and unit -> unit_id.
-- Once migrated, the old string columns can be dropped (or left for backward compatibility).


-- ========== 4. MIGRATE CUSTOMERS ==========
ALTER TABLE customers ADD COLUMN IF NOT EXISTS customer_category_id VARCHAR(255) REFERENCES customer_categories(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS npwp VARCHAR(255);
-- Rename alamat_lengkap to address
ALTER TABLE customers RENAME COLUMN alamat_lengkap TO address;


-- ========== 5. MIGRATE VENDORS ==========
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_category_id VARCHAR(255) REFERENCES vendor_categories(id) ON DELETE SET NULL;
-- Note: Depending on the DB, DROP COLUMN might fail if unsupported (like older SQLite). 
-- For Postgres, this is fine:
ALTER TABLE vendors DROP COLUMN IF EXISTS alamat_lengkap;
ALTER TABLE vendors DROP COLUMN IF EXISTS nama_bank;
ALTER TABLE vendors DROP COLUMN IF EXISTS nomor_rek;
ALTER TABLE vendors DROP COLUMN IF EXISTS pemilik_rek;


-- ========== 6. MIGRATE SALES_INVOICES & PURCHASE_ORDERS ==========
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL;
-- Application should migrate data from payment_type to payment_type_id

ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL;
-- Application should migrate data from payment_type to payment_type_id


-- ========== 7. MIGRATE CASH_TRANSACTIONS ==========
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS invoice_id VARCHAR(255) REFERENCES sales_invoices(id) ON DELETE SET NULL;
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS purchase_order_id VARCHAR(255) REFERENCES purchase_orders(id) ON DELETE SET NULL;
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS payment_type_id VARCHAR(255) REFERENCES payment_types(id) ON DELETE SET NULL;
ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- ========== 8. ADD USER_ID, CASH_CATEGORIES AND REMOVE DP ==========
ALTER TABLE sales_invoices ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS cash_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(10) CHECK (type IN ('IN', 'OUT', 'BOTH')) DEFAULT 'BOTH',
  is_system BOOLEAN DEFAULT false
);

UPDATE sales_invoices SET payment_type_id = 'PT-2' WHERE payment_type_id = 'PT-3';
UPDATE purchase_orders SET payment_type_id = 'PT-2' WHERE payment_type_id = 'PT-3';
DELETE FROM payment_types WHERE id = 'PT-3';
