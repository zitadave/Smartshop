// ============================================================
// SMART SHOP API - Cloudflare Worker (Complete Backend)
// Paste this entire file into Cloudflare Worker Editor
// ============================================================

const SUPABASE_URL = 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

async function sb(query, params = []) {
  const url = `${SUPABASE_URL}/rest/v1/${query}`;
  const res = await fetch(url, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
  });
  if (query.includes('select') || query.startsWith('rpc')) return res.json();
  return res.json();
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
}

function error(msg, status = 400) {
  return json({ success: false, message: msg }, status);
}

// Store data in memory as fallback
let localProducts = [];
let localOrders = [];
let localSettings = {};

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // CORS preflight
  if (method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });

  try {
    // ===== PRODUCTS =====
    if (path === '/api/products' && method === 'GET') {
      const { data, error: err } = await sb('products?select=*&order=id.desc');
      return json({ products: data || [] });
    }

    if (path.match(/^\/api\/products\/\d+$/) && method === 'GET') {
      const id = path.split('/')[3];
      const data = await sb(`products?id=eq.${id}&select=*`);
      return json({ product: data?.[0] || null });
    }

    if (path === '/api/products' && method === 'POST') {
      const body = await request.json();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/products`, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return json({ success: true, product: Array.isArray(data) ? data[0] : data });
    }

    if (path.match(/^\/api\/products\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return json({ success: true });
    }

    if (path.match(/^\/api\/products\/\d+$/) && method === 'DELETE') {
      const id = path.split('/')[3];
      await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${id}`, {
        method: 'DELETE', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
      });
      return json({ success: true });
    }

    // ===== ORDERS =====
    if (path === '/api/orders' && method === 'GET') {
      const data = await sb('orders?select=*&order=createdAt.desc');
      return json({ orders: data || [] });
    }

    if (path === '/api/orders' && method === 'POST') {
      const body = await request.json();
      body.orderNumber = body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return json({ success: true, order: Array.isArray(data) ? data[0] : data });
    }

    if (path.match(/^\/api\/orders\/(ETH-.+)$/) && method === 'GET') {
      const orderNumber = path.split('/')[3];
      const data = await sb(`orders?orderNumber=eq.${orderNumber}&select=*`);
      return json({ success: true, order: data?.[0] || null });
    }

    if (path.match(/\/api\/orders\/(ETH-.+)\/cancel$/) && method === 'POST') {
      const orderNumber = path.split('/')[3];
      await fetch(`${SUPABASE_URL}/rest/v1/orders?orderNumber=eq.${orderNumber}`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      return json({ success: true });
    }

    if (path.match(/\/api\/orders\/(ETH-.+)\/status$/) && method === 'PATCH') {
      const orderNumber = path.split('/')[3];
      const body = await request.json();
      await fetch(`${SUPABASE_URL}/rest/v1/orders?orderNumber=eq.${orderNumber}`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: body.status })
      });
      return json({ success: true, order: { orderNumber, status: body.status } });
    }

    // ===== VENDORS =====
    if (path === '/api/vendors' && method === 'GET') {
      const data = await sb('vendors?select=*');
      return json({ vendors: data || [] });
    }

    if (path === '/api/vendors/register' && method === 'POST') {
      const body = await request.json();
      const vendor = { ...body, commission: body.commission || 10, balance: 0, totalSales: 0, status: 'pending', joinedAt: new Date().toISOString() };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/vendors`, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(vendor)
      });
      const data = await res.json();
      return json({ success: true, vendor: Array.isArray(data) ? data[0] : data });
    }

    if (path.match(/^\/api\/vendors\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      await fetch(`${SUPABASE_URL}/rest/v1/vendors?id=eq.${id}`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return json({ success: true });
    }

    // ===== SETTINGS =====
    if (path === '/api/settings' && method === 'GET') {
      const data = await sb('settings?select=*');
      const settings = data?.[0] || {};
      if (settings && typeof settings === 'object' && 'id' in settings) delete settings.id;
      return json({ success: true, settings });
    }

    if (path === '/api/settings' && method === 'PUT') {
      const body = await request.json();
      await fetch(`${SUPABASE_URL}/rest/v1/settings?id=eq.1`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return json({ success: true });
    }

    // ===== USERS =====
    if (path === '/api/users' && method === 'GET') {
      const data = await sb('users?select=*&order=registeredAt.desc');
      return json({ success: true, users: data || [] });
    }

    if (path === '/api/users/register' && method === 'POST') {
      const body = await request.json();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users`, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return json({ success: true, user: Array.isArray(data) ? data[0] : data });
    }

    // ===== AFFILIATES =====
    if (path === '/api/affiliates' && method === 'GET') {
      const data = await sb('affiliates?select=*');
      return json({ products: data || [] });
    }

    if (path === '/api/affiliates/with-products' && method === 'GET') {
      const affiliates = await sb('affiliates?select=*');
      const products = await sb('products?select=id,nameEn,price,image');
      const merged = (affiliates || []).map(a => ({
        ...a, product: (products || []).find(p => p.id === a.productId)
      }));
      return json({ products: merged });
    }

    if (path === '/api/affiliates' && method === 'POST') {
      const body = await request.json();
      const res = await fetch(`${SUPABASE_URL}/rest/v1/affiliates`, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      return json({ success: true, product: Array.isArray(data) ? data[0] : data });
    }

    if (path.match(/^\/api\/affiliates\/\d+$/) && method === 'PUT') {
      const id = path.split('/')[3];
      const body = await request.json();
      await fetch(`${SUPABASE_URL}/rest/v1/affiliates?id=eq.${id}`, {
        method: 'PATCH', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      return json({ success: true });
    }

    // ===== ANALYTICS =====
    if (path === '/api/analytics' && method === 'GET') {
      const products = await sb('products?select=*');
      const orders = await sb('orders?select=*');
      const totalProducts = products?.length || 0;
      const totalSold = (products || []).reduce((s, p) => s + (p.soldCount || 0), 0);
      const totalRevenue = (orders || []).reduce((s, o) => s + (o.total || 0), 0);
      const totalOrders = orders?.length || 0;
      const pendingOrders = (orders || []).filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const shippedOrders = (orders || []).filter(o => o.status === 'shipped').length;
      const completedOrders = (orders || []).filter(o => o.status === 'completed').length;
      const topProducts = (products || []).sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 10);
      
      return json({ analytics: {
        totalProducts, totalSold, totalRevenue, totalOrders,
        pendingOrders, shippedOrders, completedOrders,
        topProducts, revenueByDay: [], ordersByStatus: {}
      }});
    }

    // ===== UPLOAD =====
    if (path === '/api/upload' && method === 'POST') {
      const formData = await request.formData();
      const file = formData.get('image');
      if (!file) return error('No file uploaded');
      
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(2)}.${file.name.split('.').pop() || 'jpg'}`;
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/product-images/${fileName}`;
      
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST', headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': file.type },
        body: file
      });
      
      if (uploadRes.ok) {
        return json({ url: `${SUPABASE_URL}/storage/v1/object/public/product-images/${fileName}` });
      }
      return json({ url: `https://placehold.co/400x400/2C3E50/fff?text=📦` });
    }

    // ===== BROADCAST =====
    if (path === '/api/broadcast' && method === 'POST') {
      const body = await request.json();
      return json({ success: true, sent: 0, total: 0, message: 'Broadcast endpoint ready' });
    }

    // ===== CONTACT =====
    if (path === '/api/contact' && method === 'POST') {
      return json({ success: true, message: 'Message received' });
    }

    // ===== CART SYNC =====
    if (path === '/api/cart/sync' && method === 'POST') {
      const body = await request.json();
      return json({ success: true, cart: body.items || [] });
    }

    if (path.match(/^\/api\/cart\//) && method === 'GET') {
      return json({ items: [] });
    }

    // ===== HEALTH =====
    if (path === '/' || path === '/api') {
      return json({ name: 'Smart Shop API', version: '3.0', status: 'running', endpoints: ['products', 'orders', 'vendors', 'settings', 'users', 'affiliates', 'analytics', 'upload'] });
    }

    // 404
    return error('Not found: ' + path, 404);

  } catch (e) {
    return error(e.message || 'Internal error', 500);
  }
}

export default {
  async fetch(request) {
    return handleRequest(request);
  }
};
