INSERT INTO users (username, password, role) 
VALUES ('admin', 'admin123', 'admin') 
ON CONFLICT (username) DO NOTHING;

INSERT INTO products (id, sku, name, category, cost_price, sell_price, stock, min_stock, badge) 
VALUES 
  ('P001', 'SKU-001', 'Kopi Kapal Api Mix', 'Minuman', 10000, 12000, 150, 50, 'Best Seller'),
  ('P002', 'SKU-002', 'Beras Maknyuss 5kg', 'Sembako', 60000, 65000, 20, 10, 'Hampir Habis')
ON CONFLICT (id) DO NOTHING;

INSERT INTO customers (id, name, type, phone, city, credit_limit) 
VALUES 
  ('C001', 'Toko Berkah', 'Warung', '08123456789', 'Jakarta', 500000)
ON CONFLICT (id) DO NOTHING;
