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
  connectionString: process.env.DATABASE_URL
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
    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
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

// --- Dashboard & Summary Routes ---
app.get('/api/dashboard/summary', authenticateToken, async (req, res) => {
  try {
    const revenueResult = await pool.query('SELECT SUM(total) as revenue FROM invoices WHERE status != $1', ['Batal']);
    const totalInvoices = revenueResult.rows[0].revenue || 0;
    
    const receivablesResult = await pool.query('SELECT SUM(total - paid) as receivables FROM invoices WHERE status != $1 AND status != $2', ['Lunas', 'Batal']);
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
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  const { id, sku, name, category, cost_price, sell_price, stock, min_stock, badge } = req.body;
  const insertQuery = 'INSERT INTO products (id, sku, name, category, cost_price, sell_price, stock, min_stock, badge) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
  try {
    await pool.query(insertQuery, [id || 'P' + Date.now(), sku, name, category, cost_price, sell_price, stock, min_stock, badge]);
    res.json({ success: true, message: 'Produk berhasil ditambahkan' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { sku, name, category, cost_price, sell_price, stock, min_stock, badge } = req.body;
  const updateQuery = 'UPDATE products SET sku = $1, name = $2, category = $3, cost_price = $4, sell_price = $5, stock = $6, min_stock = $7, badge = $8 WHERE id = $9';
  try {
    const result = await pool.query(updateQuery, [sku, name, category, cost_price, sell_price, stock, min_stock, badge, id]);
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

// --- Customers Routes ---
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
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
  const { name, type, phone, city, credit_limit } = req.body;
  const insertQuery = 'INSERT INTO customers (id, name, type, phone, city, credit_limit) VALUES ($1, $2, $3, $4, $5, $6)';
  try {
    await pool.query(insertQuery, ['C' + Date.now(), name, type, phone, city, credit_limit]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, type, phone, city, credit_limit } = req.body;
  const updateQuery = 'UPDATE customers SET name = $1, type = $2, phone = $3, city = $4, credit_limit = $5 WHERE id = $6';
  try {
    const result = await pool.query(updateQuery, [name, type, phone, city, credit_limit, id]);
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
    const result = await pool.query('SELECT * FROM vendors');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Invoices Routes (Sales) ---
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  const { customer_id, total, paid, type, items } = req.body;
  
  const insertInvoiceQuery = 'INSERT INTO invoices (id, date, customer_id, total, paid, type, status) VALUES ($1, $2, $3, $4, $5, $6, $7)';
  const updateStockQuery = 'UPDATE products SET stock = stock - $1 WHERE id = $2';
  
  const id = 'INV-' + Date.now();
  const date = new Date().toISOString();
  const status = paid >= total ? 'Lunas' : (paid > 0 ? 'Sebagian' : 'Belum Bayar');
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(insertInvoiceQuery, [id, date, customer_id, total, paid, type, status]);
    
    // Reduce stock
    if (items && Array.isArray(items)) {
      for (const item of items) {
         await client.query(updateStockQuery, [item.quantity, item.id]);
      }
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
    const result = await pool.query('SELECT * FROM invoices WHERE status != $1 AND status != $2', ['Lunas', 'Batal']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/finance/receivables/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
    const invoice = result.rows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice tidak ditemukan' });
    
    const currentPaid = parseFloat(invoice.paid);
    const total = parseFloat(invoice.total);
    const newPaid = currentPaid + parseFloat(amount);
    const newStatus = newPaid >= total ? 'Lunas' : 'Sebagian';
    
    await pool.query('UPDATE invoices SET paid = $1, status = $2 WHERE id = $3', [newPaid, newStatus, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/finance/payables', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchases WHERE status != $1 AND status != $2', ['Lunas', 'Batal']);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve HTML files
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(port, () => {
  console.log(`SupplierPro API running at http://localhost:${port}`);
});
