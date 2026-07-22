import { createClient } from '@supabase/supabase-js';

// ===== CONFIG =====
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ===== HELPERS =====
function cors(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
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
    createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false,
    preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null,
  };
}

// ===== MAIN HANDLER =====
export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const path = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';

  try {
    // ===== PRODUCTS =====
    if (path.startsWith('/api/products') || (path === '/api/' && method === 'GET')) {
      if (method === 'GET') {
        if (path === '/api/products' || path === '/api/') {
          const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return res.json({ products: (data || []).map(normalizeProduct) });
        }
        const id = parseInt(path.replace('/api/products/', ''));
        if (!isNaN(id)) {
          const { data } = await supabase.from('products').select('*').eq('id', id).single();
          return res.json({ product: data ? normalizeProduct(data) : null });
        }
      }
      if (method === 'POST') { const { data } = await supabase.from('products').insert(req.body).select().single(); return res.json({ success: true, product: data }); }
      if (method === 'PUT') { const id = parseInt(path.split('/').pop() || '0'); await supabase.from('products').update(req.body).eq('id', id); return res.json({ success: true }); }
      if (method === 'DELETE') { const id = parseInt(path.split('/').pop() || '0'); await supabase.from('products').delete().eq('id', id); return res.json({ success: true }); }
    }

    // ===== SETTINGS =====
    if (path === '/api/settings') {
      if (method === 'GET') { const { data } = await supabase.from('settings').select('*').single(); return res.json({ success: true, settings: data?.data || data || {} }); }
      if (method === 'PUT') { const { data: ex } = await supabase.from('settings').select('*').single(); if (ex) { await supabase.from('settings').update({ data: { ...(ex.data || ex), ...req.body } }).eq('id', ex.id); } else { await supabase.from('settings').insert({ data: req.body }); } return res.json({ success: true }); }
    }

    // ===== ORDERS =====
    if (path.startsWith('/api/orders')) {
      if (method === 'GET' && (path === '/api/orders' || path === '/api/')) { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); return res.json({ orders: data || [] }); }
      if (method === 'POST' && (path === '/api/orders' || path === '/api/')) { const body = { ...req.body, order_number: req.body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase() }; const { data } = await supabase.from('orders').insert(body).select().single(); return res.json({ success: true, order: data || body }); }
      if (method === 'GET') { const on = path.replace('/api/orders/', '').split('/')[0]; const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return res.json({ success: true, order: data }); }
      if (method === 'PATCH' && path.includes('/status')) { const on = path.split('/')[3]; await supabase.from('orders').update({ status: req.body.status }).eq('order_number', on); return res.json({ success: true }); }
    }

    // ===== VENDORS =====
    if (path.startsWith('/api/vendors')) {
      if (method === 'GET' && (path === '/api/vendors' || path === '/api/')) { const { data } = await supabase.from('vendors').select('*'); return res.json({ vendors: data || [] }); }
      if (method === 'POST' && path === '/api/vendors/register') { const vendor = { ...req.body, status: 'pending', joined_at: new Date().toISOString() }; const { data } = await supabase.from('vendors').insert(vendor).select().single(); return res.json({ success: true, vendor: data }); }
      if (method === 'PUT') { const id = parseInt(path.split('/').pop() || '0'); await supabase.from('vendors').update(req.body).eq('id', id); return res.json({ success: true }); }
    }

    // ===== ANALYTICS =====
    if (path === '/api/analytics') {
      const { data: products } = await supabase.from('products').select('*');
      const { data: orders } = await supabase.from('orders').select('*');
      const tp = products?.length || 0; const ts = products?.reduce((s: any, p: any) => s + (p.sold_count || 0), 0) || 0;
      const tor = orders?.length || 0; const tr = orders?.reduce((s: any, o: any) => s + (o.total || 0), 0) || 0;
      const po = orders?.filter((o: any) => o.status === 'pending').length || 0;
      const so = orders?.filter((o: any) => o.status === 'shipped').length || 0;
      const top = [...(products || [])].sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5).map((p: any) => ({ name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }));
      return res.json({ analytics: { totalProducts: tp, totalSold: ts, totalRevenue: tr, totalOrders: tor, pendingOrders: po, shippedOrders: so, topProducts: top } });
    }

    // ===== USERS =====
    if (path === '/api/users' && method === 'GET') { const { data } = await supabase.from('users').select('*'); return res.json({ success: true, users: data || [] }); }
    if (path === '/api/users/register' && method === 'POST') { const { data } = await supabase.from('users').insert(req.body).select().single(); return res.json({ success: true, user: data || req.body }); }

    // ===== AFFILIATES =====
    if (path === '/api/affiliates' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true); return res.json({ products: (data || []).map(normalizeProduct) }); }
    if (path === '/api/affiliates/with-products' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4); return res.json({ products: (data || []).map(normalizeProduct) }); }

    // ===== REVIEWS =====
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') { const pid = (req.url?.split('?')[1] || '').split('&').find((s: string) => s.startsWith('productId='))?.split('=')[1]; let q: any = supabase.from('reviews').select('*'); if (pid) q = q.eq('product_id', parseInt(pid)); const { data } = await q.order('created_at', { ascending: false }); return res.json({ reviews: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('reviews').insert(req.body).select().single(); return res.json({ success: true, review: data }); }
    }

    // ===== BROADCAST =====
    if (path === '/api/broadcast' && method === 'POST') { return res.json({ success: true, sent: 1, total: 1 }); }

    // ===== PRE-ORDERS =====
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { const { data } = await supabase.from('pre_orders').select('*'); return res.json({ preOrders: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return res.json({ success: true, preOrder: data }); }
    }

    // ===== CURRENCY =====
    if (path === '/api/currency/rates' && method === 'GET') { return res.json({ rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' }); }

    // ===== RECEIPTS =====
    if (path.startsWith('/api/receipts/') && method === 'GET') { const on = path.replace('/api/receipts/', ''); return res.json({ success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } }); }

    // ===== FLASH DEALS =====
    if (path === '/api/flash-deals' && method === 'GET') { const { data } = await supabase.from('settings').select('*').single(); const fs = data?.data?.flashSales || {}; return res.json({ deals: Object.entries(fs).map(([pid, d]: any) => ({ id: parseInt(pid), productId: parseInt(pid), ...d })) }); }

    // ===== TRACKING =====
    if (path.startsWith('/api/tracking/')) {
      const on = path.replace('/api/tracking/', '');
      if (method === 'GET') { const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return res.json({ success: true, tracking: data?.tracking || null }); }
      if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return res.json({ success: true }); }
    }

    // ===== UPLOAD =====
    if (path === '/api/upload' && method === 'POST') { return res.json({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Uploaded' }); }

    // ===== SEED / HEALTH =====
    if (path === '/api/seed' && method === 'GET') { const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }); return res.json({ products: count || 0, message: 'Smart Shop API running on Vercel!' }); }

    // ===== FALLBACK =====
    return res.status(404).json({ error: 'Not found', path, method });

  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
