-- =============================================
-- Seed Data untuk SupplierPro (PRD2 Master Data Update)
-- =============================================

-- Master Data
INSERT INTO product_categories (id, name) VALUES ('PC-1', 'Minuman'), ('PC-2', 'Makanan'), ('PC-3', 'Sembako'), ('PC-4', 'Lainnya') ON CONFLICT DO NOTHING;
INSERT INTO product_units (id, name) VALUES ('PU-1', 'pcs'), ('PU-2', 'box'), ('PU-3', 'botol'), ('PU-4', 'dus'), ('PU-5', 'pack'), ('PU-6', 'sak'), ('PU-7', 'kg'), ('PU-8', 'karton') ON CONFLICT DO NOTHING;
INSERT INTO customer_categories (id, name) VALUES ('CC-1', 'Reseller'), ('CC-2', 'Warung'), ('CC-3', 'Kafe'), ('CC-4', 'Toko') ON CONFLICT DO NOTHING;
INSERT INTO vendor_categories (id, name) VALUES ('VC-1', 'Minuman'), ('VC-2', 'Makanan'), ('VC-3', 'Sembako'), ('VC-4', 'Non-Pangan') ON CONFLICT DO NOTHING;
INSERT INTO payment_types (id, name) VALUES ('PT-1', 'Tunai'), ('PT-2', 'Tempo'), ('PT-3', 'DP'), ('PT-4', 'Transfer') ON CONFLICT DO NOTHING;

-- Admin user (id=1 eksplisit agar FK cash_transactions.user_id valid)
INSERT INTO users (id, username, name, email, password_hash, role, active) 
VALUES (1, 'admin', 'Administrator', 'admin@supplierpro.id', 'admin123', 'admin', true) 
ON CONFLICT (username) DO NOTHING;
SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users));

-- Products (dengan kolom FK unit_id dan category_id)
INSERT INTO products (id, sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id) 
VALUES 
  ('P001', 'MNM-001', 'Kopi Arabica 250g', 'PC-1', 45000, 68000, 124, 20, 'PU-1'),
  ('P002', 'MNM-002', 'Teh Celup Premium 25s', 'PC-1', 12000, 18500, 230, 50, 'PU-2'),
  ('P003', 'MNM-003', 'Sirup Rasa Buah 1L', 'PC-1', 22000, 35000, 67, 15, 'PU-3'),
  ('P004', 'MKN-001', 'Mie Instan Goreng (dus)', 'PC-2', 92000, 115000, 45, 10, 'PU-4'),
  ('P005', 'MKN-002', 'Biskuit Kaleng 350g', 'PC-2', 28000, 42000, 89, 20, 'PU-1'),
  ('P006', 'MKN-003', 'Wafer Coklat 12x21g', 'PC-2', 18000, 27000, 156, 30, 'PU-5'),
  ('P007', 'SMB-001', 'Beras Premium 5kg', 'PC-3', 62000, 78000, 8, 15, 'PU-6'),
  ('P008', 'SMB-002', 'Gula Pasir 1kg', 'PC-3', 14000, 18000, 12, 25, 'PU-7'),
  ('P009', 'SMB-003', 'Minyak Goreng 2L', 'PC-3', 28000, 36000, 5, 10, 'PU-3'),
  ('P010', 'MNM-004', 'Susu UHT 1L (karton)', 'PC-1', 155000, 195000, 32, 10, 'PU-8'),
  ('P011', 'MKN-004', 'Sarden Kaleng 155g', 'PC-2', 11000, 16500, 78, 20, 'PU-1'),
  ('P012', 'LNY-001', 'Sabun Cuci Piring 750ml', 'PC-4', 8500, 13000, 140, 30, 'PU-3'),
  ('P013', 'LNY-002', 'Tisu Wajah 250s', 'PC-4', 12000, 18000, 95, 20, 'PU-5'),
  ('P014', 'SMB-004', 'Tepung Terigu 1kg', 'PC-3', 10000, 14500, 18, 20, 'PU-7'),
  ('P015', 'MNM-005', 'Air Mineral 600ml (dus)', 'PC-1', 38000, 52000, 200, 30, 'PU-4'),
  ('P016', 'MKN-005', 'Kecap Manis 600ml', 'PC-2', 15000, 22000, 62, 15, 'PU-3')
