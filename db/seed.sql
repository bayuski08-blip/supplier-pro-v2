-- =============================================
-- Seed Data untuk SupplierPro (PRD2 Master Data Update)
-- =============================================

-- Master Data
INSERT INTO product_categories (id, name) VALUES ('PC-1', 'Minuman'), ('PC-2', 'Makanan'), ('PC-3', 'Sembako'), ('PC-4', 'Lainnya') ON CONFLICT DO NOTHING;
INSERT INTO product_units (id, name) VALUES ('PU-1', 'pcs'), ('PU-2', 'box'), ('PU-3', 'botol'), ('PU-4', 'dus'), ('PU-5', 'pack'), ('PU-6', 'sak'), ('PU-7', 'kg'), ('PU-8', 'karton') ON CONFLICT DO NOTHING;
INSERT INTO customer_categories (id, name) VALUES ('CC-1', 'Reseller'), ('CC-2', 'Warung'), ('CC-3', 'Kafe'), ('CC-4', 'Toko') ON CONFLICT DO NOTHING;
INSERT INTO vendor_categories (id, name) VALUES ('VC-1', 'Minuman'), ('VC-2', 'Makanan'), ('VC-3', 'Sembako'), ('VC-4', 'Non-Pangan') ON CONFLICT DO NOTHING;
INSERT INTO payment_types (id, name) VALUES ('PT-1', 'Tunai'), ('PT-2', 'Tempo'), ('PT-3', 'DP'), ('PT-4', 'Transfer') ON CONFLICT DO NOTHING;

-- Admin user
INSERT INTO users (username, name, email, password_hash, role, active) 
VALUES ('admin', 'Administrator', 'admin@supplierpro.id', 'admin123', 'admin', true) 
ON CONFLICT (username) DO NOTHING;

-- Products (dengan kolom FK unit_id dan category_id)
INSERT INTO products (id, sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id, badge) 
VALUES 
  ('P001', 'MNM-001', 'Kopi Arabica 250g', 'PC-1', 45000, 68000, 124, 20, 'PU-1', 'Best Seller'),
  ('P002', 'MNM-002', 'Teh Celup Premium 25s', 'PC-1', 12000, 18500, 230, 50, 'PU-2', NULL),
  ('P003', 'MNM-003', 'Sirup Rasa Buah 1L', 'PC-1', 22000, 35000, 67, 15, 'PU-3', NULL),
  ('P004', 'MKN-001', 'Mie Instan Goreng (dus)', 'PC-2', 92000, 115000, 45, 10, 'PU-4', NULL),
  ('P005', 'MKN-002', 'Biskuit Kaleng 350g', 'PC-2', 28000, 42000, 89, 20, 'PU-1', NULL),
  ('P006', 'MKN-003', 'Wafer Coklat 12x21g', 'PC-2', 18000, 27000, 156, 30, 'PU-5', NULL),
  ('P007', 'SMB-001', 'Beras Premium 5kg', 'PC-3', 62000, 78000, 8, 15, 'PU-6', 'Hampir Habis'),
  ('P008', 'SMB-002', 'Gula Pasir 1kg', 'PC-3', 14000, 18000, 12, 25, 'PU-7', NULL),
  ('P009', 'SMB-003', 'Minyak Goreng 2L', 'PC-3', 28000, 36000, 5, 10, 'PU-3', 'Hampir Habis'),
  ('P010', 'MNM-004', 'Susu UHT 1L (karton)', 'PC-1', 155000, 195000, 32, 10, 'PU-8', NULL),
  ('P011', 'MKN-004', 'Sarden Kaleng 155g', 'PC-2', 11000, 16500, 78, 20, 'PU-1', NULL),
  ('P012', 'LNY-001', 'Sabun Cuci Piring 750ml', 'PC-4', 8500, 13000, 140, 30, 'PU-3', NULL),
  ('P013', 'LNY-002', 'Tisu Wajah 250s', 'PC-4', 12000, 18000, 95, 20, 'PU-5', NULL),
  ('P014', 'SMB-004', 'Tepung Terigu 1kg', 'PC-3', 10000, 14500, 18, 20, 'PU-7', NULL),
  ('P015', 'MNM-005', 'Air Mineral 600ml (dus)', 'PC-1', 38000, 52000, 200, 30, 'PU-4', NULL),
  ('P016', 'MKN-005', 'Kecap Manis 600ml', 'PC-2', 15000, 22000, 62, 15, 'PU-3', NULL)
ON CONFLICT (id) DO NOTHING;

-- Customers (menggunakan address dan FK customer_category_id)
INSERT INTO customers (id, name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp) 
VALUES 
  ('C001', 'Toko Berkah Jaya', 'CC-1', '0812-3456-7001', 'Surabaya', 'Jl. Diponegoro No 45, Surabaya', 15000000, '3578012345678901', '01.234.567.8-001.000'),
  ('C002', 'Warung Sari Rasa', 'CC-2', '0813-2345-6002', 'Malang', 'Jl. Ijen No 12, Malang', 5000000, '3573019876543210', NULL),
  ('C003', 'Kafe Nusantara', 'CC-3', '0821-4567-8003', 'Surabaya', 'Jl. Basuki Rahmat No 88, Surabaya', 20000000, '3578024567890123', '02.345.678.9-002.000'),
  ('C004', 'Toko Makmur Sentosa', 'CC-4', '0852-6789-0004', 'Sidoarjo', 'Jl. Pahlawan No 30, Sidoarjo', 10000000, '3515031234567890', NULL),
  ('C005', 'Warung Makan Bu Diah', 'CC-2', '0896-1234-5005', 'Gresik', 'Jl. Veteran No 5, Gresik', 3000000, '3525049876543210', NULL),
  ('C006', 'Minimarket Jaya Abadi', 'CC-1', '0811-9876-5006', 'Surabaya', 'Jl. Ahmad Yani No 100, Surabaya', 25000000, '3578056789012345', '03.456.789.0-003.000'),
  ('C007', 'Kedai Kopi Pagi', 'CC-3', '0857-6543-2007', 'Malang', 'Jl. Kawi No 7, Malang', 8000000, '3573068901234567', NULL),
  ('C008', 'Toko Sembako Ibu Rina', 'CC-4', '0878-3210-9008', 'Mojokerto', 'Jl. Majapahit No 22, Mojokerto', 7000000, '3576079012345678', NULL)
