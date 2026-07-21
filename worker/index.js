// ============================================================
// SMART SHOP API - Cloudflare Worker (Complete Backend)
// ============================================================

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,PATCH,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type,Authorization' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

async function sb(query, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...options.headers },
    ...options
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch(e) { return text; }
}

const SEED_PRODUCTS = [
  {name:"ፕሮ የጆሮ ማዳመጫ",nameEn:"Pro Wireless Headphones",category:"electronics",price:4500,originalPrice:5500,stockCount:25,soldCount:142,rating:4.8,reviews:89,badge:"best-seller",image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",vendorName:"TechHub Ethiopia",inStock:true,visible:true,descriptionEn:"Premium wireless headphones with noise cancellation, 30hr battery, and crystal-clear sound quality."},
  {name:"ስማርት ዎች ፕሮ ማክስ",nameEn:"Smart Watch Pro Max",category:"electronics",price:8500,originalPrice:9900,stockCount:15,soldCount:98,rating:4.7,reviews:67,badge:"hot",image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",vendorName:"TechHub Ethiopia",inStock:true,visible:true,descriptionEn:"Advanced smartwatch with health monitoring, GPS, 7-day battery, and waterproof design."},
  {name:"የልጆች ትምህርታዊ ታብሌት",nameEn:"Kids Learning Tablet",category:"electronics",price:3200,stockCount:30,soldCount:56,rating:4.5,reviews:34,badge:"new",image:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",vendorName:"EduTech Solutions",inStock:true,visible:true,descriptionEn:"Educational tablet for kids with pre-loaded learning apps, parental controls, and durable build."},
  {name:"ፖርታብል ብሉቱዝ ስፒከር",nameEn:"Portable Bluetooth Speaker",category:"electronics",price:1800,originalPrice:2500,stockCount:40,soldCount:210,rating:4.6,reviews:124,badge:"sale",image:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",vendorName:"Audio Pro ET",inStock:true,visible:true,descriptionEn:"Powerful portable speaker with deep bass, 12hr playtime, and water-resistant design."},
  {name:"ዲጂታል ካሜራ 48ሜፒ",nameEn:"Digital Camera 48MP",category:"electronics",price:12000,originalPrice:15000,stockCount:8,soldCount:34,rating:4.9,reviews:28,badge:"premium",image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",vendorName:"PhotoPro Shop",inStock:true,visible:true,descriptionEn:"Professional 48MP digital camera with 4K video, optical zoom, and image stabilization."},
  {name:"ፕሪሚየም ሐበሻ ቀሚስ",nameEn:"Premium Habesha Kemis",category:"fashion",price:3500,originalPrice:4500,stockCount:20,soldCount:167,rating:4.8,reviews:92,badge:"best-seller",image:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",vendorName:"Habesha Handcrafts",inStock:true,visible:true,descriptionEn:"Beautiful handwoven traditional Habesha dress with intricate gold embroidery."},
  {name:"የኢትዮጵያ ቆዳ ቦርሳ",nameEn:"Ethiopian Leather Bag",category:"fashion",price:2800,stockCount:18,soldCount:73,rating:4.5,reviews:41,badge:"popular",image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",vendorName:"Habesha Handcrafts",inStock:true,visible:true,descriptionEn:"Handcrafted genuine leather bag made by Ethiopian artisans. Durable and stylish."},
  {name:"የስፖርት ልብስ ስብስብ",nameEn:"Sportswear Collection Set",category:"fashion",price:2200,stockCount:35,soldCount:89,rating:4.3,reviews:56,badge:"sale",image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",vendorName:"SportZone Ethiopia",inStock:true,visible:true,descriptionEn:"Complete sportswear set including top, shorts, and accessories for your workout."},
  {name:"ፕሮፌሽናል ብሌንደር ፕሮ",nameEn:"Professional Blender Pro",category:"home",price:5500,originalPrice:7000,stockCount:12,soldCount:45,rating:4.6,reviews:33,badge:"hot",image:"https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400",vendorName:"HomePlus Ethiopia",inStock:true,visible:true,descriptionEn:"High-power professional blender with 6 blades, variable speed, and 2L capacity."},
  {name:"አውቶ ማጠቢያ ማሽን 7ኪግ",nameEn:"Auto Washing Machine 7kg",category:"home",price:18500,stockCount:5,soldCount:23,rating:4.4,reviews:19,badge:"big-deal",image:"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400",vendorName:"HomePlus Ethiopia",inStock:true,visible:true,descriptionEn:"Automatic washing machine with 7kg capacity, energy efficient, and multiple wash programs."},
  {name:"የተፈጥሮ ሼአ ቅቤ ክሬም",nameEn:"Natural Shea Butter Cream",category:"beauty",price:450,stockCount:100,soldCount:312,rating:4.7,reviews:156,badge:"best-seller",image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",vendorName:"Nature's Gift Ethiopia",inStock:true,visible:true,descriptionEn:"Pure natural shea butter cream for skin moisturizing and hair care. Chemical-free."},
  {name:"የፀጉር እንክብካቤ ኪት",nameEn:"Hair Care Premium Kit",category:"beauty",price:1200,stockCount:45,soldCount:78,rating:4.4,reviews:44,badge:"new",image:"https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400",vendorName:"Nature's Gift Ethiopia",inStock:true,visible:true,descriptionEn:"Complete hair care kit with shampoo, conditioner, oil, and hair mask. Natural ingredients."},
  {name:"የኢትዮጵያ ኦርጋኒክ ቡና 1ኪግ",nameEn:"Ethiopian Organic Coffee 1kg",category:"groceries",price:850,originalPrice:1100,stockCount:60,soldCount:425,rating:4.9,reviews:234,badge:"best-seller",image:"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",vendorName:"EthioGold Coffee",inStock:true,visible:true,descriptionEn:"Premium single-origin Ethiopian organic coffee. Rich flavor with fruity notes."},
  {name:"ንጹህ የኢትዮጵያ ማር 500ግ",nameEn:"Pure Ethiopian Honey 500g",category:"groceries",price:600,stockCount:80,soldCount:289,rating:4.7,reviews:178,badge:"popular",image:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",vendorName:"EthioGold Coffee",inStock:true,visible:true,descriptionEn:"Pure natural Ethiopian white honey. Harvested from highland forests. Unprocessed."},
  {name:"የልጆች ተረት መጽሐፍት 10pk",nameEn:"Children's Story Books 10pk",category:"books",price:950,stockCount:40,soldCount:134,rating:4.6,reviews:67,badge:"educational",image:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",vendorName:"EduTech Solutions",inStock:true,visible:true,descriptionEn:"Set of 10 educational story books for children. Amharic and English bilingual."},
  {name:"ፕሪሚየም ዮጋ ምንጣፍ",nameEn:"Premium Yoga Mat",category:"sports",price:1500,stockCount:25,soldCount:56,rating:4.3,reviews:31,badge:"",image:"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",vendorName:"SportZone Ethiopia",inStock:true,visible:true,descriptionEn:"Extra thick premium yoga mat with non-slip surface. Includes carrying strap."},
  {name:"የሕፃን እንክብካቤ ኪት",nameEn:"Baby Care Essential Kit",category:"baby",price:1800,stockCount:30,soldCount:67,rating:4.5,reviews:42,badge:"new",image:"https://images.unsplash.com/photo-1555949960-aa29b8d0a85c?w=400",vendorName:"BabyLove Ethiopia",inStock:true,visible:true,descriptionEn:"Complete baby care kit including lotion, shampoo, wipes, and diaper cream."}
];

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    
    try {
      // ===== SEED DATABASE (GET /api/seed) =====
      if (path === '/api/seed' && method === 'GET') {
        let count = 0;
        for (const p of SEED_PRODUCTS) {
          try {
            await sb('products', { method: 'POST', body: JSON.stringify(p) });
            count++;
          } catch(e) {}
        }
        return json({ success: true, message: `Seeded ${count} products. Refresh to check.` });
      }

      // ===== PRODUCTS =====
      if (path === '/api/products' && method === 'GET') {
        const data = await sb('products?select=*&order=id.desc');
        return json({ products: Array.isArray(data) ? data : [] });
      }
      if (path.match(/^\/api\/products\/\d+$/) && method === 'GET') {
        const id = path.split('/')[3];
        const data = await sb(`products?id=eq.${id}&select=*`);
        return json({ product: data?.[0] || null });
      }
      if (path === '/api/products' && method === 'POST') {
        const body = await request.json();
        const data = await sb('products', { method: 'POST', body: JSON.stringify(body) });
        return json({ success: true, product: Array.isArray(data) ? data[0] : data });
      }
      if (path.match(/^\/api\/products\/\d+$/) && method === 'PUT') {
        const id = path.split('/')[3]; const body = await request.json();
        await sb(`products?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        return json({ success: true });
      }
      if (path.match(/^\/api\/products\/\d+$/) && method === 'DELETE') {
        const id = path.split('/')[3];
        await sb(`products?id=eq.${id}`, { method: 'DELETE' });
        return json({ success: true });
      }

      // ===== ORDERS =====
      if (path === '/api/orders' && method === 'GET') {
        const data = await sb('orders?select=*&order=createdAt.desc');
        return json({ orders: Array.isArray(data) ? data : [] });
      }
      if (path === '/api/orders' && method === 'POST') {
        const body = await request.json();
        body.orderNumber = body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
        const data = await sb('orders', { method: 'POST', body: JSON.stringify(body) });
        return json({ success: true, order: Array.isArray(data) ? data[0] : data });
      }
      if (path.match(/\/api\/orders\/(ETH-.+)\/cancel$/) && method === 'POST') {
        const on = path.split('/')[3];
        await sb(`orders?orderNumber=eq.${on}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) });
        return json({ success: true });
      }
      if (path.match(/\/api\/orders\/(ETH-.+)\/status$/) && method === 'PATCH') {
        const on = path.split('/')[3]; const body = await request.json();
        await sb(`orders?orderNumber=eq.${on}`, { method: 'PATCH', body: JSON.stringify({ status: body.status }) });
        return json({ success: true });
      }
      if (path.match(/\/api\/orders\/(ETH-.+)$/) && method === 'GET') {
        const on = path.split('/')[3];
        const data = await sb(`orders?orderNumber=eq.${on}&select=*`);
        return json({ success: true, order: data?.[0] || null });
      }

      // ===== VENDORS =====
      if (path === '/api/vendors' && method === 'GET') {
        const data = await sb('vendors?select=*');
        return json({ vendors: Array.isArray(data) ? data : [] });
      }
      if (path === '/api/vendors/register' && method === 'POST') {
        const body = await request.json();
        const v = { ...body, commission: body.commission||10, balance: 0, totalSales: 0, status: 'pending', joinedAt: new Date().toISOString() };
        const data = await sb('vendors', { method: 'POST', body: JSON.stringify(v) });
        return json({ success: true, vendor: Array.isArray(data) ? data[0] : data });
      }
      if (path.match(/^\/api\/vendors\/\d+$/) && method === 'PUT') {
        const id = path.split('/')[3]; const body = await request.json();
        await sb(`vendors?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        return json({ success: true });
      }

      // ===== SETTINGS =====
      if (path === '/api/settings' && method === 'GET') {
        const data = await sb('settings?select=*');
        const s = (Array.isArray(data) && data[0]) || {};
        delete s.id;
        return json({ success: true, settings: s.data || s || {} });
      }
      if (path === '/api/settings' && method === 'PUT') {
        const body = await request.json();
        const existing = await sb('settings?select=*');
        if (Array.isArray(existing) && existing.length > 0) {
          const current = existing[0];
          const merged = { ...(current.data || current), ...body };
          await sb(`settings?id=eq.${current.id}`, { method: 'PATCH', body: { data: merged } });
        } else {
          await sb('settings', { method: 'POST', body: { data: body } });
        }
        return json({ success: true });
      }

      // ===== USERS =====
      if (path === '/api/users' && method === 'GET') {
        const data = await sb('users?select=*&order=registeredAt.desc');
        return json({ success: true, users: Array.isArray(data) ? data : [] });
      }
      if (path === '/api/users/register' && method === 'POST') {
        const body = await request.json();
        const data = await sb('users', { method: 'POST', body: JSON.stringify(body) });
        return json({ success: true, user: Array.isArray(data) ? data[0] : data });
      }

      // ===== AFFILIATES =====
      if (path === '/api/affiliates' && method === 'GET') {
        const data = await sb('affiliates?select=*');
        return json({ products: Array.isArray(data) ? data : [] });
      }
      if (path === '/api/affiliates/with-products' && method === 'GET') {
        const aff = await sb('affiliates?select=*');
        const prods = await sb('products?select=id,nameEn,price,image');
        const merged = (Array.isArray(aff) ? aff : []).map(a => ({ ...a, product: (Array.isArray(prods) ? prods : []).find(p => p.id === a.productId) }));
        return json({ products: merged });
      }
      if (path === '/api/affiliates' && method === 'POST') {
        const body = await request.json();
        const data = await sb('affiliates', { method: 'POST', body: JSON.stringify(body) });
        return json({ success: true, product: Array.isArray(data) ? data[0] : data });
      }
      if (path.match(/^\/api\/affiliates\/\d+$/) && method === 'PUT') {
        const id = path.split('/')[3]; const body = await request.json();
        await sb(`affiliates?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(body) });
        return json({ success: true });
      }

      // ===== ANALYTICS =====
      if (path === '/api/analytics' && method === 'GET') {
        const prods = Array.isArray(await sb('products?select=*')) ? await sb('products?select=*') : [];
        const ords = Array.isArray(await sb('orders?select=*')) ? await sb('orders?select=*') : [];
        return json({ analytics: {
          totalProducts: prods.length, totalSold: prods.reduce((s,p) => s+(p.soldCount||0),0),
          totalRevenue: ords.reduce((s,o) => s+(o.total||0),0), totalOrders: ords.length,
          pendingOrders: ords.filter(o => o.status==='pending'||o.status==='confirmed').length,
          shippedOrders: ords.filter(o => o.status==='shipped').length,
          completedOrders: ords.filter(o => o.status==='completed').length,
          topProducts: prods.sort((a,b) => (b.soldCount||0)-(a.soldCount||0)).slice(0,10),
          revenueByDay: [], ordersByStatus: {}
        }});
      }

      // ===== UPLOAD =====
      if (path === '/api/upload' && method === 'POST') {
        const fd = await request.formData();
        const file = fd.get('image');
        if (!file) return json({ url: 'https://placehold.co/400x400/2C3E50/fff?text=📦' });
        const fn = `products/${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
        const r = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${fn}`, {
          method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }, body: file
        });
        return json({ url: r.ok ? `${SUPABASE_URL}/storage/v1/object/public/product-images/${fn}` : 'https://placehold.co/400x400/2C3E50/fff?text=📦' });
      }

      // ===== CART =====
      if (path === '/api/cart/sync' && method === 'POST') {
        const body = await request.json(); return json({ success: true, cart: body.items || [] });
      }
      if (path.match(/^\/api\/cart\//) && method === 'GET') {
        return json({ items: [] });
      }

      // ===== CONTACT / BROADCAST =====
      if (path === '/api/contact' && method === 'POST') return json({ success: true });
      if (path === '/api/broadcast' && method === 'POST') return json({ success: true, sent: 0, total: 0 });

      // ===== HEALTH =====
      if (path === '/' || path === '/api') {
        return json({ name: 'Smart Shop API', version: '3.0', status: 'running', seed: SUPABASE_URL + '/rest/v1/products' });
      }

      return json({ error: 'Not found: ' + path }, 404);
    } catch (e) {
      return json({ error: e.message, message: 'Try visiting /api/seed to create tables' }, 500);
    }
  }
};