ON CONFLICT (id) DO NOTHING;

-- Customers (menggunakan address dan FK customer_category_id)
INSERT INTO customers (id, name, customer_category_id, phone, city, address, credit_lmt) 
VALUES 
  ('C0001', 'Toko Berkah Jaya', 'CC-1', '0812-3456-7001', 'Surabaya', 'Jl. Diponegoro No 45, Surabaya', 15000000),
  ('C0002', 'Warung Sari Rasa', 'CC-2', '0813-2345-6002', 'Malang', 'Jl. Ijen No 12, Malang', 5000000),
  ('C0003', 'Kafe Nusantara', 'CC-3', '0821-4567-8003', 'Surabaya', 'Jl. Basuki Rahmat No 88, Surabaya', 20000000),
  ('C0004', 'Toko Makmur Sentosa', 'CC-4', '0852-6789-0004', 'Sidoarjo', 'Jl. Pahlawan No 30, Sidoarjo', 10000000),
  ('C0005', 'Warung Makan Bu Diah', 'CC-2', '0896-1234-5005', 'Gresik', 'Jl. Veteran No 5, Gresik', 3000000),
  ('C0006', 'Minimarket Jaya Abadi', 'CC-1', '0811-9876-5006', 'Surabaya', 'Jl. Ahmad Yani No 100, Surabaya', 25000000),
  ('C0007', 'Kedai Kopi Pagi', 'CC-3', '0857-6543-2007', 'Malang', 'Jl. Kawi No 7, Malang', 8000000),
  ('C0008', 'Toko Sembako Ibu Rina', 'CC-4', '0878-3210-9008', 'Mojokerto', 'Jl. Majapahit No 22, Mojokerto', 7000000)
ON CONFLICT (id) DO NOTHING;

-- Vendors (menggunakan FK vendor_category_id)
INSERT INTO vendors (id, name, vendor_category_id, phone, city, address, id_number, nama_bank, nomor_rek, pemilik_rek) 
VALUES 
  ('V0001', 'PT Sumber Minuman Nusantara', 'VC-1', '021-5556-7890', 'Jakarta', 'Jl. Sudirman No 45, Jakarta', '3171011234567890', 'BCA', '1234567890', 'PT Sumber Minuman Nusantara'),
  ('V0002', 'CV Pangan Makmur', 'VC-2', '031-7778-9012', 'Surabaya', 'Jl. Raya Darmo No 12, Surabaya', '3578022345678901', 'Mandiri', '0987654321', 'CV Pangan Makmur'),
  ('V0003', 'UD Sembako Sentosa', 'VC-3', '031-3334-5678', 'Sidoarjo', 'Jl. Pahlawan No 8, Sidoarjo', '3515033456789012', 'BRI', '1122334455', 'UD Sembako Sentosa'),
  ('V0004', 'PT Kopi Nusantara', 'VC-1', '0341-445-6789', 'Malang', 'Jl. Ijen No 30, Malang', '3573044567890123', 'BNI', '5566778899', 'PT Kopi Nusantara'),
  ('V0005', 'CV Bersih Sempurna', 'VC-4', '021-2223-4567', 'Jakarta', 'Jl. Gatot Subroto No 77, Jakarta', '3171055678901234', 'BCA', '9988776655', 'CV Bersih Sempurna')
ON CONFLICT (id) DO NOTHING;

