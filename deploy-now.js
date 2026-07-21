// SMART SHOP - Complete Worker API
const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS', 'Access-Control-Allow-Headers': '*' };

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json', ...CORS } });
}

function norm(p) {
  return {
    id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
    price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
    badge: p.badge || '', descriptionEn: p.description_en || '',
    stockCount: p.stock_count || 0, soldCount: p.sold_count || 0,
    inStock: p.in_stock !== false, visible: p.visible !== false,
    rating: p.rating || 4.0, reviews: p.reviews || 0,
    vendorName: p.vendor_name || '', vendorId: p.vendor_id,
    createdAt: p.created_at || '', colors: [], sizes: []
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // API
    if (url.pathname.startsWith('/api/')) {
      try {
        const apiPath = url.pathname;
        
        // PRODUCTS
        if (apiPath === '/api/products' && method === 'GET') {
          const r = await fetch(SUPABASE_URL + '/rest/v1/products?select=*&order=id.desc', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
          });
          const d = await r.json();
          return json({ products: (Array.isArray(d) ? d : []).map(norm) });
        }

        // SETTINGS
        if (apiPath === '/api/settings' && method === 'GET') {
          const r = await fetch(SUPABASE_URL + '/rest/v1/settings?select=*', {
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY }
          });
          const d = await r.json();
          return json({ success: true, settings: {} });
        }

        // ORDERS
        if (apiPath === '/api/orders' && method === 'POST') {
          const b = await request.json();
          b.orderNumber = b.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
          const r = await fetch(SUPABASE_URL + '/rest/v1/orders', {
            method: 'POST',
            headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
            body: JSON.stringify(b)
          });
          return json({ success: true, order: b });
        }

        return json({ error: 'Not found' }, 404);
      } catch (e) { return json({ error: e.message }, 500); }
    }

    // Root health check
    return json({ name: 'Smart Shop API', version: '3.0', status: 'ok', products: 'GET /api/products' });
  }
};
