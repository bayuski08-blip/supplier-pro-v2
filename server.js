const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3000;
const SECRET_KEY = 'supplierpro_secret_key_demo'; // In a real app, use environment variables

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Serve static files from the current directory

// Initialize Database Connection Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:T34m1tb4l1@localhost:5432/supplierpro'
});

// Initialize settings table and seed defaults
pool.query(`
  CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT
  );
`).then(() => {
  pool.query(`
    INSERT INTO settings (key, value) VALUES
    ('prefix_customer', 'C'),
    ('prefix_vendor', 'V'),
    ('prefix_purchase', 'PO/{YYYY}/{MM}/'),
    ('prefix_sales', 'INV/{YYYY}/{MM}/')
    ON CONFLICT (key) DO NOTHING;
  `);
}).catch(err => console.error('Error initializing settings table on startup:', err));

// Settings & Prefix Helpers
async function getSetting(key, defaultValue) {
  try {
    const res = await pool.query('SELECT value FROM settings WHERE key = $1', [key]);
    if (res.rows.length > 0) {
      return res.rows[0].value;
    }
  } catch (err) {
    console.error(`getSetting error for key ${key}:`, err);
  }
  return defaultValue;
}

async function generateNextId(clientOrPool, tableName, prefixSetting) {
  const now = new Date();
  const yyyy = now.getFullYear().toString();
  const yy = yyyy.slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  
  let resolvedPrefix = prefixSetting || '';
  resolvedPrefix = resolvedPrefix
    .replace(/{YYYY}/g, yyyy)
    .replace(/{YY}/g, yy)
    .replace(/{MM}/g, mm);
    
  const query = `SELECT id FROM ${tableName} WHERE id LIKE $1`;
  const result = await clientOrPool.query(query, [resolvedPrefix + '%']);
  
  let maxNum = 0;
  for (const row of result.rows) {
    const idStr = row.id;
    if (idStr.startsWith(resolvedPrefix)) {
      const suffix = idStr.substring(resolvedPrefix.length);
      const num = parseInt(suffix, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }
  
  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(4, '0');
  return resolvedPrefix + padded;
}

// Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ======================= API ROUTES =======================

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password_hash = $2 AND active = true', [username, password]);
    const user = result.rows[0];
    
    if (user) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '24h' });
      res.json({ token, role: user.role, username: user.username });
    } else {
      res.status(401).json({ error: 'Username atau password salah' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Master Data Routes ---
app.get('/api/master/product-categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master/product-units', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM product_units');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master/customer-categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customer_categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master/vendor-categories', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vendor_categories');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/master/payment-types', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM payment_types');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Master Data CRUD (POST, PUT, DELETE) ---
const MASTER_TABLE_WHITELIST = {
  product_categories: 'product_categories',
  product_units: 'product_units',
  customer_categories: 'customer_categories',
  vendor_categories: 'vendor_categories',
  payment_types: 'payment_types'
};

app.post('/api/master/:type', authenticateToken, async (req, res) => {
  const tableName = MASTER_TABLE_WHITELIST[req.params.type];
  if (!tableName) return res.status(400).json({ error: 'Tipe master data tidak valid' });
  const { id, name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama wajib diisi' });
  try {
    await pool.query(`INSERT INTO ${tableName} (id, name) VALUES ($1, $2)`, [id || req.params.type.toUpperCase().slice(0,2) + '-' + Date.now(), name]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/master/:type/:id', authenticateToken, async (req, res) => {
  const tableName = MASTER_TABLE_WHITELIST[req.params.type];
  if (!tableName) return res.status(400).json({ error: 'Tipe master data tidak valid' });
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama wajib diisi' });
  try {
    const result = await pool.query(`UPDATE ${tableName} SET name = $1 WHERE id = $2`, [name, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/master/:type/:id', authenticateToken, async (req, res) => {
  const tableName = MASTER_TABLE_WHITELIST[req.params.type];
  if (!tableName) return res.status(400).json({ error: 'Tipe master data tidak valid' });
  try {
    const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1`, [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Data tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    if (err.code === '23503') {
      res.status(409).json({ error: 'Data masih digunakan dan tidak dapat dihapus.' });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

// --- Settings Routes ---
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM settings');
    const settingsMap = {};
    result.rows.forEach(r => {
      settingsMap[r.key] = r.value;
    });
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', authenticateToken, async (req, res) => {
  const settings = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [key, value] of Object.entries(settings)) {
      await client.query(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
        [key, String(value)]
      );
    }
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Dashboard & Summary Routes ---
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    // Revenue (omzet) - semua invoice yang tidak batal
    const revenueResult = await pool.query("SELECT SUM(total) as revenue FROM sales_invoices WHERE status != 'Batal'");
    const revenue = parseFloat(revenueResult.rows[0].revenue || 0);

    // Piutang - invoice yang belum lunas
    const receivablesResult = await pool.query("SELECT SUM(total - paid_amount) as receivables FROM sales_invoices WHERE status != 'Lunas' AND status != 'Batal'");
    const receivables = parseFloat(receivablesResult.rows[0].receivables || 0);

    // Hutang ke vendor - PO yang belum selesai
    const payablesResult = await pool.query("SELECT SUM(total - paid_amount) as payables FROM purchase_orders WHERE status != 'Selesai' AND status != 'Batal'");
    const payables = parseFloat(payablesResult.rows[0].payables || 0);

    // Stok menipis
    const lowStockResult = await pool.query('SELECT id, name, stock, min_stock FROM products WHERE stock <= min_stock ORDER BY stock ASC');
    const lowStockProducts = lowStockResult.rows;

    // Laba Kotor (Revenue - HPP)
    const hppResult = await pool.query(`
      SELECT COALESCE(SUM(ii.quantity * p.cost_price), 0) as hpp
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN sales_invoices si ON ii.invoice_id = si.id
      WHERE si.status != 'Batal'
    `);
    const hpp = parseFloat(hppResult.rows[0].hpp || 0);
    const grossProfit = revenue - hpp;

    // Order hari ini
    const today = new Date().toISOString().split('T')[0];
    const ordersTodayResult = await pool.query("SELECT COUNT(*) as count FROM sales_invoices WHERE date::date = $1 AND status != 'Batal'", [today]);
    const ordersToday = parseInt(ordersTodayResult.rows[0].count || 0);

    // Jumlah pelanggan aktif
    const customersResult = await pool.query('SELECT COUNT(*) as count FROM customers');
    const customerCount = parseInt(customersResult.rows[0].count || 0);

    // Jumlah produk
    const productsResult = await pool.query('SELECT COUNT(*) as count FROM products');
    const productCount = parseInt(productsResult.rows[0].count || 0);

    // Jumlah invoice belum lunas (untuk badge piutang)
    const unpaidCountResult = await pool.query("SELECT COUNT(*) as count FROM sales_invoices WHERE status != 'Lunas' AND status != 'Batal'");
    const unpaidCount = parseInt(unpaidCountResult.rows[0].count || 0);

    res.json({
      revenue,
      receivables,
      payables,
      lowStockCount: lowStockProducts.length,
      lowStockProducts,
      grossProfit,
      ordersToday,
      customerCount,
      productCount,
      unpaidCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// --- Products Routes ---
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, c.name as category, u.name as unit 
      FROM products p 
      LEFT JOIN product_categories c ON p.category_id = c.id 
      LEFT JOIN product_units u ON p.unit_id = u.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { id, sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id, badge } = req.body;
  const insertQuery = 'INSERT INTO products (id, sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id, badge) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)';
  try {
    await pool.query(insertQuery, [id || 'P' + Date.now(), sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id || 'PU-1', badge]);
    res.json({ success: true, message: 'Produk berhasil ditambahkan' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id, badge } = req.body;
  const updateQuery = 'UPDATE products SET sku = $1, name = $2, category_id = $3, cost_price = $4, sell_price = $5, stock = $6, min_stock = $7, unit_id = $8, badge = $9 WHERE id = $10';
  try {
    const result = await pool.query(updateQuery, [sku, name, category_id, cost_price, sell_price, stock, min_stock, unit_id, badge, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json({ success: true, message: 'Produk berhasil diperbarui' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM products WHERE id = $1';
  try {
    const result = await pool.query(deleteQuery, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Stock Adjust (Stock Opname) ---
app.post('/api/stock-adjust', authenticateToken, async (req, res) => {
  const { product_id, actual_stock, note } = req.body;
  if (!product_id || actual_stock === undefined || actual_stock === null) {
    return res.status(400).json({ error: 'product_id dan actual_stock wajib diisi' });
  }
  const newStock = parseInt(actual_stock);
  if (isNaN(newStock) || newStock < 0) {
    return res.status(400).json({ error: 'actual_stock harus angka non-negatif' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT id, stock, name, cost_price FROM products WHERE id = $1', [product_id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    const oldStock = parseInt(existing.rows[0].stock);
    const productName = existing.rows[0].name;
    const costPrice = parseFloat(existing.rows[0].cost_price || 0);

    await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, product_id]);

    // Tentukan tipe dan jumlah berdasarkan selisih stok
    const diff = newStock - oldStock;
    const txType = diff >= 0 ? 'IN' : 'OUT';
    const amount = Math.abs(diff) * costPrice;
    const keterangan = diff > 0 ? 'tambah banyak' : diff < 0 ? 'Menyusut' : 'tidak berubah';

    const ctId = 'SA-' + Date.now();
    const ctDate = new Date().toISOString().split('T')[0];
    const desc = `Stock Opname: [${product_id}] ${productName} | Sebelum: ${oldStock} → Sesudah: ${newStock} | ${keterangan}${note ? ' | ' + note : ''}`;

    await client.query(
      'INSERT INTO cash_transactions (id, date, type, category, description, amount, method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ctId, ctDate, txType, 'Penyesuaian Stok', desc, amount, 'Stock Opname']
    );
    await client.query('COMMIT');
    res.json({ success: true, old_stock: oldStock, new_stock: newStock, type: txType, amount });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Customers Routes ---
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, cc.name as category_name
      FROM customers c
      LEFT JOIN customer_categories cc ON c.customer_category_id = cc.id
      ORDER BY c.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/customers/search', authenticateToken, async (req, res) => {
  const { q } = req.query;
  const query = `%${q}%`;
  try {
    const result = await pool.query('SELECT * FROM customers WHERE name LIKE $1 OR phone LIKE $2', [query, query]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  const { name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp } = req.body;
  const insertQuery = 'INSERT INTO customers (id, name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  try {
    const prefix = await getSetting('prefix_customer', 'C');
    const id = await generateNextId(pool, 'customers', prefix);
    await pool.query(insertQuery, [id, name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp } = req.body;
  const updateQuery = 'UPDATE customers SET name = $1, customer_category_id = $2, phone = $3, city = $4, address = $5, credit_lmt = $6, id_number = $7, npwp = $8 WHERE id = $9';
  try {
    const result = await pool.query(updateQuery, [name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp, id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Pelanggan berhasil diperbarui' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const deleteQuery = 'DELETE FROM customers WHERE id = $1';
  try {
    const result = await pool.query(deleteQuery, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Pelanggan tidak ditemukan' });
    }
    res.json({ success: true, message: 'Pelanggan berhasil dihapus' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Vendors Routes ---
app.get('/api/vendors', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.*, vc.name as category_name
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.vendor_category_id = vc.id
      ORDER BY v.name ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices Routes (Sales) ---
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT si.*, c.name as customer, pt.name as payment_type_name
      FROM sales_invoices si
      LEFT JOIN customers c ON si.customer_id = c.id
      LEFT JOIN payment_types pt ON si.payment_type_id = pt.id
      ORDER BY si.date DESC, si.id DESC
    `);
    res.json(result.rows.map(r => ({
      id: r.id,
      date: r.date ? r.date.split('T')[0] : '',
      customerId: r.customer_id,
      customer: r.customer || 'Tanpa Pelanggan',
      total: parseFloat(r.total),
      paid: parseFloat(r.paid_amount),
      type: r.payment_type_name || 'Tunai',
      paymentTypeId: r.payment_type_id,
      method: r.payment_method || '-',
      status: r.status,
      dueDate: r.due_date ? r.due_date.split('T')[0] : ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/:id/items', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/purchases/:id/items', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchase_order_items WHERE purchase_order_id = $1', [req.params.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  const { customer_id, total, paid, payment_type_id, due_date, items } = req.body;
  
  const insertInvoiceQuery = 'INSERT INTO sales_invoices (id, date, customer_id, total, paid_amount, payment_type_id, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
  const updateStockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2';
  
  const date = new Date().toISOString();
  const status = paid >= total ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Bayar');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prefix = await getSetting('prefix_sales', 'INV/{YYYY}/{MM}/');
    const id = await generateNextId(client, 'sales_invoices', prefix);
    await client.query(insertInvoiceQuery, [id, date, customer_id, total, paid, payment_type_id, due_date, status]);
    
    // Reduce stock
    if (items && Array.isArray(items)) {
      for (const item of items) {
         await client.query(updateStockQuery, [item.quantity, item.id]);
         // Also insert to invoice_items
         await client.query('INSERT INTO invoice_items (id, invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4, $5)', [Date.now().toString() + Math.floor(Math.random()*1000), id, item.id, item.quantity, item.price || 0]);
      }
    }

    // Log cash transaction IN
    if (paid > 0) {
      const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
      const ctDate = new Date().toISOString().split('T')[0];
      await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id, payment_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [ctId, ctDate, 'IN', 'Pendapatan', `DP/Pembayaran Invoice ${id}`, paid, 'Transfer Bank', id, payment_type_id]);
    }

    await client.query('COMMIT');
    res.json({ success: true, invoiceId: id });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Finance Routes ---
app.get('/api/finance/receivables', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sales_invoices WHERE status != $1 AND status != $2', ['Lunas', 'Batal']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/receivables/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM sales_invoices WHERE id = $1', [id]);
    const invoice = result.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    
    const currentPaid = parseFloat(invoice.paid_amount);
    const total = parseFloat(invoice.total);
    const newPaid = currentPaid + parseFloat(amount);
    const newStatus = newPaid >= total ? 'Lunas' : 'Sebagian';
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('UPDATE sales_invoices SET paid_amount = $1, status = $2 WHERE id = $3', [newPaid, newStatus, id]);
        
        // Log cash transaction IN
        const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
        const date = new Date().toISOString().split('T')[0];
        await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [ctId, date, 'IN', 'Pendapatan', `Pelunasan/Cicilan Invoice ${id}`, amount, 'Transfer Bank', id]);
        
        await client.query('COMMIT');
        res.json({ success: true });
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Cash Flow Route ---
// Auto-migrate: add 'status' column if not exists
pool.query(`ALTER TABLE cash_transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active'`)
  .catch(err => console.error('Error adding status column to cash_transactions:', err));

app.get('/api/finance/cash-flow', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cash_transactions ORDER BY date DESC, id DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      date: r.date ? r.date.toISOString ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0] : '',
      type: r.type,
      category: r.category,
      desc: r.description,
      amount: parseFloat(r.amount),
      method: r.method || '-',
      invoiceId: r.invoice_id || '',
      purchaseOrderId: r.purchase_order_id || '',
      status: r.status || 'active',
      isManual: !r.invoice_id && !r.purchase_order_id
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Catat transaksi kas manual
app.post('/api/finance/cash-flow', authenticateToken, async (req, res) => {
  const { type, category, description, amount, method, date } = req.body;
  if (!type || !amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Tipe dan jumlah wajib diisi' });
  }
  try {
    const ctId = 'CT-' + Date.now() + Math.floor(Math.random() * 1000);
    const ctDate = date || new Date().toISOString().split('T')[0];
    await pool.query(
      `INSERT INTO cash_transactions (id, date, type, category, description, amount, method, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')`,
      [ctId, ctDate, type, category || 'Lainnya', description || '-', parseFloat(amount), method || 'Transfer Bank']
    );
    res.json({ success: true, id: ctId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Edit transaksi kas manual (hanya yang tidak punya invoice_id / purchase_order_id)
app.put('/api/finance/cash-flow/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, category, description, amount, method, date } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM cash_transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    const tx = existing.rows[0];
    if (tx.invoice_id || tx.purchase_order_id) {
      return res.status(403).json({ error: 'Transaksi otomatis tidak dapat diedit' });
    }
    await pool.query(
      `UPDATE cash_transactions SET type=$1, category=$2, description=$3, amount=$4, method=$5, date=$6 WHERE id=$7`,
      [type || tx.type, category || tx.category, description || tx.description,
       parseFloat(amount) || tx.amount, method || tx.method, date || tx.date, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH - Batalkan transaksi kas (soft delete + reversal untuk auto transactions)
app.patch('/api/finance/cash-flow/:id/cancel', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM cash_transactions WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
    }
    const tx = existing.rows[0];
    if ((tx.status || 'active') === 'cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Transaksi sudah dibatalkan' });
    }

    // Soft delete
    await client.query(`UPDATE cash_transactions SET status='cancelled' WHERE id=$1`, [id]);

    // Reversal untuk transaksi otomatis
    if (tx.invoice_id) {
      // Reversal invoice paid_amount
      const invRes = await client.query('SELECT * FROM sales_invoices WHERE id=$1', [tx.invoice_id]);
      if (invRes.rows.length > 0) {
        const inv = invRes.rows[0];
        const newPaid = Math.max(0, parseFloat(inv.paid_amount) - parseFloat(tx.amount));
        const newStatus = newPaid >= parseFloat(inv.total) ? 'Lunas' : newPaid > 0 ? 'Sebagian' : 'Belum Bayar';
        await client.query('UPDATE sales_invoices SET paid_amount=$1, status=$2 WHERE id=$3', [newPaid, newStatus, tx.invoice_id]);
      }
    } else if (tx.purchase_order_id) {
      // Reversal PO paid_amount
      const poRes = await client.query('SELECT * FROM purchase_orders WHERE id=$1', [tx.purchase_order_id]);
      if (poRes.rows.length > 0) {
        const po = poRes.rows[0];
        const newPaid = Math.max(0, parseFloat(po.paid_amount) - parseFloat(tx.amount));
        const newStatus = newPaid >= parseFloat(po.total) ? 'Selesai' : 'Dalam Proses';
        await client.query('UPDATE purchase_orders SET paid_amount=$1, status=$2 WHERE id=$3', [newPaid, newStatus, tx.purchase_order_id]);
      }
    } else if (tx.category === 'Penyesuaian Stok') {
      // Reversal for stock opname
      const match = tx.description.match(/Stock Opname: (.*?) \| Sebelum: (\d+) → Sesudah: (\d+)/);
      if (match) {
        let productName = match[1].trim();
        let productId = null;
        const idMatch = productName.match(/^\[(.*?)\]\s+(.*)/);
        if (idMatch) {
          productId = idMatch[1];
          productName = idMatch[2];
        }

        const oldStock = parseInt(match[2]);
        const newStock = parseInt(match[3]);
        const diff = newStock - oldStock; // Positive if stock increased, negative if decreased

        // Reverse the diff: subtract it from the current stock
        if (productId) {
          await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [diff, productId]);
        } else {
          await client.query('UPDATE products SET stock = stock - $1 WHERE name = $2', [diff, productName]);
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Laba Rugi Endpoint ---
app.get('/api/laporan/laba-rugi', authenticateToken, async (req, res) => {
  const bulan = parseInt(req.query.bulan);
  const tahun = parseInt(req.query.tahun);
  
  if (!bulan || !tahun) {
    return res.status(400).json({ error: 'Parameter bulan dan tahun diperlukan' });
  }

  const client = await pool.connect();
  try {
    // 1. PENDAPATAN (Penjualan kotor & diskon)
    // Extract sales_invoices matching month/year and status != 'Dibatalkan'
    const resPendapatan = await client.query(`
      SELECT SUM(total) as kotor, SUM(discount) as diskon 
      FROM sales_invoices 
      WHERE EXTRACT(MONTH FROM date::DATE) = $1 
        AND EXTRACT(YEAR FROM date::DATE) = $2 
        AND status != 'Dibatalkan'
    `, [bulan, tahun]);

    const penjualanKotor = parseFloat(resPendapatan.rows[0]?.kotor || 0);
    const diskon = parseFloat(resPendapatan.rows[0]?.diskon || 0);
    const penjualanBersih = penjualanKotor - diskon;

    // 2. HPP (Pembelian)
    // From purchase_orders where status = 'Selesai'
    const resHPP = await client.query(`
      SELECT SUM(total) as hpp 
      FROM purchase_orders 
      WHERE EXTRACT(MONTH FROM date::DATE) = $1 
        AND EXTRACT(YEAR FROM date::DATE) = $2 
        AND status = 'Selesai'
    `, [bulan, tahun]);
    const hpp = parseFloat(resHPP.rows[0]?.hpp || 0);
    const labaKotor = penjualanBersih - hpp;

    // 3. BEBAN OPERASIONAL (Cash transactions OUT, category Operasional/Gaji/Sewa, no invoice/PO)
    // To be generic, any OUT transaction not related to purchasing stock or related to PO
    // The requirement says: category = 'Operasional' BUT we also seeded 'Gaji', 'Sewa', etc.
    // So we will group by category for OUT transactions where invoice_id is null and po_id is null, 
    // and category != 'Pembelian Stok'
    const resBeban = await client.query(`
      SELECT category, SUM(amount) as total 
      FROM cash_transactions 
      WHERE type = 'OUT' 
        AND (status IS NULL OR status != 'cancelled')
        AND invoice_id IS NULL 
        AND purchase_order_id IS NULL
        AND category != 'Pembelian Stok'
        AND EXTRACT(MONTH FROM date) = $1 
        AND EXTRACT(YEAR FROM date) = $2
      GROUP BY category
    `, [bulan, tahun]);

    const rincianBeban = resBeban.rows.map(r => ({
      category: r.category,
      total: parseFloat(r.total)
    }));
    const totalBebanOperasional = rincianBeban.reduce((sum, item) => sum + item.total, 0);
    const labaOperasional = labaKotor - totalBebanOperasional;

    // 4. PENDAPATAN LAIN-LAIN
    // From cash transactions IN, category != 'Penjualan'
    const resLain = await client.query(`
      SELECT SUM(amount) as total 
      FROM cash_transactions 
      WHERE type = 'IN' 
        AND (status IS NULL OR status != 'cancelled')
        AND category != 'Penjualan'
        AND EXTRACT(MONTH FROM date) = $1 
        AND EXTRACT(YEAR FROM date) = $2
    `, [bulan, tahun]);
    const pendapatanLain = parseFloat(resLain.rows[0]?.total || 0);

    // LABA BERSIH
    const labaBersih = labaOperasional + pendapatanLain;

    res.json({
      success: true,
      data: {
        pendapatan: {
          kotor: penjualanKotor,
          diskon: diskon,
          bersih: penjualanBersih
        },
        hpp: hpp,
        labaKotor: labaKotor,
        operasional: {
          rincian: rincianBeban,
          total: totalBebanOperasional
        },
        labaOperasional: labaOperasional,
        pendapatanLain: pendapatanLain,
        labaBersih: labaBersih
      }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.get('/api/finance/payables', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT po.*, v.name as vendor_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id WHERE po.status != $1 AND po.status != $2', ['Selesai', 'Batal']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pay vendor PO debt
app.post('/api/finance/payables/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  const payAmount = parseFloat(amount || 0);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [id]);
    const po = result.rows[0];
    if (!po) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'PO tidak ditemukan' });
    }
    
    const currentPaid = parseFloat(po.paid_amount || 0);
    const total = parseFloat(po.total || 0);
    const newPaid = currentPaid + payAmount;
    const newStatus = newPaid >= total ? 'Selesai' : 'Dalam Proses';
    
    await client.query('UPDATE purchase_orders SET paid_amount = $1, status = $2 WHERE id = $3', [newPaid, newStatus, id]);
    
    // Log cash transaction OUT
    const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
    const date = new Date().toISOString().split('T')[0];
    await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, purchase_order_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [ctId, date, 'OUT', 'Pembelian Stok', `Bayar Cicilan PO ${id}`, payAmount, 'Transfer Bank', id]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Vendors Routes Extra CRUD ---
app.post('/api/vendors', authenticateToken, async (req, res) => {
  const { name, vendor_category_id, category_id, phone, city, address, id_number, npwp, nama_bank, nomor_rek, pemilik_rek } = req.body;
  const catId = vendor_category_id || category_id || 'VC-1';
  try {
    const prefix = await getSetting('prefix_vendor', 'V');
    const vId = await generateNextId(pool, 'vendors', prefix);
    await pool.query(
      'INSERT INTO vendors (id, name, vendor_category_id, phone, city, address, id_number, npwp, nama_bank, nomor_rek, pemilik_rek) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
      [vId, name, catId, phone, city, address, id_number, npwp, nama_bank, nomor_rek, pemilik_rek]
    );
    res.json({ success: true, id: vId });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/vendors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, vendor_category_id, category_id, phone, city, address, id_number, npwp, nama_bank, nomor_rek, pemilik_rek } = req.body;
  const catId = vendor_category_id || category_id;
  try {
    const result = await pool.query(
      'UPDATE vendors SET name = $1, vendor_category_id = $2, phone = $3, city = $4, address = $5, id_number = $6, npwp = $7, nama_bank = $8, nomor_rek = $9, pemilik_rek = $10 WHERE id = $11',
      [name, catId, phone, city, address, id_number, npwp, nama_bank, nomor_rek, pemilik_rek, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vendor tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/vendors/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM vendors WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Vendor tidak ditemukan' });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Purchase Orders Routes ---
app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT po.*, v.name as vendor_name, pt.name as payment_type 
      FROM purchase_orders po 
      LEFT JOIN vendors v ON po.vendor_id = v.id
      LEFT JOIN payment_types pt ON po.payment_type_id = pt.id
      ORDER BY po.date DESC, po.id DESC
    `);
    res.json(result.rows.map(row => ({
      id: row.id,
      date: row.date,
      vendorId: row.vendor_id,
      vendor: row.vendor_name || 'Tanpa Vendor',
      total: parseFloat(row.total),
      paid: parseFloat(row.paid_amount),
      type: row.payment_type || 'Tunai',
      status: row.status,
      paymentTypeId: row.payment_type_id,
      dueDate: row.due_date ? row.due_date.split('T')[0] : ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', authenticateToken, async (req, res) => {
  const { vendor_id, vendorId, date, total, paid, paid_amount, payment_type_id, due_date, items } = req.body;
  const vId = vendor_id || vendorId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'Selesai' : 'Dalam Proses';
  const poDate = date || new Date().toISOString().split('T')[0];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prefix = await getSetting('prefix_purchase', 'PO/{YYYY}/{MM}/');
    const poId = await generateNextId(client, 'purchase_orders', prefix);
    await client.query('INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, payment_type_id, due_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [poId, poDate, vId, finalTotal, finalPaid, pType, due_date, status]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemId = 'POI-' + Date.now() + Math.floor(Math.random()*1000);
        const prodId = item.product_id || item.id;
        const qty = parseInt(item.quantity || item.qty || 0);
        const cost = parseFloat(item.cost || item.cost_price || item.price || 0);
        
        await client.query('INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, cost) VALUES ($1, $2, $3, $4, $5)', [itemId, poId, prodId, qty, cost]);
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [qty, prodId]);
      }
    }
    
    if (finalPaid > 0) {
      const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
      await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, purchase_order_id, payment_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [ctId, poDate, 'OUT', 'Pembelian Stok', `Bayar PO ${poId}`, finalPaid, 'Transfer Bank', poId, pType]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true, id: poId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/purchases/:id', authenticateToken, async (req, res) => {
  const poId = req.params.id;
  const { vendor_id, vendorId, date, total, paid, paid_amount, payment_type_id, due_date, items } = req.body;
  const vId = vendor_id || vendorId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'Selesai' : 'Dalam Proses';
  const poDate = date || new Date().toISOString().split('T')[0];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const oldItemsRes = await client.query('SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1', [poId]);
    for (const item of oldItemsRes.rows) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    
    await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id = $1', [poId]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemId = 'POI-' + Date.now() + Math.floor(Math.random()*1000);
        const prodId = item.product_id || item.id;
        const qty = parseInt(item.quantity || item.qty || 0);
        const cost = parseFloat(item.cost || item.cost_price || item.price || 0);
        
        await client.query('INSERT INTO purchase_order_items (id, purchase_order_id, product_id, quantity, cost) VALUES ($1, $2, $3, $4, $5)', [itemId, poId, prodId, qty, cost]);
        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [qty, prodId]);
      }
    }
    
    await client.query('UPDATE purchase_orders SET date = $1, vendor_id = $2, total = $3, paid_amount = $4, status = $5, payment_type_id = $6, due_date = $7 WHERE id = $8', [poDate, vId, finalTotal, finalPaid, status, pType, due_date, poId]);
    
    await client.query('DELETE FROM cash_transactions WHERE purchase_order_id = $1', [poId]);
    if (finalPaid > 0) {
      const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
      await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, purchase_order_id, payment_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [ctId, poDate, 'OUT', 'Pembelian Stok', `Bayar PO ${poId} (Edit)`, finalPaid, 'Transfer Bank', poId, pType]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/purchases/:id/cancel', authenticateToken, async (req, res) => {
  const poId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const checkRes = await client.query('SELECT status FROM purchase_orders WHERE id = $1', [poId]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'PO tidak ditemukan' });
    }
    if (checkRes.rows[0].status === 'Batal') {
      await client.query('ROLLBACK');
      return res.json({ success: true });
    }
    
    const itemsRes = await client.query('SELECT product_id, quantity FROM purchase_order_items WHERE purchase_order_id = $1', [poId]);
    for (const item of itemsRes.rows) {
      await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    
    await client.query('UPDATE purchase_orders SET status = $1 WHERE id = $2', ['Batal', poId]);
    await client.query('DELETE FROM cash_transactions WHERE purchase_order_id = $1', [poId]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Sales Invoices Extra CRUD ---
app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  const invId = req.params.id;
  const { customer_id, customerId, date, total, paid, paid_amount, payment_type_id, due_date, items } = req.body;
  const custId = customer_id || customerId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'Lunas' : (finalPaid > 0 ? 'Sebagian' : 'Belum Bayar');
  const invDate = date || new Date().toISOString().split('T')[0];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const oldItemsRes = await client.query('SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1', [invId]);
    for (const item of oldItemsRes.rows) {
      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    
    await client.query('DELETE FROM invoice_items WHERE invoice_id = $1', [invId]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        const itemId = 'IVI-' + Date.now() + Math.floor(Math.random()*1000);
        const prodId = item.product_id || item.id;
        const qty = parseInt(item.quantity || item.qty || 0);
        const price = parseFloat(item.price || item.sell_price || 0);
        
        await client.query('INSERT INTO invoice_items (id, invoice_id, product_id, quantity, price) VALUES ($1, $2, $3, $4, $5)', [itemId, invId, prodId, qty, price]);
        await client.query('UPDATE products SET stock = stock - $1 WHERE id = $2', [qty, prodId]);
      }
    }
    
    if (due_date !== undefined) {
      await client.query('UPDATE sales_invoices SET date = $1, customer_id = $2, subtotal = $3, total = $4, paid_amount = $5, status = $6, payment_type_id = $7, due_date = $8 WHERE id = $9', [invDate, custId, finalTotal, finalTotal, finalPaid, status, pType, due_date, invId]);
    } else {
      await client.query('UPDATE sales_invoices SET date = $1, customer_id = $2, subtotal = $3, total = $4, paid_amount = $5, status = $6, payment_type_id = $7 WHERE id = $8', [invDate, custId, finalTotal, finalTotal, finalPaid, status, pType, invId]);
    }
    
    await client.query('DELETE FROM cash_transactions WHERE invoice_id = $1', [invId]);
    if (finalPaid > 0) {
      const ctId = 'CT-' + Date.now() + Math.floor(Math.random()*1000);
      await client.query('INSERT INTO cash_transactions (id, date, type, category, description, amount, method, invoice_id, payment_type_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [ctId, invDate, 'IN', 'Penjualan', `Pembayaran INV ${invId} (Edit)`, finalPaid, 'Transfer Bank', invId, pType]);
    }
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

app.put('/api/invoices/:id/cancel', authenticateToken, async (req, res) => {
  const invId = req.params.id;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const checkRes = await client.query('SELECT status FROM sales_invoices WHERE id = $1', [invId]);
    if (checkRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    }
    if (checkRes.rows[0].status === 'Batal') {
      await client.query('ROLLBACK');
      return res.json({ success: true });
    }
    
    const itemsRes = await client.query('SELECT product_id, quantity FROM invoice_items WHERE invoice_id = $1', [invId]);
    for (const item of itemsRes.rows) {
      await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }
    
    await client.query('UPDATE sales_invoices SET status = $1 WHERE id = $2', ['Batal', invId]);
    await client.query('DELETE FROM cash_transactions WHERE invoice_id = $1', [invId]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Cash Transactions (Arus Kas) ---
app.get('/api/finance/cashflow', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM cash_transactions ORDER BY date DESC, id DESC');
    res.json(result.rows.map(r => ({
      id: r.id,
      date: r.date ? new Date(r.date).toISOString().split('T')[0] : '',
      type: r.type,
      category: r.category,
      desc: r.description,
      amount: parseFloat(r.amount),
      method: r.method
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/cashflow', authenticateToken, async (req, res) => {
  const { type, category, description, amount, method, date } = req.body;
  const ctId = 'CT-' + Date.now();
  const ctDate = date || new Date().toISOString().split('T')[0];
  try {
    await pool.query(
      'INSERT INTO cash_transactions (id, date, type, category, description, amount, method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ctId, ctDate, type, category, description, parseFloat(amount), method]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// --- Reports & Dashboard API ---
app.get('/api/finance/reports/profit-loss', authenticateToken, async (req, res) => {
  try {
    const salesRes = await pool.query("SELECT SUM(total) as revenue FROM sales_invoices WHERE status != 'Batal'");
    const revenue = parseFloat(salesRes.rows[0].revenue || 0);
    
    const hppRes = await pool.query(`
      SELECT SUM(ii.quantity * p.cost_price) as hpp 
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN sales_invoices si ON ii.invoice_id = si.id
      WHERE si.status != 'Batal'
    `);
    const hpp = parseFloat(hppRes.rows[0].hpp || 0);
    
    const expensesRes = await pool.query(`
      SELECT category, SUM(amount) as total 
      FROM cash_transactions 
      WHERE type = 'OUT' AND category NOT IN ('Pembelian Stok', 'Hutang')
      GROUP BY category
    `);
    
    res.json({
      revenue,
      hpp,
      expenses: expensesRes.rows.map(r => ({
        category: r.category,
        amount: parseFloat(r.total)
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/reports/balance-sheet', authenticateToken, async (req, res) => {
  try {
    const cashInRes = await pool.query("SELECT SUM(amount) as total FROM cash_transactions WHERE type = 'IN'");
    const cashOutRes = await pool.query("SELECT SUM(amount) as total FROM cash_transactions WHERE type = 'OUT'");
    const cash = parseFloat(cashInRes.rows[0].total || 0) - parseFloat(cashOutRes.rows[0].total || 0);
    
    const piutangRes = await pool.query("SELECT SUM(total - paid_amount) as total FROM sales_invoices WHERE status != 'Batal'");
    const piutang = parseFloat(piutangRes.rows[0].total || 0);
    
    const inventoryRes = await pool.query("SELECT SUM(stock * cost_price) as total FROM products");
    const persediaan = parseFloat(inventoryRes.rows[0].total || 0);
    
    const hutangRes = await pool.query("SELECT SUM(total - paid_amount) as total FROM purchase_orders WHERE status != 'Batal'");
    const hutang = parseFloat(hutangRes.rows[0].total || 0);
    
    res.json({
      cash,
      piutang,
      persediaan,
      hutang
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/reports/insights', authenticateToken, async (req, res) => {
  try {
    const topProductsRes = await pool.query(`
      SELECT p.name, SUM(ii.quantity * ii.price) as value
      FROM invoice_items ii
      JOIN products p ON ii.product_id = p.id
      JOIN sales_invoices si ON ii.invoice_id = si.id
      WHERE si.status != 'Batal'
      GROUP BY p.id, p.name
      ORDER BY value DESC
      LIMIT 5
    `);
    
    const topCustomersRes = await pool.query(`
      SELECT c.name, SUM(si.total) as value
      FROM sales_invoices si
      JOIN customers c ON si.customer_id = c.id
      WHERE si.status != 'Batal'
      GROUP BY c.id, c.name
      ORDER BY value DESC
      LIMIT 5
    `);
    
    res.json({
      topProducts: topProductsRes.rows.map(r => ({ name: r.name, value: parseFloat(r.value) })),
      topCustomers: topCustomersRes.rows.map(r => ({ name: r.name, value: parseFloat(r.value) }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Product Stock Opname ---
app.post('/api/products/:id/stock-adjustment', authenticateToken, async (req, res) => {
  const prodId = req.params.id;
  const { actual_stock, reason } = req.body;
  const finalActual = parseInt(actual_stock);
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const prodRes = await client.query('SELECT stock FROM products WHERE id = $1', [prodId]);
    if (prodRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    
    const systemStock = parseInt(prodRes.rows[0].stock || 0);
    const diff = finalActual - systemStock;
    if (diff === 0) {
      await client.query('ROLLBACK');
      return res.json({ success: true, message: 'Tidak ada perbedaan stok' });
    }
    
    const type = diff > 0 ? 'IN' : 'OUT';
    const qty = Math.abs(diff);
    const adjId = 'ADJ-' + Date.now();
    const date = new Date().toISOString().split('T')[0];
    
    await client.query('INSERT INTO stock_adjustments (id, product_id, type, quantity, reason, adjustment_date) VALUES ($1, $2, $3, $4, $5, $6)', [adjId, prodId, type, qty, reason, date]);
    await client.query('UPDATE products SET stock = $1 WHERE id = $2', [finalActual, prodId]);
    
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// --- Users / Staff CRUD ---
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, name, email, role, active FROM users ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  const { username, name, email, password, role, active } = req.body;
  try {
    await pool.query(
      'INSERT INTO users (username, name, email, password_hash, role, active) VALUES ($1, $2, $3, $4, $5, $6)',
      [username, name, email, password || '123456', role || 'kasir', active !== undefined ? active : true]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, email, role, active } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = $1, email = $2, role = $3, active = $4 WHERE id = $5',
      [name, email, role, active, id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE users SET active = false WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Serve HTML files
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(port, () => {
  console.log(`SupplierPro API running at http://localhost:${port}`);
});