-- Sales Invoices (menggunakan payment_type_id)
INSERT INTO sales_invoices (id, date, customer_id, subtotal, discount, tax, total, paid_amount, due_date, payment_type_id, payment_method, status) 
VALUES 
  ('INV-2026-06-0041', '2026-06-03', 'C0001', 1255000, 0, 0, 1255000, 1255000, '2026-06-03', 'PT-1', 'Transfer', 'Lunas'),
  ('INV-2026-06-0040', '2026-06-02', 'C0003', 1600000, 0, 0, 1600000, 1000000, '2026-06-16', 'PT-2', 'Transfer', 'Sebagian'),
  ('INV-2026-06-0039', '2026-06-02', 'C0006', 1170000, 0, 0, 1170000, 0, '2026-06-16', 'PT-2', '-', 'Belum Bayar'),
  ('INV-2026-06-0038', '2026-06-01', 'C0002', 780000, 0, 0, 780000, 780000, '2026-06-01', 'PT-1', 'Tunai', 'Lunas'),
  ('INV-2026-06-0037', '2026-06-01', 'C0004', 2850000, 0, 0, 2850000, 1500000, '2026-06-15', 'PT-3', 'Transfer', 'Sebagian')
ON CONFLICT (id) DO NOTHING;

-- Purchase Orders (data contoh)
INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, due_date, payment_type_id, status) 
VALUES 
  ('PO-2026-06-0018', '2026-06-02', 'V0001', 3450000, 3450000, '2026-06-02', 'PT-1', 'Selesai'),
  ('PO-2026-06-0017', '2026-06-01', 'V0002', 6800000, 3000000, '2026-06-15', 'PT-2', 'Dalam Proses'),
  ('PO-2026-06-0016', '2026-05-30', 'V0004', 6400000, 2000000, '2026-06-30', 'PT-2', 'Dalam Proses'),
  ('PO-2026-06-0015', '2026-05-28', 'V0003', 5900000, 5900000, '2026-05-28', 'PT-1', 'Selesai'),
  ('PO-2026-06-0014', '2026-05-25', 'V0005', 10550000, 10550000, '2026-05-25', 'PT-1', 'Selesai')
ON CONFLICT (id) DO NOTHING;

-- Invoice Items (sample items for seeded invoices)
INSERT INTO invoice_items (id, invoice_id, product_id, quantity, price) VALUES
  ('INV-ITEM-001', 'INV-2026-06-0041', 'P001', 10, 68000),
  ('INV-ITEM-002', 'INV-2026-06-0041', 'P004', 5, 115000),
  ('INV-ITEM-003', 'INV-2026-06-0040', 'P003', 20, 35000),
  ('INV-ITEM-004', 'INV-2026-06-0040', 'P008', 50, 18000),
  ('INV-ITEM-005', 'INV-2026-06-0039', 'P005', 15, 42000),
  ('INV-ITEM-006', 'INV-2026-06-0039', 'P006', 20, 27000),
  ('INV-ITEM-007', 'INV-2026-06-0038', 'P007', 10, 78000),
  ('INV-ITEM-008', 'INV-2026-06-0037', 'P009', 25, 36000),
  ('INV-ITEM-009', 'INV-2026-06-0037', 'P010', 10, 195000)
ON CONFLICT (id) DO NOTHING;

-- Purchase Order Items (sample items for seeded POs)
INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, cost) VALUES
  ('PO-ITEM-001', 'PO-2026-06-0018', 'P001', 50, 45000),
  ('PO-ITEM-002', 'PO-2026-06-0018', 'P002', 100, 12000),
  ('PO-ITEM-003', 'PO-2026-06-0017', 'P003', 100, 22000),
  ('PO-ITEM-004', 'PO-2026-06-0017', 'P004', 50, 92000),
  ('PO-ITEM-005', 'PO-2026-06-0016', 'P005', 100, 28000),
  ('PO-ITEM-006', 'PO-2026-06-0016', 'P006', 200, 18000),
  ('PO-ITEM-007', 'PO-2026-06-0015', 'P007', 50, 62000),
  ('PO-ITEM-008', 'PO-2026-06-0015', 'P008', 200, 14000),
  ('PO-ITEM-009', 'PO-2026-06-0014', 'P009', 100, 28000),
  ('PO-ITEM-0010', 'PO-2026-06-0014', 'P010', 50, 155000)
