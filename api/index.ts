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
    createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false,
    preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null,
  };
}

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    // ======================== PRODUCTS ========================
    if (path.startsWith('/api/products')) {
      if (method === 'GET') {
        if (path === '/api/products') {
          const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return json({ products: (data || []).map(normalizeProduct) });
        }
        const id = parseInt(path.replace('/api/products/', ''));
        if (!isNaN(id)) {
          const { data } = await supabase.from('products').select('*').eq('id', id).single();
          return json({ product: data ? normalizeProduct(data) : null });
        }
      }
      if (method === 'POST') {
        const body = await request.json();
        const { data } = await supabase.from('products').insert(body).select().single();
        return json({ success: true, product: data });
      }
      if (method === 'PUT') {
        const id = parseInt(path.replace('/api/products/', ''));
        const body = await request.json();
        await supabase.from('products').update(body).eq('id', id);
        return json({ success: true });
      }
      if (method === 'DELETE') {
        const id = parseInt(path.replace('/api/products/', ''));
        await supabase.from('products').delete().eq('id', id);
        return json({ success: true });
      }
    }

    // ======================== SETTINGS ========================
    if (path === '/api/settings') {
      if (method === 'GET') {
        const { data } = await supabase.from('settings').select('*').single();
        const s = data?.data || data || {};
        if (typeof s === 'object' && !Array.isArray(s)) {
          // If settings exist with data field, return it
          if (data?.data) return json({ success: true, settings: data.data });
          return json({ success: true, settings: data || {} });
        }
        return json({ success: true, settings: {} });
      }
      if (method === 'PUT') {
        const body = await request.json();
        const { data: existing } = await supabase.from('settings').select('*').single();
        if (existing) {
          const merged = { ...(existing.data || existing), ...body };
          await supabase.from('settings').update({ data: merged }).eq('id', existing.id);
        } else {
          await supabase.from('settings').insert({ data: body });
        }
        return json({ success: true });
      }
    }

    // ======================== ORDERS ========================
    if (path.startsWith('/api/orders')) {
      if (method === 'GET' && path === '/api/orders') {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return json({ orders: data || [] });
      }
      if (method === 'POST' && path === '/api/orders') {
        const body = await request.json();
        body.order_number = body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
        const { data } = await supabase.from('orders').insert(body).select().single();
        return json({ success: true, order: data || body });
      }
      if (method === 'GET') {
        const on = path.replace('/api/orders/', '');
        const { data } = await supabase.from('orders').select('*').eq('order_number', on).single();
        return json({ success: true, order: data });
      }
      if (method === 'PATCH' && path.includes('/status')) {
        const on = path.split('/')[3];
        const { status } = await request.json();
        await supabase.from('orders').update({ status }).eq('order_number', on);
        return json({ success: true });
      }
      if (method === 'POST' && path.includes('/cancel')) {
        const on = path.split('/')[3];
        await supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', on);
        return json({ success: true });
      }
    }

    // ======================== VENDORS ========================
    if (path.startsWith('/api/vendors')) {
      if (method === 'GET' && path === '/api/vendors') {
        const { data } = await supabase.from('vendors').select('*');
        return json({ vendors: data || [] });
      }
      if (method === 'POST' && path === '/api/vendors/register') {
        const body = await request.json();
        const vendor = { ...body, status: 'pending', joined_at: new Date().toISOString() };
        const { data } = await supabase.from('vendors').insert(vendor).select().single();
        return json({ success: true, vendor: data });
      }
      if (method === 'PUT') {
        const id = parseInt(path.split('/')[3]);
        const body = await request.json();
        await supabase.from('vendors').update(body).eq('id', id);
        return json({ success: true });
      }
    }

    // ======================== ANALYTICS ========================
    if (path === '/api/analytics') {
      const { data: products } = await supabase.from('products').select('*');
      const { data: orders } = await supabase.from('orders').select('*');
      const totalProducts = products?.length || 0;
      const totalSold = products?.reduce((s: number, p: any) => s + (p.sold_count || 0), 0) || 0;
      const totalRevenue = orders?.reduce((s: number, o: any) => s + (o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const pendingOrders = orders?.filter((o: any) => o.status === 'pending').length || 0;
      const shippedOrders = orders?.filter((o: any) => o.status === 'shipped').length || 0;
      const topProducts = [...(products || [])].sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5).map((p: any) => ({ name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }));
      return json({ analytics: { totalProducts, totalSold, totalRevenue, totalOrders, pendingOrders, shippedOrders, topProducts } });
    }

    // ======================== USERS ========================
    if (path === '/api/users' && method === 'GET') {
      const { data } = await supabase.from('users').select('*');
      return json({ success: true, users: data || [] });
    }
    if (path === '/api/users/register' && method === 'POST') {
      const body = await request.json();
      const { data } = await supabase.from('users').insert(body).select().single();
      return json({ success: true, user: data || body });
    }

    // ======================== AFFILIATES ========================
    if (path === '/api/affiliates' && method === 'GET') {
      const { data } = await supabase.from('products').select('*').eq('visible', true);
      return json({ products: (data || []).map(normalizeProduct) });
    }
    if (path === '/api/affiliates/with-products' && method === 'GET') {
      const { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4);
      return json({ products: (data || []).map(normalizeProduct) });
    }

    // ======================== REVIEWS ========================
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') {
        const pid = url.searchParams.get('productId');
        let query = supabase.from('reviews').select('*');
        if (pid) query = query.eq('product_id', parseInt(pid));
        const { data } = await query.order('created_at', { ascending: false });
        return json({ reviews: data || [] });
      }
      if (method === 'POST') {
        const body = await request.json();
        const { data } = await supabase.from('reviews').insert(body).select().single();
        return json({ success: true, review: data });
      }
    }

    // ======================== BROADCAST ========================
    if (path === '/api/broadcast' && method === 'POST') {
      const { message } = await request.json();
      return json({ success: true, sent: 1, total: 1 });
    }

    // ======================== PRE-ORDERS ========================
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') {
        const { data } = await supabase.from('pre_orders').select('*');
        return json({ preOrders: data || [] });
      }
      if (method === 'POST') {
        const body = await request.json();
        const { data } = await supabase.from('pre_orders').insert(body).select().single();
        return json({ success: true, preOrder: data });
      }
    }

    // ======================== CURRENCY RATES ========================
    if (path === '/api/currency/rates' && method === 'GET') {
      return json({ rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' });
    }

    // ======================== RECEIPTS ========================
    if (path.startsWith('/api/receipts/')) {
      if (method === 'GET') {
        const on = path.replace('/api/receipts/', '');
        return json({ success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } });
      }
      if (method === 'POST') {
        const on = path.replace('/api/receipts/', '');
        return json({ success: true, receiptUrl: `/receipt-${on}.html` });
      }
    }

    // ======================== FLASH DEALS ========================
    if (path.startsWith('/api/flash-deals')) {
      if (method === 'GET') {
        const { data } = await supabase.from('settings').select('*').single();
        const flashSales = data?.data?.flashSales || {};
        return json({ deals: Object.entries(flashSales).map(([pid, d]: any) => ({ id: pid, productId: parseInt(pid), ...d })) });
      }
    }

    // ======================== TRACKING ========================
    if (path.startsWith('/api/tracking/')) {
      const on = path.replace('/api/tracking/', '');
      if (method === 'GET') {
        const { data } = await supabase.from('orders').select('*').eq('order_number', on).single();
        return json({ success: true, tracking: data?.tracking || null });
      }
      if (method === 'PUT') {
        const body = await request.json();
        await supabase.from('orders').update({ tracking: body }).eq('order_number', on);
        return json({ success: true });
      }
    }

    // ======================== SEED / HEALTH ========================
    if (path === '/api/seed' && method === 'GET') {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      return json({ products: count || 0, message: 'Smart Shop API is running!' });
    }

    // ======================== UPLOAD ========================
    if (path === '/api/upload' && method === 'POST') {
      return json({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Uploaded' });
    }

    // ======================== FALLBACK ========================
    return json({ error: 'Not found', path, method }, 404);
  }
};
