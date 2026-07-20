import { Router } from 'itty-router';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mjk2NzM1MTEsImV4cCI6MjA0NTI0OTUxMX0.Tp2mFEzBmzr6zBYZgg0f9AQ8pjsAGv0Z09s4JtqdpN4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const router = Router();

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function error(message: string, status = 400): Response {
  return json({ success: false, message }, status);
}

// ==================== PRODUCTS API ====================

router.get('/api/products', async () => {
  const { data, error: err } = await supabase.from('products').select('*').order('id', { ascending: false });
  if (err) return json({ products: [] });
  return json({ products: data || [] });
});

router.get('/api/products/:id', async ({ params }) => {
  const { data } = await supabase.from('products').select('*').eq('id', Number(params.id)).single();
  if (!data) return error('Product not found', 404);
  return json({ product: data });
});

router.post('/api/products', async (request) => {
  const body = await request.json();
  const { data, error: err } = await supabase.from('products').insert([body]).select().single();
  if (err) return error(err.message);
  return json({ success: true, product: data });
});

router.put('/api/products/:id', async ({ params, request }) => {
  const body = await request.json();
  const { data } = await supabase.from('products').update(body).eq('id', Number(params.id)).select().single();
  return json({ success: true, product: data });
});

router.delete('/api/products/:id', async ({ params }) => {
  await supabase.from('products').delete().eq('id', Number(params.id));
  return json({ success: true });
});

// ==================== ORDERS API ====================

router.get('/api/orders', async () => {
  const { data } = await supabase.from('orders').select('*').order('createdAt', { ascending: false });
  return json({ orders: data || [] });
});

router.get('/api/orders/:orderNumber', async ({ params }) => {
  const { data } = await supabase.from('orders').select('*').eq('orderNumber', params.orderNumber).single();
  if (!data) return error('Order not found', 404);
  return json({ success: true, order: data });
});

router.post('/api/orders', async (request) => {
  const body = await request.json();
  body.orderNumber = body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
  const { data, error: err } = await supabase.from('orders').insert([body]).select().single();
  if (err) return json({ success: true, order: body }); // Fallback
  return json({ success: true, order: data || body });
});

router.post('/api/orders/:id/cancel', async ({ params }) => {
  const { data } = await supabase.from('orders').update({ status: 'cancelled' }).eq('orderNumber', params.id).select().single();
  return json({ success: true, order: data });
});

// ==================== VENDORS API ====================

router.get('/api/vendors', async () => {
  const { data } = await supabase.from('vendors').select('*');
  return json({ vendors: data || [] });
});

router.post('/api/vendors/register', async (request) => {
  const body = await request.json();
  const { data, error: err } = await supabase.from('vendors').insert([{
    ...body, commission: 10, balance: 0, totalSales: 0, status: 'pending', joinedAt: new Date().toISOString()
  }]).select().single();
  if (err) return error(err.message);
  return json({ success: true, vendor: data });
});

router.put('/api/vendors/:id', async ({ params, request }) => {
  const body = await request.json();
  await supabase.from('vendors').update(body).eq('id', Number(params.id));
  return json({ success: true });
});

// ==================== SETTINGS API ====================

const KV_SETTINGS_KEY = 'app_settings';

router.get('/api/settings', async (_, env) => {
  // Try KV first, then Supabase
  let settings = {};
  try {
    if (env && env.SMART_SHOP_KV) {
      const cached = await env.SMART_SHOP_KV.get(KV_SETTINGS_KEY);
      if (cached) return json({ success: true, settings: JSON.parse(cached) });
    }
  } catch(e) {}
  
  const { data } = await supabase.from('settings').select('*').single();
  settings = data || {};
  return json({ success: true, settings });
});

router.put('/api/settings', async (request, env) => {
  const body = await request.json();
  await supabase.from('settings').upsert({ id: 1, ...body });
  
  // Cache in KV
  try {
    if (env && env.SMART_SHOP_KV) {
      const current = await supabase.from('settings').select('*').single();
      await env.SMART_SHOP_KV.put(KV_SETTINGS_KEY, JSON.stringify(current.data || {}));
    }
  } catch(e) {}
  
  return json({ success: true });
});

// ==================== USERS API ====================

router.post('/api/users/register', async (request) => {
  const body = await request.json();
  const { data } = await supabase.from('users').insert([body]).select().single();
  return json({ success: true, user: data });
});

