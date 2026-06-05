-- =============================================
-- Seed Data untuk SupplierPro (PRD2)
-- =============================================

-- Admin user
INSERT INTO users (username, name, email, password_hash, role, active) 
VALUES ('admin', 'Administrator', 'admin@supplierpro.id', 'admin123', 'admin', true) 
ON CONFLICT (username) DO NOTHING;

-- Products (dengan kolom unit)
INSERT INTO products (id, sku, name, category, cost_price, sell_price, stock, min_stock, unit, badge) 
VALUES 
  ('P001', 'MNM-001', 'Kopi Arabica 250g', 'Minuman', 45000, 68000, 124, 20, 'pcs', 'Best Seller'),
  ('P002', 'MNM-002', 'Teh Celup Premium 25s', 'Minuman', 12000, 18500, 230, 50, 'box', NULL),
  ('P003', 'MNM-003', 'Sirup Rasa Buah 1L', 'Minuman', 22000, 35000, 67, 15, 'botol', NULL),
  ('P004', 'MKN-001', 'Mie Instan Goreng (dus)', 'Makanan', 92000, 115000, 45, 10, 'dus', NULL),
  ('P005', 'MKN-002', 'Biskuit Kaleng 350g', 'Makanan', 28000, 42000, 89, 20, 'pcs', NULL),
  ('P006', 'MKN-003', 'Wafer Coklat 12x21g', 'Makanan', 18000, 27000, 156, 30, 'pack', NULL),
  ('P007', 'SMB-001', 'Beras Premium 5kg', 'Sembako', 62000, 78000, 8, 15, 'sak', 'Hampir Habis'),
  ('P008', 'SMB-002', 'Gula Pasir 1kg', 'Sembako', 14000, 18000, 12, 25, 'kg', NULL),
  ('P009', 'SMB-003', 'Minyak Goreng 2L', 'Sembako', 28000, 36000, 5, 10, 'botol', 'Hampir Habis'),
  ('P010', 'MNM-004', 'Susu UHT 1L (karton)', 'Minuman', 155000, 195000, 32, 10, 'karton', NULL),
  ('P011', 'MKN-004', 'Sarden Kaleng 155g', 'Makanan', 11000, 16500, 78, 20, 'pcs', NULL),
  ('P012', 'LNY-001', 'Sabun Cuci Piring 750ml', 'Lainnya', 8500, 13000, 140, 30, 'botol', NULL),
  ('P013', 'LNY-002', 'Tisu Wajah 250s', 'Lainnya', 12000, 18000, 95, 20, 'pack', NULL),
  ('P014', 'SMB-004', 'Tepung Terigu 1kg', 'Sembako', 10000, 14500, 18, 20, 'kg', NULL),
  ('P015', 'MNM-005', 'Air Mineral 600ml (dus)', 'Minuman', 38000, 52000, 200, 30, 'dus', NULL),
  ('P016', 'MKN-005', 'Kecap Manis 600ml', 'Makanan', 15000, 22000, 62, 15, 'botol', NULL)
ON CONFLICT (id) DO NOTHING;

-- Customers (dengan alamat_lengkap dan id_number)
INSERT INTO customers (id, name, type, phone, city, alamat_lengkap, "credit_limit", id_number) 
VALUES 
  ('C001', 'Toko Berkah Jaya', 'Reseller', '0812-3456-7001', 'Surabaya', 'Jl. Diponegoro No 45, Surabaya', 15000000, '3578012345678901'),
  ('C002', 'Warung Sari Rasa', 'Warung', '0813-2345-6002', 'Malang', 'Jl. Ijen No 12, Malang', 5000000, '3573019876543210'),
  ('C003', 'Kafe Nusantara', 'Kafe', '0821-4567-8003', 'Surabaya', 'Jl. Basuki Rahmat No 88, Surabaya', 20000000, '3578024567890123'),
  ('C004', 'Toko Makmur Sentosa', 'Toko', '0852-6789-0004', 'Sidoarjo', 'Jl. Pahlawan No 30, Sidoarjo', 10000000, '3515031234567890'),
  ('C005', 'Warung Makan Bu Diah', 'Warung', '0896-1234-5005', 'Gresik', 'Jl. Veteran No 5, Gresik', 3000000, '3525049876543210'),
  ('C006', 'Minimarket Jaya Abadi', 'Reseller', '0811-9876-5006', 'Surabaya', 'Jl. Ahmad Yani No 100, Surabaya', 25000000, '3578056789012345'),
  ('C007', 'Kedai Kopi Pagi', 'Kafe', '0857-6543-2007', 'Malang', 'Jl. Kawi No 7, Malang', 8000000, '3573068901234567'),
  ('C008', 'Toko Sembako Ibu Rina', 'Toko', '0878-3210-9008', 'Mojokerto', 'Jl. Majapahit No 22, Mojokerto', 7000000, '3576079012345678')
