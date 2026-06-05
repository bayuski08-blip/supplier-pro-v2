// ==========================================================================
// SupplierPro Dashboard — JavaScript
// ==========================================================================

// Auth check
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}
// ---------- Currency Formatter ----------
function rp(n) {
    return 'Rp ' + Number(n).toLocaleString('id-ID');
}

function rpShort(n) {
    if (n >= 1_000_000_000) return 'Rp ' + (n / 1_000_000_000).toFixed(1) + 'M';
    if (n >= 1_000_000) return 'Rp ' + (n / 1_000_000).toFixed(1) + 'jt';
    if (n >= 1_000) return 'Rp ' + (n / 1_000).toFixed(0) + 'rb';
    return rp(n);
}

// ---------- Dummy Data ----------
const PRODUCTS = [
    { id: 'P001', sku: 'MNM-001', name: 'Kopi Arabica 250g', category: 'Minuman', cost: 45000, price: 68000, stock: 124, minStock: 20, unit: 'pcs', emoji: '☕' },
    { id: 'P002', sku: 'MNM-002', name: 'Teh Celup Premium 25s', category: 'Minuman', cost: 12000, price: 18500, stock: 230, minStock: 50, unit: 'box', emoji: '🍵' },
    { id: 'P003', sku: 'MNM-003', name: 'Sirup Rasa Buah 1L', category: 'Minuman', cost: 22000, price: 35000, stock: 67, minStock: 15, unit: 'botol', emoji: '🧃' },
    { id: 'P004', sku: 'MKN-001', name: 'Mie Instan Goreng (dus)', category: 'Makanan', cost: 92000, price: 115000, stock: 45, minStock: 10, unit: 'dus', emoji: '🍜' },
    { id: 'P005', sku: 'MKN-002', name: 'Biskuit Kaleng 350g', category: 'Makanan', cost: 28000, price: 42000, stock: 89, minStock: 20, unit: 'pcs', emoji: '🍪' },
    { id: 'P006', sku: 'MKN-003', name: 'Wafer Coklat 12x21g', category: 'Makanan', cost: 18000, price: 27000, stock: 156, minStock: 30, unit: 'pack', emoji: '🍫' },
    { id: 'P007', sku: 'SMB-001', name: 'Beras Premium 5kg', category: 'Sembako', cost: 62000, price: 78000, stock: 8, minStock: 15, unit: 'sak', emoji: '🌾' },
    { id: 'P008', sku: 'SMB-002', name: 'Gula Pasir 1kg', category: 'Sembako', cost: 14000, price: 18000, stock: 12, minStock: 25, unit: 'kg', emoji: '🍬' },
    { id: 'P009', sku: 'SMB-003', name: 'Minyak Goreng 2L', category: 'Sembako', cost: 28000, price: 36000, stock: 5, minStock: 10, unit: 'botol', emoji: '🫗' },
    { id: 'P010', sku: 'MNM-004', name: 'Susu UHT 1L (karton)', category: 'Minuman', cost: 155000, price: 195000, stock: 32, minStock: 10, unit: 'karton', emoji: '🥛' },
    { id: 'P011', sku: 'MKN-004', name: 'Sarden Kaleng 155g', category: 'Makanan', cost: 11000, price: 16500, stock: 78, minStock: 20, unit: 'pcs', emoji: '🐟' },
    { id: 'P012', sku: 'LNY-001', name: 'Sabun Cuci Piring 750ml', category: 'Lainnya', cost: 8500, price: 13000, stock: 140, minStock: 30, unit: 'botol', emoji: '🧴' },
    { id: 'P013', sku: 'LNY-002', name: 'Tisu Wajah 250s', category: 'Lainnya', cost: 12000, price: 18000, stock: 95, minStock: 20, unit: 'pack', emoji: '🧻' },
    { id: 'P014', sku: 'SMB-004', name: 'Tepung Terigu 1kg', category: 'Sembako', cost: 10000, price: 14500, stock: 18, minStock: 20, unit: 'kg', emoji: '🌾' },
    { id: 'P015', sku: 'MNM-005', name: 'Air Mineral 600ml (dus)', category: 'Minuman', cost: 38000, price: 52000, stock: 200, minStock: 30, unit: 'dus', emoji: '💧' },
    { id: 'P016', sku: 'MKN-005', name: 'Kecap Manis 600ml', category: 'Makanan', cost: 15000, price: 22000, stock: 62, minStock: 15, unit: 'botol', emoji: '🫙' },
];

const CUSTOMERS = [
    { id: 'C001', name: 'Toko Berkah Jaya', type: 'Reseller', phone: '0812-3456-7001', city: 'Surabaya', creditLimit: 15000000, totalOrders: 42, totalSpent: 28500000, color: 'blue' },
    { id: 'C002', name: 'Warung Sari Rasa', type: 'Warung', phone: '0813-2345-6002', city: 'Malang', creditLimit: 5000000, totalOrders: 18, totalSpent: 8750000, color: 'emerald' },
    { id: 'C003', name: 'Kafe Nusantara', type: 'Kafe', phone: '0821-4567-8003', city: 'Surabaya', creditLimit: 20000000, totalOrders: 31, totalSpent: 45200000, color: 'amber' },
    { id: 'C004', name: 'Toko Makmur Sentosa', type: 'Toko', phone: '0852-6789-0004', city: 'Sidoarjo', creditLimit: 10000000, totalOrders: 25, totalSpent: 18900000, color: 'violet' },
    { id: 'C005', name: 'Warung Makan Bu Diah', type: 'Warung', phone: '0896-1234-5005', city: 'Gresik', creditLimit: 3000000, totalOrders: 12, totalSpent: 4200000, color: 'rose' },
    { id: 'C006', name: 'Minimarket Jaya Abadi', type: 'Reseller', phone: '0811-9876-5006', city: 'Surabaya', creditLimit: 25000000, totalOrders: 55, totalSpent: 67800000, color: 'indigo' },
    { id: 'C007', name: 'Kedai Kopi Pagi', type: 'Kafe', phone: '0857-6543-2007', city: 'Malang', creditLimit: 8000000, totalOrders: 14, totalSpent: 12300000, color: 'cyan' },
    { id: 'C008', name: 'Toko Sembako Ibu Rina', type: 'Toko', phone: '0878-3210-9008', city: 'Mojokerto', creditLimit: 7000000, totalOrders: 20, totalSpent: 9800000, color: 'blue' },
];

const VENDORS = [
    { id: 'V001', name: 'PT Sumber Minuman Nusantara', category: 'Minuman', phone: '021-5556-7890', city: 'Jakarta', totalPurchases: 125000000, debt: 12500000, color: 'blue' },
    { id: 'V002', name: 'CV Pangan Makmur', category: 'Makanan', phone: '031-7778-9012', city: 'Surabaya', totalPurchases: 87000000, debt: 4200000, color: 'emerald' },
    { id: 'V003', name: 'UD Sembako Sentosa', category: 'Sembako', phone: '031-3334-5678', city: 'Sidoarjo', totalPurchases: 64000000, debt: 0, color: 'amber' },
    { id: 'V004', name: 'PT Kopi Nusantara', category: 'Minuman', phone: '0341-445-6789', city: 'Malang', totalPurchases: 42000000, debt: 8500000, color: 'violet' },
    { id: 'V005', name: 'CV Bersih Sempurna', category: 'Non-Pangan', phone: '021-2223-4567', city: 'Jakarta', totalPurchases: 18000000, debt: 0, color: 'rose' },
];

