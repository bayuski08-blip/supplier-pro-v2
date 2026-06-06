// ==========================================================================
// SupplierPro Dashboard — JavaScript
// ==========================================================================

// Auth check
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

// ==========================================================================
// TOAST NOTIFICATION SYSTEM
// ==========================================================================
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed;bottom:1.5rem;right:1.5rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    const colors = { success: '#10b981', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
    const icons  = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };
    toast.style.cssText = `background:${colors[type] || colors.success};color:white;padding:0.75rem 1.25rem;border-radius:0.75rem;font-size:0.875rem;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.15);display:flex;align-items:center;gap:0.5rem;min-width:200px;max-width:360px;transform:translateX(120%);transition:transform 0.3s ease;`;
    toast.innerHTML = `<span style="font-size:1rem;">${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.transform = 'translateX(120%)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// PO Item Management
function addPurchaseItemRow(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    const prefix = containerId.startsWith('edit') ? 'edit' : 'add';
    const row = document.createElement('div');
    row.className = `form-row ${prefix}-purchase-item`;
    row.style.marginBottom = '0.5rem';
    
    const productOptions = PRODUCTS.map(p => `<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`).join('');
    
    row.innerHTML = `
        <div class="form-group" style="flex: 2;">
            <select class="form-input item-product">
                <option value="" disabled selected>Pilih Produk...</option>
                ${productOptions}
            </select>
        </div>
        <div class="form-group" style="flex: 1;">
            <input type="number" class="form-input item-qty" placeholder="Qty">
        </div>
        <div class="form-group" style="flex: 1.5;">
            <input type="number" class="form-input item-price" placeholder="Harga Beli">
        </div>
        <div class="form-group" style="flex: 0.5;">
            <button type="button" class="btn-toolbar secondary" style="color:var(--rose-600);" onclick="this.parentElement.parentElement.remove()">
                <i data-lucide="x" style="width:14px; height:14px;"></i>
            </button>
        </div>
    `;
    container.appendChild(row);
    if (window.lucide) lucide.createIcons();
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

// ---------- Dynamic Data ----------
let PRODUCTS = [];
let CUSTOMERS = [];
let VENDORS = [];

let INVOICES = [];
let PURCHASES = [];
let CASH_TRANSACTIONS = [];
let USERS = [];

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
    'master-data': { title: 'Master Data', subtitle: 'Kelola kategori, satuan, dan tipe pembayaran' },
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
let DASHBOARD_SUMMARY = null;

async function fetchDashboardSummary() {
    try {
        const res = await fetch('/api/dashboard/summary', { headers: getAuthHeaders() });
        if (res.ok) {
            DASHBOARD_SUMMARY = await res.json();
        }
    } catch (err) {
        console.error('Failed to fetch dashboard summary', err);
    }
}

function renderDashboard() {
    renderSummaryCards();
    renderSalesChart();
    renderDonutChart();
    renderRecentTransactions();
    renderLowStock();
}

function renderSummaryCards() {
    // Prioritize fetched API summary, fallback to computed values from loaded arrays
    const totalOmzet = DASHBOARD_SUMMARY?.revenue ?? INVOICES.filter(i => i.status.toLowerCase() !== 'batal').reduce((s, i) => s + i.total, 0);
    const totalPiutang = DASHBOARD_SUMMARY?.receivables ?? INVOICES.filter(i => i.status.toLowerCase() !== 'lunas' && i.status.toLowerCase() !== 'batal').reduce((s, i) => s + (i.total - i.paid), 0);
    const totalHutang = DASHBOARD_SUMMARY?.payables ?? PURCHASES.filter(p => p.status.toLowerCase() !== 'selesai' && p.status.toLowerCase() !== 'batal').reduce((s, p) => s + (p.total - p.paid), 0);
    const lowStockCount = DASHBOARD_SUMMARY?.lowStockCount ?? PRODUCTS.filter(p => p.stock <= p.minStock).length;
    const labaKotor = DASHBOARD_SUMMARY?.grossProfit ?? (totalOmzet * 0.28);
    const ordersToday = DASHBOARD_SUMMARY?.ordersToday ?? (() => {
        const today = new Date().toISOString().split('T')[0];
        return INVOICES.filter(i => (i.date || '').startsWith(today) && i.status.toLowerCase() !== 'batal').length;
    })();
    const activeCustomers = DASHBOARD_SUMMARY?.customerCount ?? CUSTOMERS.length;
    const totalProducts = DASHBOARD_SUMMARY?.productCount ?? PRODUCTS.length;

    const cards = [
        { label: 'Omzet Bulan Ini', value: rpShort(totalOmzet), trend: 'Total penjualan', trendDir: 'up', icon: 'trending-up', color: 'blue' },
        { label: 'Total Piutang', value: rpShort(totalPiutang), trend: totalPiutang > 0 ? 'Belum terbayar' : 'Semua lunas', trendDir: totalPiutang > 0 ? 'down' : 'up', icon: 'hand-coins', color: 'amber' },
        { label: 'Total Hutang', value: rpShort(totalHutang), trend: totalHutang > 0 ? 'Ke vendor' : 'Semua lunas', trendDir: totalHutang > 0 ? 'down' : 'up', icon: 'landmark', color: 'rose' },
        { label: 'Stok Menipis', value: lowStockCount + ' produk', trend: lowStockCount > 0 ? 'Perlu restock' : 'Stok aman', trendDir: lowStockCount > 0 ? 'down' : 'up', icon: 'alert-triangle', color: 'orange' },
        { label: 'Laba Kotor', value: rpShort(labaKotor), trend: labaKotor >= 0 ? 'Revenue - HPP' : 'Rugi', trendDir: labaKotor >= 0 ? 'up' : 'down', icon: 'wallet', color: 'emerald' },
        { label: 'Order Hari Ini', value: ordersToday + ' transaksi', trend: 'Hari ini', trendDir: 'up', icon: 'shopping-cart', color: 'indigo' },
        { label: 'Pelanggan Aktif', value: activeCustomers + ' pelanggan', trend: 'Terdaftar', trendDir: 'up', icon: 'users', color: 'violet' },
        { label: 'Produk Terdaftar', value: totalProducts + ' produk', trend: 'Katalog', trendDir: 'up', icon: 'package', color: 'cyan' },
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
                <td style="font-weight:700;">${p.stock}</td>
                <td>${p.unit}</td>
                <td>${p.minStock}</td>
                <td><span class="badge-status ${stockStatus}">${stockLabel}</span></td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit Produk" onclick="openEditProductModal('${p.id}')">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem; color: var(--blue-600);" title="Stock Opname" onclick="openStockOpnameModal('${p.id}')">
                        <i data-lucide="boxes" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Hapus Produk" onclick="deleteProduct('${p.id}')">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    if (window.lucide) lucide.createIcons();
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
            <button class="btn-toolbar secondary" style="position: absolute; top: 1rem; right: 1rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Pelanggan" onclick="openEditCustomerModal('${c.id}')">
                <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
            </button>
            <button class="btn-toolbar secondary" style="position: absolute; top: 1rem; right: 3rem; padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Hapus Pelanggan" onclick="deleteCustomer('${c.id}')">
                <i data-lucide="trash-2" style="width: 14px; height: 14px; margin: 0;"></i>
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
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Pelanggan" onclick="openEditCustomerModal('${c.id}')">
                        <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                    </button>
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Hapus Pelanggan" onclick="deleteCustomer('${c.id}')">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px; margin: 0;"></i>
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
            <button class="btn-toolbar secondary" style="position: absolute; top: 1rem; right: 1rem; padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Vendor" onclick="openEditVendorModal('${v.id}')">
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
                    <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;" title="Edit Vendor" onclick="openEditVendorModal('${v.id}')">
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
    if (!filter || typeof filter !== 'string') {
        const sel = document.getElementById('purchase-status-filter');
        filter = sel ? sel.value : 'all';
    }
    const tbody = document.getElementById('purchases-body');
    let filtered = PURCHASES;
    if (filter && filter !== 'all') {
        filtered = filtered.filter(p => p.status.toLowerCase() === filter);
    }
    const searchEl = document.getElementById('purchase-search');
    if (searchEl && searchEl.value) {
        const q = searchEl.value.toLowerCase();
        filtered = filtered.filter(p => 
            p.id.toLowerCase().includes(q) || 
            (p.vendor && p.vendor.toLowerCase().includes(q))
        );
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td style="font-weight:600; color: var(--blue-600);">${p.id}</td>
            <td>${p.date}</td>
            <td>${p.vendor}</td>
            <td style="font-weight:700;">${rp(p.total)}</td>
            <td>${rp(p.paid)}</td>
            <td>${p.type}</td>
            <td><span class="badge-status ${p.status.toLowerCase()}">${capitalize(p.status)}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Cetak PO" onclick="openModal('modal-print-po')">
                    <i data-lucide="printer" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit PO" onclick="openEditPurchaseModal('${p.id}')">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                ${p.status.toLowerCase() !== 'batal' ? `<button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-500);" title="Batalkan PO" onclick="cancelPurchase('${p.id}')">
                    <i data-lucide="x-circle" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>` : ''}
            </td>
        </tr>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---------- Invoices Page ----------
function renderInvoices(filter = '') {
    if (!filter || typeof filter !== 'string') {
        const sel = document.getElementById('invoice-status-filter');
        filter = sel ? sel.value : 'all';
    }
    const tbody = document.getElementById('invoices-body');
    if (!tbody) return;
    
    let filtered = INVOICES;
    if (filter && filter !== 'all') {
        filtered = filtered.filter(i => i.status.toLowerCase() === filter);
    }
    const searchEl = document.getElementById('invoice-search');
    if (searchEl && searchEl.value) {
        const q = searchEl.value.toLowerCase();
        filtered = filtered.filter(i => 
            i.id.toLowerCase().includes(q) || 
            (i.customer && i.customer.toLowerCase().includes(q))
        );
    }

    tbody.innerHTML = filtered.map(inv => {
        const statusLower = (inv.status || '').toLowerCase();
        return `
        <tr>
            <td style="font-weight:600; color: var(--blue-600);">${inv.id}</td>
            <td>${inv.date}</td>
            <td>${inv.customer}</td>
            <td style="font-weight:700;">${rp(inv.total)}</td>
            <td>${rp(inv.paid)}</td>
            <td>${inv.type}</td>
            <td><span class="badge-status ${statusLower}">${capitalize(inv.status || 'belum')}</span></td>
            <td style="text-align: right; white-space: nowrap;">
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Print Preview" onclick="openModal('modal-print-invoice')">
                    <i data-lucide="printer" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" title="Edit Invoice" onclick="openEditInvoiceModal('${inv.id}')">
                    <i data-lucide="edit-2" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>
                ${statusLower !== 'batal' ? `<button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem; color: var(--rose-500);" title="Batalkan Invoice" onclick="cancelInvoice('${inv.id}')">
                    <i data-lucide="x-circle" style="width: 14px; height: 14px; margin: 0;"></i>
                </button>` : ''}
                ${statusLower !== 'lunas' && statusLower !== 'batal' ? `<button class="btn-toolbar primary" style="padding:0.25rem 0.5rem; font-size:0.75rem;" onclick="openPiutangPaymentModal('${inv.id}', ${inv.total - inv.paid})">Bayar</button>` : ''}
            </td>
        </tr>
    `}).join('');
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ---------- Piutang Page ----------
function renderPiutang(filter = '') {
    if (!filter || typeof filter !== 'string') {
        const sel = document.getElementById('piutang-status-filter');
        filter = sel ? sel.value : 'all';
    }
    // Summary
    const piutangInvoices = INVOICES.filter(i => i.status.toLowerCase() !== 'lunas');
    const totalPiutang = piutangInvoices.reduce((s, i) => s + (i.total - i.paid), 0);
    const belumBayar = INVOICES.filter(i => i.status.toLowerCase() === 'belum').reduce((s, i) => s + i.total, 0);
    const sebagian = INVOICES.filter(i => i.status.toLowerCase() === 'sebagian').reduce((s, i) => s + (i.total - i.paid), 0);

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
    // Show all invoices that are not "Lunas" or "Batal"
    let filtered = INVOICES.filter(i => i.status.toLowerCase() !== 'lunas' && i.status.toLowerCase() !== 'batal');
    if (filter && filter !== 'all') {
        filtered = filtered.filter(i => i.status.toLowerCase() === filter);
    }
    const searchEl = document.getElementById('piutang-search');
    if (searchEl && searchEl.value) {
        const q = searchEl.value.toLowerCase();
        filtered = filtered.filter(i => 
            i.id.toLowerCase().includes(q) || 
            (i.customer && i.customer.toLowerCase().includes(q))
        );
    }

    tbody.innerHTML = filtered.map(inv => {
        const sisa = inv.total - inv.paid;
        return `
            <tr>
                <td style="font-weight:600; color: var(--blue-600);">${inv.id}</td>
                <td>${inv.customer}</td>
                <td style="font-weight:700;">${rp(inv.total)}</td>
                <td>${rp(inv.paid)}</td>
                <td style="font-weight:700; color: ${sisa > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'}">${rp(sisa)}</td>
                <td>${inv.dueDate}</td>
                <td><span class="badge-status ${inv.status.toLowerCase()}">${capitalize(inv.status)}</span></td>
                <td>${inv.status.toLowerCase() !== 'lunas' ? `<button class="btn-toolbar primary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openPiutangPaymentModal('${inv.id}', ${sisa})">Input Bayar</button>` : '—'}</td>
            </tr>
        `;
    }).join('');
}

// ---------- Hutang Page ----------
function renderHutang(filter = '') {
    if (!filter || typeof filter !== 'string') {
        const sel = document.getElementById('hutang-status-filter');
        filter = sel ? sel.value : 'all';
    }
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
    let purchaseData = PURCHASES;
    if (filter === 'lunas') {
        purchaseData = PURCHASES.filter(p => p.paid >= p.total);
    } else if (filter === 'belum') {
        purchaseData = PURCHASES.filter(p => p.paid < p.total);
    }
    const searchEl = document.getElementById('hutang-search');
    if (searchEl && searchEl.value) {
        const q = searchEl.value.toLowerCase();
        purchaseData = purchaseData.filter(p => 
            p.id.toLowerCase().includes(q) || 
            (p.vendor && p.vendor.toLowerCase().includes(q))
        );
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
                <td style="font-weight:700; color: ${sisa > 0 ? 'var(--rose-500)' : 'var(--emerald-500)'}">${rp(sisa)}</td>
                <td>${p.date}</td>
                <td><span class="badge-status ${st}">${sisa > 0 ? 'Belum Lunas' : 'Lunas'}</span></td>
                <td>${sisa > 0 ? `<button class="btn-toolbar primary" style="padding:0.3rem 0.65rem; font-size:0.75rem;" onclick="openHutangPaymentModal('${p.id}', ${sisa})">Bayar</button>` : '—'}</td>
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
                <div class="cart-item-price-edit" style="display:flex; align-items:center; gap:0.25rem;">
                    <span style="font-size:0.75rem; color:var(--gray-500);">Rp</span>
                    <input type="number" value="${item.price}" onchange="updateCartPrice('${item.id}', this.value)" style="width:70px; padding:0.1rem 0.25rem; font-size:0.875rem; border:1px solid var(--gray-200); border-radius:0.25rem;" />
                    <span style="font-size:0.75rem; color:var(--gray-500);">/ ${item.unit}</span>
                </div>
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

    window.updateCartPrice = (id, newPrice) => {
        const item = cart.find(c => c.id === id);
        if (item) {
            item.price = parseFloat(newPrice) || 0;
            renderCart();
        }
    };

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
document.getElementById('btn-checkout')?.addEventListener('click', async () => {
    if (cart.length === 0) return;
    
    const customerId = document.getElementById('pos-customer-id').value;
    if (!customerId) {
        showToast('Silakan pilih pelanggan terlebih dahulu.', 'warning');
        return;
    }
    
    const paymentTypeSelect = document.getElementById('cart-payment-type');
    const payment_type_id = paymentTypeSelect ? paymentTypeSelect.value : 'PT-1';
    const payTypeName = getPaymentTypeName(paymentTypeSelect).toLowerCase();
    // Let's deduce payTypeStr from payment_type_id or payTypeName to know if it's DP or Tempo/Credit
    let payTypeStr = 'tunai';
    if (payment_type_id === 'PT-2' || payTypeName.includes('tempo') || payTypeName.includes('credit')) {
        payTypeStr = 'tempo';
    } else if (payment_type_id === 'PT-3' || payTypeName.includes('dp')) {
        payTypeStr = 'dp';
    }
    
    const subtotal = cart.reduce((s, c) => s + c.price * c.qty, 0);
    const ppnAmount = subtotal * (currentPpnRate / 100);
    const total = subtotal + ppnAmount;
    
    let paid = total;
    if (payTypeStr === 'tempo') {
        paid = 0;
    } else if (payTypeStr === 'dp') {
        const dpPrompt = prompt(`Total belanja: ${rp(total)}. Masukkan jumlah uang muka (DP):`, (total / 2).toString());
        if (dpPrompt === null) return;
        paid = parseFloat(dpPrompt) || 0;
    }
    
    const payload = {
        customer_id: customerId,
        total: total,
        paid: paid,
        payment_type_id: payment_type_id,
        due_date: calculateDueDate(getPaymentTypeName(paymentTypeSelect), new Date().toISOString()),
        items: cart.map(item => ({
            id: item.id,
            quantity: item.qty,
            price: item.price
        }))
    };
    
    try {
        const res = await fetch('/api/invoices', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            const successDesc = document.querySelector('#modal-checkout-success p');
            if (successDesc) successDesc.textContent = `Invoice ${result.invoiceId} telah dicatat. Stok produk telah diperbarui secara otomatis.`;
            openModal('modal-checkout-success');
            cart = [];
            document.getElementById('pos-customer-id').value = '';
            document.getElementById('pos-customer-search').value = '';
            renderCart();
            await fetchProducts();
            renderPOSProducts(); // Fix: Update POS product list to reflect new stock
            await fetchInvoices();
            await fetchCashTransactions();
            await renderDashboard();
        } else {
            alert('Gagal membuat invoice: ' + (result.error || 'Terjadi kesalahan'));
        }
    } catch(err) {
        console.error(err);
        alert('Gagal menghubungi server');
    }
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

function calculateDueDate(paymentTypeName, transactionDateStr) {
    if (!paymentTypeName || !paymentTypeName.toLowerCase().includes('credit')) return '';
    const match = paymentTypeName.match(/credit\s+(\d+)\s+hari/i);
    if (match && match[1]) {
        const days = parseInt(match[1], 10);
        const date = new Date(transactionDateStr);
        if (!isNaN(date.getTime())) {
            date.setDate(date.getDate() + days);
            return date.toISOString().split('T')[0];
        }
    }
    return '';
}

function getPaymentTypeName(selectElement) {
    if (!selectElement) return '';
    if (selectElement.options.length === 0) return '';
    return selectElement.options[selectElement.selectedIndex].text;
}

function onPurchasePaymentTypeChange(mode) {
    const typeSelect = document.getElementById(`${mode}-purchase-payment-type`);
    const dateInput = document.getElementById(`${mode}-purchase-date`);
    const dueDateGroup = document.getElementById(`${mode}-purchase-duedate-group`);
    const dueDateInput = document.getElementById(`${mode}-purchase-due-date`);
    
    if (!typeSelect || !dueDateGroup) return;
    
    const typeName = getPaymentTypeName(typeSelect);
    if (typeName.toLowerCase().includes('credit')) {
        dueDateGroup.style.display = 'block';
        if (dateInput && dateInput.value) {
            dueDateInput.value = calculateDueDate(typeName, dateInput.value);
        }
    } else {
        dueDateGroup.style.display = 'none';
        dueDateInput.value = '';
    }
}

// ---------- Initialize Everything ----------
async function init() {
    // Render empty placeholders while loading
    renderDashboard();
    renderProducts();
    renderCustomers();
    renderVendors();
    
    // Populate dropdowns and fetch all data from DB
    await populateMasterDropdowns();
    await Promise.all([
        fetchDashboardSummary(),
        fetchProducts(),
        fetchCustomers(),
        fetchVendors(),
        fetchPurchases(),
        fetchInvoices(),
        fetchCashTransactions(),
        fetchUsers(),
        loadPrefixSettings()
    ]);

    // Re-render dashboard with real DB data
    renderDashboard();
    renderInvoices();
    renderPiutang();
    renderHutang();
    renderCashFlow();
    renderProfitLoss();
    renderBalance();
    renderReports();
    renderPOSProducts();
    populateCustomerSelect();

    const btnAddPoItem = document.getElementById('btn-add-purchase-item');
    if (btnAddPoItem) btnAddPoItem.addEventListener('click', () => { if (window.addAddPurchaseItem) window.addAddPurchaseItem(); });

    // Recalculate PO due date when date inputs change
    document.getElementById('add-purchase-date')?.addEventListener('change', () => onPurchasePaymentTypeChange('add'));
    document.getElementById('edit-purchase-date')?.addEventListener('change', () => onPurchasePaymentTypeChange('edit'));
    
    // Edit item button is dynamically added with onclick in HTML, so we don't need to bind it here unless missing

    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}


// ---------- API Integrations ----------
const getAuthHeaders = () => ({
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
});

async function fetchProducts() {
    try {
        const res = await fetch('/api/products', { headers: getAuthHeaders() });
        const data = await res.json();
        PRODUCTS = data.map(p => ({
            id: p.id,
            sku: p.sku,
            name: p.name,
            category: p.category,
            category_id: p.category_id,
            cost: parseFloat(p.cost_price),
            price: parseFloat(p.sell_price),
            stock: p.stock,
            minStock: p.min_stock,
            unit: p.unit || p.badge || 'pcs',
            unit_id: p.unit_id,
            emoji: '📦'
        }));
        renderProducts(document.getElementById('product-search')?.value, document.getElementById('product-category-filter')?.value);
    } catch (err) {
        console.error('Failed to fetch products', err);
    }
}

async function saveProduct(isEdit) {
    const id = isEdit ? document.getElementById('edit-product-id').value : null;
    const prefix = isEdit ? 'edit' : 'add';

    const categoryEl = document.getElementById(`${prefix}-product-category`);
    // category_id is the value from the select (populated with name or id depending on master)
    const categoryValue = categoryEl ? categoryEl.value : '';

    const payload = {
        name: document.getElementById(`${prefix}-product-name`).value,
        sku: document.getElementById(`${prefix}-product-sku`).value,
        category_id: categoryValue,   // FIX: backend expects category_id not category
        cost_price: parseFloat(document.getElementById(`${prefix}-product-cost`).value) || 0,
        sell_price: parseFloat(document.getElementById(`${prefix}-product-price`).value) || 0,
        stock: isEdit ? parseInt(document.getElementById('edit-product-stock').value) || 0 : parseInt(document.getElementById('add-product-stock').value) || 0,
        min_stock: parseInt(document.getElementById(`${prefix}-product-minstock`).value) || 0,
        unit_id: isEdit ? document.getElementById('edit-product-unit').value : document.getElementById('add-product-unit').value,
        badge: isEdit ? document.getElementById('edit-product-unit').value : document.getElementById('add-product-unit').value
    };

    if (!payload.name || !payload.sku) {
        showToast('Nama produk dan SKU wajib diisi!', 'warning');
        return;
    }

    const url = isEdit ? `/api/products/${id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal(`modal-${isEdit ? 'edit' : 'add'}-product`);
            showToast(isEdit ? 'Produk berhasil diperbarui!' : 'Produk berhasil ditambahkan!', 'success');
            await fetchProducts();
        } else {
            const err = await res.json();
            showToast('Error: ' + (err.error || 'Gagal menyimpan produk'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

function openEditProductModal(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    document.getElementById('edit-product-id').value = p.id;
    document.getElementById('edit-product-name').value = p.name;
    document.getElementById('edit-product-sku').value = p.sku;
    // FIX: set category select — try both category_id and category name
    const catEl = document.getElementById('edit-product-category');
    if (catEl) {
        // Try setting by value (which is the name from master)
        catEl.value = p.category || '';
        if (!catEl.value && p.category_id) catEl.value = p.category_id;
    }
    document.getElementById('edit-product-cost').value = p.cost;
    document.getElementById('edit-product-price').value = p.price;
    document.getElementById('edit-product-stock').value = p.stock;
    document.getElementById('edit-product-minstock').value = p.minStock;
    const unitEl = document.getElementById('edit-product-unit');
    if (unitEl) unitEl.value = p.unit_id || p.unit || '';
    openModal('modal-edit-product');
}

// ==========================================================================
// STOCK OPNAME
// ==========================================================================
let stockOpnameProductId = null;

function openStockOpnameModal(id) {
    const p = PRODUCTS.find(x => x.id === id);
    if (!p) return;
    stockOpnameProductId = p.id;
    const nameEl = document.querySelector('#modal-stock-opname .form-group:nth-child(1) input');
    const stockEl = document.querySelector('#modal-stock-opname .form-row .form-group:first-child input');
    const actualEl = document.querySelector('#modal-stock-opname .form-row .form-group:last-child input');
    const noteEl  = document.querySelector('#modal-stock-opname textarea');
    if (nameEl)   nameEl.value  = p.name;
    if (stockEl)  stockEl.value = p.stock;
    if (actualEl) actualEl.value = '';
    if (noteEl)   noteEl.value   = '';
    openModal('modal-stock-opname');
}

async function submitStockOpname() {
    if (!stockOpnameProductId) return;
    const actualEl = document.querySelector('#modal-stock-opname .form-row .form-group:last-child input');
    const noteEl   = document.querySelector('#modal-stock-opname textarea');
    const actual   = parseInt(actualEl ? actualEl.value : '');
    if (isNaN(actual) || actual < 0) {
        showToast('Masukkan jumlah stok fisik yang valid!', 'warning');
        return;
    }
    const note = noteEl ? noteEl.value : '';
    try {
        const res = await fetch('/api/stock-adjust', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ product_id: stockOpnameProductId, actual_stock: actual, note })
        });
        if (res.ok) {
            closeModal('modal-stock-opname');
            showToast('Stok berhasil disesuaikan!', 'success');
            stockOpnameProductId = null;
            await fetchProducts();
        } else {
            const err = await res.json();
            showToast('Gagal: ' + (err.error || 'Terjadi kesalahan'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

async function deleteProduct(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    try {
        const res = await fetch(`/api/products/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            fetchProducts();
        } else {
            alert('Gagal menghapus produk');
        }
    } catch (err) {
        console.error(err);
    }
}

async function fetchCustomers() {
    try {
        const res = await fetch('/api/customers', { headers: getAuthHeaders() });
        const data = await res.json();
        CUSTOMERS = data.map(c => ({
            id: c.id,
            name: c.name,
            type: c.category_name || c.customer_category_id || c.type || '',
            categoryId: c.customer_category_id || '',
            phone: c.phone,
            city: c.city,
            creditLimit: parseFloat(c.credit_lmt) || 0,
            totalSpent: 0,
            totalOrders: 0,
            color: 'blue'
        }));
        renderCustomers(document.getElementById('customer-search')?.value, document.getElementById('customer-type-filter')?.value);
    } catch (err) {
        console.error('Failed to fetch customers', err);
    }
}

async function saveCustomer(isEdit) {
    const id = isEdit ? document.getElementById('edit-customer-id').value : null;
    const prefix = isEdit ? 'edit' : 'add';
    
    const payload = {
        name: document.getElementById(`${prefix}-customer-name`).value,
        customer_category_id: document.getElementById(`${prefix}-customer-type`).value,
        city: document.getElementById(`${prefix}-customer-city`).value,
        phone: document.getElementById(`${prefix}-customer-phone`).value,
        credit_lmt: document.getElementById(`${prefix}-customer-limit`).value
    };

    const url = isEdit ? `/api/customers/${id}` : '/api/customers';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal(`modal-${isEdit ? 'edit' : 'add'}-customer`);
            fetchCustomers();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan pelanggan');
    }
}

function openEditCustomerModal(id) {
    const c = CUSTOMERS.find(x => x.id === id);
    if (!c) return;
    document.getElementById('edit-customer-id').value = c.id;
    document.getElementById('edit-customer-id-display').value = c.id;
    document.getElementById('edit-customer-name').value = c.name;
    document.getElementById('edit-customer-type').value = c.categoryId;
    document.getElementById('edit-customer-city').value = c.city;
    document.getElementById('edit-customer-phone').value = c.phone;
    document.getElementById('edit-customer-limit').value = c.creditLimit;
    openModal('modal-edit-customer');
}

async function deleteCustomer(id) {
    if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
    try {
        const res = await fetch(`/api/customers/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            fetchCustomers();
        } else {
            alert('Gagal menghapus pelanggan');
        }
    } catch (err) {
        console.error(err);
    }
}

// ==========================================================================
// VENDORS — CRUD
// ==========================================================================

async function fetchVendors() {
    try {
        const res = await fetch('/api/vendors', { headers: getAuthHeaders() });
        const data = await res.json();
        VENDORS = data.map(v => ({
            id: v.id,
            name: v.name,
            category: v.category_name || v.vendor_category_id || '',
            categoryId: v.vendor_category_id || '',
            phone: v.phone,
            city: v.city,
            address: v.address,
            bank: v.nama_bank || v.bank_account,
            rekening: v.nomor_rek,
            pemilik: v.pemilik_rek,
            idNumber: v.id_number,
            npwp: v.npwp,
            debt: parseFloat(v.debt) || 0
        }));
        
        // Populate vendor dropdowns in PO modals
        const vendorOptions = '<option value="" disabled selected>- Pilih Vendor -</option>' + 
            VENDORS.map(v => `<option value="${v.id}">${v.name}</option>`).join('');
        const addVendorEl = document.getElementById('add-purchase-vendor');
        if (addVendorEl) addVendorEl.innerHTML = vendorOptions;
        const editVendorEl = document.getElementById('edit-purchase-vendor');
        if (editVendorEl) editVendorEl.innerHTML = vendorOptions;
        
        renderVendors(document.getElementById('vendor-search')?.value);
    } catch (err) {
        console.error('Failed to fetch vendors', err);
    }
}

async function saveVendor(isEdit) {
    const id = isEdit ? document.getElementById('edit-vendor-id').value : null;
    const prefix = isEdit ? 'edit' : 'add';
    
    const payload = {
        name: document.getElementById(`${prefix}-vendor-name`)?.value || '',
        vendor_category_id: document.getElementById(`${prefix}-vendor-category`)?.value || '',
        phone: document.getElementById(`${prefix}-vendor-phone`)?.value || '',
        city: document.getElementById(`${prefix}-vendor-city`)?.value || '',
        address: document.getElementById(`${prefix}-vendor-address`)?.value || '',
        nama_bank: document.getElementById(`${prefix}-vendor-bank`)?.value || '',
        nomor_rek: document.getElementById(`${prefix}-vendor-rekening`)?.value || '',
        pemilik_rek: document.getElementById(`${prefix}-vendor-pemilik`)?.value || '',
        id_number: document.getElementById(`${prefix}-vendor-idnumber`)?.value || '',
        npwp: document.getElementById(`${prefix}-vendor-npwp`)?.value || ''
    };

    const url = isEdit ? `/api/vendors/${id}` : '/api/vendors';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal(`modal-${isEdit ? 'edit' : 'add'}-vendor`);
            fetchVendors();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan vendor');
    }
}

function openAddVendorModal() {
    const fields = ['name', 'category', 'phone', 'city', 'address', 'bank', 'rekening', 'pemilik', 'idnumber'];
    fields.forEach(f => {
        const el = document.getElementById(`add-vendor-${f}`);
        if (el) el.value = '';
    });
    openModal('modal-add-vendor');
}

function openEditVendorModal(id) {
    const v = VENDORS.find(x => x.id === id);
    if (!v) return;
    document.getElementById('edit-vendor-id').value = v.id;
    document.getElementById('edit-vendor-id-display').value = v.id;
    document.getElementById('edit-vendor-name').value = v.name;
    document.getElementById('edit-vendor-category').value = v.categoryId || '';
    document.getElementById('edit-vendor-phone').value = v.phone || '';
    document.getElementById('edit-vendor-city').value = v.city || '';
    document.getElementById('edit-vendor-address').value = v.address || '';
    if(document.getElementById('edit-vendor-bank')) document.getElementById('edit-vendor-bank').value = v.bank || '';
    if(document.getElementById('edit-vendor-rekening')) document.getElementById('edit-vendor-rekening').value = v.rekening || '';
    if(document.getElementById('edit-vendor-pemilik')) document.getElementById('edit-vendor-pemilik').value = v.pemilik || '';
    if(document.getElementById('edit-vendor-idnumber')) document.getElementById('edit-vendor-idnumber').value = v.idNumber || '';
    openModal('modal-edit-vendor');
}

async function deleteVendor(id) {
    if (!confirm('Yakin ingin menghapus vendor ini?')) return;
    try {
        const res = await fetch(`/api/vendors/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            fetchVendors();
        } else {
            alert('Gagal menghapus vendor');
        }
    } catch (err) {
        console.error(err);
    }
}

// ==========================================================================
// PURCHASE ORDERS — CRUD
// ==========================================================================

async function fetchPurchases() {
    try {
        const res = await fetch('/api/purchases', { headers: getAuthHeaders() });
        const data = await res.json();
        PURCHASES = data;
        renderPurchases();
    } catch (err) {
        console.error('Failed to fetch purchases', err);
    }
}

let addPurchaseItems = [];

function renderAddPurchaseItems() {
    const container = document.getElementById('add-purchase-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    let subtotal = 0;
    
    addPurchaseItems.forEach((item, index) => {
        const product = PRODUCTS.find(p => p.id === item.product_id) || { name: item.product_id, unit: 'pcs' };
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        subtotal += itemTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.5rem;">
                <div style="font-weight: 500; color: var(--gray-900);">${product.name}</div>
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <input type="number" min="1" value="${item.quantity}" onchange="updateAddPurchaseItemQty(${index}, this.value)" style="width: 60px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: center;">
            </td>
            <td style="padding: 0.5rem; text-align: right;">
                <div style="display:flex; align-items:center; justify-content:flex-end; gap:0.25rem;">
                    <span style="font-size:0.75rem; color:var(--gray-500);">Rp</span>
                    <input type="number" value="${item.price}" onchange="updateAddPurchaseItemPrice(${index}, this.value)" style="width: 80px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: right;">
                </div>
            </td>
            <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: var(--gray-900);">
                ${rp(itemTotal)}
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <button type="button" onclick="removeAddPurchaseItem(${index})" style="color: var(--rose-500); background: none; border: none; cursor: pointer; padding: 0.25rem;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
    
    if (addPurchaseItems.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--gray-500);">Belum ada item.</td></tr>`;
    }
    
    document.getElementById('add-purchase-subtotal-display').textContent = rp(subtotal);
    document.getElementById('add-purchase-total-display').textContent = rp(subtotal);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addAddPurchaseItem = () => {
    const select = document.getElementById('add-purchase-product-select');
    if (!select || !select.value) return;
    
    const prod = PRODUCTS.find(p => p.id === select.value);
    if (!prod) return;
    
    const existing = addPurchaseItems.find(i => i.product_id === prod.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        addPurchaseItems.push({
            product_id: prod.id,
            quantity: 1,
            price: prod.cost || prod.price || 0
        });
    }
    renderAddPurchaseItems();
};

window.removeAddPurchaseItem = (index) => {
    addPurchaseItems.splice(index, 1);
    renderAddPurchaseItems();
};

window.updateAddPurchaseItemQty = (index, val) => {
    const qty = parseInt(val);
    addPurchaseItems[index].quantity = qty > 0 ? qty : 1;
    renderAddPurchaseItems();
};

window.updateAddPurchaseItemPrice = (index, val) => {
    const price = parseFloat(val);
    if (price >= 0) addPurchaseItems[index].price = price;
    renderAddPurchaseItems();
};

// FIX: open add-purchase modal with cleared form
function openAddPurchaseModal() {
    // Reset all fields
    const vendorEl = document.getElementById('add-purchase-vendor');
    const dateEl   = document.getElementById('add-purchase-date');
    const paidEl   = document.getElementById('add-purchase-paid');
    const ptEl     = document.getElementById('add-purchase-payment-type');
    const selectEl = document.getElementById('add-purchase-product-select');
    
    if (vendorEl) vendorEl.selectedIndex = 0;
    if (dateEl)   dateEl.value = new Date().toISOString().split('T')[0];
    if (paidEl)   paidEl.value = '';
    if (ptEl)     ptEl.selectedIndex = 0;
    
    // Populate product select if not populated yet
    if (selectEl && selectEl.options.length <= 1) {
        const productOptions = PRODUCTS.map(p => `<option value="${p.id}">${p.name} (Stok: ${p.stock})</option>`).join('');
        selectEl.innerHTML = `<option value="" disabled selected>Pilih Produk...</option>${productOptions}`;
    }
    
    onPurchasePaymentTypeChange('add');
    
    addPurchaseItems = [];
    renderAddPurchaseItems();
    openModal('modal-add-purchase');
}

let editPurchaseItems = [];

function renderEditPurchaseItems() {
    const container = document.getElementById('edit-purchase-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    let subtotal = 0;
    
    editPurchaseItems.forEach((item, index) => {
        const product = PRODUCTS.find(p => p.id === item.product_id) || { name: item.product_id, unit: 'pcs' };
        const itemPrice = parseFloat(item.price ?? item.cost ?? 0);
        const itemTotal = (parseFloat(item.quantity) || 0) * itemPrice;
        subtotal += itemTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.5rem;">
                <div style="font-weight: 500; color: var(--gray-900);">${product.name}</div>
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <input type="number" min="1" value="${item.quantity}" onchange="updateEditPurchaseItemQty(${index}, this.value)" style="width: 60px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: center;">
            </td>
            <td style="padding: 0.5rem; text-align: right;">
                <div style="display:flex; align-items:center; justify-content:flex-end; gap:0.25rem;">
                    <span style="font-size:0.75rem; color:var(--gray-500);">Rp</span>
                    <input type="number" value="${itemPrice}" onchange="updateEditPurchaseItemPrice(${index}, this.value)" style="width: 80px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: right;">
                </div>
            </td>
            <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: var(--gray-900);">
                ${rp(itemTotal)}
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <button type="button" onclick="removeEditPurchaseItem(${index})" style="color: var(--rose-500); background: none; border: none; cursor: pointer; padding: 0.25rem;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
    
    if (editPurchaseItems.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--gray-500);">Belum ada item.</td></tr>`;
    }
    
    document.getElementById('edit-purchase-total').textContent = rp(subtotal);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addEditPurchaseItem = () => {
    const select = document.getElementById('edit-purchase-product-select');
    if (!select || !select.value) return;
    
    const prod = PRODUCTS.find(p => p.id === select.value);
    if (!prod) return;
    
    const existing = editPurchaseItems.find(i => i.product_id === prod.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        editPurchaseItems.push({
            product_id: prod.id,
            quantity: 1,
            price: prod.cost || prod.price
        });
    }
    renderEditPurchaseItems();
};

window.removeEditPurchaseItem = (index) => {
    editPurchaseItems.splice(index, 1);
    renderEditPurchaseItems();
};

window.updateEditPurchaseItemQty = (index, val) => {
    const qty = parseInt(val);
    if (qty > 0) {
        editPurchaseItems[index].quantity = qty;
    } else {
        editPurchaseItems[index].quantity = 1;
    }
    renderEditPurchaseItems();
};

window.updateEditPurchaseItemPrice = (index, val) => {
    const price = parseFloat(val);
    if (price >= 0) {
        editPurchaseItems[index].price = price;
    }
    renderEditPurchaseItems();
};

// FIX: open edit-purchase modal and load existing items
async function openEditPurchaseModal(id) {
    const po = PURCHASES.find(x => x.id === id);
    if (!po) return;

    // Fill header fields
    const idEl     = document.getElementById('edit-purchase-id');
    const vendorEl = document.getElementById('edit-purchase-vendor');
    const dateEl   = document.getElementById('edit-purchase-date');
    const paidEl   = document.getElementById('edit-purchase-paid');
    const ptEl     = document.getElementById('edit-purchase-payment-type');

    if (idEl)     idEl.value     = po.id;
    const numDisplay = document.getElementById('edit-purchase-number-display');
    if (numDisplay) numDisplay.value = po.id;
    if (vendorEl) vendorEl.value = po.vendorId || '';
    if (dateEl)   dateEl.value   = (po.date || '').split('T')[0];
    if (paidEl)   paidEl.value   = po.paid || '';
    if (ptEl)     ptEl.value     = po.paymentTypeId || '';
    const statusEl = document.getElementById('edit-purchase-status');
    if (statusEl) statusEl.value = po.status || 'Dalam Proses';
    const dueDateEl = document.getElementById('edit-purchase-due-date');
    if (dueDateEl) dueDateEl.value = po.dueDate || '';

    // Adjust due date picker visibility
    onPurchasePaymentTypeChange('edit');

    // Populate product select
    const select = document.getElementById('edit-purchase-product-select');
    if (select) {
        select.innerHTML = '<option value="" disabled selected>- Pilih Produk -</option>' + 
            PRODUCTS.map(p => `<option value="${p.id}">${p.name} (${rp(p.cost || p.price)})</option>`).join('');
    }

    const container = document.getElementById('edit-purchase-items-container');
    if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--gray-400);">Memuat data item...</td></tr>';

    try {
        const res = await fetch(`/api/purchases/${id}/items`, { headers: getAuthHeaders() });
        if (res.ok) {
            editPurchaseItems = await res.json();
            renderEditPurchaseItems();
        }
    } catch (err) {
        console.error('Failed to load PO items', err);
        if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--rose-500);">Gagal memuat data item</td></tr>';
    }

    openModal('modal-edit-purchase');
}

async function savePurchase(isEdit) {
    const id = isEdit ? document.getElementById('edit-purchase-id').value : null;
    const prefix = isEdit ? 'edit' : 'add';

    let itemsToSave = [];
    if (isEdit) {
        itemsToSave = editPurchaseItems.map(i => ({ product_id: i.product_id, qty: i.quantity, price: i.price ?? i.cost ?? 0, total: i.quantity * (i.price ?? i.cost ?? 0) }));
    } else {
        itemsToSave = addPurchaseItems.map(i => ({ product_id: i.product_id, qty: i.quantity, price: i.price, total: i.quantity * i.price }));
    }

    if (itemsToSave.length === 0) {
        showToast('Tambahkan minimal satu item produk!', 'warning');
        return;
    }

    const total = itemsToSave.reduce((s, i) => s + i.total, 0);

    let dueDate = document.getElementById(`${prefix}-purchase-due-date`)?.value || '';
    if (!dueDate) {
        dueDate = calculateDueDate(getPaymentTypeName(document.getElementById(`${prefix}-purchase-payment-type`)), document.getElementById(`${prefix}-purchase-date`)?.value);
    }
    
    const payload = {
        vendor_id: document.getElementById(`${prefix}-purchase-vendor`)?.value || '',
        date: document.getElementById(`${prefix}-purchase-date`)?.value || '',
        total: total,
        paid: parseFloat(document.getElementById(`${prefix}-purchase-paid`)?.value || 0),
        payment_type_id: document.getElementById(`${prefix}-purchase-payment-type`)?.value || '',
        due_date: dueDate,
        items: itemsToSave
    };

    const url = isEdit ? `/api/purchases/${id}` : '/api/purchases';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal(`modal-${isEdit ? 'edit' : 'add'}-purchase`);
            showToast(isEdit ? 'Purchase Order berhasil diperbarui!' : 'Purchase Order berhasil dibuat!', 'success');
            await fetchPurchases();
            await fetchProducts(); // update stock
            renderHutang();
        } else {
            const err = await res.json();
            showToast('Error: ' + (err.error || 'Gagal menyimpan PO'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

// ==========================================================================
// INVOICES — CRUD
// ==========================================================================

async function fetchInvoices() {
    try {
        // FIX: correct endpoint is /api/invoices not /api/sales
        const res = await fetch('/api/invoices', { headers: getAuthHeaders() });
        const data = await res.json();
        INVOICES = data;
        renderInvoices();
        renderPiutang();
        renderSummaryCards();
        renderRecentTransactions();
    } catch (err) {
        console.error('Failed to fetch invoices', err);
    }
}

let editInvoiceItems = [];

function renderEditInvoiceItems() {
    const container = document.getElementById('edit-invoice-items-container');
    if (!container) return;
    
    container.innerHTML = '';
    let subtotal = 0;
    
    editInvoiceItems.forEach((item, index) => {
        const product = PRODUCTS.find(p => p.id === item.product_id) || { name: item.product_id, unit: 'pcs' };
        const itemTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.price) || 0);
        subtotal += itemTotal;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="padding: 0.5rem;">
                <div style="font-weight: 500; color: var(--gray-900);">${product.name}</div>
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <input type="number" min="1" value="${item.quantity}" onchange="updateEditInvoiceItemQty(${index}, this.value)" style="width: 60px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: center;">
            </td>
            <td style="padding: 0.5rem; text-align: right;">
                <div style="display:flex; align-items:center; justify-content:flex-end; gap:0.25rem;">
                    <span style="font-size:0.75rem; color:var(--gray-500);">Rp</span>
                    <input type="number" value="${item.price}" onchange="updateEditInvoiceItemPrice(${index}, this.value)" style="width: 80px; padding: 0.25rem; border: 1px solid var(--gray-200); border-radius: 0.25rem; text-align: right;">
                </div>
            </td>
            <td style="padding: 0.5rem; text-align: right; font-weight: 600; color: var(--gray-900);">
                ${rp(itemTotal)}
            </td>
            <td style="padding: 0.5rem; text-align: center;">
                <button type="button" onclick="removeEditInvoiceItem(${index})" style="color: var(--rose-500); background: none; border: none; cursor: pointer; padding: 0.25rem;">
                    <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                </button>
            </td>
        `;
        container.appendChild(tr);
    });
    
    if (editInvoiceItems.length === 0) {
        container.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--gray-500);">Belum ada item.</td></tr>`;
    }
    
    const ppn = subtotal * 0.11;
    const grandTotal = subtotal + ppn;
    
    document.getElementById('edit-invoice-subtotal').textContent = rp(subtotal);
    document.getElementById('edit-invoice-ppn').textContent = rp(ppn);
    document.getElementById('edit-invoice-total').textContent = rp(grandTotal);
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.addEditInvoiceItem = () => {
    const select = document.getElementById('edit-invoice-product-select');
    if (!select || !select.value) return;
    
    const prod = PRODUCTS.find(p => p.id === select.value);
    if (!prod) return;
    
    const existing = editInvoiceItems.find(i => i.product_id === prod.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        editInvoiceItems.push({
            product_id: prod.id,
            quantity: 1,
            price: prod.price
        });
    }
    renderEditInvoiceItems();
};

window.removeEditInvoiceItem = (index) => {
    editInvoiceItems.splice(index, 1);
    renderEditInvoiceItems();
};

window.updateEditInvoiceItemQty = (index, val) => {
    const qty = parseInt(val);
    if (qty > 0) {
        editInvoiceItems[index].quantity = qty;
    } else {
        editInvoiceItems[index].quantity = 1;
    }
    renderEditInvoiceItems();
};

window.updateEditInvoiceItemPrice = (index, val) => {
    const price = parseFloat(val);
    if (price >= 0) {
        editInvoiceItems[index].price = price;
    }
    renderEditInvoiceItems();
};

async function openEditInvoiceModal(id) {
    const inv = INVOICES.find(x => x.id === id);
    if (!inv) return;
    
    document.getElementById('edit-invoice-id').value = inv.id;
    document.getElementById('edit-invoice-number-display').value = inv.id;
    document.getElementById('edit-invoice-date').value = inv.date || '';
    document.getElementById('edit-invoice-customer-display').value = inv.customer || '';
    
    const statusEl = document.getElementById('edit-invoice-status');
    if (statusEl) {
        const statusLower = (inv.status || '').toLowerCase();
        statusEl.value = statusLower === 'lunas' ? 'lunas' : (statusLower === 'sebagian' ? 'sebagian' : 'belum');
    }
    
    // Populate product select
    const select = document.getElementById('edit-invoice-product-select');
    if (select) {
        select.innerHTML = '<option value="" disabled selected>- Pilih Produk -</option>' + 
            PRODUCTS.map(p => `<option value="${p.id}">${p.name} (${rp(p.price)})</option>`).join('');
    }
    
    const container = document.getElementById('edit-invoice-items-container');
    if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--gray-400);">Memuat data item...</td></tr>';
    
    try {
        const res = await fetch(`/api/invoices/${id}/items`, { headers: getAuthHeaders() });
        if (res.ok) {
            editInvoiceItems = await res.json();
            renderEditInvoiceItems();
        }
    } catch (err) {
        console.error('Failed to load invoice items', err);
        if (container) container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 1rem; color: var(--rose-500);">Gagal memuat data item</td></tr>';
    }
    
    openModal('modal-edit-invoice');
}

async function saveInvoiceEdits() {
    const id = document.getElementById('edit-invoice-id').value;
    if (!id) return;
    
    const date = document.getElementById('edit-invoice-date').value;
    const status = document.getElementById('edit-invoice-status').value;
    
    const inv = INVOICES.find(x => x.id === id);
    const customer_id = inv ? inv.customerId : null;
    
    const subtotal = editInvoiceItems.reduce((s, i) => s + (parseFloat(i.price) * parseInt(i.quantity)), 0);
    const total = subtotal * 1.11; // including 11% tax
    
    // Determine paid amount based on old paid amount. If it was fully paid, should we adjust paid amount?
    // Let's assume paid_amount stays the same unless it exceeds new total.
    let paid_amount = inv ? inv.paid : 0;
    if (status === 'lunas') {
        paid_amount = total;
    } else if (status === 'belum') {
        paid_amount = 0;
    } else {
        if (paid_amount > total) paid_amount = total;
    }
    
    try {
        const res = await fetch(`/api/invoices/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ 
                date, 
                status, 
                customer_id, 
                total, 
                paid_amount, 
                payment_type_id: inv ? inv.paymentTypeId : 'PT-1',
                items: editInvoiceItems
            })
        });
        if (res.ok) {
            closeModal('modal-edit-invoice');
            showToast('Invoice berhasil diperbarui!', 'success');
            await fetchInvoices();
            await fetchProducts(); // stock changed
        } else {
            const err = await res.json();
            showToast('Error: ' + (err.error || 'Gagal menyimpan invoice'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

let cancelInvoiceId = null;

async function cancelInvoice(id) {
    cancelInvoiceId = id;
    openModal('modal-cancel-invoice');
}

async function confirmCancelInvoice() {
    const id = cancelInvoiceId || document.getElementById('edit-invoice-id')?.value;
    if (!id) return;
    try {
        const res = await fetch(`/api/invoices/${id}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            closeModal('modal-cancel-invoice');
            closeModal('modal-edit-invoice');
            showToast('Invoice berhasil dibatalkan. Stok telah dikembalikan.', 'success');
            await fetchInvoices();
            await fetchProducts();
            renderPOSProducts();
        } else {
            const err = await res.json();
            showToast('Gagal: ' + (err.error || 'Terjadi kesalahan'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
    cancelInvoiceId = null;
}

let cancelPurchaseId = null;

async function confirmCancelPurchase() {
    const id = cancelPurchaseId || document.getElementById('edit-purchase-id')?.value;
    if (!id) return;
    try {
        const res = await fetch(`/api/purchases/${id}/cancel`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            closeModal('modal-cancel-purchase');
            closeModal('modal-edit-purchase');
            showToast('PO berhasil dibatalkan. Stok telah dikembalikan.', 'success');
            await fetchPurchases();
            await fetchProducts();
        } else {
            const err = await res.json();
            showToast('Gagal: ' + (err.error || 'Terjadi kesalahan'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
    cancelPurchaseId = null;
}

window.cancelPurchase = (id) => {
    cancelPurchaseId = id;
    document.getElementById('modal-cancel-purchase').querySelector('strong').textContent = id;
    openModal('modal-cancel-purchase');
};

window.cancelPurchaseFromEdit = () => {
    const id = document.getElementById('edit-purchase-id')?.value;
    if (id) {
        window.cancelPurchase(id);
    }
};// ==========================================================================
// CASH FLOW — CRUD
// ==========================================================================

async function fetchCashTransactions() {
    try {
        const res = await fetch('/api/finance/cash-flow', { headers: getAuthHeaders() });
        const data = await res.json();
        CASH_TRANSACTIONS = data;
        renderCashFlow();
    } catch (err) {
        console.error('Failed to fetch cash flow', err);
    }
}

async function saveCashTransaction() {
    const payload = {
        type: document.getElementById('add-cash-type').value,
        category: document.getElementById('add-cash-category').value,
        amount: document.getElementById('add-cash-amount').value,
        notes: document.getElementById('add-cash-notes').value,
        date: document.getElementById('add-cash-date').value
    };

    try {
        const res = await fetch('/api/finance/cash-flow', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal('modal-add-cash');
            fetchCashTransactions();
            fetchInvoices(); // if it affects unpaid
            fetchPurchases();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan transaksi kas');
    }
}

// FIX: helper to open hutang payment modal with correct PO id pre-filled
function openHutangPaymentModal(poId, sisa) {
    const typeEl = document.getElementById('payment-type');
    const refEl  = document.getElementById('payment-ref-id');
    const amtEl  = document.getElementById('payment-amount');
    if (typeEl) typeEl.value  = 'payable';
    if (refEl)  refEl.value  = poId;
    if (amtEl)  amtEl.value  = sisa || '';
    openModal('modal-payment');
}

// FIX: helper to open piutang payment modal with correct invoice id pre-filled
function openPiutangPaymentModal(invoiceId, sisa) {
    const typeEl = document.getElementById('payment-type');
    const refEl  = document.getElementById('payment-ref-id');
    const amtEl  = document.getElementById('payment-amount');
    if (typeEl) typeEl.value  = 'receivable';
    if (refEl)  refEl.value  = invoiceId;
    if (amtEl)  amtEl.value  = sisa || '';
    openModal('modal-payment');
}

async function submitPayment() {
    const typeEl   = document.getElementById('payment-type');
    const isReceivable = typeEl ? typeEl.value === 'receivable' : false;
    const id       = document.getElementById('payment-ref-id').value;
    const amount   = document.getElementById('payment-amount').value;
    const methodEl = document.getElementById('payment-method');
    const method   = methodEl ? methodEl.value : 'Transfer Bank';

    if (!id || !amount || parseFloat(amount) <= 0) {
        showToast('ID dan jumlah pembayaran wajib diisi!', 'warning');
        return;
    }

    // FIX: use correct endpoints
    const url = isReceivable
        ? `/api/finance/receivables/${id}/pay`
        : `/api/finance/payables/${id}/pay`;

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ amount: parseFloat(amount), payment_method: method })
        });
        if (res.ok) {
            closeModal('modal-payment');
            showToast('Pembayaran berhasil dicatat!', 'success');
            if (isReceivable) {
                await fetchInvoices();
                renderPiutang();
            } else {
                await fetchPurchases();
                renderHutang();
            }
            await fetchCashTransactions();
        } else {
            const err = await res.json();
            showToast('Error: ' + (err.error || 'Gagal memproses pembayaran'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

// ==========================================================================
// USERS — CRUD
// ==========================================================================

async function fetchUsers() {
    try {
        const res = await fetch('/api/users', { headers: getAuthHeaders() });
        const data = await res.json();
        USERS = data;
        renderUsers();
    } catch (err) {
        console.error('Failed to fetch users', err);
    }
}

function renderUsers() {
    const tbody = document.getElementById('users-body');
    if (!tbody) return;
    
    tbody.innerHTML = USERS.map(u => `
        <tr>
            <td style="font-weight: 600;">${u.username}</td>
            <td>${u.name}</td>
            <td><span class="badge-status pending">${u.role}</span></td>
            <td><span class="badge-status ${u.active ? 'lunas' : 'batal'}">${u.active ? 'Aktif' : 'Nonaktif'}</span></td>
            <td>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;" onclick="openEditStaffModal('${u.id}')"><i data-lucide="edit-2" style="width:14px;height:14px;margin:0;"></i></button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color:var(--rose-600);" onclick="deleteStaff('${u.id}')"><i data-lucide="trash-2" style="width:14px;height:14px;margin:0;"></i></button>
            </td>
        </tr>
    `).join('');
    
    if (window.lucide) lucide.createIcons();
}

function openEditStaffModal(id) {
    const u = USERS.find(x => x.id == id);
    if (!u) return;
    document.getElementById('modal-add-staff').querySelector('h3').textContent = 'Edit Staff';
    document.getElementById('staff-id').value = u.id;
    document.getElementById('staff-name').value = u.name;
    document.getElementById('staff-username').value = u.username;
    document.getElementById('staff-username').disabled = true;
    document.getElementById('staff-password').value = ''; // Leave empty if no change
    document.getElementById('staff-email').value = u.email || '';
    document.getElementById('staff-role').value = u.role;
    document.getElementById('staff-status').value = u.active ? 'true' : 'false';
    openModal('modal-add-staff');
}

function openAddStaffModal() {
    document.getElementById('modal-add-staff').querySelector('h3').textContent = 'Tambah Staff';
    document.getElementById('staff-id').value = '';
    document.getElementById('staff-name').value = '';
    document.getElementById('staff-username').value = '';
    document.getElementById('staff-username').disabled = false;
    document.getElementById('staff-password').value = '';
    document.getElementById('staff-email').value = '';
    document.getElementById('staff-role').value = 'kasir';
    document.getElementById('staff-status').value = 'true';
    openModal('modal-add-staff');
}

async function saveStaff() {
    const id = document.getElementById('staff-id').value;
    const isEdit = !!id;
    
    const payload = {
        name: document.getElementById('staff-name').value,
        username: document.getElementById('staff-username').value,
        password: document.getElementById('staff-password').value,
        email: document.getElementById('staff-email').value,
        role: document.getElementById('staff-role').value,
        active: document.getElementById('staff-status').value === 'true'
    };

    const url = isEdit ? `/api/users/${id}` : '/api/users';
    const method = isEdit ? 'PUT' : 'POST';

    try {
        const res = await fetch(url, {
            method,
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            closeModal('modal-add-staff');
            fetchUsers();
        } else {
            const err = await res.json();
            alert('Error: ' + err.error);
        }
    } catch (err) {
        console.error(err);
        alert('Gagal menyimpan staff');
    }
}

async function deleteStaff(id) {
    if (!confirm('Yakin ingin menghapus staff ini?')) return;
    try {
        const res = await fetch(`/api/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) {
            fetchUsers();
        } else {
            const err = await res.json();
            alert('Gagal menghapus: ' + err.error);
        }
    } catch (err) {
        console.error(err);
    }
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);

async function populateMasterDropdowns() {
    try {
        const fetchAndFill = async (endpoint, selectIds, valueField = 'id', labelField = 'name') => {
            const res = await fetch(endpoint, { headers: getAuthHeaders() });
            const data = await res.json();
            const optionsHtml = data.map(item => `<option value="${item[valueField]}">${item[labelField]}</option>`).join('');
            selectIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = optionsHtml;
            });
        };

        await fetchAndFill('/api/master/product-categories', ['add-product-category', 'edit-product-category'], 'id', 'name');
        await fetchAndFill('/api/master/product-units', ['add-product-unit', 'edit-product-unit'], 'id', 'name');
        await fetchAndFill('/api/master/customer-categories', ['add-customer-type', 'edit-customer-type'], 'id', 'name');
        await fetchAndFill('/api/master/vendor-categories', ['add-vendor-category', 'edit-vendor-category'], 'id', 'name');
        await fetchAndFill('/api/master/payment-types', ['cart-payment-type', 'add-purchase-payment-type', 'edit-purchase-payment-type', 'edit-invoice-payment-type', 'payment-method'], 'id', 'name');
    } catch (err) {
        console.error('Failed to populate master dropdowns', err);
    }
}

// ==========================================================================
// MASTER DATA — CRUD
// ==========================================================================

let currentMasterType = 'product_categories';
let masterDataToDelete = null;

const MASTER_LABELS = {
    product_categories: 'Kategori Produk',
    product_units: 'Satuan Produk',
    customer_categories: 'Kategori Pelanggan',
    vendor_categories: 'Kategori Vendor',
    payment_types: 'Tipe Pembayaran'
};

const MASTER_API_MAP = {
    product_categories: 'product-categories',
    product_units: 'product-units',
    customer_categories: 'customer-categories',
    vendor_categories: 'vendor-categories',
    payment_types: 'payment-types'
};

async function fetchMasterData(type) {
    currentMasterType = type || currentMasterType;
    const apiKey = MASTER_API_MAP[currentMasterType];
    try {
        const res = await fetch(`/api/master/${apiKey}`, { headers: getAuthHeaders() });
        const data = await res.json();
        renderMasterTable(data);
    } catch (err) {
        console.error('fetchMasterData error:', err);
    }
}

function renderMasterTable(data) {
    const tbody = document.getElementById('master-data-body');
    const emptyState = document.getElementById('master-data-empty');
    const table = document.getElementById('master-data-table');

    if (!data || data.length === 0) {
        tbody.innerHTML = '';
        table.style.display = 'none';
        emptyState.style.display = 'flex';
        return;
    }

    table.style.display = '';
    emptyState.style.display = 'none';

    tbody.innerHTML = data.map(row => `
        <tr>
            <td style="font-family: monospace; color: var(--gray-500); font-size: 0.8rem;">${row.id}</td>
            <td style="font-weight: 600;">${row.name}</td>
            <td style="text-align: right;">
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; margin-right: 0.25rem;"
                    onclick="openEditMasterModal('${row.id}', '${row.name.replace(/'/g, "\\'")}')"
                    title="Edit">
                    <i data-lucide="edit-2" style="width:14px;height:14px;margin:0;"></i>
                </button>
                <button class="btn-toolbar secondary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; color: var(--rose-600);"
                    onclick="openDeleteMasterModal('${row.id}', '${row.name.replace(/'/g, "\\'")}')"
                    title="Hapus">
                    <i data-lucide="trash-2" style="width:14px;height:14px;margin:0;"></i>
                </button>
            </td>
        </tr>
    `).join('');

    if (window.lucide) lucide.createIcons();
}

function openAddMasterModal() {
    document.getElementById('modal-master-data-title').textContent =
        'Tambah ' + (MASTER_LABELS[currentMasterType] || 'Data Master');
    document.getElementById('master-data-edit-id').value = '';
    document.getElementById('master-data-id').value = '';
    document.getElementById('master-data-id').disabled = false;
    document.getElementById('master-data-name').value = '';
    openModal('modal-master-data');
}

function openEditMasterModal(id, name) {
    document.getElementById('modal-master-data-title').textContent =
        'Edit ' + (MASTER_LABELS[currentMasterType] || 'Data Master');
    document.getElementById('master-data-edit-id').value = id;
    document.getElementById('master-data-id').value = id;
    document.getElementById('master-data-id').disabled = true; // ID tidak boleh diubah saat edit
    document.getElementById('master-data-name').value = name;
    openModal('modal-master-data');
}

async function saveMasterData() {
    const editId = document.getElementById('master-data-edit-id').value;
    const id = document.getElementById('master-data-id').value.trim();
    const name = document.getElementById('master-data-name').value.trim();
    const apiKey = MASTER_API_MAP[currentMasterType];

    if (!name) {
        alert('Nama tidak boleh kosong.');
        return;
    }

    const isEdit = !!editId;
    const url = isEdit ? `/api/master/${currentMasterType}/${editId}` : `/api/master/${currentMasterType}`;
    const method = isEdit ? 'PUT' : 'POST';
    const body = isEdit ? { name } : { id: id || undefined, name };

    try {
        const res = await fetch(url, {
            method,
            headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const result = await res.json();
        if (result.success) {
            closeModal('modal-master-data');
            fetchMasterData();
        } else {
            alert('Gagal menyimpan: ' + (result.error || 'Error tidak diketahui'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

function openDeleteMasterModal(id, name) {
    masterDataToDelete = { id, name };
    document.getElementById('delete-master-name').textContent = name;
    openModal('modal-delete-master');
}

async function confirmDeleteMaster() {
    if (!masterDataToDelete) return;
    const { id } = masterDataToDelete;
    try {
        const res = await fetch(`/api/master/${currentMasterType}/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        const result = await res.json();
        closeModal('modal-delete-master');
        if (result.success) {
            masterDataToDelete = null;
            fetchMasterData();
        } else {
            alert('Gagal menghapus: ' + (result.error || 'Error tidak diketahui'));
        }
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

// Wire up master data tabs
document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('#master-data-tabs .tab-filter');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentMasterType = tab.dataset.master;
            fetchMasterData(currentMasterType);
        });
    });

    // Auto-load when navigating to master-data page
    const masterNavItem = document.getElementById('nav-master-data');
    if (masterNavItem) {
        masterNavItem.addEventListener('click', () => {
            fetchMasterData(currentMasterType);
        });
    }

    // Auto-load when navigating to settings page
    const settingsNavItem = document.getElementById('nav-settings');
    if (settingsNavItem) {
        settingsNavItem.addEventListener('click', () => {
            loadPrefixSettings();
        });
    }
});

// Prefix Settings Functions
async function loadPrefixSettings() {
    try {
        const res = await fetch('/api/settings', { headers: getAuthHeaders() });
        if (res.ok) {
            const settings = await res.json();
            const customerEl = document.getElementById('settings-prefix-customer');
            const vendorEl   = document.getElementById('settings-prefix-vendor');
            const purchaseEl = document.getElementById('settings-prefix-purchase');
            const salesEl     = document.getElementById('settings-prefix-sales');
            
            if (customerEl) customerEl.value = settings.prefix_customer ?? 'C';
            if (vendorEl)   vendorEl.value   = settings.prefix_vendor ?? 'V';
            if (purchaseEl) purchaseEl.value = settings.prefix_purchase ?? 'PO/{YYYY}/{MM}/';
            if (salesEl)     salesEl.value     = settings.prefix_sales ?? 'INV/{YYYY}/{MM}/';
        }
    } catch (err) {
        console.error('Failed to load prefix settings', err);
    }
}

async function savePrefixSettings() {
    const payload = {
        prefix_customer: document.getElementById('settings-prefix-customer')?.value || 'C',
        prefix_vendor: document.getElementById('settings-prefix-vendor')?.value || 'V',
        prefix_purchase: document.getElementById('settings-prefix-purchase')?.value || 'PO/{YYYY}/{MM}/',
        prefix_sales: document.getElementById('settings-prefix-sales')?.value || 'INV/{YYYY}/{MM}/'
    };
    
    try {
        const res = await fetch('/api/settings', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            showToast('Pengaturan prefix penomoran berhasil disimpan!', 'success');
        } else {
            const err = await res.json();
            showToast('Gagal menyimpan prefix: ' + (err.error || 'Terjadi kesalahan'), 'error');
        }
    } catch (err) {
        console.error(err);
        showToast('Gagal menghubungi server', 'error');
    }
}

// Make functions globally accessible
window.savePrefixSettings = savePrefixSettings;