ON CONFLICT (id) DO NOTHING;

-- Vendors (menggunakan FK vendor_category_id)
INSERT INTO vendors (id, name, vendor_category_id, phone, city, id_number) 
VALUES 
  ('V001', 'PT Sumber Minuman Nusantara', 'VC-1', '021-5556-7890', 'Jakarta', '3171011234567890'),
  ('V002', 'CV Pangan Makmur', 'VC-2', '031-7778-9012', 'Surabaya', '3578022345678901'),
  ('V003', 'UD Sembako Sentosa', 'VC-3', '031-3334-5678', 'Sidoarjo', '3515033456789012'),
  ('V004', 'PT Kopi Nusantara', 'VC-1', '0341-445-6789', 'Malang', '3573044567890123'),
  ('V005', 'CV Bersih Sempurna', 'VC-4', '021-2223-4567', 'Jakarta', '3171055678901234')
ON CONFLICT (id) DO NOTHING;

-- Sales Invoices (menggunakan payment_type_id)
INSERT INTO sales_invoices (id, date, customer_id, subtotal, discount, tax, total, paid_amount, due_date, payment_type_id, payment_method, status) 
VALUES 
  ('INV-2026-0041', '2026-06-03', 'C001', 2850000, 0, 0, 2850000, 2850000, '2026-06-03', 'PT-1', 'Transfer', 'Lunas'),
  ('INV-2026-0040', '2026-06-02', 'C003', 4750000, 0, 0, 4750000, 2000000, '2026-06-16', 'PT-2', 'Transfer', 'Sebagian'),
  ('INV-2026-0039', '2026-06-02', 'C006', 8200000, 0, 0, 8200000, 0, '2026-06-16', 'PT-2', '-', 'Belum Bayar'),
  ('INV-2026-0038', '2026-06-01', 'C002', 1250000, 0, 0, 1250000, 1250000, '2026-06-01', 'PT-1', 'Tunai', 'Lunas'),
  ('INV-2026-0037', '2026-06-01', 'C004', 3400000, 0, 0, 3400000, 1500000, '2026-06-15', 'PT-3', 'Transfer', 'Sebagian')
ON CONFLICT (id) DO NOTHING;

-- Purchase Orders (data contoh)
INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, due_date, payment_type_id, status) 
VALUES 
  ('PO-2026-018', '2026-06-02', 'V001', 15600000, 15600000, '2026-06-02', 'PT-1', 'Selesai'),
  ('PO-2026-017', '2026-06-01', 'V002', 8400000, 4200000, '2026-06-15', 'PT-2', 'Dalam Proses'),
  ('PO-2026-016', '2026-05-30', 'V004', 12500000, 4000000, '2026-06-30', 'PT-2', 'Dalam Proses'),
  ('PO-2026-015', '2026-05-28', 'V003', 6200000, 6200000, '2026-05-28', 'PT-1', 'Selesai'),
  ('PO-2026-014', '2026-05-25', 'V005', 3800000, 3800000, '2026-05-25', 'PT-1', 'Selesai')
ON CONFLICT (id) DO NOTHING;

-- Cash Transactions (data contoh dengan FK)
INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id, purchase_order_id, payment_type_id, user_id) 
VALUES
  ('CT001', '2026-06-03', 'IN', 'Penjualan', 'Pembayaran INV-2026-0041', 2850000, 'Transfer Bank', 'INV-2026-0041', NULL, 'PT-1', 1),
  ('CT002', '2026-06-02', 'IN', 'Penjualan', 'DP dari Kafe Nusantara', 2000000, 'Transfer Bank', 'INV-2026-0040', NULL, 'PT-3', 1),
  ('CT003', '2026-06-02', 'OUT', 'Pembelian Stok', 'Bayar PO-2026-018', 15600000, 'Transfer Bank', NULL, 'PO-2026-018', 'PT-1', 1),
  ('CT004', '2026-06-01', 'IN', 'Penjualan', 'Pembayaran tunai Warung Sari Rasa', 1250000, 'Tunai', 'INV-2026-0038', NULL, 'PT-1', 1),
  ('CT005', '2026-06-01', 'OUT', 'Operasional', 'Listrik & air gudang', 2500000, 'Transfer Bank', NULL, NULL, NULL, 1)
ON CONFLICT (id) DO NOTHING;

-- Seed default prefix settings
INSERT INTO settings (key, value) VALUES
  ('prefix_customer', 'C'),
  ('prefix_vendor', 'V'),
  ('prefix_purchase', 'PO/{YYYY}/{MM}/'),
  ('prefix_sales', 'INV/{YYYY}/{MM}/')
ON CONFLICT (key) DO NOTHING;

