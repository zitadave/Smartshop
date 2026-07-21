// ============================================================
// SMART SHOP - Static Site + API (Single Worker)
// Deploy this ONE file as a Cloudflare Worker
// Replace ALL your existing worker code with this
// ============================================================

// HTML page that loads React from CDN (no build step needed!)
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Smart Shop</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%231e40af' width='100' height='100' rx='20'/><text x='50' y='75' text-anchor='middle' font-size='60'>🏪</text></svg>">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#0f172a;min-height:100vh;overflow-x:hidden}
.dark{background:#0f172a;color:#f1f5f9}
.container{max-width:800px;margin:0 auto;padding:16px}
.header{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#1e40af;color:#fff;position:sticky;top:0;z-index:50}
.header h1{font-size:18px;font-weight:700}.header button{background:rgba(255,255,255,.15);border:none;color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;padding:12px 0}
.card{background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;cursor:pointer;transition:.2s}
.dark .card{background:#1e293b;border-color:#334155}
.card:hover{box-shadow:0 4px 12px rgba(0,0,0,.1);transform:translateY(-2px)}
.card img{width:100%;aspect-ratio:1;object-fit:cover}
.card-body{padding:10px}.card-name{font-size:13px;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.card-price{font-size:16px;font-weight:700;color:#1e40af;margin-top:4px}
.dark .card-price{color:#3b82f6}.card-old{font-size:11px;color:#94a3b8;text-decoration:line-through}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;font-size:8px;font-weight:700;color:#fff;margin-bottom:4px}
.loading{text-align:center;padding:40px;color:#64748b}.loading .spinner{width:32px;height:32px;border:3px solid #e2e8f0;border-top-color:#1e40af;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px}
@keyframes spin{to{transform:rotate(360deg)}}
.error{text-align:center;padding:40px;color:#dc2626}
.hero{background:linear-gradient(135deg,#1e40af,#1e3a8a);color:#fff;padding:32px 16px 24px;text-align:center;border-radius:0 0 24px 24px;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-50%;right:-20%;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,.03)}
.hero h2{font-size:24px;font-weight:800;margin-bottom:4px}
.hero p{font-size:13px;opacity:.7;margin-bottom:12px}
.btn{display:inline-flex;align-items:center;gap:6px;padding:10px 24px;border-radius:100px;font-size:13px;font-weight:600;border:none;cursor:pointer;transition:.2s}
.btn-primary{background:#fff;color:#1e40af;box-shadow:0 4px 12px rgba(0,0,0,.15)}
.btn-primary:hover{transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,.2)}
.cat-bar{display:flex;gap:6px;padding:12px 0;overflow-x:auto;scrollbar-width:none}
.cat-tab{padding:6px 14px;border-radius:100px;font-size:11px;font-weight:500;white-space:nowrap;border:1px solid #e2e8f0;background:#fff;color:#64748b;cursor:pointer}
.dark .cat-tab{background:#1e293b;border-color:#334155;color:#94a3b8}
.search-bar{position:relative;margin-bottom:8px}
.search-bar input{width:100%;padding:10px 14px 10px 36px;border-radius:100px;border:1.5px solid #e2e8f0;font-size:14px;background:#fff}
.dark .search-bar input{background:#1e293b;border-color:#334155;color:#f1f5f9}
.search-bar input:focus{outline:none;border-color:#3b82f6}
.search-icon{position:absolute;left:12px;top:50%;transform:translateY(-50%);opacity:.4}
.stats{display:flex;gap:16px;justify-content:center;margin-top:12px}
.stat{text-align:center;padding:6px 12px;background:rgba(255,255,255,.08);border-radius:8px;min-width:60px}
.stat-val{font-size:16px;font-weight:700}.stat-lbl{font-size:8px;opacity:.6;text-transform:uppercase}
</style>
</head>
<body>
<div id="app"></div>
<script>
const API = 'https://smartshop-api.zitadave61.workers.dev';
let products = [];
let search = '';
let dark = localStorage.getItem('dark') === 'true';
if (dark) document.body.classList.add('dark');

async function load() {
  document.getElementById('app').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading products...</p></div>';
  try {
    const r = await fetch(API + '/api/products');
    const d = await r.json();
    products = d.products || [];
    render();
  } catch(e) {
    document.getElementById('app').innerHTML = '<div class="error">❌ Failed to load products. Check API connection.</div>';
  }
}

function render() {
  const top = [...products].sort((a,b) => (b.soldCount||0)-(a.soldCount||0)).slice(0,4);
  const filtered = search ? products.filter(p => p.nameEn.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase())) : products;
  
  let html = \`
    <section class="hero">
      <h2>🏪 Smart Shop</h2>
      <p>Premium marketplace for Ethiopian products</p>
      <button class="btn btn-primary" onclick="document.getElementById('shop').scrollIntoView({behavior:'smooth'})">🛍️ Shop Now</button>
      <div class="stats">
        <div class="stat"><div class="stat-val">\${products.length}+</div><div class="stat-lbl">Products</div></div>
        <div class="stat"><div class="stat-val">⭐4.9</div><div class="stat-lbl">Rating</div></div>
        <div class="stat"><div class="stat-val">FREE</div><div class="stat-lbl">Delivery</div></div>
      </div>
    </section>
    <div class="container">
      <div class="section-title" style="font-size:14px;font-weight:700;padding:12px 0 4px">⭐ Featured Products</div>
      <div class="grid">
        \${top.map(p => cardHTML(p)).join('')}
      </div>
      <div class="section-title" style="font-size:14px;font-weight:700;padding:16px 0 4px" id="shop">📦 All Products (\${filtered.length})</div>
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input type="text" placeholder="Search products..." oninput="search=this.value.toLowerCase();render()" value="\${search}">
      </div>
      <div class="grid">
        \${filtered.length ? filtered.map(p => cardHTML(p)).join('') : '<div style="text-align:center;padding:40px;grid-column:span 2;color:#64748b">No products found</div>'}
      </div>
    </div>
    <div style="text-align:center;padding:16px;font-size:10px;color:#94a3b8">🏪 Smart Shop v3.0</div>
  \`;
  document.getElementById('app').innerHTML = html;
}

function cardHTML(p) {
  return \`<div class="card">
    <img src="\${p.image}" alt="\${p.nameEn}" loading="lazy">
    <div class="card-body">
      \${p.badge ? '<span class="badge" style="background:\${badgeColor(p.badge)}">\${p.badge.toUpperCase()}</span>' : ''}
      <div class="card-name">\${p.name}</div>
      <div style="font-size:10px;color:#94a3b8;margin:2px 0">\${p.nameEn}</div>
      <div class="card-price">Br \${(p.price||0).toLocaleString()}
        \${p.originalPrice ? '<span class="card-old">Br ' + p.originalPrice.toLocaleString() + '</span>' : ''}
      </div>
    </div>
  </div>\`;
}

function badgeColor(b) {
  const m = {sale:'#dc2626',hot:'#ea580c',new:'#16a34a','best-seller':'#7c3aed',popular:'#2563eb',premium:'#1e293b','big-deal':'#b91c1c',educational:'#0d9488'};
  return m[b] || '#dc2626';
}

function toggleDark() {
  dark = !dark;
  localStorage.setItem('dark', dark);
  document.body.classList.toggle('dark', dark);
  render();
}

// Add dark mode toggle to header
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = '.dark-btn{position:fixed;top:12px;right:12px;z-index:100;background:rgba(255,255,255,.15);border:none;color:#fff;width:36px;height:36px;border-radius:10px;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px)}';
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.className = 'dark-btn';
  btn.innerHTML = dark ? '☀️' : '🌙';
  btn.onclick = toggleDark;
  document.body.prepend(btn);
  load();
});
<\/script>
</body>
</html>`;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };
const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    
    // Serve the main page
    if (path === '/' || path === '/index.html') {
      return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8', ...CORS } });
    }
    
    // API proxy to Supabase
    if (path.startsWith('/api/')) {
      const supabaseUrl = SUPABASE_URL + '/rest/v1/' + path.replace('/api/', '') + url.search;
      const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await request.text() : null;
      const res = await fetch(supabaseUrl, { method, headers, body });
      const data = await res.json();
      
      // Normalize products
      if (path === '/api/products' && method === 'GET') {
        const products = (Array.isArray(data) ? data : []).map(p => ({
          id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
          price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
          badge: p.badge || '', descriptionEn: p.description_en || '',
          stockCount: p.stock_count || 0, soldCount: p.sold_count || 0,
          inStock: p.in_stock !== false, visible: p.visible !== false,
          rating: p.rating || 4.0, reviews: p.reviews || 0,
          vendorName: p.vendor_name || '', createdAt: p.created_at || ''
        }));
        return new Response(JSON.stringify({ products }), { headers: { 'content-type': 'application/json', ...CORS } });
      }
      
      return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', ...CORS } });
    }
    
    return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8', ...CORS } });
  }
};