const INVOICES = [
    { id: 'INV-2026-0041', date: '2026-06-03', customerId: 'C001', customer: 'Toko Berkah Jaya', total: 2850000, paid: 2850000, type: 'Tunai', method: 'Transfer', status: 'lunas', dueDate: '2026-06-03' },
    { id: 'INV-2026-0040', date: '2026-06-02', customerId: 'C003', customer: 'Kafe Nusantara', total: 4750000, paid: 2000000, type: 'Tempo', method: 'Transfer', status: 'sebagian', dueDate: '2026-06-16' },
    { id: 'INV-2026-0039', date: '2026-06-02', customerId: 'C006', customer: 'Minimarket Jaya Abadi', total: 8200000, paid: 0, type: 'Tempo', method: '-', status: 'belum', dueDate: '2026-06-16' },
    { id: 'INV-2026-0038', date: '2026-06-01', customerId: 'C002', customer: 'Warung Sari Rasa', total: 1250000, paid: 1250000, type: 'Tunai', method: 'Tunai', status: 'lunas', dueDate: '2026-06-01' },
    { id: 'INV-2026-0037', date: '2026-06-01', customerId: 'C004', customer: 'Toko Makmur Sentosa', total: 3400000, paid: 1500000, type: 'DP', method: 'Transfer', status: 'sebagian', dueDate: '2026-06-15' },
    { id: 'INV-2026-0036', date: '2026-05-31', customerId: 'C007', customer: 'Kedai Kopi Pagi', total: 2100000, paid: 2100000, type: 'Tunai', method: 'QRIS', status: 'lunas', dueDate: '2026-05-31' },
    { id: 'INV-2026-0035', date: '2026-05-30', customerId: 'C005', customer: 'Warung Makan Bu Diah', total: 850000, paid: 0, type: 'Tempo', method: '-', status: 'belum', dueDate: '2026-06-13' },
    { id: 'INV-2026-0034', date: '2026-05-30', customerId: 'C008', customer: 'Toko Sembako Ibu Rina', total: 1950000, paid: 0, type: 'Tempo', method: '-', status: 'belum', dueDate: '2026-06-13' },
    { id: 'INV-2026-0033', date: '2026-05-29', customerId: 'C001', customer: 'Toko Berkah Jaya', total: 5200000, paid: 5200000, type: 'Tunai', method: 'Transfer', status: 'lunas', dueDate: '2026-05-29' },
    { id: 'INV-2026-0032', date: '2026-05-28', customerId: 'C006', customer: 'Minimarket Jaya Abadi', total: 12500000, paid: 6000000, type: 'Tempo', method: 'Transfer', status: 'sebagian', dueDate: '2026-06-11' },
];

const PURCHASES = [
    { id: 'PO-2026-018', date: '2026-06-02', vendorId: 'V001', vendor: 'PT Sumber Minuman Nusantara', total: 15600000, paid: 15600000, type: 'Lunas', status: 'selesai' },
    { id: 'PO-2026-017', date: '2026-06-01', vendorId: 'V002', vendor: 'CV Pangan Makmur', total: 8400000, paid: 4200000, type: 'Tempo 14 Hari', status: 'proses' },
    { id: 'PO-2026-016', date: '2026-05-30', vendorId: 'V004', vendor: 'PT Kopi Nusantara', total: 12500000, paid: 4000000, type: 'Tempo 30 Hari', status: 'proses' },
    { id: 'PO-2026-015', date: '2026-05-28', vendorId: 'V003', vendor: 'UD Sembako Sentosa', total: 6200000, paid: 6200000, type: 'Lunas', status: 'selesai' },
    { id: 'PO-2026-014', date: '2026-05-25', vendorId: 'V005', vendor: 'CV Bersih Sempurna', total: 3800000, paid: 3800000, type: 'Lunas', status: 'selesai' },
    { id: 'PO-2026-013', date: '2026-05-22', vendorId: 'V001', vendor: 'PT Sumber Minuman Nusantara', total: 18200000, paid: 9000000, type: 'Tempo 14 Hari', status: 'proses' },
];

const CASH_TRANSACTIONS = [
    { id: 'CT001', date: '2026-06-03', type: 'IN', category: 'Penjualan', desc: 'Pembayaran INV-2026-0041', amount: 2850000, method: 'Transfer Bank' },
    { id: 'CT002', date: '2026-06-02', type: 'IN', category: 'Penjualan', desc: 'DP dari Kafe Nusantara', amount: 2000000, method: 'Transfer Bank' },
    { id: 'CT003', date: '2026-06-02', type: 'OUT', category: 'Pembelian Stok', desc: 'Bayar PO-2026-018', amount: 15600000, method: 'Transfer Bank' },
    { id: 'CT004', date: '2026-06-01', type: 'IN', category: 'Penjualan', desc: 'Pembayaran tunai Warung Sari Rasa', amount: 1250000, method: 'Tunai' },
    { id: 'CT005', date: '2026-06-01', type: 'OUT', category: 'Operasional', desc: 'Listrik & air gudang', amount: 2500000, method: 'Transfer Bank' },
    { id: 'CT006', date: '2026-06-01', type: 'IN', category: 'Penjualan', desc: 'DP Toko Makmur Sentosa', amount: 1500000, method: 'Transfer Bank' },
    { id: 'CT007', date: '2026-05-31', type: 'IN', category: 'Penjualan', desc: 'Pembayaran QRIS Kedai Kopi Pagi', amount: 2100000, method: 'QRIS' },
    { id: 'CT008', date: '2026-05-31', type: 'OUT', category: 'Gaji', desc: 'Gaji karyawan Mei 2026', amount: 8500000, method: 'Transfer Bank' },
    { id: 'CT009', date: '2026-05-30', type: 'OUT', category: 'Pembelian Stok', desc: 'Bayar PO-2026-015', amount: 6200000, method: 'Transfer Bank' },
    { id: 'CT010', date: '2026-05-29', type: 'IN', category: 'Penjualan', desc: 'Pembayaran INV-2026-0033', amount: 5200000, method: 'Transfer Bank' },
    { id: 'CT011', date: '2026-05-28', type: 'IN', category: 'Piutang', desc: 'Cicilan Minimarket Jaya Abadi', amount: 6000000, method: 'Transfer Bank' },
    { id: 'CT012', date: '2026-05-28', type: 'OUT', category: 'Sewa', desc: 'Sewa gudang Juni 2026', amount: 5000000, method: 'Transfer Bank' },
];

