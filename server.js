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

// --- Dashboard & Summary Routes ---
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const revenueResult = await pool.query('SELECT SUM(total) as revenue FROM sales_invoices WHERE status != $1', ['Batal']);
    const totalInvoices = revenueResult.rows[0].revenue || 0;
    
    const receivablesResult = await pool.query('SELECT SUM(total - paid_amount) as receivables FROM sales_invoices WHERE status != $1 AND status != $2', ['Lunas', 'Batal']);
    const unpaidInvoices = receivablesResult.rows[0].receivables || 0;
    
    const lowStockProductsResult = await pool.query('SELECT * FROM products WHERE stock <= min_stock');
    const lowStockProducts = lowStockProductsResult.rows;

    res.json({
      revenue: parseFloat(totalInvoices),
      receivables: parseFloat(unpaidInvoices),
      lowStockCount: lowStockProducts.length,
      lowStockProducts
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
    const existing = await client.query('SELECT id, stock, name FROM products WHERE id = $1', [product_id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Produk tidak ditemukan' });
    }
    const oldStock = parseInt(existing.rows[0].stock);
    const productName = existing.rows[0].name;
    await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, product_id]);
    // Log adjustment in cash transactions as a note (or you can add a separate stock_adjustments table)
    const ctId = 'SA-' + Date.now();
    const ctDate = new Date().toISOString().split('T')[0];
    const desc = `Stock Opname: ${productName} | Sebelum: ${oldStock} → Sesudah: ${newStock}${note ? ' | ' + note : ''}`;
    await client.query(
      'INSERT INTO cash_transactions (id, date, type, category, description, amount, method) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [ctId, ctDate, 'OUT', 'Penyesuaian Stok', desc, 0, 'Stock Opname']
    );
    await client.query('COMMIT');
    res.json({ success: true, old_stock: oldStock, new_stock: newStock });
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
    await pool.query(insertQuery, ['C' + Date.now(), name, customer_category_id, phone, city, address, credit_lmt, id_number, npwp]);
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
  const { customer_id, total, paid, payment_type_id, items } = req.body;
  
  const insertInvoiceQuery = 'INSERT INTO sales_invoices (id, date, customer_id, total, paid_amount, payment_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  const updateStockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2';
  
  const id = 'INV-' + Date.now();
  const date = new Date().toISOString();
  const status = paid >= total ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Bayar');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(insertInvoiceQuery, [id, date, customer_id, total, paid, payment_type_id, status]);
    
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
      purchaseOrderId: r.purchase_order_id || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/payables', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT po.*, v.name as vendor_name FROM purchase_orders po LEFT JOIN vendors v ON po.vendor_id = v.id WHERE po.status != $1 AND po.status != $2', ['Lunas', 'Batal']);
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
    const newStatus = newPaid >= total ? 'selesai' : 'proses';
    
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
  const vId = 'V' + Date.now();
  const catId = vendor_category_id || category_id || 'VC-1';
  try {
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
      status: row.status
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', authenticateToken, async (req, res) => {
  const { vendor_id, vendorId, date, total, paid, paid_amount, payment_type_id, items } = req.body;
  const vId = vendor_id || vendorId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'selesai' : 'proses';
  const poId = 'PO-' + Date.now();
  const poDate = date || new Date().toISOString().split('T')[0];
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('INSERT INTO purchase_orders (id, date, vendor_id, total, paid_amount, payment_type_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [poId, poDate, vId, finalTotal, finalPaid, pType, status]);
    
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
  const { vendor_id, vendorId, date, total, paid, paid_amount, payment_type_id, items } = req.body;
  const vId = vendor_id || vendorId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'selesai' : 'proses';
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
    
    await client.query('UPDATE purchase_orders SET date = $1, vendor_id = $2, total = $3, paid_amount = $4, status = $5, payment_type_id = $6 WHERE id = $7', [poDate, vId, finalTotal, finalPaid, status, pType, poId]);
    
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
  const { customer_id, customerId, date, total, paid, paid_amount, payment_type_id, items } = req.body;
  const custId = customer_id || customerId;
  const pType = payment_type_id || 'PT-1';
  const finalPaid = parseFloat(paid || paid_amount || 0);
  const finalTotal = parseFloat(total || 0);
  const status = finalPaid >= finalTotal ? 'lunas' : (finalPaid > 0 ? 'sebagian' : 'belum');
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
    
    await client.query('UPDATE sales_invoices SET date = $1, customer_id = $2, subtotal = $3, total = $4, paid_amount = $5, status = $6, payment_type_id = $7 WHERE id = $8', [invDate, custId, finalTotal, finalTotal, finalPaid, status, pType, invId]);
    
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