ON CONFLICT (id) DO NOTHING;

-- Vendors (dengan id_number, alamat, bank)
INSERT INTO vendors (id, name, category, phone, city, id_number, alamat_lengkap, nama_bank, nomor_rek, pemilik_rek) 
VALUES 
  ('V001', 'PT Sumber Minuman Nusantara', 'Minuman', '021-5556-7890', 'Jakarta', '3171011234567890', 'Jl. Industri Raya No 15, Jakarta Utara', 'BCA', '1234567890', 'PT Sumber Minuman Nusantara'),
  ('V002', 'CV Pangan Makmur', 'Makanan', '031-7778-9012', 'Surabaya', '3578022345678901', 'Jl. Rungkut Industri No 8, Surabaya', 'BRI', '2345678901', 'CV Pangan Makmur'),
  ('V003', 'UD Sembako Sentosa', 'Sembako', '031-3334-5678', 'Sidoarjo', '3515033456789012', 'Jl. Raya Gedangan No 50, Sidoarjo', 'Mandiri', '3456789012', 'UD Sembako Sentosa'),
  ('V004', 'PT Kopi Nusantara', 'Minuman', '0341-445-6789', 'Malang', '3573044567890123', 'Jl. Soekarno Hatta No 20, Malang', 'BNI', '4567890123', 'PT Kopi Nusantara'),
  ('V005', 'CV Bersih Sempurna', 'Non-Pangan', '021-2223-4567', 'Jakarta', '3171055678901234', 'Jl. Tanah Abang III No 12, Jakarta Pusat', 'BCA', '5678901234', 'CV Bersih Sempurna')
ON CONFLICT (id) DO NOTHING;

-- Sales Invoices (data contoh)
INSERT INTO sales_invoices (id, date, customer_id, subtotal, discount, tax, total, paid_amount, due_date, payment_type, payment_method, status) 
VALUES 
  ('INV-2026-0041', '2026-06-03', 'C001', 2850000, 0, 0, 2850000, 2850000, '2026-06-03', 'Tunai', 'Transfer', 'lunas'),
  ('INV-2026-0040', '2026-06-02', 'C003', 4750000, 0, 0, 4750000, 2000000, '2026-06-16', 'Tempo', 'Transfer', 'sebagian'),
  ('INV-2026-0039', '2026-06-02', 'C006', 8200000, 0, 0, 8200000, 0, '2026-06-16', 'Tempo', '-', 'belum'),
  ('INV-2026-0038', '2026-06-01', 'C002', 1250000, 0, 0, 1250000, 1250000, '2026-06-01', 'Tunai', 'Tunai', 'lunas'),
  ('INV-2026-0037', '2026-06-01', 'C004', 3400000, 0, 0, 3400000, 1500000, '2026-06-15', 'DP', 'Transfer', 'sebagian')
ON CONFLICT (id) DO NOTHING;

-- Purchase Orders (data contoh)
INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, due_date, payment_type, status) 
VALUES 
  ('PO-2026-018', '2026-06-02', 'V001', 15600000, 15600000, '2026-06-02', 'Lunas', 'selesai'),
  ('PO-2026-017', '2026-06-01', 'V002', 8400000, 4200000, '2026-06-15', 'Tempo 14 Hari', 'proses'),
  ('PO-2026-016', '2026-05-30', 'V004', 12500000, 4000000, '2026-06-30', 'Tempo 30 Hari', 'proses'),
  ('PO-2026-015', '2026-05-28', 'V003', 6200000, 6200000, '2026-05-28', 'Lunas', 'selesai'),
  ('PO-2026-014', '2026-05-25', 'V005', 3800000, 3800000, '2026-05-25', 'Lunas', 'selesai')
ON CONFLICT (id) DO NOTHING;

-- Cash Transactions (data contoh)
INSERT INTO cash_transactions (id, date, type, category, description, amount, method) 
VALUES
  ('CT001', '2026-06-03', 'IN', 'Penjualan', 'Pembayaran INV-2026-0041', 2850000, 'Transfer Bank'),
  ('CT002', '2026-06-02', 'IN', 'Penjualan', 'DP dari Kafe Nusantara', 2000000, 'Transfer Bank'),
  ('CT003', '2026-06-02', 'OUT', 'Pembelian Stok', 'Bayar PO-2026-018', 15600000, 'Transfer Bank'),
  ('CT004', '2026-06-01', 'IN', 'Penjualan', 'Pembayaran tunai Warung Sari Rasa', 1250000, 'Tunai'),
  ('CT005', '2026-06-01', 'OUT', 'Operasional', 'Listrik & air gudang', 2500000, 'Transfer Bank')
ON CONFLICT (id) DO NOTHING;