ON CONFLICT (id) DO NOTHING;

-- Cash Transactions (data contoh dengan FK)
INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id, purchase_order_id, payment_type_id, user_id) 
VALUES
  ('CT0001', '2026-06-03', 'IN', 'Penjualan', 'Pembayaran INV-2026-06-0041', 1255000, 'Transfer Bank', 'INV-2026-06-0041', NULL, 'PT-1', 1),
  ('CT0002', '2026-06-02', 'IN', 'Penjualan', 'DP dari Kafe Nusantara', 1000000, 'Transfer Bank', 'INV-2026-06-0040', NULL, 'PT-3', 1),
  ('CT0003', '2026-06-02', 'OUT', 'Pembelian Stok', 'Bayar PO-2026-06-0018', 3450000, 'Transfer Bank', NULL, 'PO-2026-06-0018', 'PT-1', 1),
  ('CT0004', '2026-06-01', 'IN', 'Penjualan', 'Pembayaran tunai Warung Sari Rasa', 780000, 'Tunai', 'INV-2026-06-0038', NULL, 'PT-1', 1),
  ('CT0005', '2026-06-01', 'OUT', 'Operasional', 'Listrik & air gudang', 2500000, 'Transfer Bank', NULL, NULL, NULL, 1),
  ('CT0006', '2026-06-04', 'OUT', 'Operasional', 'Biaya internet bulanan', 500000, 'Transfer Bank', NULL, NULL, NULL, 1),
  ('CT0007', '2026-06-05', 'OUT', 'Gaji', 'Pembayaran gaji karyawan bulan Mei', 12000000, 'Transfer Bank', NULL, NULL, NULL, 1),
  ('CT0008', '2026-06-05', 'OUT', 'Sewa', 'Sewa ruko bulan Juni', 5000000, 'Transfer Bank', NULL, NULL, NULL, 1),
  ('CT0009', '2026-06-06', 'IN', 'Lainnya', 'Cashback promo bank', 150000, 'Transfer Bank', NULL, NULL, NULL, 1),
  ('CT0010', '2026-06-06', 'OUT', 'Operasional', 'Beli atk dan perlengkapan gudang', 350000, 'Tunai', NULL, NULL, NULL, 1),
  ('CT0011', '2026-06-07', 'OUT', 'Lainnya', 'Biaya kebersihan dan keamanan', 200000, 'Tunai', NULL, NULL, NULL, 1),
  ('CT0012', '2026-06-07', 'IN', 'Lainnya', 'Penjualan kardus bekas', 75000, 'Tunai', NULL, NULL, NULL, 1),
  ('CT0013', '2026-06-08', 'OUT', 'Operasional', 'Bensin untuk kendaraan operasional', 300000, 'Tunai', NULL, NULL, NULL, 1),
  ('CT0014', '2026-06-09', 'OUT', 'Operasional', 'Konsumsi lembur tim gudang', 250000, 'QRIS', NULL, NULL, NULL, 1),
  ('CT0015', '2026-06-10', 'IN', 'Lainnya', 'Bonus dari supplier', 1000000, 'Transfer Bank', NULL, NULL, NULL, 1)
ON CONFLICT (id) DO NOTHING;

-- Seed default prefix settings
INSERT INTO settings (key, value) VALUES
  ('prefix_customer', 'C'),
  ('prefix_vendor', 'V'),
  ('prefix_purchase', 'PO-{YYYY}-{MM}-'),
  ('prefix_sales', 'INV-{YYYY}-{MM}-')
ON CONFLICT (key) DO NOTHING;