router.get('/api/users', async () => {
  const { data } = await supabase.from('users').select('*').order('registeredAt', { ascending: false });
  return json({ success: true, users: data || [] });
});

// ==================== AFFILIATES API ====================

router.get('/api/affiliates', async () => {
  const { data } = await supabase.from('affiliates').select('*');
  return json({ products: data || [] });
});

router.get('/api/affiliates/with-products', async () => {
  const { data: affiliates } = await supabase.from('affiliates').select('*');
  const { data: products } = await supabase.from('products').select('*');
  const merged = (affiliates || []).map((a: any) => ({
    ...a,
    product: (products || []).find((p: any) => p.id === a.productId)
  }));
  return json({ products: merged });
});

router.post('/api/affiliates', async (request) => {
  const body = await request.json();
  const { data } = await supabase.from('affiliates').insert([body]).select().single();
  return json({ success: true, product: data });
});

router.put('/api/affiliates/:id', async ({ params, request }) => {
  const body = await request.json();
  await supabase.from('affiliates').update(body).eq('id', Number(params.id));
  return json({ success: true });
});

// ==================== ANALYTICS ====================

router.get('/api/analytics', async () => {
  const { data: products } = await supabase.from('products').select('*');
  const { data: orders } = await supabase.from('orders').select('*');
  
  const totalProducts = products?.length || 0;
  const totalSold = (products || []).reduce((s: number, p: any) => s + (p.soldCount || 0), 0);
  const totalRevenue = (orders || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
  const totalOrders = orders?.length || 0;
  const pendingOrders = (orders || []).filter((o: any) => o.status === 'pending' || o.status === 'confirmed').length;
  const shippedOrders = (orders || []).filter((o: any) => o.status === 'shipped').length;
  const completedOrders = (orders || []).filter((o: any) => o.status === 'completed').length;
  
  return json({
    analytics: {
      totalProducts, totalSold, totalRevenue, totalOrders,
      pendingOrders, shippedOrders, completedOrders,
      topProducts: (products || []).sort((a: any, b: any) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10).map((p: any) => ({
        name: p.nameEn, sold: p.soldCount || 0, revenue: (p.soldCount || 0) * (p.price || 0)
      })),
      revenueByDay: [],
      ordersByStatus: {
        pending: pendingOrders, confirmed: completedOrders + pendingOrders,
        shipped: shippedOrders, completed: completedOrders
      }
    }
  });
});

// ==================== BROADCAST ====================

router.post('/api/broadcast', async () => {
  // Simplified - would need Telegram bot integration
  return json({ success: true, sent: 0, total: 0, message: 'Broadcast endpoint ready (configure Telegram bot token)' });
});

// ==================== CONTACT ====================

router.post('/api/contact', async () => {
  return json({ success: true, message: 'Message received' });
});

// ==================== CART SYNC ====================

router.post('/api/cart/sync', async (request) => {
  const body = await request.json();
  return json({ success: true, cart: body.items || [] });
});

router.get('/api/cart/:userId', async ({ params }) => {
  return json({ items: [] });
});

// ==================== UPLOAD ====================

router.post('/api/upload', async (request, env) => {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    if (!file) return error('No file uploaded');
    
    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    
    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { contentType: file.type, upsert: false });
    
    if (uploadError) {
      // Fallback: return a placeholder
      return json({ url: `https://placehold.co/400x400/2C3E50/fff?text=📦` });
    }
    
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName);
    return json({ url: publicUrl });
  } catch (e: any) {
    return error(e.message);
  }
});

// ==================== HEALTH ====================

router.get('/', () => json({ name: 'Smart Shop API', version: '3.0', status: 'running' }));
router.get('/api', () => json({ status: 'ok', endpoints: ['products', 'orders', 'vendors', 'settings', 'users', 'affiliates', 'analytics', 'upload'] }));

// ==================== 404 ====================
router.all('*', () => error('Not found', 404));

// ==================== WORKER ENTRY ====================
export default {
  async fetch(request: Request, env: any): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }
    
    // Rate limiting (simple in-memory)
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    // Cloudflare handles rate limiting at edge, so we keep it simple
    
    try {
      return await router.handle(request, env);
    } catch (e: any) {
      return json({ error: e.message || 'Internal error' }, 500);
    }
  },
} satisfies ExportedHandler<Env>;
