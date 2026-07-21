// SMART SHOP - API + Static Assets (Single Worker)
// Routes: /api/* -> Supabase API, /* -> Frontend
import { createClient } from '@supabase/supabase-js';
const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };

// Read the built files as strings
const HTML = `PLEASE_REPLACE_ME_WITH_BUILT_HTML`;

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '');
      try {
        if (apiPath === 'products' && method === 'GET') {
          const r = await fetch(`${SUPABASE_URL}/rest/v1/products?select=*&order=id.desc`, { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } });
          const data = await r.json();
          return new Response(JSON.stringify({ products: (data||[]).map(p => ({ id:p.id, name:p.name||'', nameEn:p.name_en||'', category:p.category||'', price:p.price||0, originalPrice:p.original_price||null, image:p.image||'', badge:p.badge||'', descriptionEn:p.description_en||'', stockCount:p.stock_count||0, soldCount:p.sold_count||0, inStock:p.in_stock!==false, visible:p.visible!==false, rating:p.rating||4.0, reviews:p.reviews||0, vendorName:p.vendor_name||'', createdAt:p.created_at||'' })) }), { headers: { 'content-type':'application/json', ...CORS } });
        }
        // Add more API routes as needed
      } catch(e: any) { return new Response(JSON.stringify({ error: e.message }), { status:500, headers: { 'content-type':'application/json', ...CORS } }); }
      return new Response(JSON.stringify({ error:'Not found' }), { status:404, headers: { 'content-type':'application/json', ...CORS } });
    }
    // Serve index.html for all non-API routes (SPA)
    return new Response(HTML, { headers: { 'content-type':'text/html;charset=UTF-8', ...CORS } });
  }
};
