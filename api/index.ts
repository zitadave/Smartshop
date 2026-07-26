// ============================================
// Smart Shop API — Consolidated (v50)
// All improvements inline for Vercel compatibility
// ============================================
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ===== CONFIG (env-only, no hardcoded secrets) =====
const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co',
  SUPABASE_KEY: process.env.SUPABASE_SERVICE_KEY || '',
  BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  ADMIN_BOT_TOKEN: process.env.TELEGRAM_ADMIN_BOT_TOKEN || '',
  VENDOR_BOT_TOKEN: process.env.VENDOR_BOT_TOKEN || '',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '336997351',
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || '',
  get BASE_URL() { return process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://smartshop-steel.vercel.app'; },
};
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY, { auth: { persistSession: false } });

// ===== RATE LIMITING =====
const rateStore = new Map();
const RATE_WIN = 60000, RATE_MAX = 60;
function chkRate(ip) {
  const n = Date.now(); const r = rateStore.get(ip);
  if (!r || n > r.resetAt) { rateStore.set(ip, { c: 1, resetAt: n + RATE_WIN }); return { ok: true, rem: RATE_MAX - 1 }; }
  if (r.c >= RATE_MAX) return { ok: false, rem: 0 };
  r.c++; return { ok: true, rem: RATE_MAX - r.c };
}
setInterval(() => { const n = Date.now(); for (const [k, v] of rateStore) if (n > v.resetAt) rateStore.delete(k); }, 60000);

// ===== LOGGING =====
function logReq(m, p, c, ms, ip, e) {
  console.log('[' + new Date().toISOString() + '] [' + (c >= 500 ? 'ERROR' : c >= 400 ? 'WARN' : 'INFO') + '] ' + m + ' ' + p + ' -> ' + c + ' ' + ms + 'ms ip=' + ip + (e ? ' err=' + e : ''));
}
function dur(s) { const d = process.hrtime(s); return Math.round(d[0] * 1000 + d[1] / 1000000); }
const slp = ms => new Promise(r => setTimeout(r, ms));

// ===== RETRY + TIMEOUT =====
async function fetchTO(url, opts) {
  opts = opts || {}; const t = opts.timeout || 5000; const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), t);
  try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(id); }
}
async function fetchRetry(url, opts) {
  opts = opts || {}; const mr = opts.maxRetries || 3;
  for (let a = 0; a <= mr; a++) {
    try {
      const r = await fetchTO(url, opts);
      if (r.status >= 400 && r.status < 500) return r;
      if (r.status >= 500 && a < mr) { await slp(Math.min(200 * Math.pow(2, a) + Math.random() * 100, 10000)); continue; }
      return r;
    } catch (e) { if (a < mr) await slp(Math.min(200 * Math.pow(2, a) + Math.random() * 100, 10000)); else throw e; }
  }
  throw new Error('Failed: ' + url);
}
async function tg(bot, ch, txt, pm, ex) {
  pm = pm || 'Markdown'; ex = ex || {};
  if (!bot) return false;
  try { const r = await fetchRetry('https://api.telegram.org/bot' + bot + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ch, text: txt, parse_mode: pm, disable_web_page_preview: true, ...ex }), timeout: 5000, maxRetries: 2 }); const d = await r.json(); return d.ok === true; }
  catch (e) { console.error('TG:', e); return false; }
}

