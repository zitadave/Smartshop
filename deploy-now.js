// SMART SHOP - CORS Worker (deploy this to Workers)
const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0LCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNzg0NDM3OTA2LCJleHAiOjIxMDAwMTM5MDZ9.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const method = request.method;
    
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

    // API endpoint
    if (url.pathname.startsWith('/api/')) {
      const supabaseUrl = SUPABASE_URL + '/rest/v1/' + url.pathname.replace('/api/', '') + url.search;
      const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await request.text() : null;
      
      const res = await fetch(supabaseUrl, {
        method, body,
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
      });
      const data = await res.json();
      
      // Normalize products
      if (url.pathname === '/api/products' && method === 'GET') {
        const products = (Array.isArray(data) ? data : []).map(p => ({
          id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
          price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
          badge: p.badge || '', descriptionEn: p.description_en || '',
          stockCount: p.stock_count || 0, soldCount: p.sold_count || 0,
          inStock: p.in_stock !== false, visible: p.visible !== false,
          rating: p.rating || 4.0, reviews: p.reviews || 0,
          vendorName: p.vendor_name || '', vendorId: p.vendor_id,
          createdAt: p.created_at || ''
        }));
        return new Response(JSON.stringify({ products }), { status: 200, headers: { 'content-type': 'application/json', ...CORS } });
      }
      
      return new Response(JSON.stringify(data), { status: 200, headers: { 'content-type': 'application/json', ...CORS } });
    }
    
    return new Response('Smart Shop API', { status: 200, headers: { 'content-type': 'text/plain', ...CORS } });
  }
};