// Sales data for chart (last 7 days)
const SALES_CHART_DATA = [
    { label: '28 Mei', value: 17700000 },
    { label: '29 Mei', value: 5200000 },
    { label: '30 Mei', value: 2800000 },
    { label: '31 Mei', value: 2100000 },
    { label: '1 Jun', value: 4650000 },
    { label: '2 Jun', value: 12950000 },
    { label: '3 Jun', value: 2850000 },
];

// Donut chart data
const DONUT_DATA = [
    { label: 'Minuman', value: 38, color: '#3b82f6' },
    { label: 'Makanan', value: 27, color: '#10b981' },
    { label: 'Sembako', value: 22, color: '#f59e0b' },
    { label: 'Lainnya', value: 13, color: '#8b5cf6' },
];

// Page title mapping
const PAGE_TITLES = {
    dashboard: { title: 'Dashboard', subtitle: 'Selamat pagi, Ahmad 👋' },
    pos: { title: 'Order / Kasir', subtitle: 'Buat transaksi penjualan baru' },
    products: { title: 'Produk & Stok', subtitle: 'Kelola inventaris produk Anda' },
    customers: { title: 'Pelanggan', subtitle: 'Daftar pelanggan dan reseller' },
    vendors: { title: 'Vendor', subtitle: 'Daftar pemasok dan supplier' },
    purchases: { title: 'Pembelian', subtitle: 'Riwayat purchase order' },
    invoices: { title: 'Transaksi / Invoice', subtitle: 'Riwayat invoice penjualan' },
    piutang: { title: 'Piutang', subtitle: 'Tagihan pelanggan yang belum lunas' },
    hutang: { title: 'Hutang', subtitle: 'Kewajiban pembayaran ke vendor' },
    cashflow: { title: 'Arus Kas', subtitle: 'Mutasi kas masuk dan keluar' },
    profitloss: { title: 'Laba Rugi', subtitle: 'Laporan pendapatan dan beban' },
    balance: { title: 'Neraca', subtitle: 'Posisi keuangan bisnis Anda' },
    reports: { title: 'Laporan & Insight', subtitle: 'Analisis performa bisnis' },
    settings: { title: 'Pengaturan', subtitle: 'Konfigurasi profil dan preferensi' },
    roles: { title: 'Otoritas Akses', subtitle: 'Kelola hak akses dan peran staff' },
};

// ---------- Navigation ----------
let currentPage = 'dashboard';

function navigateTo(page) {
    // Hide all sections
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    // Deactivate all nav items
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
    if (navItem) navItem.classList.add('active');

    // Update topbar
    const info = PAGE_TITLES[page] || { title: page, subtitle: '' };
    document.getElementById('topbar-title').textContent = info.title;
    document.getElementById('topbar-subtitle').textContent = info.subtitle;

    currentPage = page;

    // Close mobile sidebar
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// Bind nav items
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        navigateTo(item.dataset.page);
    });
});

// Mobile sidebar toggle
document.getElementById('mobile-sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
});

document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
});

// ---------- Modal Helpers ----------
function openModal(id) {
    document.getElementById(id).classList.add('active');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('active');
        }
    });
});

// ---------- Dashboard Rendering ----------
function renderDashboard() {
    renderSummaryCards();
    renderSalesChart();
    renderDonutChart();
    renderRecentTransactions();
    renderLowStock();
}

function renderSummaryCards() {
    const totalOmzet = INVOICES.reduce((s, i) => s + i.total, 0);
    const totalPiutang = INVOICES.filter(i => i.status !== 'lunas').reduce((s, i) => s + (i.total - i.paid), 0);
    const totalHutang = VENDORS.reduce((s, v) => s + v.debt, 0);
    const lowStockCount = PRODUCTS.filter(p => p.stock <= p.minStock).length;
    const labaKotor = INVOICES.reduce((s, i) => s + i.total, 0) * 0.28; // ~28% margin
    const ordersToday = INVOICES.filter(i => i.date === '2026-06-03').length;
    const activeCustomers = CUSTOMERS.length;
    const totalProducts = PRODUCTS.length;

    const cards = [
        { label: 'Omzet Bulan Ini', value: rpShort(totalOmzet), trend: '+12%', trendDir: 'up', icon: 'trending-up', color: 'blue' },
        { label: 'Total Piutang', value: rpShort(totalPiutang), trend: '5 invoice', trendDir: 'down', icon: 'hand-coins', color: 'amber' },
        { label: 'Total Hutang', value: rpShort(totalHutang), trend: '3 vendor', trendDir: 'down', icon: 'landmark', color: 'rose' },
        { label: 'Stok Menipis', value: lowStockCount + ' produk', trend: 'Perlu restock', trendDir: 'down', icon: 'alert-triangle', color: 'orange' },
        { label: 'Laba Kotor', value: rpShort(labaKotor), trend: '+8%', trendDir: 'up', icon: 'wallet', color: 'emerald' },
        { label: 'Pesanan Hari Ini', value: ordersToday, trend: 'hari ini', trendDir: 'up', icon: 'shopping-cart', color: 'indigo' },
        { label: 'Pelanggan Aktif', value: activeCustomers, trend: '+2 baru', trendDir: 'up', icon: 'users', color: 'violet' },
        { label: 'Produk Terdaftar', value: totalProducts, trend: 'Katalog', trendDir: 'up', icon: 'package', color: 'cyan' },
    ];

    const grid = document.getElementById('summary-grid');
    grid.innerHTML = cards.map(c => `
        <div class="summary-card ${c.color}">
            <div class="summary-card-header">
                <div class="summary-card-icon ${c.color}"><i data-lucide="${c.icon}"></i></div>
                <span class="summary-card-trend ${c.trendDir}">${c.trendDir === 'up' ? '↑' : '↓'} ${c.trend}</span>
            </div>
            <div class="summary-card-value">${c.value}</div>
            <div class="summary-card-label">${c.label}</div>
        </div>
    `).join('');
}

function renderSalesChart() {
    const maxVal = Math.max(...SALES_CHART_DATA.map(d => d.value));
    const chart = document.getElementById('sales-chart');
    chart.innerHTML = SALES_CHART_DATA.map(d => {
        const h = Math.max((d.value / maxVal) * 200, 8);
        return `
            <div class="chart-bar-col">
                <div class="chart-bar-value">${rpShort(d.value)}</div>
                <div class="chart-bar" style="height: ${h}px;"></div>
                <div class="chart-bar-label">${d.label}</div>
            </div>
        `;
    }).join('');
}

