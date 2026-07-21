import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*', 'Access-Control-Allow-Headers': '*' };

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function normalizeProduct(p: any) {
  return {
    id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
    price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
    images: p.images || [], badge: p.badge || '', description: p.description || '',
    descriptionEn: p.description_en || '', stockCount: p.stock_count || 0,
    soldCount: p.sold_count || 0, rating: p.rating || 4.0, reviews: p.reviews || 0,
    vendorId: p.vendor_id || null, vendorName: p.vendor_name || '',
    inStock: p.in_stock !== false, visible: p.visible !== false,
    colors: p.colors || [], sizes: p.sizes || [], features: p.features || [],
    createdAt: p.created_at || ''
  };
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    // API routes are handled here
    if (path.startsWith('/api/')) {
      const apiPath = path.replace('/api/', '');
      
      try {
        if (apiPath === 'products' && method === 'GET') {
          const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return json({ products: (data || []).map(normalizeProduct) });
        }
        if (apiPath.match(/^\d+$/) && method === 'GET') {
          const { data } = await supabase.from('products').select('*').eq('id', parseInt(apiPath)).single();
          return json({ product: data ? normalizeProduct(data) : null });
        }
        if (apiPath === 'products' && method === 'POST') {
          const body = await request.json();
          const { data } = await supabase.from('products').insert(body).select().single();
          return json({ success: true, product: data });
        }
        if (apiPath === 'settings' && method === 'GET') {
          const { data } = await supabase.from('settings').select('*').single();
          return json({ success: true, settings: data?.data || data || {} });
        }
        if (apiPath === 'settings' && method === 'PUT') {
          const body = await request.json();
          const { data: existing } = await supabase.from('settings').select('*').single();
          if (existing) {
            await supabase.from('settings').update({ data: { ...(existing.data || {}), ...body } }).eq('id', existing.id);
          } else {
            await supabase.from('settings').insert({ data: body });
          }
          return json({ success: true });
        }
        if (apiPath === 'orders' && method === 'GET') {
          const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
          return json({ orders: data || [] });
        }
        if (apiPath === 'orders' && method === 'POST') {
          const body = await request.json();
          body.orderNumber = body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
          const { data } = await supabase.from('orders').insert(body).select().single();
          return json({ success: true, order: data });
        }
        if (apiPath.startsWith('orders/') && method === 'GET') {
          const on = apiPath.replace('orders/', '');
          const { data } = await supabase.from('orders').select('*').eq('orderNumber', on).single();
          return json({ success: true, order: data });
        }
        if (apiPath.match(/^orders\/.*\/cancel$/) && method === 'POST') {
          const on = apiPath.split('/')[1];
          await supabase.from('orders').update({ status: 'cancelled' }).eq('orderNumber', on);
          return json({ success: true });
        }
        if (apiPath === 'vendors' && method === 'GET') {
          const { data } = await supabase.from('vendors').select('*');
          return json({ vendors: data || [] });
        }
        if (apiPath === 'vendors/register' && method === 'POST') {
          const body = await request.json();
          const vendor = { ...body, status: 'pending', joinedAt: new Date().toISOString() };
          const { data } = await supabase.from('vendors').insert(vendor).select().single();
          return json({ success: true, vendor: data });
        }
        if (apiPath.match(/^vendors\/\d+$/) && method === 'PUT') {
          const id = parseInt(apiPath.split('/')[1]);
          const body = await request.json();
          await supabase.from('vendors').update(body).eq('id', id);
          return json({ success: true });
        }
        if (apiPath === 'seed' && method === 'GET') {
          const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
          return json({ products: count || 0, message: 'Database connected. Visit ' + url.origin + ' for the app.' });
        }
      } catch(e: any) {
        return json({ error: e.message }, 500);
      }
      
      return json({ error: 'Not found' }, 404);
    }

    return json({ name: 'Smart Shop API', version: '3.0', status: 'running' });
  }
};