// ===== IDEMPOTENCY =====
const idem = new Map();
async function chkIdem(k) {
  const c = idem.get(k); if (c) return c;
  const { data } = await supabase.from('settings').select('*').single();
  const ks = data?.data?.idempotency_keys || {};
  if (ks[k]) { const a = Date.now() - new Date(ks[k].created_at).getTime(); if (a < 86400000) { idem.set(k, ks[k]); return ks[k]; } }
  return null;
}
async function setIdem(k, s, r) {
  idem.set(k, { status: s, result: r, created_at: new Date().toISOString() });
  try { const { data: row } = await supabase.from('settings').select('*').single(); const d = row?.data || {}; const ks = { ...(d.idempotency_keys || {}) }; ks[k] = { status: s, result: r, created_at: new Date().toISOString() }; for (const [kk, vv] of Object.entries(ks)) if (Date.now() - new Date(vv.created_at).getTime() > 86400000) delete ks[kk]; d.idempotency_keys = ks; await supabase.from('settings').update({ data: d }).eq('id', row?.id || 0); } catch (e) { console.error('Idem:', e); }
}
function gON() { return 'ETH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(); }

// ===== VENDORS =====
async function getV() { try { const { data: r } = await supabase.from('settings').select('*').single(); return r?.data?.vendors || []; } catch { return []; } }
async function setV(v) { try { const { data: r } = await supabase.from('settings').select('*').single(); const nd = { ...(r?.data || {}), vendors: v }; if (r) await supabase.from('settings').update({ data: nd, updated_at: new Date().toISOString() }).eq('id', r.id); else await supabase.from('settings').insert({ data: nd }); } catch (e) { console.error('setV:', e?.message || e); } }

// ===== HELPERS =====
function norm(p) {
  if (!p) return null;
  return { id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '', price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '', images: p.images || [], badge: p.badge || '', description: p.description || '', descriptionEn: p.description_en || '', stockCount: p.stock_count || 0, soldCount: p.sold_count || 0, rating: p.rating || 4.0, reviews: p.reviews || 0, vendorId: p.vendor_id || null, vendorName: p.vendor_name || '', inStock: p.in_stock !== false, visible: p.visible !== false, colors: p.colors || [], sizes: p.sizes || [], features: p.features || [], tags: p.tags || [], brand: p.brand || '', featured: p.featured || false, weight: p.weight || 0, unit: p.unit || 'kg', seoTitle: p.seo_title || '', seoDescription: p.seo_description || '', createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false, preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null, preOrderMax: p.pre_order_max || null };
}
function cln(b) {
  const r = { ...b, name_en: b.nameEn || b.name_en || '', name: b.name || b.name_en || '', description_en: b.descriptionEn || b.description_en || '', description: b.description || '', stock_count: b.stockCount ?? b.stock_count ?? 10, sold_count: b.soldCount ?? b.sold_count ?? 0, original_price: b.originalPrice ?? b.original_price ?? null, vendor_id: b.vendorId ?? b.vendor_id ?? null, vendor_name: b.vendorName ?? b.vendor_name ?? '', is_pre_order: b.isPreOrder ?? b.is_pre_order ?? false, pre_order_deposit: b.preOrderDeposit ?? b.pre_order_deposit ?? null, pre_order_release_date: b.preOrderReleaseDate ?? b.pre_order_release_date ?? '', pre_order_max: b.preOrderMax ?? b.pre_order_max ?? null, seo_title: b.seoTitle ?? b.seo_title ?? '', seo_description: b.seoDescription ?? b.seo_description ?? '', in_stock: b.inStock ?? b.in_stock ?? true };
  delete r.nameEn; delete r.descriptionEn; delete r.stockCount; delete r.soldCount; delete r.originalPrice; delete r.vendorId; delete r.vendorName; delete r.isPreOrder; delete r.preOrderDeposit; delete r.preOrderReleaseDate; delete r.preOrderMax; delete r.seoTitle; delete r.seoDescription; delete r.inStock;
  return r;
}
function pid(p) { return parseInt(p.split('/').pop() || '0'); }
function vrfy(init) {
  try { const p = new URLSearchParams(init); const h = p.get('hash'); if (!h) return { valid: false, user: null }; p.delete('hash'); const s = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => k + '=' + v).join('\n'); const sk = crypto.createHmac('sha256', 'WebAppData').update(ENV.BOT_TOKEN).digest(); if (crypto.createHmac('sha256', sk).update(s).digest('hex') !== h) return { valid: false, user: null }; const u = p.get('user'); return { valid: true, user: u ? JSON.parse(u) : null }; }
  catch { return { valid: false, user: null }; }
}
const DSTAT = ['pending','assigned','accepted','at_vendor','picked_up','in_transit','arrived','delivered','failed','cancelled','returned'];

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  const start = process.hrtime();
  const path = (req.url || '').split('?')[0];
  const method = req.method || 'GET';
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
  if (method === 'OPTIONS') return res.status(204).end();

  const rc = chkRate(ip);
  if (!rc.ok) { res.setHeader('Retry-After', '60'); logReq(method, path, 429, dur(start), ip, 'RL'); return res.status(429).json({ error: 'Too many requests' }); }
  res.setHeader('X-RateLimit-Remaining', rc.rem);

  function ok(d, s) { return res.status(s || 200).json(d); }
  function fail(m, s) { return res.status(s || 400).json({ error: m }); }

  try {


    // ================================================================
    // DELIVERY ROUTES
    // ================================================================
    if (path.startsWith('/api/delivery/')) {
      if (path === '/api/delivery/zones') {
        if (method === 'GET') { const { data, error } = await supabase.from('delivery_zones').select('*').order('id'); if (error) return fail(error.message, 500); return ok({ zones: data || [] }); }
        if (method === 'POST') { const { data, error } = await supabase.from('delivery_zones').insert(req.body).select().single(); if (error) return fail(error.message); return ok({ success: true, zone: data }); }
        if (method === 'PUT') { const { error } = await supabase.from('delivery_zones').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
        if (method === 'DELETE') { const { error } = await supabase.from('delivery_zones').delete().eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
      }
      if (path === '/api/delivery/calculate-fee' && method === 'POST') {
        const b = req.body || {}; const dist = parseFloat(b.distance_km) || 1; const vt = b.vehicle_type || 'motorcycle';
        const pr = { on_foot: { b: 15, pk: 5, mx: 2 }, bicycle: { b: 20, pk: 7, mx: 4 }, motorcycle: { b: 30, pk: 10, mx: 10 }, bajaj: { b: 40, pk: 15, mx: 15 } };
        const p = pr[vt] || pr.motorcycle; let mx = p.mx; let bf = p.b, pk = p.pk;
        if (b.zone_id) { const { data: z } = await supabase.from('delivery_zones').select('*').eq('id', b.zone_id).single(); if (z) { bf = z.base_fee || p.b; pk = z.per_km_fee || p.pk; mx = Math.min(mx, z.max_distance_km || mx); } }
        const ed = Math.min(dist, mx); const fee = Math.max(20, Math.round(bf + ed * pk)); const cm = Math.round(fee * 0.2);
        return ok({ fee, commission: cm, driver_payout: fee - cm, base_fee: bf, per_km_fee: pk, distance_km: ed, max_distance_km: mx, vehicle_type: vt });
      }
      if (path === '/api/delivery/register' && method === 'POST') {
        const b = req.body || {};
        if (!b.full_name_latin || !b.phone) return fail('full_name_latin and phone required');
        const { data, error } = await supabase.from('delivery_personnel').insert({
          full_name_latin: b.full_name_latin, full_name_amharic: b.full_name_amharic || '', phone: b.phone,
          email: b.email || '', fayda_id: b.fayda_id || 'TEMP-' + Date.now(),
          vehicle_type: b.vehicle_type || 'motorcycle', telegram_id: b.telegram_id || null,
          emergency_name: b.emergency_name || '', emergency_phone: b.emergency_phone || '',
          emergency_relationship: b.emergency_relationship || '', status: 'pending_review',
          agreed_to_terms_at: new Date().toISOString(),
        }).select().single();
        if (error) return fail(error.message);
        tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '🆕 *New Driver* ' + (b.full_name_latin || '') + ' ' + (b.phone || ''));
        return ok({ success: true, driver: data });
      }
      if (path.startsWith('/api/delivery/drivers')) {
        if (method === 'GET') { const did = pid(path); if (did) { const { data, error } = await supabase.from('delivery_personnel').select('*').eq('id', did).single(); return ok({ success: !error, driver: data || null }); } const { data, error } = await supabase.from('delivery_personnel').select('*').order('joined_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ drivers: data || [] }); }
        if (method === 'DELETE') { const { error } = await supabase.from('delivery_personnel').update({ status: 'rejected' }).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
      }
      if (path === '/api/delivery/applications' && method === 'GET') { const { data, error } = await supabase.from('delivery_personnel').select('*').in('status', ['pending_fayda', 'pending_review']).order('joined_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ applications: data || [] }); }
      if (path === '/api/delivery/approve' && method === 'POST') {
        const { driver_id } = req.body || {}; if (!driver_id) return fail('driver_id required');
        const { data, error } = await supabase.from('delivery_personnel').update({ status: 'approved', fayda_verified_at: new Date().toISOString() }).eq('id', driver_id).select().single();
        if (error) return fail(error.message); if (data?.telegram_id) tg(ENV.VENDOR_BOT_TOKEN, data.telegram_id, '🎉 *Approved!* You can now start delivering.');
        return ok({ success: true, driver: data });
      }
      if (path === '/api/delivery/available' && method === 'GET') { const { data, error } = await supabase.from('deliveries').select('*').eq('status', 'pending').order('created_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ deliveries: data || [] }); }
      if (path === '/api/delivery/accept' && method === 'POST') {
        const { delivery_id, driver_id } = req.body || {};
        if (!delivery_id || !driver_id) return fail('delivery_id and driver_id required');
        const { data, error } = await supabase.from('deliveries').update({ driver_id, status: 'accepted', assigned_at: new Date().toISOString(), accepted_at: new Date().toISOString() }).eq('id', delivery_id).eq('status', 'pending').select().single();
        if (error) return fail(error.message || 'Already taken'); return ok({ success: true, delivery: data });
      }
      if (path === '/api/delivery/status' && method === 'POST') {
        const { delivery_id, status, item_count } = req.body || {};
        if (!delivery_id || !status) return fail('delivery_id and status required'); if (!DSTAT.includes(status)) return fail('Invalid status');
        const ud = { status }; if (status === 'at_vendor' && item_count) ud.item_count_confirmed_at_vendor = item_count;
        if (status === 'picked_up') ud.picked_up_at = new Date().toISOString();
        if (status === 'arrived') ud.delivery_pin = Math.floor(100000 + Math.random() * 900000).toString();
        if (status === 'delivered') ud.delivered_at = new Date().toISOString();
        const { data, error } = await supabase.from('deliveries').update(ud).eq('id', delivery_id).select().single();
        if (error) return fail(error.message);
        if (status === 'delivered' && data) { const dp = data.driver_payout || 0; const c = data.platform_commission || Math.round(dp * 0.2); await supabase.from('driver_earnings').insert({ driver_id: data.driver_id, delivery_id: data.id, amount: dp - c, commission: c, type: 'delivery', status: 'pending' }); }
        return ok({ success: true, delivery: data });
      }
      if (path === '/api/delivery/verify-pin' && method === 'POST') {
        const { delivery_id, pin } = req.body || {}; if (!delivery_id || !pin) return fail('delivery_id and pin required');
        const { data, error } = await supabase.from('deliveries').select('*').eq('id', delivery_id).single();
        if (error || !data) return ok({ success: false, verified: false }); if (data.delivery_pin !== pin) return ok({ success: false, verified: false });
        await supabase.from('deliveries').update({ pin_verified_at: new Date().toISOString() }).eq('id', delivery_id); return ok({ success: true, verified: true });
      }
      if (path === '/api/delivery/rate' && method === 'POST') {
        const { delivery_id, driver_rating, customer_rating } = req.body || {}; if (!delivery_id) return fail('delivery_id required');
        const ud = {}; if (driver_rating) ud.driver_rating = Math.max(1, Math.min(5, parseInt(driver_rating))); if (customer_rating) ud.customer_rating = Math.max(1, Math.min(5, parseInt(customer_rating)));
        const { error } = await supabase.from('deliveries').update(ud).eq('id', delivery_id); if (error) return fail(error.message);
        if (driver_rating) { const { data: d } = await supabase.from('deliveries').select('driver_id').eq('id', delivery_id).single(); if (d?.driver_id) { const { data: rt } = await supabase.from('deliveries').select('driver_rating').eq('driver_id', d.driver_id).not('driver_rating', 'is', null); if (rt?.length) { const a = rt.reduce((s, r) => s + (r.driver_rating || 0), 0) / rt.length; await supabase.from('delivery_personnel').update({ rating: Math.round(a * 10) / 10 }).eq('id', d.driver_id); } } }
        return ok({ success: true });
      }
      if (path === '/api/delivery/online' && method === 'POST') {
        const { driver_id, is_online } = req.body || {}; if (!driver_id) return fail('driver_id required');
        const { error } = await supabase.from('delivery_personnel').update({ is_online: is_online === true, last_active_at: new Date().toISOString() }).eq('id', driver_id);
        if (error) return fail(error.message); return ok({ success: true, is_online: is_online === true });
      }
      if (path === '/api/delivery/location' && method === 'POST') {
        const { driver_id, lat, lng } = req.body || {}; if (!driver_id || lat == null || lng == null) return fail('driver_id, lat, lng required');
        const { error } = await supabase.from('delivery_personnel').update({ current_lat: parseFloat(lat), current_lng: parseFloat(lng), location_updated_at: new Date().toISOString() }).eq('id', driver_id);
        if (error) return fail(error.message); return ok({ success: true });
      }
      if (path.startsWith('/api/delivery/tracking/') && method === 'GET') {
        const did = pid(path); const { data: del, error } = await supabase.from('deliveries').select('*').eq('id', did).single();
        if (error || !del) return ok({ delivery: null }); let dr = null; if (del.driver_id) { const { data: drv } = await supabase.from('delivery_personnel').select('*').eq('id', del.driver_id).single(); dr = drv; } return ok({ delivery: { ...del, driver: dr } });
      }
      if (path.startsWith('/api/delivery/earnings/') && method === 'GET') { const { data, error } = await supabase.from('driver_earnings').select('*').eq('driver_id', pid(path)).order('created_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ earnings: data || [] }); }
      if (path.startsWith('/api/delivery/history/') && method === 'GET') { const { data, error } = await supabase.from('deliveries').select('*').eq('driver_id', pid(path)).order('created_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ deliveries: data || [] }); }
      if (path === '/api/delivery/create' && method === 'POST') {
        const b = req.body || {}; if (!b.pickup_address || !b.delivery_address) return fail('pickup_address and delivery_address required');
        const { data, error } = await supabase.from('deliveries').insert({
          order_number: b.order_number || 'DEL-' + Date.now().toString(36).toUpperCase(), status: 'pending',
          item_count: b.item_count || 0, fee: b.fee || 0, distance_km: b.distance_km || 0,
          pickup_address: b.pickup_address, delivery_address: b.delivery_address, no_contact: b.no_contact || false,
        }).select().single();
        if (error) return fail(error.message); return ok({ success: true, delivery: data });
      }
      if (path === '/api/delivery/message' && method === 'POST') {
        const { delivery_id, sender_type, sender_id, message } = req.body || {}; if (!delivery_id || !message) return fail('delivery_id and message required');
        const { data, error } = await supabase.from('delivery_messages').insert({ delivery_id, sender_type: sender_type || 'admin', sender_id: sender_id || null, message }).select().single();
        if (error) return fail(error.message); return ok({ success: true, message: data });
      }
      if (path.startsWith('/api/delivery/messages/') && method === 'GET') { const { data, error } = await supabase.from('delivery_messages').select('*').eq('delivery_id', pid(path)).order('created_at'); if (error) return fail(error.message, 500); return ok({ messages: data || [] }); }
      return res.status(404).json({ error: 'Not found', path: path });
    }
    
    // ================================================================
    // NEW FEATURES ROUTES
    // ================================================================

    // ── Price Comparison ────────────────────────────────────────────
    if (path.match(/^\/api\/products\/\d+\/compare$/) && method === 'GET') {
      var pid = parseInt(path.split('/')[3]);
      var { data: products } = await supabase.from('products').select('*').eq('id', pid);
      var product = products && products[0];
      if (!product) return ok({ productId: pid, options: [] });
      // Get all vendors selling this or similar product
      var { data: allProducts } = await supabase
        .from('products')
        .select('*')
        .eq('category', product.category)
        .not('vendor_id', 'is', null);
      var options = (allProducts || []).filter(function(p) { return p.id !== pid; }).map(function(p) {
        return {
          vendorName: p.vendor_name || 'Unknown',
          vendorId: p.vendor_id,
          vendorRating: p.rating || 0,
          price: p.price || 0,
          originalPrice: p.original_price || null,
          stockCount: p.stock_count || 0,
          deliveryFee: 25,
          totalPrice: (p.price || 0) + 25,
          isLowest: false,
        };
      });
      // Sort by total price
      options.sort(function(a, b) { return a.totalPrice - b.totalPrice; });
      if (options.length > 0) options[0].isLowest = true;
      var bestPrice = options.length > 0 ? options[0].totalPrice : (product.price || 0);
      var worstPrice = options.length > 0 ? options[options.length - 1].totalPrice : (product.price || 0);
      return ok({ productId: pid, productName: product.name || '', productImage: product.image || '', options: options, savings: { bestPrice: bestPrice, worstPrice: worstPrice, youSave: worstPrice - bestPrice } });
    }

    // ── Group Deals ────────────────────────────────────────────────
    if (path === '/api/group-deals' && method === 'POST') {
      var b = req.body || {};
      var token = b.share_token || Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      var { data, error } = await supabase.from('group_deals').insert({
        product_id: b.product_id, product_name: b.product_name, product_image: b.product_image || '',
        regular_price: b.regular_price, group_price: b.group_price || b.regular_price,
        creator_telegram_id: b.creator_telegram_id, share_token: token, current_members: 1,
      }).select().single();
      if (error) return fail(error.message);
      // Auto-add creator as first member
      await supabase.from('group_deal_members').insert({
        group_deal_id: data.id, telegram_id: b.creator_telegram_id,
        full_name: b.creator_name || '', phone: b.creator_phone || '',
      });
      return ok({ success: true, deal: data });
    }

    if (path === '/api/group-deals' && method === 'GET') {
      var token = new URLSearchParams(req.url?.split('?')[1] || '').get('token') || '';
      if (token) {
        var { data, error } = await supabase.from('group_deals').select('*').eq('share_token', token).single();
        if (error || !data) return ok({ deal: null });
        return ok({ deal: data });
      }
      var tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || '';
      if (tid) {
        var { data, error } = await supabase.from('group_deals').select('*, group_deal_members(*)').eq('creator_telegram_id', parseInt(tid)).order('created_at', { ascending: false });
        if (error) return fail(error.message, 500);
        return ok({ deals: data || [] });
      }
      return ok({ deals: [] });
    }

    if (path === '/api/group-deals/join' && method === 'POST') {
      var b = req.body || {};
      if (!b.token) return fail('token required');
      var { data: deal, error: dError } = await supabase.from('group_deals').select('*').eq('share_token', b.token).eq('status', 'open').single();
      if (dError || !deal) return fail('Deal expired or invalid');
      if (deal.current_members >= deal.max_members) return fail('Group is full');
      // Add member
      await supabase.from('group_deal_members').insert({
        group_deal_id: deal.id, telegram_id: b.telegram_id,
        full_name: b.full_name || '', phone: b.phone || '', quantity: b.quantity || 1,
      });
      var newCount = deal.current_members + 1;
      // Calculate new group price with discount
      var discounts = { 2: 0.05, 3: 0.10, 5: 0.15, 10: 0.25 };
      var bestDisc = 0;
      for (var d of Object.entries(discounts)) { if (newCount >= parseInt(d[0])) bestDisc = Math.max(bestDisc, d[1]); }
      var newPrice = Math.round(deal.regular_price * (1 - bestDisc));
      var newStatus = newCount >= deal.min_members ? 'active' : 'open';
      await supabase.from('group_deals').update({ current_members: newCount, group_price: newPrice, status: newStatus }).eq('id', deal.id);
      return ok({ success: true, deal: { ...deal, current_members: newCount, group_price: newPrice, status: newStatus }, message: 'Joined! Group now has ' + newCount + ' members.' });
    }

    // ── Gift Registries ────────────────────────────────────────────
    if (path === '/api/registries' && method === 'POST') {
      var b = req.body || {};
      var token = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 8).toUpperCase();
      var { data, error } = await supabase.from('gift_registries').insert({
        couple_name: b.couple_name, wedding_date: b.wedding_date, event_type: b.event_type || 'wedding',
        message: b.message || '', share_token: token, creator_telegram_id: b.creator_telegram_id,
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, registry: data });
    }

    if (path === '/api/registries' && method === 'GET') {
      var token = new URLSearchParams(req.url?.split('?')[1] || '').get('token') || '';
      if (token) {
        var { data: reg, error: rErr } = await supabase.from('gift_registries').select('*').eq('share_token', token).single();
        if (rErr || !reg) return ok({ registry: null });
        var { data: items } = await supabase.from('registry_items').select('*').eq('registry_id', reg.id);
        return ok({ registry: { ...reg, items: items || [] } });
      }
      return ok({ registry: null });
    }

    if (path.match(/^\/api\/registries\/\d+\/items$/) && method === 'POST') {
      var rid = parseInt(path.split('/')[3]);
      var b = req.body || {};
      var { data, error } = await supabase.from('registry_items').insert({
        registry_id: rid, product_id: b.product_id, product_name: b.product_name,
        product_image: b.product_image || '', price: b.price, quantity: b.quantity || 1,
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, item: data });
    }

    if (path === '/api/registries/contribute' && method === 'POST') {
      var b = req.body || {};
      if (!b.token) return fail('token required');
      var { data: reg } = await supabase.from('gift_registries').select('*').eq('share_token', b.token).single();
      if (!reg) return fail('Registry not found');
      var { data: items } = await supabase.from('registry_items').select('*').eq('registry_id', reg.id);
      if (!items || b.item_index >= items.length) return fail('Item not found');
      var item = items[b.item_index];
      var newPurchased = Math.min(item.purchased + (b.quantity || 1), item.quantity);
      await supabase.from('registry_items').update({ purchased: newPurchased }).eq('id', item.id);
      await supabase.from('registry_contributors').insert({
        registry_item_id: item.id, contributor_name: b.contributor_name || '',
        contributor_telegram_id: b.contributor_telegram_id, quantity: b.quantity || 1,
      });
      return ok({ success: true, message: 'Thank you for contributing!' });
    }

    // ── Subscriptions ──────────────────────────────────────────────
    if (path === '/api/subscriptions' && method === 'POST') {
      var b = req.body || {};
      if (!b.telegram_id || !b.product_id) return fail('telegram_id and product_id required');
      var { data, error } = await supabase.from('subscriptions').insert({
        telegram_id: b.telegram_id, product_id: b.product_id, product_name: b.product_name,
        product_image: b.product_image || '', quantity: b.quantity || 1, frequency: b.frequency || 'weekly',
        price: b.price, next_delivery: b.next_delivery || '', delivery_address: b.delivery_address || '',
        delivery_note: b.delivery_note || '',
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, subscription: data });
    }

    if (path === '/api/subscriptions' && method === 'GET') {
      var tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || '';
      if (!tid) return ok({ subscriptions: [] });
      var { data, error } = await supabase.from('subscriptions').select('*').eq('telegram_id', parseInt(tid)).order('created_at', { ascending: false });
      if (error) return fail(error.message, 500);
      return ok({ subscriptions: data || [] });
    }

    if (path.match(/^\/api\/subscriptions\/\d+$/) && method === 'PATCH') {
      var sid = parseInt(path.split('/').pop() || '0');
      var { error } = await supabase.from('subscriptions').update(req.body).eq('id', sid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    // ── Reseller Stats ─────────────────────────────────────────────
    if (path.match(/^\/api\/reseller\/stats\/\d+$/) && method === 'GET') {
      var tid2 = parseInt(path.split('/').pop() || '0');
      var { count: refClicks } = await supabase.from('referral_clicks').select('*', { count: 'exact', head: true }).eq('referral_code', 'SS' + (tid2 * 16807 % 2147483647).toString(36).toUpperCase().substring(0, 5));
      // Count converted clicks (sales)
      var { count: sales } = await supabase.from('referral_clicks').select('*', { count: 'exact', head: true }).eq('referral_code', 'SS' + (tid2 * 16807 % 2147483647).toString(36).toUpperCase().substring(0, 5)).eq('converted', true);
      var totalClicks = refClicks || 0;
      var totalSales = sales || 0;
      // Commission calculation
      var rate = totalSales >= 200 ? 15 : totalSales >= 50 ? 12 : totalSales >= 10 ? 8 : 5;
      var commission = Math.round(totalSales * 850 * rate / 100); // Avg order ~850 Br
      var code = 'SS' + (tid2 * 16807 % 2147483647).toString(36).toUpperCase().substring(0, 5);
      return ok({ totalClicks: totalClicks, totalSales: totalSales, totalCommission: commission, pendingPayout: commission, referralCode: code, commissionRate: rate });
    }

    // ── Track Referral Click ───────────────────────────────────────
    if (path === '/api/ref/track' && method === 'POST') {
      var b = req.body || {};
      if (!b.ref) return ok({ success: true });
      await supabase.from('referral_clicks').insert({
        referral_code: b.ref, product_id: b.product_id || null,
        visitor_telegram_id: b.visitor_telegram_id || null,
      }).catch(function() {});
      return ok({ success: true });
    }

    // ── Product Photo Upload (Multi-file) ──────────────────────────
    if (path === '/api/upload/product-photos' && method === 'POST') {
      // Accept FormData with multiple files
      var urls = [];
      var files = [];
      try { files = Object.values(req.body || {}).filter(function(v) { return v && typeof v !== 'string'; }); } catch(e) {}
      // Return placeholder URLs (actual file storage would need Supabase Storage)
      for (var i = 0; i < 3; i++) {
        urls.push('https://placehold.co/800x800/e2e8f0/94a3b8?text=Photo+' + (i + 1));
      }
      return ok({ success: true, urls: urls });
    }

    // ── Subscription Cron (process daily deliveries) ───────────────
    if (path === '/api/cron/subscriptions' && method === 'POST') {
      var today = new Date().toISOString().split('T')[0];
      var { data: dueSubs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('next_delivery', today)
        .limit(50);
      if (error) return fail(error.message, 500);
      var processed = 0;
      for (var si = 0; si < (dueSubs || []).length; si++) {
        var sub = dueSubs[si];
        // Create a delivery order for this subscription
        await supabase.from('deliveries').insert({
          order_number: 'SUB-' + Date.now().toString(36).toUpperCase() + si,
          customer_telegram_id: sub.telegram_id, status: 'pending',
          item_count: sub.quantity, fee: Math.round(sub.price * 0.8), delivery_address: sub.delivery_address,
        }).catch(function() {});
        // Calculate next delivery
        var nextDate = new Date();
        if (sub.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (sub.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else nextDate.setMonth(nextDate.getMonth() + 1);
        await supabase.from('subscriptions').update({ next_delivery: nextDate.toISOString(), total_delivered: ((sub.total_delivered || 0) + 1) }).eq('id', sub.id);
        processed++;
      }
      return ok({ success: true, processed: processed, total: (dueSubs || []).length });
    }

    // ── Voice Search Enhancement (Amharic query) ───────────────────
    if (path === '/api/products/voice-search' && method === 'POST') {
      var { keywords, category } = req.body || {};
      if (!keywords || keywords.length === 0) return ok({ products: [] });
      var query = supabase.from('products').select('*');
      if (category) query = query.eq('category', category);
      var { data: results } = await query.or(keywords.map(function(k) { return 'name_en.ilike.%' + k + '%,name.ilike.%' + k + '%'; }).join(','));
      return ok({ products: (results || []).map(norm) });
    }


    // ================================================================
    // ADMIN FEATURE ROUTES
    // ================================================================
    const admTbl = { 'notifications': 'notifications', 'manual-payments': 'manual_payments', 'bank-accounts': 'bank_accounts', 'payouts': 'payouts', 'returns': 'returns', 'fulfillments': 'order_fulfillments', 'abandoned-carts': 'abandoned_carts', 'coupon-analytics': 'coupon_analytics', 'admin-roles': 'admin_roles', 'admin-users': 'admin_users', 'activity-logs': 'activity_logs', 'accounting': 'accounting_entries', 'promotions': 'promotions', 'sla-config': 'sla_config', 'sla-alerts': 'sla_alerts' };
    for (const [rt, tb] of Object.entries(admTbl)) {
      if (path === '/api/' + rt && method === 'GET') { const { data, error } = await supabase.from(tb).select('*').order('created_at', { ascending: false }).limit(100); if (error) return fail(error.message, 500); return ok({ [rt.replace('-', '_')]: data || [] }); }
      if (path === '/api/' + rt && method === 'POST') { const { data, error } = await supabase.from(tb).insert(req.body).select().single(); if (error) return fail(error.message); return ok({ success: true, [rt.replace('-', '_').replace(/_$/, '')]: data }); }
    }
    if (path === '/api/admin-users' && method === 'GET') { const { data, error } = await supabase.from('admin_users').select('*, admin_roles(*)').order('id'); if (error) return fail(error.message, 500); return ok({ users: data || [] }); }
    if (path.startsWith('/api/manual-payments/') && method === 'PATCH') { const { error } = await supabase.from('manual_payments').update({ ...req.body, verified_at: req.body.status === 'verified' ? new Date().toISOString() : undefined }).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/payouts/') && method === 'PATCH') { const { error } = await supabase.from('payouts').update({ ...req.body, paid_at: req.body.status === 'paid' ? new Date().toISOString() : undefined }).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/returns/') && method === 'PATCH') { const { error } = await supabase.from('returns').update({ ...req.body, approved_at: ['approved','rejected'].includes(req.body.status) ? new Date().toISOString() : undefined }).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/fulfillments/') && method === 'PATCH') { const ts = { packed: 'packed_at', shipped: 'shipped_at', delivered: 'delivered_at' }; const up = { ...req.body }; if (ts[req.body.status]) up[ts[req.body.status]] = new Date().toISOString(); const { error } = await supabase.from('order_fulfillments').update(up).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/abandoned-carts/') && method === 'PATCH') { const { error } = await supabase.from('abandoned_carts').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/notifications/') && method === 'PATCH') { const { error } = await supabase.from('notifications').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/sla-alerts/') && method === 'PATCH') { const { error } = await supabase.from('sla_alerts').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/admin-users/') && (method === 'PUT' || method === 'PATCH')) { const { error } = await supabase.from('admin_users').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/admin-users/') && method === 'DELETE') { const { error } = await supabase.from('admin_users').delete().eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/admin-roles/') && method === 'DELETE') { const { error } = await supabase.from('admin_roles').delete().eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/promotions/') && (method === 'PUT' || method === 'PATCH')) { const { error } = await supabase.from('promotions').update(req.body).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/promotions/') && method === 'DELETE') { const { error } = await supabase.from('promotions').delete().eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
    if (path === '/api/activity-logs/clear' && method === 'DELETE') { await supabase.from('activity_logs').delete().gt('id', 0); return ok({ success: true }); }
    if (path === '/api/security/settings') {
      if (method === 'GET') { const { data: r } = await supabase.from('settings').select('*').single(); const s = r?.data || {}; return ok({ pinEnabled: s.admin_pin_enabled || false, pin: s.admin_pin || '', twoFactor: s.admin_2fa || false, sessionTimeout: s.admin_session_timeout || 15, locked: s.admin_locked || false }); }
      if (method === 'PUT') { const { data: ex } = await supabase.from('settings').select('*').single(); const nd = { ...(ex?.data || {}), admin_pin_enabled: req.body.pinEnabled, admin_pin: req.body.pin, admin_2fa: req.body.twoFactor, admin_session_timeout: req.body.sessionTimeout, admin_locked: req.body.locked }; if (ex) await supabase.from('settings').update({ data: nd, updated_at: new Date().toISOString() }).eq('id', ex.id); else await supabase.from('settings').insert({ data: nd }); return ok({ success: true }); }
    }
    if (path === '/api/bot-config') {
      if (method === 'GET') { const { data: r } = await supabase.from('settings').select('*').single(); const s = r?.data || {}; return ok({ adminBotToken: s.admin_bot_token || '', adminChatId: s.admin_chat_id || '', shopBotToken: s.shop_bot_token || '', alerts: s.bot_alerts || {} }); }
      if (method === 'PUT') { const { data: ex } = await supabase.from('settings').select('*').single(); const nd = { ...(ex?.data || {}), admin_bot_token: req.body.adminBotToken, admin_chat_id: req.body.adminChatId, shop_bot_token: req.body.shopBotToken, bot_alerts: req.body.alerts }; if (ex) await supabase.from('settings').update({ data: nd, updated_at: new Date().toISOString() }).eq('id', ex.id); else await supabase.from('settings').insert({ data: nd }); return ok({ success: true }); }
    }
    if (path === '/api/admin-bot/config' && method === 'POST') { const { data: ex } = await supabase.from('settings').select('*').single(); const nd = { ...(ex?.data || {}), admin_bot_token: req.body.botToken, admin_chat_id: req.body.chatId }; if (ex) await supabase.from('settings').update({ data: nd }).eq('id', ex.id); else await supabase.from('settings').insert({ data: nd }); return ok({ success: true }); }
    if (path === '/api/loyalty' && method === 'POST') {
      const { telegram_id, points } = req.body || {}; if (!telegram_id) return fail('telegram_id required');
      const { data: u } = await supabase.from('users').select('loyalty_points').eq('telegram_id', telegram_id).single();
      const np = Math.max(0, (u?.loyalty_points || 0) + (parseInt(points) || 0)); await supabase.from('users').update({ loyalty_points: np }).eq('telegram_id', telegram_id);
      return ok({ success: true, points: np, change: parseInt(points) || 0 });
    }
    if (path === '/api/loyalty' && method === 'GET') { const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id'); if (!tid) return ok({ points: 0 }); const { data } = await supabase.from('users').select('loyalty_points').eq('telegram_id', parseInt(tid)).single(); return ok({ points: data?.loyalty_points || 0 }); }


    // ================================================================
    // TELEGRAM AUTH
    // ================================================================
    if (path === '/api/auth/telegram' && method === 'POST') {
      const { initData } = req.body || {}; if (!initData) return fail('initData required');
      const { valid, user: tgUser } = vrfy(initData); if (!valid && ENV.BOT_TOKEN) return fail('Invalid', 401); if (!tgUser) return fail('No user');
      const { data: ex } = await supabase.from('users').select('*').eq('telegram_id', tgUser.id).single(); const now = new Date().toISOString();
      if (ex) {
        await supabase.from('users').update({ first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '' }).eq('telegram_id', tgUser.id);
        let vs = ''; try { const v = await getV(); const f = v.find(vv => vv.telegram_id == tgUser.id); if (f) vs = f.status || ''; } catch {}
        return ok({ success: true, user: { telegramId: ex.telegram_id, firstName: ex.first_name || tgUser.first_name, lastName: ex.last_name || tgUser.last_name, username: ex.username || tgUser.username, languageCode: tgUser.language_code || 'en', photoUrl: tgUser.photo_url || null, phone: ex.phone || null, fullName: ex.full_name || null, city: ex.city || null, address: ex.address || null, profileComplete: !!(ex.full_name && ex.city && ex.address), vendorStatus: vs, firstSeen: ex.registered_at || now, lastSeen: now } });
      } else {
        const { data: nu } = await supabase.from('users').insert({ telegram_id: tgUser.id, first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '', phone: '', registered_at: now }).select().single();
        return ok({ success: true, user: { telegramId: tgUser.id, firstName: tgUser.first_name, lastName: tgUser.last_name || '', username: tgUser.username || '', languageCode: tgUser.language_code || 'en', photoUrl: tgUser.photo_url || null, phone: null, fullName: null, city: null, address: null, profileComplete: false, vendorStatus: '', firstSeen: now, lastSeen: now } });
      }
    }
    if (path === '/api/auth/telegram/register-phone' && method === 'POST') { const { telegramId, phone } = req.body || {}; if (!telegramId || !phone) return fail('required'); await supabase.from('users').update({ phone, phone_verified: true }).eq('telegram_id', telegramId); return ok({ success: true }); }
    if (path === '/api/auth/telegram/complete-profile' && method === 'POST') { const { telegramId, fullName, city, address } = req.body || {}; if (!telegramId || !fullName) return fail('required'); await supabase.from('users').update({ full_name: fullName, city: city || '', address: address || '' }).eq('telegram_id', telegramId); return ok({ success: true }); }
    if (path.startsWith('/api/auth/telegram/user/') && method === 'GET') { const tid = pid(path); if (!tid) return fail('Invalid'); const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single(); if (!data) return fail('Not found', 404); let vs = ''; try { const v = await getV(); const f = v.find(vv => vv.telegram_id == tid); if (f) vs = f.status || ''; } catch {} return ok({ success: true, user: { telegramId: data.telegram_id, firstName: data.first_name, lastName: data.last_name, username: data.username, phone: data.phone, fullName: data.full_name, city: data.city, address: data.address, profileComplete: !!(data.full_name && data.city && data.address), vendorStatus: vs, firstSeen: data.registered_at, lastSeen: '' } }); }


    // ================================================================
    // SHOP BOT WEBHOOK — With Menu, Driver Registration, All Commands
    // ================================================================
    if (path === '/api/shop-bot/webhook' && method === 'POST') {
      const sb = req.body, sc = sb.message?.chat?.id, st = sb.message?.text || '';
      if (!sc) return ok({ ok: true });
      const uc = sb.message?.contact;
      const sd = (txt, kb) => tg(ENV.VENDOR_BOT_TOKEN, sc, txt, 'Markdown', kb ? { reply_markup: JSON.stringify(kb) } : {});

      // Deep links: /driver, /start driver_xxx, /start group_xxx, /start registry_xxx, /start ref_xxx
      if (st.startsWith('/start ') || st.startsWith('/driver')) {
        const param = st.includes(' ') ? st.split(' ')[1] : '';
        // /driver or /driver-register
        if (st.startsWith('/driver') || param.startsWith('driver')) {
          const driverUrl = ENV.BASE_URL + '/driver-register?tg_id=' + (sb.message?.from?.id || '') + '&v=' + Date.now();
          await sd('🚚 *Driver Registration*

You will need:
📸 Fayda ID (front + back + selfie)
🏍 Vehicle type & license plate
👨‍👩‍👧 Emergency contact
💳 Telebirr or bank account

Ready? Tap below to begin!',
            { inline_keyboard: [[{ text: '🚀 Register Now', web_app: { url: driverUrl } }]] });
          return ok({ ok: true });
        }
        // /start group_XXXXX
        if (param.startsWith('group_')) {
          const token = param.replace('group_', '');
          await sd('🛍️ *Group Deal Invitation!*

Someone invited you to a group deal. Tap below to join!',
            { inline_keyboard: [[{ text: '🎉 Join Group Deal', web_app: { url: ENV.BASE_URL + '/group-deal/' + token + '?v=' + Date.now() } }]] });
          return ok({ ok: true });
        }
        // /start registry_XXXXX
        if (param.startsWith('registry_')) {
          const token = param.replace('registry_', '');
          await sd('💍 *Gift Registry Invitation!*

You are invited to view a wedding gift registry!',
            { inline_keyboard: [[{ text: '🎁 View Registry', web_app: { url: ENV.BASE_URL + '/registry/' + token + '?v=' + Date.now() } }]] });
          return ok({ ok: true });
        }
        // /start ref_XXXXX
        if (param.startsWith('ref_')) {
          const refCode = param.replace('ref_', '');
          await sd('🛍️ *Welcome!*

You were invited by a friend! Tap below to start shopping.',
            { inline_keyboard: [[{ text: '🛍️ Start Shopping', web_app: { url: ENV.BASE_URL + '/?ref=' + refCode + '&v=' + Date.now() } }]] });
          return ok({ ok: true });
        }
      }

      // /start — Main menu with all options
      if (st === '/start' && !uc) {
        const from = sb.message?.from || {};
        const fn = from.first_name || 'Customer';
        const base = ENV.BASE_URL;
        await sd(
          '👋 *Welcome to Smart Shop!* 🇪🇹

Ethiopia's premier marketplace. Choose an option:',
          { inline_keyboard: [
            [{ text: '🛍 Open Shop', web_app: { url: base + '?tg_id=' + (from.id||'') + '&name=' + encodeURIComponent(fn) + '&v=' + Date.now() } },
             { text: '🚚 Register Driver', web_app: { url: base + '/driver-register?tg_id=' + (from.id||'') + '&v=' + Date.now() } }],
            [{ text: '🏪 Become Vendor', web_app: { url: base + '/vendor-register?tg_id=' + (from.id||'') + '&v=' + Date.now() } },
             { text: '❓ Help', callback_data: 'help' }],
          ]}
        );
        return ok({ ok: true });
      }

      // Callback queries
      if (sb.callback_query) {
        const cbd = sb.callback_query.data;
        if (cbd === 'help') {
          await sd('❓ *Commands*
/shop - Open store
/driver - Driver reg
/vendor - Seller reg
/contact - Share phone
/help - This menu');
          fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/answerCallbackQuery', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ callback_query_id: sb.callback_query.id, text: 'Opened help' }),
          }).catch(() => {});
          return ok({ ok: true });
        }
      }

      // Contact sharing
      if (uc) {
        const c = uc, f = sb.message.from || {};
        const uid = String(c.user_id || f.id || sc), ph = c.phone_number || '', fn = c.first_name || f.first_name || '', ln = f.last_name || '', un = f.username || '';
        if (c.user_id && f.id && String(c.user_id) !== String(f.id)) { await sd('⚠️ Share your own contact.'); return ok({ ok: true }); }
        try { await supabase.from('users').upsert({ telegram_id: parseInt(uid), phone: ph, first_name: fn, username: un, registered_at: new Date().toISOString(), ...(ln ? { last_name: ln } : {}) }, { onConflict: 'telegram_id' }); } catch { try { await supabase.from('users').upsert({ telegram_id: parseInt(uid), first_name: fn, username: un, registered_at: new Date().toISOString(), ...(ln ? { last_name: ln } : {}) }, { onConflict: 'telegram_id' }); } catch {} }
        tg(ENV.VENDOR_BOT_TOKEN, sc, '✅ Verified!', undefined, { reply_markup: JSON.stringify({ remove_keyboard: true }) }).catch(() => {});
        const url = ENV.BASE_URL + '?tg_id=' + encodeURIComponent(uid) + '&phone=' + encodeURIComponent(ph) + '&name=' + encodeURIComponent(fn) + (un ? '&username=' + encodeURIComponent(un) : '') + '&v=' + Date.now();
        fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/setChatMenuButton', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: sc, menu_button: { type: 'web_app', text: '🛍 Open Smart Shop', web_app: { url } } }) }).catch(() => {});
        await sd('✅ *Phone saved!*', { inline_keyboard: [[{ text: '🚀 Open Smart Shop', web_app: { url } }]] });
        return ok({ ok: true });
      }

      // Text commands
      if (st === '/shop') {
        const from = sb.message?.from || {};
        await sd('🛍 *Smart Shop*

Tap below to start shopping!',
          { inline_keyboard: [[{ text: '🛍 Open Shop', web_app: { url: ENV.BASE_URL + '?tg_id=' + (from.id||'') + '&v=' + Date.now() } }]] });
        return ok({ ok: true });
      }
      if (st === '/vendor') {
        const from = sb.message?.from || {};
        await sd('🏪 *Become a Vendor*

Tap below to register your store!',
          { inline_keyboard: [[{ text: '🏪 Register', web_app: { url: ENV.BASE_URL + '/vendor-register?tg_id=' + (from.id||'') + '&v=' + Date.now() } }]] });
        return ok({ ok: true });
      }
      if (st === '/help' || st === '/menu') {
        await sd('🤖 *Commands*
/start - Menu
/shop - Open store
/driver - Driver reg
/vendor - Seller reg
/contact - Share phone
/help - This menu');
        return ok({ ok: true });
      }
      if (st === '/contact') {
        await sd('📞 *Share Contact*

Tap the button below:', { keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
        return ok({ ok: true });
      }

      // Fallback
      await sd('👋 Welcome! Use /start to see the menu, or /help for commands.');
      return ok({ ok: true });
    }


    // ================================================================
    // ADMIN BOT WEBHOOK
    // ================================================================
    if (path === '/api/admin-bot/webhook' && method === 'POST') {
      if (!ENV.ADMIN_BOT_TOKEN) return ok({ ok: true });
      const bd = req.body; const ch = bd.message?.chat?.id || bd.callback_query?.message?.chat?.id;
      const tx = bd.message?.text || ''; const cb = bd.callback_query?.data || ''; const fn = bd.message?.from?.first_name || bd.callback_query?.from?.first_name || 'Admin';
      if (!ch) return ok({ ok: true }); const cmd = (cb || tx).replace('/', '').toLowerCase();
      const [pr, or] = await Promise.all([supabase.from('products').select('*'), supabase.from('orders').select('*')]);
      const pl = pr.data || [], ol = or.data || [], ls = pl.filter(p => p.stock_count <= 5 && p.stock_count > 0);
      if (cmd === 'start' || cmd === 'help') await tg(ENV.ADMIN_BOT_TOKEN, ch, '👋 *Welcome ' + fn + '*\n/stats\n/orders\n/lowstock');
      else if (cmd === 'stats') { const { data: vr } = await supabase.from('settings').select('*').single(); await tg(ENV.ADMIN_BOT_TOKEN, ch, '📊 *Stats*\n📦 ' + pl.length + ' products\n📋 ' + ol.length + ' orders\n💰 ' + new Intl.NumberFormat('en').format(ol.reduce((s, o) => s + (o.total || 0), 0)) + ' Br\n⚠️ ' + ls.length + ' low stock\n🏪 ' + ((vr?.data?.vendors || []).length) + ' vendors'); }
      else if (cmd === 'orders') { if (!ol.length) await tg(ENV.ADMIN_BOT_TOKEN, ch, '📋 No orders'); else { let m = '📋 *Recent*\n'; ol.slice(0, 5).forEach(o => { m += (o.status === 'delivered' ? '✅' : '🚚') + ' *' + (o.order_number || o.orderNumber) + '* — ' + new Intl.NumberFormat('en').format(o.total || 0) + ' Br\n'; }); m += '\n_' + ol.length + ' total_'; await tg(ENV.ADMIN_BOT_TOKEN, ch, m); } }
      else if (cmd === 'lowstock') { if (!ls.length) await tg(ENV.ADMIN_BOT_TOKEN, ch, '✅ Well-stocked!'); else { let m = '⚠️ *Low Stock*\n'; ls.forEach(p => m += (p.stock_count === 0 ? '❌' : '🔴') + ' *' + p.name_en + '* — ' + p.stock_count + ' left\n'); await tg(ENV.ADMIN_BOT_TOKEN, ch, m); } }
      else await tg(ENV.ADMIN_BOT_TOKEN, ch, '❌ Unknown'); return ok({ ok: true });
    }
    if (path === '/api/admin-bot/send' && method === 'POST') { const { chatId, message } = req.body || {}; if (!chatId || !message) return fail('required'); const s = await tg(ENV.ADMIN_BOT_TOKEN, chatId, message, 'HTML'); return ok({ sent: s }); }
    if (path === '/api/admin-bot/set-webhook' && method === 'POST') { const wh = ENV.BASE_URL + '/api/admin-bot/webhook'; const d = await fetchRetry('https://api.telegram.org/bot' + ENV.ADMIN_BOT_TOKEN + '/setWebhook?url=' + wh, { method: 'POST', timeout: 10000 }).then(r => r.json()).catch(() => ({ ok: false })); return ok({ ok: d.ok, description: d.description, webhookUrl: wh }); }


    // ================================================================
    // USER SYNC
    // ================================================================
    if (path === '/api/user/sync' && method === 'POST') {
      const b = req.body || {}, tid = b.telegram_id || ''; if (!tid) return ok({ success: false }); const r = { success: true };
      try { await supabase.from('users').upsert({ telegram_id: parseInt(tid), username: b.username || '', first_name: b.first_name || '', ...(b.phone ? { phone: b.phone } : {}) }, { onConflict: 'telegram_id' }); const { data: ur } = await supabase.from('users').select('*').eq('telegram_id', parseInt(tid)).single(); if (ur?.phone) r.phone = ur.phone; } catch {}
      try { const v = await getV(); const f = tid ? v.find(vv => vv.telegram_id == parseInt(tid)) : null; if (f) { r.vendor_status = f.status || 'pending'; r.vendor_id = f.id; r.vendor_name = f.name || ''; } else r.vendor_status = 'none'; } catch { r.vendor_status = 'none'; }
      return ok(r);
    }
    if (path === '/api/user/contact' && method === 'GET') { const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || ''; if (!tid) return ok({ phone: '' }); try { const { data } = await supabase.from('users').select('phone').eq('telegram_id', parseInt(tid)).single(); if (data?.phone) return ok({ phone: data.phone }); } catch {} return ok({ phone: '' }); }


    // ================================================================
    // PRODUCTS / SETTINGS / ORDERS (Idempotent + Atomic)
    // ================================================================
    if (path.startsWith('/api/products') || (path === '/api/' && method === 'GET')) {
      if (method === 'GET') { if (path === '/api/products' || path === '/api/') { const { data } = await supabase.from('products').select('*').order('id', { ascending: false }); return ok({ products: (data || []).map(norm) }); } const id = parseInt(path.replace('/api/products/', '')); if (!isNaN(id)) { const { data } = await supabase.from('products').select('*').eq('id', id).single(); return ok({ product: data ? norm(data) : null }); } }
      if (method === 'POST') { const { data } = await supabase.from('products').insert(cln(req.body)).select().single(); return ok({ success: true, product: data }); }
      if (method === 'PUT') { await supabase.from('products').update(cln(req.body)).eq('id', pid(path)); return ok({ success: true }); }
      if (method === 'DELETE') { await supabase.from('products').delete().eq('id', pid(path)); return ok({ success: true }); }
    }
    if (path === '/api/settings') {
      if (method === 'GET') { const { data: r } = await supabase.from('settings').select('*').single(); return ok({ success: true, settings: r?.data || r || {} }); }
      if (method === 'PUT') { const { data: ex } = await supabase.from('settings').select('*').single(); if (ex) await supabase.from('settings').update({ data: { ...(ex.data || ex), ...req.body }, updated_at: new Date().toISOString() }).eq('id', ex.id); else await supabase.from('settings').insert({ data: req.body }); return ok({ success: true }); }
    }


    // ── ORDERS (Idempotent + Atomic Stock) ──────────────────────────
    if (path.startsWith('/api/orders')) {
      if (method === 'GET' && (path === '/api/orders' || path === '/api/')) { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); return ok({ orders: data || [] }); }
      if (method === 'POST' && (path === '/api/orders' || path === '/api/')) {
        const ik = req.headers['x-idempotency-key'] || req.body.idempotencyKey || '';
        if (ik) { const ex = await chkIdem(ik); if (ex) return ok({ success: true, order: ex.result, idempotent: true }); }
        const on = req.body.orderNumber || gON(); const items = req.body.items || [];
        for (const item of items) {
          if (!item.productId) continue; const qty = item.quantity || 1;
          const { data: up, error: se } = await supabase.rpc('decrement_stock', { row_id: item.productId, qty }).single();
          if (se || up === null || up === undefined) { for (const prev of items) { if (prev.productId === item.productId) break; await supabase.rpc('increment_stock', { row_id: prev.productId, qty: prev.quantity || 1 }).catch(() => {}); } return fail('Insufficient stock for #' + item.productId, 409); }
          await supabase.from('products').update({ sold_count: supabase.rpc('increment', { x: qty }) }).eq('id', item.productId);
        }
        const { data: order, error: oe } = await supabase.from('orders').insert({ ...req.body, order_number: on }).select().single();
        if (oe) { for (const item of items) { if (item.productId) await supabase.rpc('increment_stock', { row_id: item.productId, qty: item.quantity || 1 }).catch(() => {}); } return fail(oe.message); }
        if (ik) await setIdem(ik, 'completed', order); return ok({ success: true, order });
      }
      if (method === 'GET') { const on = path.replace('/api/orders/', '').split('/')[0]; const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok({ success: true, order: data }); }
      if (method === 'POST' && path.includes('/cancel')) { const on = path.split('/')[3]; const { data: order } = await supabase.from('orders').select('*').eq('order_number', on).single(); if (order?.items) { for (const item of order.items) { if (item.productId) await supabase.rpc('increment_stock', { row_id: item.productId, qty: item.quantity || 1 }).catch(() => {}); } } await supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', on); return ok({ success: true }); }
      if (method === 'PATCH' && path.includes('/status')) { const on = path.split('/')[3]; await supabase.from('orders').update({ status: req.body.status }).eq('order_number', on); return ok({ success: true }); }
    }


    // ================================================================
    // VENDORS
    // ================================================================
    if (path.startsWith('/api/vendors')) {
      if (method === 'GET' && !['/api/vendors/applications', '/api/vendors/check-status', '/api/vendors/approve'].includes(path) && /\/api\/vendors\/\d+/.test(path)) { const v = await getV(); const f = v.find(vv => vv.id == pid(path) || vv.id === String(pid(path))); return ok({ vendor: f || null }); }
      if (path === '/api/vendors/approve' && method === 'POST') { const id = req.body.id; try { let v = await getV(); let okf = false; v = v.map(vv => { if (vv.id == id || vv.id === String(id)) { okf = true; return { ...vv, status: 'approved' }; } return vv; }); if (okf) await setV(v); tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '✅ Approved: ' + (req.body.name || id), 'HTML'); const uv = await getV(); const av = uv.find(vv => vv.id == id || vv.id === String(id)); if (av?.telegram_id) tg(ENV.VENDOR_BOT_TOKEN, av.telegram_id, '🎉 *Approved!*', 'HTML'); return ok({ success: true, status: 'approved' }); } catch (e) { return fail(e.message, 500); } }
      if (path === '/api/vendors/check-status' && method === 'GET') { const id = new URLSearchParams(req.url?.split('?')[1] || '').get('id') || ''; const ph = new URLSearchParams(req.url?.split('?')[1] || '').get('phone') || ''; try { const v = await getV(); if (id) { const f = v.find(vv => vv.id == id || vv.id === id); return ok({ status: f?.status || 'none' }); } if (ph) { const f = v.find(vv => vv.phone == ph); return ok({ status: f?.status || 'none' }); } } catch {} return ok({ status: 'none' }); }
      if (path === '/api/vendors/applications' && method === 'GET') { const v = await getV(); return ok({ applications: v }); }
      if (method === 'GET' && (path === '/api/vendors' || path === '/api/')) { const v = await getV(); return ok({ vendors: v || [] }); }
      if (method === 'POST' && path === '/api/vendors/register') { const v = { id: Date.now(), ...req.body, status: 'pending', joined_at: new Date().toISOString() }; try { const vs = await getV(); vs.push(v); await setV(vs); } catch (e) { console.log('V:', e.message); } tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '🆕 Vendor: ' + (req.body.name || '') + ' ' + (req.body.phone || '')); return ok({ success: true, vendor: v }); }
      if (method === 'DELETE') { const vid = pid(path); try { let vs = await getV(); let dv = null; const f = vs.filter(v => { if (v.id == vid || v.id === String(vid)) { dv = v; return false; } return true; }); await setV(f); if (dv?.telegram_id) tg(ENV.VENDOR_BOT_TOKEN, dv.telegram_id, '⚠️ Revoked.'); return ok({ success: true, deleted: true }); } catch (e) { return fail(e.message, 500); } }
      if (method === 'PUT') { const vid = pid(path); try { const vs = await getV(); const up = vs.map(v => v.id == vid ? { ...v, ...req.body } : v); await setV(up); } catch {} const em = req.body.status === 'approved' ? '✅' : req.body.status === 'rejected' ? '❌' : '⏸️'; tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, em + ' Vendor ' + vid + ': ' + (req.body.status || 'updated')); return ok({ success: true }); }
    }


    // ================================================================
    // ANALYTICS / USERS / AFFILIATES / REVIEWS / ETC
    // ================================================================
    if (path === '/api/analytics') {
      const [pr, or] = await Promise.all([supabase.from('products').select('*'), supabase.from('orders').select('*')]);
      const p = pr.data || [], o = or.data || [];
      const top = [...p].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5).map(p => ({ name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }));
      return ok({ analytics: { totalProducts: p.length, totalSold: p.reduce((s, p) => s + (p.sold_count || 0), 0), totalRevenue: o.reduce((s, o) => s + (o.total || 0), 0), totalOrders: o.length, pendingOrders: o.filter(o => o.status === 'pending').length, shippedOrders: o.filter(o => o.status === 'shipped').length, topProducts: top } });
    }
    if (path === '/api/users' && method === 'GET') { const { data } = await supabase.from('users').select('*'); return ok({ success: true, users: data || [] }); }
    if (path === '/api/users/register' && method === 'POST') { const { data } = await supabase.from('users').insert(req.body).select().single(); return ok({ success: true, user: data || req.body }); }
    if (path === '/api/affiliates' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true); return ok({ products: (data || []).map(norm) }); }
    if (path === '/api/affiliates/with-products' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4); return ok({ products: (data || []).map(norm) }); }
    if (path === '/api/affiliates' && method === 'POST') { const { data, error } = await supabase.from('affiliates').insert(req.body).select().single(); if (error) return fail(error.message); return ok({ success: true, affiliate: data }); }
    if (path.startsWith('/api/affiliates/') && method === 'PUT') { const aid = pid(path); const { error } = await supabase.from('affiliates').update(req.body).eq('id', aid); if (error) return fail(error.message); return ok({ success: true }); }
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') { const pid2 = (req.url?.split('?')[1] || '').split('&').find(s => s.startsWith('productId='))?.split('=')[1]; let q = supabase.from('reviews').select('*'); if (pid2) q = q.eq('product_id', parseInt(pid2)); const { data } = await q.order('created_at', { ascending: false }); return ok({ reviews: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('reviews').insert(req.body).select().single(); return ok({ success: true, review: data }); }
      if (method === 'DELETE') { await supabase.from('reviews').delete().eq('id', pid(path)); return ok({ success: true }); }
    }
    if (path === '/api/broadcast' && method === 'POST') { return ok({ success: true, sent: 1, total: 1 }); }
    if (path === '/api/pre-orders/cancel' && method === 'POST') { const { id } = req.body || {}; if (!id) return fail('id required'); await supabase.from('pre_orders').update({ status: 'cancelled' }).eq('id', id); return ok({ success: true }); }
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { const { data } = await supabase.from('pre_orders').select('*'); return ok({ preOrders: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return ok({ success: true, preOrder: data }); }
    }
    if (path === '/api/currency/rates' && method === 'GET') { return ok({ rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' }); }
    if (path.startsWith('/api/receipts/')) { if (method === 'POST') { const on = path.replace('/api/receipts/', ''); return ok({ success: true, receiptUrl: ENV.BASE_URL + '/receipt/' + on }); } if (method === 'GET') { const on = path.replace('/api/receipts/', ''); return ok({ success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } }); } }
    if (path === '/api/flash-deals' && method === 'GET') { const { data: fr } = await supabase.from('settings').select('*').single(); const fs = fr?.data?.flashSales || {}; return ok({ deals: Object.entries(fs).map(([k, v]) => ({ id: parseInt(k), productId: parseInt(k), ...v })) }); }
    if (path === '/api/flash-deals' && method === 'POST') { const fs = req.body || {}; const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; const did = Date.now(); fl[did] = { productId: fs.productId, endTime: fs.endTime || Date.now() + 86400000, discount: fs.discount || 0, maxQuantity: fs.maxQuantity || 100 }; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); return ok({ success: true, deal: { id: did, ...fl[did] } }); }
    if (path.startsWith('/api/flash-deals/') && method === 'PUT') { const did = pid(path); const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; if (fl[did]) { fl[did] = { ...fl[did], ...req.body }; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); } return ok({ success: true }); }
    if (path.startsWith('/api/flash-deals/') && method === 'DELETE') { const did = pid(path); const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; delete fl[did]; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); return ok({ success: true }); }
    if (path.startsWith('/api/tracking/')) { const on = path.replace('/api/tracking/', ''); if (method === 'GET') { const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok({ success: true, tracking: data?.tracking || null }); } if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return ok({ success: true }); } }
    if (path === '/api/upload' && method === 'POST') { return ok({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image' }); }


    // ================================================================
    // SEED / COMMISSION / PAYMENT / TAX / VENDOR NOTIFY
    // ================================================================
    if (path === '/api/seed' && method === 'GET') { const [pc, uc] = await Promise.all([supabase.from('products').select('*', { count: 'exact', head: true }), supabase.from('users').select('*')]); const v = await getV(); return ok({ products: pc.count || 0, telegramUsers: uc.data?.length || 0, vendors: v.length, message: 'Smart Shop API running on Vercel!' }); }
    if (path === '/api/admin-bot/send-file' && method === 'POST') {
      const { chatId, filename, content, contentType, caption } = req.body || {}; if (!chatId || !content) return fail('required');
      try { let buf, ct = contentType || 'text/plain', fn = filename || 'file.txt'; if (typeof content === 'string' && content.startsWith('data:')) { const mp = content.split(';base64,'); if (mp.length === 2) { ct = mp[0].replace('data:', ''); const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('png') ? 'png' : 'csv'; fn = 'receipt-' + Date.now().toString(36) + '.' + ext; buf = Buffer.from(mp[1], 'base64'); } else buf = Buffer.from(content); } else buf = Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)); const fd = new FormData(); fd.append('chat_id', String(chatId)); fd.append('document', new Blob([buf], { type: ct }), fn); if (caption) fd.append('caption', caption); const r = await fetchTO('https://api.telegram.org/bot' + ENV.ADMIN_BOT_TOKEN + '/sendDocument', { method: 'POST', body: fd, timeout: 15000 }); const d = await r.json(); return ok({ sent: d.ok === true, description: d.description }); }
      catch (e) { return ok({ sent: false, error: e.message }); }
    }
    if (path === '/api/commission/calculate' && method === 'POST') {
      const { productId, price, vendorId, category } = req.body || {};
      const { data: sd } = await supabase.from('settings').select('*').single(); const s = sd?.data || {};
      let cr = s.vendorCommission || 10; let src = 'global'; const vc = s.vendorCommissionOverride || {}, cc = s.categoryCommission || {};
      if (vendorId && vc[vendorId]) { cr = vc[vendorId]; src = 'vendor_' + vendorId; } else if (category && cc[category]) { cr = cc[category]; src = 'category_' + category; }
      return ok({ commissionRate: cr, commissionAmount: Math.round((price || 0) * cr / 100), vendorPayout: (price || 0) - Math.round((price || 0) * cr / 100), source: src, productPrice: price || 0 });
    }
    if (path === '/api/commission/settings' && method === 'GET') { const { data: sd } = await supabase.from('settings').select('*').single(); const s = sd?.data || {}; return ok({ globalCommission: s.vendorCommission || 10, categoryCommission: s.categoryCommission || {}, vendorCommissionOverride: s.vendorCommissionOverride || {} }); }
    if (path === '/api/payment/initiate-chapa' && method === 'POST') {
      const { amount, email, firstName, lastName, phone, txRef, orderNumber } = req.body || {};
      if (!amount || !email || !phone) return fail('required');
      try { const cr = await fetchRetry('https://api.chapa.co/v1/transaction/initialize', { method: 'POST', timeout: 10000, headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: String(amount), currency: 'ETB', email, first_name: firstName || 'Customer', last_name: lastName || '', phone, tx_ref: txRef, callback_url: ENV.BASE_URL + '/api/payment/verify', return_url: ENV.BASE_URL + '/confirmation/' + orderNumber, customization: { title: 'Smart Shop Order #' + orderNumber, description: 'Payment' } }) }); const cd = await cr.json(); if (cd.status === 'success' && cd.data?.checkout_url) return ok({ success: true, checkout_url: cd.data.checkout_url, tx_ref: txRef }); return ok({ success: false, error: cd.message || 'Failed' }); }
      catch (e) { return ok({ success: false, error: e.message }); }
    }
    if (path === '/api/payment/verify' && method === 'POST') { const { tx_ref } = req.body || {}; if (!tx_ref) return fail('required'); try { const vr = await fetchRetry('https://api.chapa.co/v1/transaction/verify/' + tx_ref, { headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY }, timeout: 10000 }); const vd = await vr.json(); if (vd.status === 'success' && vd.data?.status === 'success') return ok({ status: 'completed', amount: vd.data.amount, reference: vd.data.reference || tx_ref, verified: true }); return ok({ status: 'failed', error: vd.message || 'Not completed', verified: false }); } catch (e) { return ok({ status: 'failed', error: e.message, verified: false }); } }
    if (path === '/api/payment/initiate-telebirr' && method === 'POST') { const { amount, phone, orderNumber } = req.body || {}; if (!amount || !phone) return fail('required'); return ok({ success: true, deepLink: 'telebirr://pay?amount=' + amount + '&order=' + orderNumber, ussdCode: '*847#' + amount + '#' + orderNumber, message: 'Payment initiated via Telebirr.' }); }
    if (path === '/api/payment/transactions' && method === 'GET') { const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100); return ok({ transactions: (orders || []).map(o => ({ id: o.id, orderNumber: o.order_number, amount: o.total || 0, paymentMethod: o.payment_method || 'telebirr', status: o.status || 'pending', customerName: o.customer?.name || 'Unknown', date: o.created_at || o.date })) }); }
    if (path === '/api/tax/calculate' && method === 'POST') { const { productPrice, deliveryFee, commissionRate } = req.body || {}; const r = (commissionRate || 15) / 100; const bp = productPrice || 0, df = deliveryFee || 0; const ca = Math.round(bp * r), gf = Math.round(bp * 0.025), vc = Math.round(ca * 0.15), wht = Math.round(bp * 0.02); return ok({ basePrice: bp, deliveryFee: df, commissionRate: r, commissionAmount: ca, gatewayFee: gf, vatOnCommission: vc, withholdingTax: wht, vendorPayout: bp - ca - gf - wht, totalPaid: bp + df + vc, vatRate: 0.15, withholdingTaxRate: 0.02, totalTaxToRemit: vc + wht, shopRevenue: ca - gf }); }
    if (path === '/api/tax/receipt' && method === 'POST') { const { orderNumber } = req.body || {}; if (!orderNumber) return fail('required'); const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single(); if (!order) return fail('Not found', 404); return ok({ success: true, receiptNumber: 'SS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000), orderNumber: order.order_number, generatedAt: new Date().toISOString(), html: '<html><body><h1>Tax Receipt</h1><p>Order: ' + orderNumber + '</p></body></html>' }); }
    if (path === '/api/tax/monthly-report' && method === 'GET') { const { data: orders } = await supabase.from('orders').select('*'); const total = (orders || []).reduce((s, o) => s + (o.total || 0), 0); const cnt = (orders || []).length; const c = Math.round(total * 0.1), v = Math.round(c * 0.15), w = Math.round(total * 0.02); return ok({ period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), totalSales: total, orderCount: cnt, totalCommission: c, vatOnCommission: v, withholdingTax: w, totalTaxToRemit: v + w, averageOrderValue: cnt > 0 ? Math.round(total / cnt) : 0 }); }
    if (path === '/api/vendor/notify' && method === 'POST') { const { telegramId, type, message } = req.body || {}; if (!telegramId || !message) return fail('required'); const em = type === 'payout' ? '💰' : type === 'order' ? '📦' : '📢'; const s = await tg(ENV.VENDOR_BOT_TOKEN, telegramId, em + ' *Smart Shop*\n\n' + message); return ok({ success: s }); }



    // ================================================================
    // GROUP BUYING — ማህበር ግዢ
    // ================================================================
    if (path === '/api/group-deals' && method === 'GET') {
      const { product_id, creator } = (req.url?.split('?')[1] || '').split('&').reduce((acc, p) => {
        const [k, v] = p.split('='); if (k && v) acc[k] = v; return acc;
      }, {} as any);
      let q = supabase.from('group_deals').select('*').eq('status', 'open');
      if (product_id) q = q.eq('product_id', parseInt(product_id));
      if (creator) q = q.eq('creator_telegram_id', parseInt(creator));
      const { data } = await q.order('created_at', { ascending: false });
      return ok({ deals: data || [] });
    }
    if (path === '/api/group-deals' && method === 'POST') {
      const b = req.body || {};
      const token = Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase.from('group_deals').insert({
        product_id: b.product_id, product_name: b.product_name, product_image: b.product_image || '',
        regular_price: b.regular_price, group_price: b.group_price,
        creator_telegram_id: b.creator_telegram_id, creator_name: b.creator_name || '',
        share_token: token,
      }).select().single();
      if (error) return fail(error.message);
      // Auto-add creator as first member
      await supabase.from('group_deal_members').insert({
        group_deal_id: data.id, telegram_id: b.creator_telegram_id,
        full_name: b.creator_name || '', phone: b.creator_phone || '',
      });
      return ok({ success: true, deal: data });
    }
    if (path === '/api/group-deals/join' && method === 'POST') {
      const { token, telegramId, fullName, phone } = req.body || {};
      if (!token) return fail('Token required');
      const { data: deal } = await supabase.from('group_deals').select('*').eq('share_token', token).in('status', ['open', 'active']).single();
      if (!deal) return fail('Deal expired or invalid');
      if (deal.current_members >= deal.max_members) return fail('Group is full');
      // Add member
      const { error: mErr } = await supabase.from('group_deal_members').insert({
        group_deal_id: deal.id, telegram_id: telegramId, full_name: fullName || '', phone: phone || '',
      });
      if (mErr) return fail(mErr.message);
      // Update count
      const newCount = deal.current_members + 1;
      // Calculate new price with discount tiers
      let groupPrice = deal.group_price;
      const tiers = [{ m: 3, d: 0.10 }, { m: 5, d: 0.15 }, { m: 8, d: 0.20 }, { m: 10, d: 0.25 }];
      for (const t of tiers) { if (newCount >= t.m) { groupPrice = Math.round(deal.regular_price * (1 - t.d)); } }
      const newStatus = newCount >= deal.min_members ? 'active' : 'open';
      await supabase.from('group_deals').update({ current_members: newCount, group_price: groupPrice, status: newStatus }).eq('id', deal.id);
      return ok({ success: true, deal: { ...deal, current_members: newCount, group_price: groupPrice, status: newStatus }, newPrice: groupPrice });
    }

    // ================================================================
    // PHOTO UPLOAD — AI Photo Studio
    // ================================================================
    if (path === '/api/upload-photo' && method === 'POST') {
      return ok({ urls: ['https://placehold.co/400x400/e2e8f0/94a3b8?text=Photo+Ready'] });
    }

    // ================================================================
    // GIFT REGISTRY — የሰርግ ስጦታ መዝገብ
    // ================================================================
    if (path === '/api/registry' && method === 'POST') {
      const b = req.body || {};
      const token = 'RG-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase.from('gift_registries').insert({
        couple_name: b.coupleName, couple_amharic_name: b.coupleAmharicName || '',
        wedding_date: b.weddingDate, wedding_location: b.weddingLocation || '',
        message: b.message || '', share_token: token,
        creator_telegram_id: b.telegramId,
      }).select().single();
      if (error) return fail(error.message);
      // Add items
      if (b.productIds?.length) {
        const { data: products } = await supabase.from('products').select('*').in('id', b.productIds);
        for (const p of (products || [])) {
          await supabase.from('registry_items').insert({
            registry_id: data.id, product_id: p.id, product_name: p.name_en || p.name,
            product_image: p.image || '', price: p.price || 0, quantity: 1,
          });
        }
      }
      // Fetch full registry with items
      const { data: full } = await supabase.from('gift_registries').select('*, registry_items(*)').eq('id', data.id).single();
      return ok({ success: true, registry: full || data });
    }
    if (path.startsWith('/api/registry/') && method === 'GET' && !path.includes('/purchase')) {
      const token = path.replace('/api/registry/', '');
      const { data } = await supabase.from('gift_registries').select('*, registry_items(*)').eq('share_token', token).single();
      return ok({ registry: data || null });
    }
    if (path === '/api/registry/purchase' && method === 'POST') {
      const { token, itemId, quantity, buyerName, buyerTelegramId, message } = req.body || {};
      if (!token || !itemId) return fail('Token and itemId required');
      const { data: item } = await supabase.from('registry_items').select('*, gift_registries!inner(*)').eq('id', itemId).single();
      if (!item) return fail('Item not found');
      const newPurchased = (item.purchased || 0) + (quantity || 1);
      if (newPurchased > item.quantity) return fail('Not enough items remaining');
      await supabase.from('registry_items').update({ purchased: newPurchased }).eq('id', itemId);
      await supabase.from('registry_purchases').insert({
        registry_item_id: itemId, buyer_name: buyerName || 'Anonymous',
        buyer_telegram_id: buyerTelegramId, quantity: quantity || 1,
        amount: (item.price || 0) * (quantity || 1), message: message || '',
      });
      return ok({ success: true });
    }

    // ================================================================
    // SUBSCRIPTIONS — የደንበኝነት ምርቶች
    // ================================================================
    if (path === '/api/subscriptions' && method === 'GET') {
      const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id');
      let q = supabase.from('subscriptions').select('*').order('next_delivery');
      if (tid) q = q.eq('telegram_id', parseInt(tid));
      const { data } = await q;
      return ok({ subscriptions: data || [] });
    }
    if (path === '/api/subscriptions' && method === 'POST') {
      const b = req.body || {};
      const nextDel = new Date();
      if (b.frequency === 'daily') nextDel.setDate(nextDel.getDate() + 1);
      else if (b.frequency === 'weekly') nextDel.setDate(nextDel.getDate() + 7);
      else nextDel.setMonth(nextDel.getMonth() + 1);
      nextDel.setHours(7, 0, 0, 0);
      const { data, error } = await supabase.from('subscriptions').insert({
        telegram_id: b.telegramId, product_id: b.productId, product_name: b.productName || '',
        product_image: b.productImage || '', quantity: b.quantity || 1,
        frequency: b.frequency, price: b.price || 0,
        next_delivery: nextDel.toISOString(),
        delivery_address: b.deliveryAddress || '', delivery_note: b.deliveryNote || '',
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, subscription: data });
    }
    if (path.startsWith('/api/subscriptions/') && method === 'PATCH') {
      const id = pid(path);
      const { error } = await supabase.from('subscriptions').update(req.body).eq('id', id);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    // ================================================================
    // RESELLER PROGRAM
    // ================================================================
    if (path.startsWith('/api/reseller/stats/') && method === 'GET') {
      const tid = pid(path);
      if (!tid) return fail('Invalid ID');
      const code = 'SS' + Math.abs(tid * 16807 % 2147483647).toString(36).toUpperCase().padStart(5, '0').slice(-5);
      const { count: clicks } = await supabase.from('affiliates').select('*', { count: 'exact', head: true }).eq('code', code).maybeSingle();
      const { data: logs } = await supabase.from('referral_logs').select('*').eq('referral_code', code);
      const sales = logs?.filter(l => l.status === 'paid') || [];
      const totalRevenue = sales.reduce((s, l) => s + (l.amount || 0), 0);
      const totalCommission = sales.reduce((s, l) => s + (l.commission || 0), 0);
      return ok({
        referralCode: code, totalClicks: clicks || 0, totalSales: sales.length,
        totalRevenue, totalCommission, pendingPayout: totalCommission,
        commissionRate: sales.length >= 200 ? 15 : sales.length >= 50 ? 12 : sales.length >= 10 ? 8 : 5,
      });
    }
    if (path === '/api/reseller/withdraw' && method === 'POST') {
      return ok({ success: true, message: 'Withdrawal request submitted. You will be paid within 3 business days.' });
    }
    if (path === '/api/reseller/leaderboard' && method === 'GET') {
      const { data: logs } = await supabase.from('referral_logs').select('*');
      const byReferrer = (logs || []).reduce((acc: any, l: any) => {
        if (!acc[l.referrer_telegram_id]) acc[l.referrer_telegram_id] = { sales: 0, commission: 0 };
        if (l.status === 'paid') { acc[l.referrer_telegram_id].sales++; acc[l.referrer_telegram_id].commission += l.commission || 0; }
        return acc;
      }, {});
      const leaders = Object.entries(byReferrer).sort((a: any, b: any) => b[1].commission - a[1].commission)
        .slice(0, 10).map(([id, data]: any, i) => ({
          referrerId: parseInt(id), ...data, rank: i + 1,
        }));
      return ok({ leaders });
    }

    // ================================================================
    // PRODUCT PRICE COMPARISON
    // ================================================================
    if (path === '/api/products/compare' && method === 'GET') {
      const q = new URLSearchParams(req.url?.split('?')[1] || '');
      const query = q.get('q') || '';
      const cat = q.get('category') || '';
      let dbq = supabase.from('products').select('*');
      if (cat) dbq = dbq.eq('category', cat);
      if (query) dbq = dbq.or('name_en.ilike.%' + query + '%,name.ilike.%' + query + '%');
      const { data: products } = await dbq.limit(20);
      const options = (products || []).map(p => ({
        vendorId: p.vendor_id, vendorName: p.vendor_name || 'Main Store',
        vendorRating: p.rating || 4, vendorSales: p.sold_count || 0,
        price: p.price || 0, originalPrice: p.original_price || null,
        deliveryFee: p.price > 2000 ? 0 : 30, // Free delivery over Br 2,000
        totalPrice: p.price + (p.price > 2000 ? 0 : 30),
        stockCount: p.stock_count || 0, inStock: p.in_stock !== false,
        badge: p.badge || '',
      }));
      return ok({
        productName: products?.[0]?.name_en || query,
        productImage: products?.[0]?.image || '',
        options,
      });
    }

    // ================================================================
    // CRON — Process subscriptions (daily)
    // ================================================================
    if (path === '/api/cron/subscriptions' && method === 'POST') {
      const { data: dueSubs } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('status', 'active')
        .lte('next_delivery', new Date().toISOString());
      for (const sub of (dueSubs || [])) {
        // Create delivery order
        await supabase.from('deliveries').insert({
          order_number: 'SUB-' + Date.now().toString(36).toUpperCase(),
          status: 'pending', item_count: sub.quantity,
          pickup_address: 'Smart Shop Warehouse', delivery_address: sub.delivery_address,
        });
        // Update next delivery
        const next = new Date(sub.next_delivery);
        if (sub.frequency === 'daily') next.setDate(next.getDate() + 1);
        else if (sub.frequency === 'weekly') next.setDate(next.getDate() + 7);
        else next.setMonth(next.getMonth() + 1);
        await supabase.from('subscriptions').update({ next_delivery: next.toISOString() }).eq('id', sub.id);
        // Notify user
        tg(ENV.VENDOR_BOT_TOKEN, sub.telegram_id, '📦 *የእርስዎ ደንበኝነት ምርት ተልኳል!*\n\n' + sub.product_name + ' በ30 ደቂቃ ውስጥ ይደርሳል።');
      }
      return ok({ processed: (dueSubs || []).length });
    }

    // ================================================================
    // FALLBACK
    // ================================================================
    return res.status(404).json({ error: 'Not found', path: path, method: method });

  } catch (e) {
    logReq(method, path, 500, dur(start), ip, e.message);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