function renderDonutChart() {
    const wrapper = document.getElementById('donut-chart');
    const total = DONUT_DATA.reduce((s, d) => s + d.value, 0);
    let cumulative = 0;
    const radius = 52;
    const circumference = 2 * Math.PI * radius;

    let circles = '';
    DONUT_DATA.forEach(d => {
        const dashLength = (d.value / total) * circumference;
        const dashOffset = -(cumulative / total) * circumference;
        circles += `<circle cx="70" cy="70" r="${radius}" fill="none" stroke="${d.color}" stroke-width="16" 
                     stroke-dasharray="${dashLength} ${circumference - dashLength}" 
                     stroke-dashoffset="${dashOffset}" 
                     style="transition: all 0.8s ease;"/>`;
        cumulative += d.value;
    });

    const svg = `<svg class="donut-svg" viewBox="0 0 140 140">${circles}</svg>`;
    const legend = DONUT_DATA.map(d => `
        <div class="donut-legend-item">
            <span class="donut-legend-dot" style="background: ${d.color};"></span>
            <span>${d.label}</span>
            <span class="donut-legend-value">${d.value}%</span>
        </div>
    `).join('');

    wrapper.innerHTML = svg + `<div class="donut-legend">${legend}</div>`;
}

function renderRecentTransactions() {
    const tbody = document.getElementById('recent-transactions-body');
    tbody.innerHTML = INVOICES.slice(0, 5).map(inv => `
        <tr>
            <td style="font-weight:600; color: var(--blue-600);">${inv.id}</td>
            <td>${inv.customer}</td>
            <td style="font-weight:600;">${rp(inv.total)}</td>
            <td><span class="badge-status ${inv.status}">${capitalize(inv.status)}</span></td>
        </tr>
    `).join('');
}

function renderLowStock() {
    const lowStock = PRODUCTS.filter(p => p.stock <= p.minStock);
    const tbody = document.getElementById('low-stock-body');
    tbody.innerHTML = lowStock.map(p => `
        <tr>
            <td style="font-weight: 600;">${p.emoji} ${p.name}</td>
            <td style="font-weight: 700; color: var(--rose-500);">${p.stock}</td>
            <td>${p.minStock}</td>
            <td><span class="badge-status rendah">Rendah</span></td>
        </tr>
    `).join('');

    if (lowStock.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--gray-400); padding:2rem;">Semua stok aman ✓</td></tr>';
    }
}

// ---------- Products Page ----------
function renderProducts(filter = '', category = '') {
    const tbody = document.getElementById('products-body');
    let filtered = PRODUCTS;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    if (category) {
        filtered = filtered.filter(p => p.category === category);
    }

    tbody.innerHTML = filtered.map(p => {
        const stockStatus = p.stock <= p.minStock ? 'rendah' : 'aman';
        const stockLabel = p.stock <= p.minStock ? 'Rendah' : 'Aman';
        return `
            <tr>
                <td><code style="background:var(--gray-100); padding:2px 6px; border-radius:4px; font-size:0.78rem;">${p.sku}</code></td>
                <td style="font-weight:600;">${p.emoji} ${p.name}</td>
                <td>${p.category}</td>
                <td>${rp(p.cost)}</td>
                <td style="font-weight:700;">${rp(p.price)}</td>
                <td style="font-weight:700;">${p.stock} ${p.unit}</td>
                <td>${p.minStock}</td>
                <td><span class="badge-status ${stockStatus}">${stockLabel}</span></td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit Produk" onclick="openModal('modal-edit-product')">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem; color: var(--blue-600);" title="Stock Opname" onclick="openModal('modal-stock-opname')">
                        <i data-lucide="boxes" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Hapus Produk">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Search & filter bindings for products
document.getElementById('product-search')?.addEventListener('input', (e) => {
    renderProducts(e.target.value, document.getElementById('product-category-filter').value);
});
document.getElementById('product-category-filter')?.addEventListener('change', (e) => {
    renderProducts(document.getElementById('product-search').value, e.target.value);
});

// ---------- Customers Page ----------
let customerViewMode = 'kanban';

function renderCustomers(filter = '', type = '') {
    const grid = document.getElementById('customers-grid');
    const listBody = document.getElementById('customers-list-body');
    if (!grid) return;

    let filtered = CUSTOMERS;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.city.toLowerCase().includes(q) || c.id.toLowerCase().includes(q));
    }
    if (type) {
        filtered = filtered.filter(c => c.type === type);
    }

    grid.innerHTML = filtered.map(c => `
        <div class="entity-card" style="position: relative;">
            <button class="btn-toolbar secondary" style="position: absolute; top: 1rem; right: 1rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Pelanggan" onclick="openModal('modal-edit-customer')">
                <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
            </button>
            <div class="entity-card-header">
                <div class="entity-avatar ${c.color}">${c.name.charAt(0)}</div>
                <div>
                    <div class="entity-name">${c.name}</div>
                    <div class="entity-type">${c.type} • ${c.city}</div>
                </div>
            </div>
            <div class="entity-details">
                <div class="entity-detail">
                    <span class="entity-detail-label">ID Pelanggan</span>
                    <span class="entity-detail-value">${c.id}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Telepon / WA</span>
                    <span class="entity-detail-value">${c.phone}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Limit Piutang</span>
                    <span class="entity-detail-value">${rpShort(c.creditLimit)}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Total Belanja</span>
                    <span class="entity-detail-value">${rpShort(c.totalSpent)}</span>
                </div>
            </div>
        </div>
    `).join('');

    if (listBody) {
        listBody.innerHTML = filtered.map(c => `
            <tr>
                <td style="font-weight:600; color: var(--blue-600);">${c.id}</td>
                <td style="font-weight:600;">${c.name}</td>
                <td><span class="badge-status aman">${c.type}</span></td>
                <td>${c.city}</td>
                <td>${c.phone}</td>
                <td style="font-weight:700;">${rp(c.creditLimit)}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Pelanggan" onclick="openModal('modal-edit-customer')">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.getElementById('customer-search')?.addEventListener('input', (e) => {
    renderCustomers(e.target.value, document.getElementById('customer-type-filter').value);
});
document.getElementById('customer-type-filter')?.addEventListener('change', (e) => {
    renderCustomers(document.getElementById('customer-search').value, e.target.value);
});

// Customer view toggle bindings
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-view-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            document.querySelectorAll('.btn-view-toggle').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--gray-500)';
                b.style.boxShadow = 'none';
            });
            targetBtn.classList.add('active');
            targetBtn.style.background = 'white';
            targetBtn.style.color = 'var(--blue-600)';
            targetBtn.style.boxShadow = '0 1px 2px rgb(0 0 0 / 0.05)';

            customerViewMode = targetBtn.dataset.view;
            if (customerViewMode === 'list') {
                document.getElementById('customers-grid').style.display = 'none';
                document.getElementById('customers-list').style.display = 'block';
            } else {
                document.getElementById('customers-grid').style.display = 'grid';
                document.getElementById('customers-list').style.display = 'none';
            }
        });
    });
});

// ---------- Vendors Page ----------
let vendorViewMode = 'kanban';

