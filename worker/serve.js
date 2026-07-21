// ============================================================
// SMART SHOP v3.0 — Full SPA + API (Single Cloudflare Worker)
// Serves the complete app with navigation & all pages
// ============================================================

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };

// ==================== FULL SPA HTML ====================
const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>Smart Shop Ethiopia</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect fill='%231e40af' width='100' height='100' rx='20'/><text x='50' y='75' text-anchor='middle' font-size='60'>🏪</text></svg>">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
:root{--bg:#f8fafc;--fg:#0f172a;--card:#fff;--border:#e2e8f0;--muted:#f1f5f9;--mfg:#64748b;--p:#1e40af;--s:#16a34a;--d:#dc2626;--a:#ea580c;--r:12px;--hdr:56px;--tab:60px}
.dark{--bg:#0f172a;--fg:#f1f5f9;--card:#1e293b;--border:#334155;--muted:#1e293b;--mfg:#94a3b8;--p:#3b82f6}
body{background:var(--bg);color:var(--fg);padding-top:var(--hdr);padding-bottom:calc(var(--tab) + 12px);min-height:100vh}
.header{position:fixed;top:0;left:0;right:0;height:var(--hdr);background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;display:flex;align-items:center;padding:0 12px;gap:8px;z-index:100}
.header .logo{font-size:20px;font-weight:800;flex:1;display:flex;align-items:center;gap:6px}
.header .h-btn{width:34px;height:34px;border-radius:8px;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative}
.cart-badge{position:absolute;top:-4px;right:-4px;min-width:16px;height:16px;border-radius:8px;background:var(--d);color:#fff;font-size:7px;font-weight:700;padding:0 4px}
.mtabs{position:fixed;bottom:0;left:0;right:0;height:var(--tab);background:var(--card);border-top:1px solid var(--border);display:flex;z-index:100;padding-bottom:env(safe-area-inset-bottom,0)}
.mtab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:9px;color:var(--mfg);background:none;border:none;cursor:pointer}
.mtab.active{color:var(--p)}.mtab .icon{font-size:20px}
.page{display:none;padding:12px;max-width:640px;margin:0 auto;animation:fadeUp .3s ease}
.page.active{display:block}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes spin{to{transform:rotate(360deg)}}
.hero{background:linear-gradient(135deg,#1e40af,#1e3a8a);color:#fff;margin:-12px -12px 12px;padding:24px 16px;text-align:center;position:relative;overflow:hidden}
.hero::before{content:'';position:absolute;top:-40%;right:-15%;width:250px;height:250px;border-radius:50%;background:rgba(255,255,255,.03)}
.hero h2{font-size:22px;font-weight:800}.hero p{font-size:13px;opacity:.7;margin:4px 0 12px}
.hero-stats{display:flex;gap:8px;justify-content:center;margin-top:10px}
.hero-stat{padding:8px 14px;background:rgba(255,255,255,.08);border-radius:10px;text-align:center;backdrop-filter:blur(8px)}
.hero-stat .v{font-size:16px;font-weight:700}.hero-stat .l{font-size:7px;opacity:.6;text-transform:uppercase}
.grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;padding:0 0 12px}
.card{background:var(--card);border-radius:var(--r);overflow:hidden;border:1px solid var(--border);cursor:pointer;transition:.2s;animation:fadeUp .4s ease both}
.card:hover{transform:translateY(-2px);box-shadow:0 4px 12px rgba(0,0,0,.08)}
.card-img{aspect-ratio:1;overflow:hidden;background:var(--muted);position:relative}
.card-img img{width:100%;height:100%;object-fit:cover;transition:.3s}
.card:hover .card-img img{transform:scale(1.05)}
.card-body{padding:10px}.card-n{font-size:13px;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.3}
.card-e{font-size:10px;color:var(--mfg);margin:2px 0}
.card-p{font-size:17px;font-weight:800;color:var(--p);margin:3px 0}
.card-o{font-size:11px;color:var(--mfg);text-decoration:line-through}
.disc{font-size:9px;background:rgba(220,38,38,.1);color:var(--d);padding:1px 5px;border-radius:4px;font-weight:700}
.cat-bar{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none}
.cat{flex-shrink:0;padding:5px 12px;border-radius:100px;font-size:10px;font-weight:500;border:1px solid var(--border);background:var(--card);color:var(--mfg);cursor:pointer;white-space:nowrap}
.cat.active{background:var(--p);color:#fff;border-color:var(--p)}
.srch{display:flex;gap:8px;margin-bottom:10px}
.srch input{flex:1;padding:10px 14px;border-radius:100px;border:1.5px solid var(--border);font-size:14px;background:var(--card);color:var(--fg)}
.srch input:focus{outline:none;border-color:var(--p)}
.sort-bar{display:flex;gap:6px;overflow-x:auto;padding:0 0 10px;scrollbar-width:none}
.sort-btn{flex-shrink:0;padding:4px 10px;border-radius:100px;font-size:9px;font-weight:500;border:1px solid var(--border);background:var(--card);color:var(--mfg);cursor:pointer}
.sort-btn.active{background:var(--p);color:#fff;border-color:var(--p)}
.loading,.empty{text-align:center;padding:40px;color:var(--mfg)}
.loading .sp{width:28px;height:28px;border:3px solid var(--border);border-top-color:var(--p);border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 8px}
.badge{position:absolute;top:6px;left:6px;padding:2px 6px;border-radius:4px;font-size:7px;font-weight:700;color:#fff;z-index:2}
.sold{position:absolute;inset:0;background:rgba(0,0,0,.4);backdrop-filter:blur(2px);display:flex;align-items:center;justify-content:center;z-index:2}
.sold span{color:#fff;font-size:10px;font-weight:700;background:var(--d);padding:4px 10px;border-radius:6px}
.wish{position:absolute;top:6px;right:6px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,.9);border:none;font-size:12px;cursor:pointer;z-index:2;display:flex;align-items:center;justify-content:center}
.profile-hdr{text-align:center;padding:20px 0}.avatar{width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,var(--p),#3b82f6);color:#fff;display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;margin:0 auto;box-shadow:0 4px 12px rgba(0,0,0,.1)}
.profile-name{font-size:18px;font-weight:700;margin-top:8px}
.profile-stats{display:flex;justify-content:center;gap:16px;padding:12px;background:var(--card);border-radius:var(--r);margin-bottom:8px;border:1px solid var(--border)}
.ps{text-align:center}.ps-v{font-size:20px;font-weight:700;color:var(--p)}.ps-l{font-size:9px;color:var(--mfg)}
.menu{padding:0 0 12px}.mi{display:flex;align-items:center;gap:10px;padding:12px;background:var(--card);border-radius:8px;margin-bottom:4px;cursor:pointer;border:1px solid var(--border);transition:.15s;font-size:13px}
.mi:hover{border-color:var(--p)}.mi .ar{margin-left:auto;color:var(--mfg)}
.pitem{display:flex;gap:12px;padding:12px;background:var(--card);border-radius:var(--r);margin-bottom:6px;border:1px solid var(--border);cursor:pointer}
.pitem img{width:50px;height:50px;border-radius:8px;object-fit:cover}
.pitem-info{flex:1}.pitem-n{font-size:13px;font-weight:600}.pitem-p{font-size:15px;font-weight:700;color:var(--p);margin-top:2px}
.section-title{font-size:14px;font-weight:700;padding:12px 0 6px;display:flex;align-items:center;gap:6px}
.qty{display:flex;align-items:center;gap:4px;background:var(--muted);border-radius:6px;padding:2px}
.qty button{width:28px;height:28px;border-radius:4px;border:none;font-size:14px;font-weight:600;background:var(--card);color:var(--fg);cursor:pointer}
.qty span{min-width:22px;text-align:center;font-weight:600;font-size:14px}
.checkout-btn{width:100%;padding:14px;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;border:none;border-radius:var(--r);font-size:15px;font-weight:700;cursor:pointer;margin-top:8px;transition:.2s}
.checkout-btn:active{transform:scale(.98)}
.summary{background:var(--card);border-radius:var(--r);padding:14px;border:1px solid var(--border)}
.sum-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;color:var(--mfg)}
.sum-total{font-size:18px;font-weight:700;color:var(--p);border-top:1px solid var(--border);padding-top:6px;margin-top:4px}
.lang-select{padding:6px 10px;border-radius:8px;border:1.5px solid var(--border);font-size:12px;background:var(--card);color:var(--fg);width:100%}
.empty-ic{font-size:48px;opacity:.4;display:block;margin-bottom:8px}
</style>
</head>
<body>
<div class="header">
  <div class="logo" onclick="showPage('home')">🏪 Smart Shop</div>
  <button class="h-btn" onclick="toggleTheme()">🌙</button>
  <button class="h-btn" onclick="showPage('cart')">🛒<span class="cart-badge" id="cartBadge" style="display:none">0</span></button>
</div>

<div id="pages">
  <div class="page active" id="page-home"></div>
  <div class="page" id="page-shop"></div>
  <div class="page" id="page-cart"></div>
  <div class="page" id="page-profile"></div>
</div>

<div class="mtabs">
  <button class="mtab active" data-page="home" onclick="showPage('home')"><span class="icon">🏠</span>Home</button>
  <button class="mtab" data-page="shop" onclick="showPage('shop')"><span class="icon">🛍️</span>Shop</button>
  <button class="mtab" data-page="cart" onclick="showPage('cart')"><span class="icon">🛒</span>Cart</button>
  <button class="mtab" data-page="profile" onclick="showPage('profile')"><span class="icon">👤</span>Profile</button>
</div>

<script>
const API = window.location.origin;
let products = [], cart = JSON.parse(localStorage.getItem('cart') || '[]'), wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]'), dark = localStorage.getItem('dark') === 'true';
const LANG = {am:{home:'መነሻ',shop:'ሱቅ',cart:'ጋሪ',profile:'መገለጫ',search:'ፈልግ',empty:'ባዶ ነው',inStock:'ክምችት አለ',soldOut:'ተሽጧል'},en:{home:'Home',shop:'Shop',cart:'Cart',profile:'Profile',search:'Search',empty:'is empty',inStock:'In Stock',soldOut:'Sold Out'}};
const lang = 'en'; function t(k){return LANG[lang][k]||k}
if(dark)document.documentElement.classList.add('dark');

// ===== API =====
async function api(path) {
  try { const r = await fetch(API + '/api/' + path); return await r.json(); }
  catch(e) { return null; }
}

// ===== CART FUNCTIONS =====
function getCartCount() { return cart.reduce((s,i) => s + i.qty, 0); }
function updateCartBadge() {
  const n = getCartCount();
  const b = document.getElementById('cartBadge');
  if (b) { b.style.display = n > 0 ? 'flex' : 'none'; b.textContent = n > 99 ? '99+' : n; }
}
function addToCart(p, qty = 1) {
  const i = cart.findIndex(x => x.id === p.id);
  if (i >= 0) cart[i].qty = Math.min(cart[i].qty + qty, p.stockCount);
  else cart.push({id:p.id,name:p.nameEn||p.name,price:p.price,image:p.image,qty,maxQty:p.stockCount,vendorName:p.vendorName||'Smart Shop'});
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartBadge();
  showToast('🛒 ' + (p.nameEn||p.name) + ' added!');
}
function removeFromCart(id) { cart = cart.filter(x => x.id !== id); localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); renderCart(); }
function updateQty(id, q) { const i = cart.findIndex(x => x.id === id); if (i >= 0) { if (q <= 0) cart.splice(i,1); else cart[i].qty = Math.min(q, cart[i].maxQty); } localStorage.setItem('cart', JSON.stringify(cart)); updateCartBadge(); renderCart(); }
function clearCart() { cart = []; localStorage.setItem('cart', '[]'); updateCartBadge(); renderCart(); }

// ===== WISHLIST =====
function toggleWish(id) { const i = wishlist.indexOf(id); if (i >= 0) wishlist.splice(i,1); else wishlist.push(id); localStorage.setItem('wishlist', JSON.stringify(wishlist)); }

// ===== TOAST =====
function showToast(msg) {
  let t = document.createElement('div');
  t.style.cssText = 'position:fixed;top:64px;left:50%;transform:translateX(-50%);z-index:999;background:var(--card);padding:10px 20px;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);font-size:12px;font-weight:500;border-left:3px solid var(--s);animation:fadeUp .3s ease;max-width:90%';
  t.textContent = msg; document.body.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(-50%) translateY(-10px)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, 2500);
}

// ===== RENDER FUNCTIONS =====
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('active', t.dataset.page === page));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  updateCartBadge();
  if (page === 'home') renderHome();
  else if (page === 'shop') renderShop();
  else if (page === 'cart') renderCart();
  else if (page === 'profile') renderProfile();
}

// ===== STAR RATING =====
function stars(r) { r = r || 0; const f = Math.floor(r), h = r % 1 >= .5 ? 1 : 0, e = 5 - f - h; return '★'.repeat(f) + (h ? '½' : '') + '☆'.repeat(e); }

// ===== BADGE COLOR =====
function bc(b) { const m = {sale:'#dc2626',hot:'#ea580c',new:'#16a34a','best-seller':'#7c3aed',popular:'#2563eb',premium:'#1e293b','big-deal':'#b91c1c',educational:'#0d9488'}; return m[b] || '#dc2626'; }

// ===== HOME =====
function renderHome() {
  const top = [...products].sort((a,b) => (b.soldCount||0)-(a.soldCount||0)).slice(0,8);
  const offs = products.filter(p => p.originalPrice && p.originalPrice > p.price).slice(0,6);
  const pc = products.length;
  document.getElementById('page-home').innerHTML = \`
    <section class="hero">
      <h2>🏪 Welcome!</h2>
      <p>Premium products at great prices</p>
      <button class="checkout-btn" style="width:auto;padding:8px 24px;margin:0 auto;display:inline-block;background:#fff;color:#1e40af;font-size:13px" onclick="showPage('shop')">🛍️ Shop Now</button>
      <div class="hero-stats">
        <div class="hero-stat"><div class="v">\${pc}+</div><div class="l">Products</div></div>
        <div class="hero-stat"><div class="v">⭐\${(products.reduce((m,p)=>Math.max(m,p.rating||0),0)||4.9).toFixed(1)}</div><div class="l">Rating</div></div>
        <div class="hero-stat"><div class="v">FREE</div><div class="l">Delivery</div></div>
      </div>
    </section>
    \${offs.length ? '<div class="section-title">🔥 Special Offers</div><div style="display:flex;gap:10px;overflow-x:auto;padding:0 0 12px">' + offs.map(p => '<div style="flex-shrink:0;width:160px;background:var(--card);border-radius:var(--r);overflow:hidden;border:1px solid var(--border);cursor:pointer" onclick="openProduct('+p.id+')"><img src="'+p.image+'" style="width:100%;height:120px;object-fit:cover"><div style="padding:8px"><div style="font-size:12px;font-weight:700;color:var(--p)">'+price(p.price)+'</div>'+(p.originalPrice?'<div style="font-size:10px;color:var(--mfg);text-decoration:line-through">'+price(p.originalPrice)+'</div>':'')+'</div></div>').join('') + '</div>' : ''}
    <div class="section-title">⭐ Featured Products</div>
    <div class="grid">
      \${top.map(p => cardHTML(p)).join('')}
    </div>
  \`;
}

// ===== SHOP =====
let sSearch = '', sCat = 'all', sSort = '';
const CATS = ['all','electronics','fashion','home','beauty','groceries','books','sports','baby'];
const CAT_ICONS = {all:'📋',electronics:'📱',fashion:'👗',home:'🏠',beauty:'💄',groceries:'🍎',books:'📚',sports:'⚽',baby:'👶'};

function renderShop() {
  let f = [...products];
  if (sCat !== 'all') f = f.filter(p => p.category === sCat);
  if (sSearch) { const q = sSearch.toLowerCase(); f = f.filter(p => (p.nameEn||'').toLowerCase().includes(q) || (p.name||'').toLowerCase().includes(q)); }
  if (sSort === 'low') f.sort((a,b) => a.price - b.price);
  else if (sSort === 'high') f.sort((a,b) => b.price - a.price);
  else if (sSort === 'new') f.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
  else f.sort((a,b) => (b.soldCount||0) - (a.soldCount||0));
  document.getElementById('page-shop').innerHTML = \`
    <div class="srch"><input placeholder="🔍 \${t('search')}..." value="\${sSearch}" oninput="sSearch=this.value;renderShop()"></div>
    <div class="cat-bar">\${CATS.map(c => '<span class="cat '+(sCat===c?'active':'')+'" onclick="sCat=\\''+c+'\\';renderShop()">\${CAT_ICONS[c]} \${c.charAt(0).toUpperCase()+c.slice(1)}</span>').join('')}</div>
    <div class="sort-bar">\${[{id:'',l:'🔥 Best'},{id:'low',l:'💰 Low'},{id:'high',l:'💰 High'},{id:'new',l:'🆕 New'}].map(s => '<span class="sort-btn '+(sSort===s.id?'active':'')+'" onclick="sSort=\\''+s.id+'\\';renderShop()">\${s.l}</span>').join('')}</div>
    <div style="font-size:10px;color:var(--mfg);padding:0 0 8px">\${f.length} products</div>
    \${f.length ? '<div class="grid">' + f.map(p => cardHTML(p)).join('') + '</div>' : '<div class="empty"><span class="empty-ic">🔍</span>No products found</div>'}
  \`;
}

// ===== CART =====
function renderCart() {
  const groups = {};
  cart.forEach(i => { const v = i.vendorName || 'Smart Shop'; if (!groups[v]) groups[v] = []; groups[v].push(i); });
  const total = cart.reduce((s,i) => s + i.price * i.qty, 0);
  document.getElementById('page-cart').innerHTML = \`
    <div class="section-title">🛒 Cart (\${cart.length})</div>
    \${cart.length === 0 ? '<div class="empty"><span class="empty-ic">🛒</span>Cart is empty</div>' :
      Object.entries(groups).map(([v, items]) => '<div style="margin-bottom:8px"><div style="font-size:10px;font-weight:600;color:var(--mfg);padding:4px 0">🏪 \${v}</div>' +
        items.map(i => '<div class="pitem" onclick="openProduct(\${i.id})"><img src="\${i.image}"><div class="pitem-info"><div class="pitem-n">\${i.name}</div><div class="pitem-p">Br \${(i.price*i.qty).toLocaleString()}</div><div class="qty" style="margin-top:4px"><button onclick="event.stopPropagation();updateQty(\${i.id},\${i.qty-1})">−</button><span>\${i.qty}</span><button onclick="event.stopPropagation();updateQty(\${i.id},\${i.qty+1})">+</button></div></div></div>').join('') + '</div>').join('') +
      '<div class="summary"><div class="sum-row"><span>Subtotal</span><span>Br \${total.toLocaleString()}</span></div><div class="sum-row"><span style="color:var(--s)">Free Delivery</span><span>Br 0</span></div><div class="sum-row sum-total"><span>Total</span><span>Br \${total.toLocaleString()}</span></div><button class="checkout-btn" onclick="showToast(\'✅ Order placed! Coming soon\')">✅ Checkout</button>' +
      (cart.length ? '<button style="width:100%;padding:8px;border:1px solid var(--border);border-radius:8px;margin-top:6px;background:none;color:var(--mfg);font-size:12px;cursor:pointer" onclick="clearCart()">🗑️ Clear Cart</button>' : '') + '</div>'
    }
  \`;
  updateCartBadge();
}

// ===== PROFILE =====
function renderProfile() {
  const nm = localStorage.getItem('name') || 'Guest';
  document.getElementById('page-profile').innerHTML = \`
    <div class="profile-hdr">
      <div class="avatar">\${nm.substring(0,2).toUpperCase()}</div>
      <div class="profile-name">\${nm}</div>
    </div>
    <div class="profile-stats">
      <div class="ps"><div class="ps-v">\${cart.length}</div><div class="ps-l">Cart</div></div>
      <div class="ps"><div class="ps-v">\${wishlist.length}</div><div class="ps-l">Wishlist</div></div>
      <div class="ps"><div class="ps-v">\${products.length}</div><div class="ps-l">Products</div></div>
    </div>
    <div class="menu">
      <div class="mi" onclick="const n=prompt('Name:',nm);if(n&&n.trim()){localStorage.setItem('name',n.trim());renderProfile()}"><span>✏️</span>Edit Name<span class="ar">›</span></div>
      <div class="mi" onclick="renderShop()"><span>🛍️</span>Browse Shop<span class="ar">›</span></div>
      <div class="mi" onclick="toggleTheme()" id="themeBtn"><span>🎨</span>\${dark ? '☀️ Light Mode' : '🌙 Dark Mode'}<span class="ar">›</span></div>
      <div class="mi" style="flex-direction:column;align-items:stretch;background:var(--muted);padding:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span>🌐</span><span style="font-size:13px;flex:1">Language</span></div>
        <select class="lang-select" onchange="console.log(this.value)">
          <option value="en">🇬🇧 English</option><option value="am">🇪🇹 አማርኛ</option><option value="om">🌍 Oromoo</option><option value="ti">🇪🇹 ትግርኛ</option><option value="so">🇸🇴 Soomaali</option>
        </select>
      </div>
      <div class="mi" style="color:var(--d)" onclick="if(confirm('Reset?')){localStorage.clear();location.reload()}"><span>🚪</span>Logout<span class="ar">›</span></div>
    </div>
    <div style="text-align:center;font-size:10px;color:var(--mfg);padding:16px">🏪 Smart Shop v3.0</div>
  \`;
}

// ===== HELPERS =====
function cardHTML(p) {
  const wis = wishlist.indexOf(p.id) >= 0;
  return \`<div class="card" onclick="openProduct(\${p.id})">
    <div class="card-img">
      <img src="\${p.image}" alt="\${p.nameEn}" loading="lazy">
      \${p.badge ? '<span class="badge" style="background:'+bc(p.badge)+'">\${p.badge.toUpperCase()}</span>' : ''}
      \${p.stockCount <= 0 ? '<div class="sold"><span>\${t('soldOut')}</span></div>' : ''}
      <button class="wish" onclick="event.stopPropagation();toggleWish(\${p.id});renderHome();renderShop()">\${wis ? '❤️' : '♡'}</button>
    </div>
    <div class="card-body">
      <div class="card-n">\${p.name}</div>
      <div class="card-e">\${p.nameEn}</div>
      <div style="font-size:9px;color:#f59e0b;margin:2px 0">\${stars(p.rating)}</div>
      <div class="card-p">Br \${(p.price||0).toLocaleString()}
        \${p.originalPrice ? '<span class="card-o">Br \${p.originalPrice.toLocaleString()}</span> <span class="disc">-\${Math.round((1-p.price/p.originalPrice)*100)}%</span>' : ''}
      </div>
      <button class="checkout-btn" style="padding:8px;font-size:11px;margin-top:6px" onclick="event.stopPropagation();addToCart(p=\${JSON.stringify(p).replace(/"/g,'&quot;')})">🛒 Add</button>
    </div>
  </div>\`;
}

function price(n) { return 'Br ' + (n||0).toLocaleString(); }

function openProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  alert('🏪 ' + (p.nameEn||p.name) + '\n' + price(p.price) + '\n' + (p.descriptionEn||'') + '\n\nTap Shop to browse all products');
}

function toggleTheme() {
  dark = !dark;
  localStorage.setItem('dark', dark);
  document.documentElement.classList.toggle('dark', dark);
  showPage('profile');
}

// ===== INIT =====
async function init() {
  document.getElementById('page-home').innerHTML = '<div class="loading"><div class="sp"></div>Loading products...</div>';
  const d = await api('products?select=*&order=id.desc');
  if (d && d.products) {
    products = d.products;
    updateCartBadge();
    renderHome();
  } else {
    document.getElementById('page-home').innerHTML = '<div class="empty"><span class="empty-ic">❌</span>Failed to load</div>';
  }
}
init();
<\/script>
</body>
</html>`;

// ==================== API HANDLER ====================
async function handleAPI(path, method, request) {
  const supabaseUrl = SUPABASE_URL + '/rest/v1/' + path.replace('/api/', '') + (path.includes('?') ? '' : '');
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await request.text() : null;
  const res = await fetch(supabaseUrl, { method, headers, body });
  const data = await res.json();

  // Normalize products for frontend
  if (path === '/api/products' && method === 'GET') {
    const products = (Array.isArray(data) ? data : []).map(p => ({
      id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
      price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
      badge: p.badge || '', descriptionEn: p.description_en || '',
      stockCount: p.stock_count || 0, soldCount: p.sold_count || 0,
      inStock: p.in_stock !== false, visible: p.visible !== false,
      rating: p.rating || 4.0, reviews: p.reviews || 0,
      vendorName: p.vendor_name || '', vendorId: p.vendor_id,
      createdAt: p.created_at || '', colors: [], sizes: [], images: [p.image]
    }));
    return new Response(JSON.stringify({ products }), { headers: { 'content-type': 'application/json', ...CORS } });
  }
  
  return new Response(JSON.stringify(data), { headers: { 'content-type': 'application/json', ...CORS } });
}

// ==================== WORKER ENTRY ====================
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // API routes
    if (path.startsWith('/api/')) return handleAPI(path, method, request);

    // Serve the SPA for all other routes (SPA fallback)
    return new Response(HTML, { headers: { 'content-type': 'text/html;charset=UTF-8', ...CORS } });
  }
};
