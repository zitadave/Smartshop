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
  {name:"ፕሮ የጆሮ ማዳመጫ",name_en:"Pro Wireless Headphones",category:"electronics",price:4500,original_price:5500,image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",badge:"best-seller",description_en:"Premium wireless headphones with noise cancellation, 30hr battery.",stock_count:25,sold_count:142,in_stock:true,visible:true},
  {name:"ስማርት ዎች ፕሮ ማክስ",name_en:"Smart Watch Pro Max",category:"electronics",price:8500,original_price:9900,image:"https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400",badge:"hot",description_en:"Advanced smartwatch with health monitoring, GPS, 7-day battery.",stock_count:15,sold_count:98,in_stock:true,visible:true},
  {name:"የልጆች ትምህርታዊ ታብሌት",name_en:"Kids Learning Tablet",category:"electronics",price:3200,image:"https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400",badge:"new",description_en:"Educational tablet for kids with pre-loaded learning apps.",stock_count:30,sold_count:56,in_stock:true,visible:true},
  {name:"ፖርታብል ብሉቱዝ ስፒከር",name_en:"Portable Bluetooth Speaker",category:"electronics",price:1800,original_price:2500,image:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400",badge:"sale",description_en:"Powerful portable speaker with deep bass, 12hr playtime.",stock_count:40,sold_count:210,in_stock:true,visible:true},
  {name:"ዲጂታል ካሜራ 48ሜፒ",name_en:"Digital Camera 48MP",category:"electronics",price:12000,original_price:15000,image:"https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400",badge:"premium",description_en:"Professional 48MP digital camera with 4K video.",stock_count:8,sold_count:34,in_stock:true,visible:true},
  {name:"ፕሪሚየም ሐበሻ ቀሚስ",name_en:"Premium Habesha Kemis",category:"fashion",price:3500,original_price:4500,image:"https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400",badge:"best-seller",description_en:"Beautiful handwoven traditional Habesha dress.",stock_count:20,sold_count:167,in_stock:true,visible:true},
  {name:"የኢትዮጵያ ቆዳ ቦርሳ",name_en:"Ethiopian Leather Bag",category:"fashion",price:2800,image:"https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400",badge:"popular",description_en:"Handcrafted genuine leather bag.",stock_count:18,sold_count:73,in_stock:true,visible:true},
  {name:"የስፖርት ልብስ ስብስብ",name_en:"Sportswear Collection Set",category:"fashion",price:2200,image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400",badge:"sale",description_en:"Complete sportswear set.",stock_count:35,sold_count:89,in_stock:true,visible:true},
  {name:"ፕሮፌሽናል ብሌንደር ፕሮ",name_en:"Professional Blender Pro",category:"home",price:5500,original_price:7000,image:"https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400",badge:"hot",description_en:"High-power professional blender.",stock_count:12,sold_count:45,in_stock:true,visible:true},
  {name:"አውቶ ማጠቢያ ማሽን 7ኪግ",name_en:"Auto Washing Machine 7kg",category:"home",price:18500,image:"https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400",badge:"big-deal",description_en:"Automatic washing machine 7kg.",stock_count:5,sold_count:23,in_stock:true,visible:true},
  {name:"የተፈጥሮ ሼአ ቅቤ ክሬም",name_en:"Natural Shea Butter Cream",category:"beauty",price:450,image:"https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400",badge:"best-seller",description_en:"Pure natural shea butter cream.",stock_count:100,sold_count:312,in_stock:true,visible:true},
  {name:"የፀጉር እንክብካቤ ኪት",name_en:"Hair Care Premium Kit",category:"beauty",price:1200,image:"https://images.unsplash.com/photo-1526947425960-945c6e72858f?w=400",badge:"new",description_en:"Complete hair care kit.",stock_count:45,sold_count:78,in_stock:true,visible:true},
  {name:"የኢትዮጵያ ኦርጋኒክ ቡና 1ኪግ",name_en:"Ethiopian Organic Coffee 1kg",category:"groceries",price:850,original_price:1100,image:"https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400",badge:"best-seller",description_en:"Premium single-origin Ethiopian organic coffee.",stock_count:60,sold_count:425,in_stock:true,visible:true},
  {name:"ንጹህ የኢትዮጵያ ማር 500ግ",name_en:"Pure Ethiopian Honey 500g",category:"groceries",price:600,image:"https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400",badge:"popular",description_en:"Pure natural Ethiopian white honey.",stock_count:80,sold_count:289,in_stock:true,visible:true},
  {name:"የልጆች ተረት መጽሐፍት 10pk",name_en:"Children's Story Books 10pk",category:"books",price:950,image:"https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400",badge:"educational",description_en:"Set of 10 educational story books.",stock_count:40,sold_count:134,in_stock:true,visible:true},
  {name:"ፕሪሚየም ዮጋ ምንጣፍ",name_en:"Premium Yoga Mat",category:"sports",price:1500,image:"https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400",badge:"",description_en:"Extra thick premium yoga mat.",stock_count:25,sold_count:56,in_stock:true,visible:true},
  {name:"የሕፃን እንክብካቤ ኪት",name_en:"Baby Care Essential Kit",category:"baby",price:1800,image:"https://images.unsplash.com/photo-1555949960-aa29b8d0a85c?w=400",badge:"new",description_en:"Complete baby care kit.",stock_count:30,sold_count:67,in_stock:true,visible:true}
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