function renderVendors(filter = '') {
    const grid = document.getElementById('vendors-grid');
    const listBody = document.getElementById('vendors-list-body');
    if (!grid) return;

    let filtered = VENDORS;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = filtered.filter(v => v.name.toLowerCase().includes(q) || (v.id && v.id.toLowerCase().includes(q)));
    }

    grid.innerHTML = filtered.map(v => `
        <div class="entity-card" style="position: relative;">
            <button class="btn-toolbar secondary" style="position: absolute; top: 1rem; right: 1rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Vendor" onclick="openModal('modal-edit-vendor')">
                <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
            </button>
            <div class="entity-card-header">
                <div class="entity-avatar ${v.color}">${v.name.charAt(0)}</div>
                <div>
                    <div class="entity-name">${v.name}</div>
                    <div class="entity-type">${v.category} • ${v.city}</div>
                </div>
            </div>
            <div class="entity-details">
                <div class="entity-detail">
                    <span class="entity-detail-label">ID Vendor</span>
                    <span class="entity-detail-value">${v.id || 'V0XX'}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Telepon / WA</span>
                    <span class="entity-detail-value">${v.phone}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Total Pembelian</span>
                    <span class="entity-detail-value">${rpShort(v.totalPurchases)}</span>
                </div>
                <div class="entity-detail">
                    <span class="entity-detail-label">Hutang</span>
                    <span class="entity-detail-value" style="color: ${v.debt > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'}; font-weight:700;">${v.debt > 0 ? rp(v.debt) : 'Lunas ✓'}</span>
                </div>
            </div>
        </div>
    `).join('');

    if (listBody) {
        listBody.innerHTML = filtered.map(v => `
            <tr>
                <td style="font-weight:600; color: var(--blue-600);">${v.id || 'V0XX'}</td>
                <td style="font-weight:600;">${v.name}</td>
                <td><span class="badge-status aman">${v.category}</span></td>
                <td>${v.city}</td>
                <td>${v.phone}</td>
                <td style="font-weight:700; color: ${v.debt > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'};">${v.debt > 0 ? rp(v.debt) : 'Lunas ✓'}</td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Vendor" onclick="openModal('modal-edit-vendor')">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.getElementById('vendor-search')?.addEventListener('input', (e) => {
    renderVendors(e.target.value);
});

// Vendor view toggle bindings
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.btn-vendor-view-toggle').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBtn = e.currentTarget;
            document.querySelectorAll('.btn-vendor-view-toggle').forEach(b => {
                b.classList.remove('active');
                b.style.background = 'transparent';
                b.style.color = 'var(--gray-500)';
                b.style.boxShadow = 'none';
            });
            targetBtn.classList.add('active');
            targetBtn.style.background = 'white';
            targetBtn.style.color = 'var(--blue-600)';
            targetBtn.style.boxShadow = '0 1px 2px rgb(0 0 0 / 0.05)';

            vendorViewMode = targetBtn.dataset.view;
            if (vendorViewMode === 'list') {
                document.getElementById('vendors-grid').style.display = 'none';
                document.getElementById('vendors-list').style.display = 'block';
            } else {
                document.getElementById('vendors-grid').style.display = 'grid';
                document.getElementById('vendors-list').style.display = 'none';
            }
        });
    });
});

// ---------- Purchases Page ----------
function renderPurchases(filter = '') {
    const tbody = document.getElementById('purchases-body');
    let filtered = PURCHASES;
    if (filter && filter !== 'all') {
        filtered = filtered.filter(p => p.status === filter);
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td style="font-weight:600; color: var(--blue-600);">${p.id}</td>
            <td>${p.date}</td>
            <td>${p.vendor}</td>
            <td style="font-weight:700;">${rp(p.total)}</td>
            <td>${rp(p.paid)}</td>
            <td>${p.type}</td>
            <td><span class="badge-status ${p.status}">${capitalize(p.status)}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Cetak PO" onclick="openModal('modal-print-po')">
                    <i data-lucide="printer" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit PO" onclick="openModal('modal-edit-purchase')">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Batalkan PO" onclick="openModal('modal-cancel-purchase')">
                    <i data-lucide="x-circle" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---------- Invoices Page ----------
function renderInvoices(filter = '') {
    const tbody = document.getElementById('invoices-body');
    if (!tbody) return;
    
    let filtered = INVOICES;
    if (filter && filter !== 'all') {
        filtered = filtered.filter(i => i.status === filter);
    }

    tbody.innerHTML = filtered.map(inv => `
        <tr>
            <td style="font-weight:600; color: var(--blue-600);">${inv.id}</td>
            <td>${inv.date}</td>
            <td>${inv.customer}</td>
            <td style="font-weight:700;">${rp(inv.total)}</td>
            <td>${rp(inv.paid)}</td>
            <td>${inv.type}</td>
            <td><span class="badge-status ${inv.status}">${capitalize(inv.status)}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Print Preview" onclick="openModal('modal-print-invoice')">
                    <i data-lucide="printer" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit Invoice" onclick="openModal('modal-edit-invoice')">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem; color: var(--rose-500);" title="Batalkan Invoice" onclick="openModal('modal-cancel-invoice')">
                    <i data-lucide="x-circle" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                ${inv.status !== 'lunas' ? `<button class="btn-toolbar primary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="openModal('modal-payment')">Bayar</button>` : ''}
            </td>
        </tr>
    `).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---------- Piutang Page ----------
function renderPiutang(filter = '') {
    // Summary
    const piutangInvoices = INVOICES.filter(i => i.status !== 'lunas');
    const totalPiutang = piutangInvoices.reduce((s, i) => s + (i.total - i.paid), 0);
    const belumBayar = INVOICES.filter(i => i.status === 'belum').reduce((s, i) => s + i.total, 0);
    const sebagian = INVOICES.filter(i => i.status === 'sebagian').reduce((s, i) => s + (i.total - i.paid), 0);

    document.getElementById('piutang-summary').innerHTML = `
        <div class="finance-summary-card highlight">
            <div class="fs-value">${rp(totalPiutang)}</div>
            <div class="fs-label">Total Piutang</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value" style="color: var(--rose-500);">${rp(belumBayar)}</div>
            <div class="fs-label">Belum Dibayar</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value" style="color: var(--amber-500);">${rp(sebagian)}</div>
            <div class="fs-label">Dibayar Sebagian</div>
        </div>
    `;

    // Table
    const tbody = document.getElementById('piutang-body');
    let filtered = INVOICES.filter(i => i.type === 'Tempo' || i.type === 'DP');
    if (filter && filter !== 'all') {
        filtered = filtered.filter(i => i.status === filter);
    }

    tbody.innerHTML = filtered.map(inv => {
        const sisa = inv.total - inv.paid;
        return `
            <tr>
                <td style="font-weight:600; color: var(--blue-600);">${inv.id}</td>
                <td>${inv.customer}</td>
                <td style="font-weight:700;">${rp(inv.total)}</td>
                <td>${rp(inv.paid)}</td>
                <td style="font-weight:700; color: ${sisa > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'};">${rp(sisa)}</td>
                <td>${inv.dueDate}</td>
                <td><span class="badge-status ${inv.status}">${capitalize(inv.status)}</span></td>
                <td>${inv.status !== 'lunas' ? `<button class="btn-toolbar primary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openModal('modal-payment')">Input Bayar</button>` : '—'}</td>
            </tr>
        `;
    }).join('');
}

// ---------- Hutang Page ----------
function renderHutang(filter = '') {
    const totalHutang = VENDORS.reduce((s, v) => s + v.debt, 0);
    const vendorsWithDebt = VENDORS.filter(v => v.debt > 0);

    document.getElementById('hutang-summary').innerHTML = `
        <div class="finance-summary-card highlight">
            <div class="fs-value">${rp(totalHutang)}</div>
            <div class="fs-label">Total Hutang</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value">${vendorsWithDebt.length}</div>
            <div class="fs-label">Vendor Belum Lunas</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value">${VENDORS.length - vendorsWithDebt.length}</div>
            <div class="fs-label">Vendor Lunas</div>
        </div>
    `;

    // Convert purchases to hutang rows
    const tbody = document.getElementById('hutang-body');
    let purchaseData = PURCHASES.filter(p => p.paid < p.total);
    if (filter === 'lunas') {
        purchaseData = PURCHASES.filter(p => p.paid >= p.total);
    } else if (filter === 'belum') {
        purchaseData = PURCHASES.filter(p => p.paid < p.total);
    }

    tbody.innerHTML = purchaseData.map(p => {
        const sisa = p.total - p.paid;
        const st = sisa > 0 ? 'belum' : 'lunas';
        return `
            <tr>
                <td style="font-weight:600; color: var(--blue-600);">${p.id}</td>
                <td>${p.vendor}</td>
                <td style="font-weight:700;">${rp(p.total)}</td>
                <td>${rp(p.paid)}</td>
                <td style="font-weight:700; color: ${sisa > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'};">${rp(sisa)}</td>
                <td>${p.date}</td>
                <td><span class="badge-status ${st}">${sisa > 0 ? 'Belum Lunas' : 'Lunas'}</span></td>
                <td>${sisa > 0 ? `<button class="btn-toolbar primary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openModal('modal-payment')">Bayar</button>` : '—'}</td>
            </tr>
        `;
    }).join('');
}

// ---------- Cash Flow Page ----------
function renderCashFlow(filter = '') {
    const totalIn = CASH_TRANSACTIONS.filter(t => t.type === 'IN').reduce((s, t) => s + t.amount, 0);
    const totalOut = CASH_TRANSACTIONS.filter(t => t.type === 'OUT').reduce((s, t) => s + t.amount, 0);
    const net = totalIn - totalOut;

    document.getElementById('cashflow-summary').innerHTML = `
        <div class="finance-summary-card">
            <div class="fs-value" style="color: var(--emerald-500);">${rp(totalIn)}</div>
            <div class="fs-label">Total Kas Masuk</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value" style="color: var(--rose-500);">${rp(totalOut)}</div>
            <div class="fs-label">Total Kas Keluar</div>
        </div>
        <div class="finance-summary-card highlight">
            <div class="fs-value">${rp(net)}</div>
            <div class="fs-label">Saldo Bersih</div>
        </div>
    `;

    const tbody = document.getElementById('cashflow-body');
    let filtered = CASH_TRANSACTIONS;
    if (filter === 'in') filtered = filtered.filter(t => t.type === 'IN');
    if (filter === 'out') filtered = filtered.filter(t => t.type === 'OUT');

    tbody.innerHTML = filtered.map(t => `
        <tr>
            <td>${t.date}</td>
            <td style="font-weight:600;">${t.desc}</td>
            <td><span class="badge-status ${t.category === 'Penjualan' || t.category === 'Piutang' ? 'lunas' : 'tempo'}">${t.category}</span></td>
            <td><span class="badge-status ${t.type.toLowerCase()}">${t.type === 'IN' ? '↑ Masuk' : '↓ Keluar'}</span></td>
            <td style="font-weight:700; color: ${t.type === 'IN' ? 'var(--emerald-500)' : 'var(--rose-500)'};">${t.type === 'IN' ? '+' : '-'}${rp(t.amount)}</td>
            <td>${t.method}</td>
        </tr>
    `).join('');
}

// ---------- Profit & Loss Page ----------
function renderProfitLoss() {
    const pendapatan = 43050000;
    const hpp = 27100000;
    const labaKotor = pendapatan - hpp;
    const bebanOperasional = 8500000;
    const bebanSewa = 5000000;
    const bebanListrik = 2500000;
    const totalBeban = bebanOperasional + bebanSewa + bebanListrik;
    const labaBersih = labaKotor - totalBeban;

    document.getElementById('pl-summary').innerHTML = `
        <div class="finance-summary-card">
            <div class="fs-value">${rp(pendapatan)}</div>
            <div class="fs-label">Total Pendapatan</div>
        </div>
        <div class="finance-summary-card">
            <div class="fs-value" style="color: var(--rose-500);">${rp(totalBeban + hpp)}</div>
            <div class="fs-label">Total Beban & HPP</div>
        </div>
        <div class="finance-summary-card highlight">
            <div class="fs-value">${rp(labaBersih)}</div>
            <div class="fs-label">Laba Bersih</div>
        </div>
    `;

    document.getElementById('pl-breakdown').innerHTML = `
        <div class="finance-breakdown-header"><h3>Laporan Laba Rugi — Juni 2026</h3></div>
        <div class="finance-breakdown-row"><span class="fb-label"><strong>Pendapatan Penjualan</strong></span><span class="fb-value">${rp(pendapatan)}</span></div>
        <div class="finance-breakdown-row indent"><span class="fb-label">Harga Pokok Penjualan (HPP)</span><span class="fb-value" style="color:var(--rose-500);">(${rp(hpp)})</span></div>
        <div class="finance-breakdown-row total"><span class="fb-label">Laba Kotor</span><span class="fb-value">${rp(labaKotor)}</span></div>
        <div class="finance-breakdown-row"><span class="fb-label"><strong>Beban Operasional</strong></span><span class="fb-value"></span></div>
        <div class="finance-breakdown-row indent"><span class="fb-label">Gaji Karyawan</span><span class="fb-value" style="color:var(--rose-500);">(${rp(bebanOperasional)})</span></div>
        <div class="finance-breakdown-row indent"><span class="fb-label">Sewa Gudang</span><span class="fb-value" style="color:var(--rose-500);">(${rp(bebanSewa)})</span></div>
        <div class="finance-breakdown-row indent"><span class="fb-label">Listrik & Utilitas</span><span class="fb-value" style="color:var(--rose-500);">(${rp(bebanListrik)})</span></div>
        <div class="finance-breakdown-row total"><span class="fb-label">Total Beban Operasional</span><span class="fb-value" style="color:var(--rose-500);">(${rp(totalBeban)})</span></div>
        <div class="finance-breakdown-row profit"><span class="fb-label"><strong>Laba Bersih</strong></span><span class="fb-value"><strong>${rp(labaBersih)}</strong></span></div>
    `;
}

// ---------- Balance Sheet Page ----------
function renderBalance() {
    const kas = 15850000;
    const piutang = 19250000;
    const persediaan = PRODUCTS.reduce((s, p) => s + p.cost * p.stock, 0);
    const totalAset = kas + piutang + persediaan;

    const hutangUsaha = 25200000;
    const hutangLain = 0;
    const totalLiabilitas = hutangUsaha + hutangLain;

    const ekuitas = totalAset - totalLiabilitas;

    const content = document.getElementById('balance-content');
    content.innerHTML = `
        <div class="finance-breakdown">
            <div class="finance-breakdown-header"><h3>Aset</h3></div>
            <div class="finance-breakdown-row"><span class="fb-label"><strong>Aset Lancar</strong></span><span class="fb-value"></span></div>
            <div class="finance-breakdown-row indent"><span class="fb-label">Kas & Bank</span><span class="fb-value">${rp(kas)}</span></div>
            <div class="finance-breakdown-row indent"><span class="fb-label">Piutang Usaha</span><span class="fb-value">${rp(piutang)}</span></div>
            <div class="finance-breakdown-row indent"><span class="fb-label">Persediaan Barang</span><span class="fb-value">${rp(persediaan)}</span></div>
            <div class="finance-breakdown-row total"><span class="fb-label">Total Aset</span><span class="fb-value"><strong>${rp(totalAset)}</strong></span></div>
        </div>
        <div>
            <div class="finance-breakdown" style="margin-bottom: 1.25rem;">
                <div class="finance-breakdown-header"><h3>Liabilitas</h3></div>
                <div class="finance-breakdown-row"><span class="fb-label"><strong>Kewajiban Lancar</strong></span><span class="fb-value"></span></div>
                <div class="finance-breakdown-row indent"><span class="fb-label">Hutang Usaha</span><span class="fb-value">${rp(hutangUsaha)}</span></div>
                <div class="finance-breakdown-row indent"><span class="fb-label">Hutang Lain-lain</span><span class="fb-value">${rp(hutangLain)}</span></div>
                <div class="finance-breakdown-row total"><span class="fb-label">Total Liabilitas</span><span class="fb-value"><strong>${rp(totalLiabilitas)}</strong></span></div>
            </div>
            <div class="finance-breakdown">
                <div class="finance-breakdown-header"><h3>Ekuitas</h3></div>
                <div class="finance-breakdown-row"><span class="fb-label">Modal Pemilik</span><span class="fb-value">${rp(ekuitas - 950000)}</span></div>
                <div class="finance-breakdown-row"><span class="fb-label">Laba Ditahan</span><span class="fb-value">${rp(950000)}</span></div>
                <div class="finance-breakdown-row profit"><span class="fb-label"><strong>Total Ekuitas</strong></span><span class="fb-value"><strong>${rp(ekuitas)}</strong></span></div>
            </div>
        </div>
    `;
}

// ---------- Reports Page ----------
function renderReports() {
    // Insight cards
    document.getElementById('report-insights').innerHTML = `
        <div class="insight-card">
            <div class="insight-card-title"><i data-lucide="trending-up"></i> Rata-rata Penjualan/Hari</div>
            <div class="insight-card-value">${rpShort(6150000)}</div>
            <div class="insight-card-desc">Berdasarkan data 7 hari terakhir</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-title"><i data-lucide="receipt"></i> Rata-rata Nilai Invoice</div>
            <div class="insight-card-value">${rpShort(4305000)}</div>
            <div class="insight-card-desc">Dari ${INVOICES.length} invoice bulan ini</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-title"><i data-lucide="percent"></i> Margin Rata-rata</div>
            <div class="insight-card-value">28.3%</div>
            <div class="insight-card-desc">Laba kotor dibanding omzet</div>
        </div>
        <div class="insight-card">
            <div class="insight-card-title"><i data-lucide="users"></i> Customer Retention</div>
            <div class="insight-card-value">87%</div>
            <div class="insight-card-desc">Pelanggan yang repeat order</div>
        </div>
    `;

    // Top products horizontal bar chart
    const topProducts = [
        { name: 'Kopi Arabica 250g', value: 8500000 },
        { name: 'Susu UHT 1L (karton)', value: 6200000 },
        { name: 'Mie Instan Goreng (dus)', value: 5750000 },
        { name: 'Air Mineral 600ml (dus)', value: 4100000 },
        { name: 'Beras Premium 5kg', value: 3800000 },
    ];
    const maxProd = topProducts[0].value;

    document.getElementById('top-products-chart').innerHTML = topProducts.map(p => {
        const pct = (p.value / maxProd) * 100;
        return `
            <div class="hbar-item">
                <span class="hbar-label">${p.name}</span>
                <div class="hbar-track">
                    <div class="hbar-fill" style="width: ${pct}%;">
                        <span class="hbar-fill-text">${pct >= 30 ? rpShort(p.value) : ''}</span>
                    </div>
                </div>
                <span class="hbar-value">${rpShort(p.value)}</span>
            </div>
        `;
    }).join('');

    // Top customers rank list
    const topCustomers = [
        { name: 'Minimarket Jaya Abadi', value: 'Rp 67.8jt' },
        { name: 'Kafe Nusantara', value: 'Rp 45.2jt' },
        { name: 'Toko Berkah Jaya', value: 'Rp 28.5jt' },
        { name: 'Toko Makmur Sentosa', value: 'Rp 18.9jt' },
        { name: 'Kedai Kopi Pagi', value: 'Rp 12.3jt' },
    ];

    document.getElementById('top-customers-list').innerHTML = topCustomers.map((c, i) => `
        <li class="insight-rank-item">
            <span class="insight-rank-num">${i + 1}</span>
            <span class="insight-rank-name">${c.name}</span>
            <span class="insight-rank-value">${c.value}</span>
        </li>
    `).join('');
}

// ---------- POS / Kasir ----------
let cart = [];
let currentPpnRate = 11;

function renderPOSProducts(searchTerm = '', category = '') {
    const grid = document.getElementById('pos-product-grid');
    let filtered = PRODUCTS;
    if (searchTerm) {
        const q = searchTerm.toLowerCase();
        filtered = filtered.filter(p => p.name.toLowerCase().includes(q));
    }
    if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category === category);
    }

    grid.innerHTML = filtered.map(p => `
        <div class="pos-product-card" onclick="addToCart('${p.id}')">
            <div class="pos-product-emoji">${p.emoji}</div>
            <div class="pos-product-name">${p.name}</div>
            <div class="pos-product-price">${rp(p.price)}</div>
            <div class="pos-product-stock">Stok: ${p.stock} ${p.unit}</div>
        </div>
    `).join('');
}

function addToCart(productId) {
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;

    const existing = cart.find(c => c.id === productId);
    if (existing) {
        existing.qty += 1;
    } else {
        cart.push({ ...product, qty: 1 });
    }
    renderCart();
}

function updateCartQty(productId, delta) {
    const item = cart.find(c => c.id === productId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
        cart = cart.filter(c => c.id !== productId);
    }
    renderCart();
}

function removeFromCart(productId) {
    cart = cart.filter(c => c.id !== productId);
    renderCart();
}

function renderCart() {
    const container = document.getElementById('pos-cart-items');
    const emptyState = document.getElementById('cart-empty');
    const countEl = document.getElementById('cart-count');
    
    countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);

    if (cart.length === 0) {
        container.innerHTML = `<div class="empty-state" id="cart-empty"><i data-lucide="shopping-bag"></i><p>Keranjang masih kosong</p></div>`;
        document.getElementById('cart-subtotal').textContent = 'Rp 0';
        document.getElementById('cart-discount').textContent = 'Rp 0';
        const ppnEl = document.getElementById('cart-ppn');
        if (ppnEl) ppnEl.textContent = 'Rp 0';
        document.getElementById('cart-total').textContent = 'Rp 0';
        lucide.createIcons();
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.emoji} ${item.name}</div>
                <div class="cart-item-price">${rp(item.price)} / ${item.unit}</div>
            </div>
            <div class="cart-item-qty">
                <button class="cart-qty-btn" onclick="updateCartQty('${item.id}', -1)">−</button>
                <span class="cart-qty-val">${item.qty}</span>
                <button class="cart-qty-btn" onclick="updateCartQty('${item.id}', 1)">+</button>
            </div>
            <div class="cart-item-total">${rp(item.price * item.qty)}</div>
            <button class="cart-item-remove" onclick="removeFromCart('${item.id}')"><i data-lucide="trash-2"></i></button>
        </div>
    `).join('');

    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const discount = 0; // if there is discount logic
    const afterDiscount = subtotal - discount;
    const ppnAmount = afterDiscount * (currentPpnRate / 100);
    const total = afterDiscount + ppnAmount;
    
    document.getElementById('cart-subtotal').textContent = rp(subtotal);
    document.getElementById('cart-discount').textContent = 'Rp 0';
    
    const ppnEl = document.getElementById('cart-ppn');
    const ppnLabelEl = document.getElementById('cart-ppn-label');
    if (ppnEl) ppnEl.textContent = rp(ppnAmount);
    if (ppnLabelEl) ppnLabelEl.textContent = `(${currentPpnRate}%)`;
    
    document.getElementById('cart-total').textContent = rp(total);

    lucide.createIcons();
}

// Settings PPN binding
document.getElementById('settings-ppn')?.addEventListener('input', (e) => {
    currentPpnRate = parseFloat(e.target.value) || 0;
    renderCart(); // re-calculate cart totals
});

// POS search
document.getElementById('pos-search')?.addEventListener('input', (e) => {
    const activeCat = document.querySelector('.pos-category-tab.active')?.dataset.cat || 'all';
    renderPOSProducts(e.target.value, activeCat);
});

// POS category tabs
document.getElementById('pos-category-tabs')?.addEventListener('click', (e) => {
    if (e.target.classList.contains('pos-category-tab')) {
        document.querySelectorAll('.pos-category-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        renderPOSProducts(document.getElementById('pos-search').value, e.target.dataset.cat);
    }
});

// Payment type buttons
document.querySelectorAll('.cart-payment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cart-payment-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    });
});

// Checkout
document.getElementById('btn-checkout')?.addEventListener('click', () => {
    if (cart.length === 0) return;
    openModal('modal-checkout-success');
    cart = [];
    renderCart();
});

// Populate customer select in POS
function populateCustomerSelect(filter = '') {
    const dropdown = document.getElementById('pos-customer-dropdown');
    if (!dropdown) return;
    
    let filtered = CUSTOMERS;
    if (filter) {
        const q = filter.toLowerCase();
        filtered = filtered.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
        dropdown.innerHTML = '<div style="padding: 0.75rem; color: var(--gray-400); text-align: center; font-size: 0.875rem;">Pelanggan tidak ditemukan</div>';
        return;
    }

    dropdown.innerHTML = filtered.map(c => `
        <div class="customer-dropdown-item" data-id="${c.id}" data-name="${c.name}" style="padding: 0.5rem 0.75rem; cursor: pointer; border-bottom: 1px solid var(--gray-100); display: flex; flex-direction: column; transition: background-color 0.2s;">
            <span style="font-weight: 500; font-size: 0.875rem;">${c.name}</span>
            <span style="font-size: 0.75rem; color: var(--gray-500);">${c.type} • ${c.phone}</span>
        </div>
    `).join('');

    // Add click listeners to items
    dropdown.querySelectorAll('.customer-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const name = e.currentTarget.dataset.name;
            document.getElementById('pos-customer-search').value = name;
            document.getElementById('pos-customer-id').value = id;
            dropdown.style.display = 'none';
        });
        
        // Add hover effect
        item.addEventListener('mouseenter', () => {
            item.style.backgroundColor = 'var(--gray-50)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.backgroundColor = 'transparent';
        });
    });
}

// POS Customer Search bindings
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('pos-customer-search');
    const dropdown = document.getElementById('pos-customer-dropdown');
    const toggle = document.getElementById('pos-customer-dropdown-toggle');
    
    if (searchInput && dropdown) {
        searchInput.addEventListener('focus', () => {
            populateCustomerSelect(searchInput.value);
            dropdown.style.display = 'block';
        });

        searchInput.addEventListener('input', (e) => {
            populateCustomerSelect(e.target.value);
            dropdown.style.display = 'block';
            document.getElementById('pos-customer-id').value = '';
        });

        toggle?.addEventListener('click', (e) => {
            e.stopPropagation();
            if (dropdown.style.display === 'block') {
                dropdown.style.display = 'none';
            } else {
                populateCustomerSelect(searchInput.value);
                dropdown.style.display = 'block';
                searchInput.focus();
            }
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.customer-search-wrapper')) {
                dropdown.style.display = 'none';
            }
        });
    }
});

// ---------- Tab Filter Bindings ----------
document.querySelectorAll('.tab-filters').forEach(filterGroup => {
    filterGroup.querySelectorAll('.tab-filter').forEach(btn => {
        btn.addEventListener('click', () => {
            filterGroup.querySelectorAll('.tab-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filter = btn.dataset.filter;

            // Determine which page this filter belongs to and re-render
            const section = filterGroup.closest('.page-section');
            if (!section) return;
            const pageId = section.id.replace('page-', '');

            switch (pageId) {
                case 'invoices': renderInvoices(filter); break;
                case 'piutang': renderPiutang(filter); break;
                case 'hutang': renderHutang(filter); break;
                case 'cashflow': renderCashFlow(filter); break;
                case 'purchases': renderPurchases(filter); break;
            }
        });
    });
});

// ---------- Utility ----------
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ---------- Initialize Everything ----------
function init() {
    renderDashboard();
    renderProducts();
    renderCustomers();
    renderVendors();
    renderPurchases();
    renderInvoices();
    renderPiutang();
    renderHutang();
    renderCashFlow();
    renderProfitLoss();
    renderBalance();
    renderReports();
    renderPOSProducts();
    populateCustomerSelect();

    // Initialize Lucide icons
    lucide.createIcons();
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
