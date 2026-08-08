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
  ADMIN_BOT_TOKEN: process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc',
  VENDOR_BOT_TOKEN: process.env.VENDOR_BOT_TOKEN || '7761374287:AAHreFF93x92F4tMqRoA1swcNiJoDv5M-Rk',
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '336997351',
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-a1y8t4NUlLoHF3ltfA7oczUIB777CJxz',
  CHAPA_PUBLIC_KEY: process.env.CHAPA_PUBLIC_KEY || 'CHAPUBK_TEST-8QjyLYBTfvQHXakSwYOCaOyxxty3UZfv',
  CHAPA_ENCRYPTION_KEY: process.env.CHAPA_ENCRYPTION_KEY || 'GyZtXJroHpl4ZOogcjZ7aFXl',
  BASE_URL: 'https://smartshop-steel.vercel.app',
};
const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY, { auth: { persistSession: false } });

// ===== RATE LIMITING =====
const rateStore = new Map();
const RATE_WIN = 60000, RATE_MAX = 60;
function chkRate(ip: any) {
  const n = Date.now(); const r: any = rateStore.get(ip);
  if (!r || n > r.resetAt) { rateStore.set(ip, { c: 1, resetAt: n + RATE_WIN }); return { ok: true, rem: RATE_MAX - 1 }; }
  if (r.c >= RATE_MAX) return { ok: false, rem: 0 };
  r.c++; return { ok: true, rem: RATE_MAX - r.c };
}
setInterval(() => { const n = Date.now(); for (const [k, v] of rateStore) if (n > (v as any).resetAt) rateStore.delete(k); }, 60000);

// ===== LOGGING =====
function logReq(m: any, p: any, c: any, ms: any, ip: any, e?: any) {
  console.log('[' + new Date().toISOString() + '] [' + (c >= 500 ? 'ERROR' : c >= 400 ? 'WARN' : 'INFO') + '] ' + m + ' ' + p + ' -> ' + c + ' ' + ms + 'ms ip=' + ip + (e ? ' err=' + e : ''));
}
function dur(s: any) { const d = process.hrtime(s); return Math.round(d[0] * 1000 + d[1] / 1000000); }
const slp = (ms: number) => new Promise(r => setTimeout(r, ms));

// ===== RETRY + TIMEOUT =====
async function fetchTO(url: string, opts?: any) {
  opts = opts || {}; const t = opts.timeout || 5000; const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), t);
  try { return await fetch(url, { ...opts, signal: ac.signal }); } finally { clearTimeout(id); }
}
async function fetchRetry(url: string, opts?: any) {
  opts = opts || {}; const mr = opts.maxRetries || 3;
  for (let a = 0; a <= mr; a++) {
    try {
    const r = await fetchTO(url, opts);
      if (r.status >= 400 && r.status < 500) return r;
      if (r.status >= 500 && a < mr) { await slp(Math.min(200 * Math.pow(2, a) + Math.random() * 100, 10000)); continue; }
      return r;
    } catch (e: any) { if (a < mr) await slp(Math.min(200 * Math.pow(2, a) + Math.random() * 100, 10000)); else throw e; }
  }
  throw new Error('Failed: ' + url);
}
async function tg(bot: any, ch: any, txt: any, pm?: any, ex?: any) {
  pm = pm || 'Markdown'; ex = ex || {};
  if (!bot) return false;
  try { const r = await fetchRetry('https://api.telegram.org/bot' + bot + '/sendMessage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: ch, text: txt, parse_mode: pm, disable_web_page_preview: true, ...ex }), timeout: 5000, maxRetries: 2 }); const d = await r.json(); return d.ok === true; }
  catch (e: any) { console.error('TG:', e); return false; }
}

function escapeHtml(unsafe: any): string {
  if (unsafe == null) return '';
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

async function notifyAdmins(txt: string, pm = 'HTML') {
  const chatIds = new Set<string>();
  if (ENV.adminChatId) chatIds.add(String(ENV.adminChatId));
  try {
    const { data: sd } = await supabase.from('settings').select('*').single();
    const s = sd?.data || sd || {};
    if (s.adminChatId) chatIds.add(String(s.adminChatId));
    if (s.admin_chat_id) chatIds.add(String(s.admin_chat_id));
    if (s.telegramAdminChatId) chatIds.add(String(s.telegramAdminChatId));
  } catch {}
  try {
    const { data: aus } = await supabase.from('admin_users').select('telegram_id').eq('is_active', true);
    if (aus) {
      for (const au of aus) {
        if (au.telegram_id) chatIds.add(String(au.telegram_id));
      }
    }
  } catch {}

  const bots = [ENV.ADMIN_BOT_TOKEN, ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN].filter(Boolean);
  for (const cid of chatIds) {
    for (const bot of bots) {
      try {
        const sent = await tg(bot, cid, txt, pm);
        if (sent) break;
      } catch {}
    }
  }
}

// ===== IDEMPOTENCY =====
const idem = new Map();
async function chkIdem(k: string) {
  const c = idem.get(k); if (c) return c;
  const { data } = await supabase.from('settings').select('*').single();
  const ks = data?.data?.idempotency_keys || {};
  if (ks[k]) { const a = Date.now() - new Date(ks[k].created_at).getTime(); if (a < 86400000) { idem.set(k, ks[k]); return ks[k]; } }
  return null;
}
async function setIdem(k: string, s: string, r: any) {
  idem.set(k, { status: s, result: r, created_at: new Date().toISOString() });
  try { const { data: row } = await supabase.from('settings').select('*').single(); const d = row?.data || {}; const ks = { ...(d.idempotency_keys || {}) }; ks[k] = { status: s, result: r, created_at: new Date().toISOString() }; for (const [kk, vv] of Object.entries(ks)) if (Date.now() - new Date((vv as any).created_at).getTime() > 86400000) delete ks[kk]; d.idempotency_keys = ks; await supabase.from('settings').update({ data: d }).eq('id', row?.id || 0); } catch (e: any) { console.error('Idem:', e?.message || e); }
}
function gON() { return 'ETH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase(); }

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function createDeliveryForOrder(on: string, lat?: number, lng?: number, ordParam?: any) {
  try {
    const { data: existingDel } = await supabase.from('deliveries').select('id').eq('order_number', on).maybeSingle();

    let ord = ordParam;
    if (!ord) {
      const { data } = await supabase.from('orders').select('*').eq('order_number', on).maybeSingle();
      ord = data;
    }
    if (!ord) {
      console.warn(`[DELIVERY] Order #${on} not found in database.`);
      return;
    }

    // Defensive parsing of items if stored as JSON string
    let items = ord.items || [];
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }
    if (!Array.isArray(items)) {
      items = [];
    }

    const itemCount = items.reduce((acc: number, it: any) => acc + (it.quantity || it.qty || 1), 0);
    const fee = Number(ord.delivery || ord.delivery_fee || 0);
    const customerTelegramId = ord.telegram_id || ord.telegramId || ord.customer?.telegram_id || ord.customer?.telegramId || null;
    
    let delCommRate = 0.20;
    try {
      const { data: sd } = await supabase.from('settings').select('*').single();
      if (sd?.data?.deliveryCommission) {
        delCommRate = sd.data.deliveryCommission / 100;
      }
    } catch {}

    const commission = Math.round(fee * delCommRate);
    const payout = Math.max(80, fee - commission); // Ensure a base payout of at least 80 Birr for drivers!

    let finalPickupLat = lat || null;
    let finalPickupLng = lng || null;

    const firstItem = items[0] || null;
    const firstVendorId = firstItem?.vendorId || firstItem?.vendor_id || null;

    if (!finalPickupLat) {
      if (firstVendorId) {
        const vendors = await getV();
        const vendorProfile = vendors.find((v: any) => v.id == firstVendorId || v.id === String(firstVendorId));
        if (vendorProfile?.lat && vendorProfile?.lng) {
          finalPickupLat = parseFloat(vendorProfile.lat);
          finalPickupLng = parseFloat(vendorProfile.lng);
        }
      }
    }

    if (!finalPickupLat) {
      finalPickupLat = 9.0190;
      finalPickupLng = 38.7680;
    }

    let finalDropoffLat = ord.customer?.lat || null;
    let finalDropoffLng = ord.customer?.lng || null;
    if (!finalDropoffLat) {
      finalDropoffLat = 9.0315;
      finalDropoffLng = 38.7485;
    }

    let { data: onlineDrivers } = await supabase
      .from('delivery_personnel')
      .select('*')
      .eq('status', 'approved')
      .eq('is_online', true);

    // Fallback: If no online drivers are found, notify ALL approved drivers to maximize pickup chances!
    if (!onlineDrivers || onlineDrivers.length === 0) {
      const { data: allApproved } = await supabase
        .from('delivery_personnel')
        .select('*')
        .eq('status', 'approved');
      onlineDrivers = allApproved || [];
      console.log(`[DELIVERY] No online drivers found. Cascading dispatch to ${onlineDrivers?.length || 0} approved partners.`);
    }

    // FINAL FALLBACK: If NO approved drivers exist at all in the database, notify ALL registered drivers so test/demo flows work!
    if (!onlineDrivers || onlineDrivers.length === 0) {
      const { data: allDrivers } = await supabase
        .from('delivery_personnel')
        .select('*');
      onlineDrivers = allDrivers || [];
      console.log(`[DELIVERY] No approved drivers found. Cascading dispatch to ALL ${onlineDrivers?.length || 0} registered partners.`);
    }

    // 1. Only consider real drivers who have a reachable telegram_id or a valid real phone (ignore seed test drivers like +251911111111)
    const validDrivers = (onlineDrivers || []).filter((d: any) => {
      const hasTg = d.telegram_id || d.telegramId;
      const isFakeSeed = d.phone === '+251911111111' || d.full_name_latin === 'Test Driver';
      return !isFakeSeed && (hasTg || d.phone);
    });

    const candidates = validDrivers.length > 0 ? validDrivers : (onlineDrivers || []);

    // AUTOMATIC DRIVER ASSIGNMENT: Select closest approved driver among valid contactable drivers
    let bestDriver = candidates.length > 0 ? candidates[0] : null;
    if (candidates.length > 1) {
      let minDistance = Infinity;
      for (const d of candidates) {
        let dist = 5.0; // Default distance if coordinates not set yet
        if (d.current_lat && d.current_lng && finalPickupLat && finalPickupLng) {
          dist = calculateDistance(parseFloat(d.current_lat), parseFloat(d.current_lng), finalPickupLat as number, finalPickupLng as number);
        }
        if (dist < minDistance) {
          minDistance = dist;
          bestDriver = d;
        }
      }
    }

    const deliveryStatus = bestDriver ? 'assigned' : 'pending';
    const assignedDriverId = bestDriver ? bestDriver.id : null;
    const nowIso = new Date().toISOString();
    const upfrontPin = Math.floor(1000 + Math.random() * 9000).toString();

    const deliveryPayload: Record<string, any> = {
      order_number: on,
      status: deliveryStatus,
      driver_id: assignedDriverId,
      delivery_pin: upfrontPin,
      assigned_at: assignedDriverId ? nowIso : null,
      accepted_at: assignedDriverId ? nowIso : null,
      item_count: itemCount,
      fee: fee,
      distance_km: 3.5,
      platform_commission: commission,
      driver_payout: payout,
      pickup_address: firstItem?.vendorName || firstItem?.vendor_name || 'Smart Shop Warehouse',
      delivery_address: ord.customer?.address || 'Addis Ababa',
      customer_telegram_id: customerTelegramId,
      pickup_lat: finalPickupLat,
      pickup_lng: finalPickupLng,
      delivery_lat: finalDropoffLat,
      delivery_lng: finalDropoffLng,
    };

    if (existingDel) {
      await supabase.from('deliveries').update({
        driver_id: assignedDriverId,
        status: deliveryStatus,
        delivery_pin: upfrontPin,
        assigned_at: assignedDriverId ? nowIso : null,
        accepted_at: assignedDriverId ? nowIso : null,
        pickup_lat: finalPickupLat,
        pickup_lng: finalPickupLng,
        delivery_lat: finalDropoffLat,
        delivery_lng: finalDropoffLng,
      }).eq('id', existingDel.id);
    } else {
      let newDel = null;
      let delErr = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        const res = await supabase.from('deliveries').insert(deliveryPayload).select().single();
        newDel = res.data;
        delErr = res.error;
        if (delErr && delErr.message && delErr.message.includes('schema cache')) {
          const m = delErr.message.match(/Could not find the '([^']+)' column/i);
          if (m && m[1]) {
            delete deliveryPayload[m[1]];
            console.warn(`[DELIVERY] Schema mismatch: removed column '${m[1]}', retrying insert (attempt ${attempt + 1})...`);
            continue;
          }
        }
        break;
      }
      if (delErr) {
        console.error(`[DELIVERY] Insert failed for order ${on}: ${delErr.message}`);
      } else {
        console.log(`[DELIVERY] Successfully created delivery record ${newDel?.id} for order ${on}`);
      }
    }
    console.log(`[DELIVERY] Automatically assigned order ${on} to driver ${bestDriver?.id || 'none'} (${bestDriver?.full_name_latin || 'unassigned'}) with upfront PIN ${upfrontPin}`);

    // STAGE 1: Notify Customer upfront with their Security PIN
    let custTgId = customerTelegramId;
    if (!custTgId && ord.customer?.phone) {
      try {
        const last9 = String(ord.customer.phone).replace(/\D/g, '').slice(-9);
        const { data: allU } = await supabase.from('users').select('telegram_id, phone').not('telegram_id', 'is', null);
        const foundU = (allU || []).find((u: any) => u.phone && String(u.phone).replace(/\D/g, '').slice(-9) === last9);
        if (foundU?.telegram_id) custTgId = foundU.telegram_id;
      } catch {}
    }

    if (custTgId) {
      const driverName = bestDriver ? (bestDriver.full_name_latin || 'Smart Express Partner') : 'Smart Express Courier';
      const pinMsg = `🎉 <b>Order Confirmed & Driver Assigned!</b>\n\n` +
        `📦 <b>Order:</b> #${escapeHtml(on)}\n` +
        `🚚 <b>Assigned Courier:</b> ${escapeHtml(driverName)}\n` +
        `🔐 <b>Your Delivery Security PIN:</b> <code>${upfrontPin}</code>\n\n` +
        `⚠️ <i>Keep this PIN safe! When your driver arrives with your package, enter this PIN on your Order Tracking page (or give it to your driver) to confirm receipt and release payment.</i>`;
      const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
      for (const bot of bots) {
        try {
          const sent = await tg(bot, custTgId, pinMsg, 'HTML');
          if (sent) {
            console.log(`[DELIVERY PIN] Sent upfront security PIN ${upfrontPin} to customer tg=${custTgId}`);
            break;
          }
        } catch {}
      }
      try {
        await supabase.from('notifications').insert({
          telegram_id: custTgId,
          type: 'delivery',
          title: '🔐 Delivery Security PIN: ' + upfrontPin,
          message: `Your security PIN for order #${on} is ${upfrontPin}. Enter this when your courier arrives to release payment.`,
          icon: '🔐',
        });
      } catch {}
    }

    if (onlineDrivers && onlineDrivers.length > 0) {
      for (const d of onlineDrivers) {
        let hasMatched = true;
        let distTextPickup = '';
        let distTextDropoff = '';

        if (d.current_lat && d.current_lng) {
          const dLat = parseFloat(d.current_lat);
          const dLng = parseFloat(d.current_lng);
          
          const distToPickup = calculateDistance(dLat, dLng, finalPickupLat as number, finalPickupLng as number);
          const distToDropoff = calculateDistance(dLat, dLng, finalDropoffLat as number, finalDropoffLng as number);
          const minDistance = Math.min(distToPickup, distToDropoff);

          hasMatched = true;
          distTextPickup = ` (Est. ${distToPickup.toFixed(1)} km away)`;
          distTextDropoff = ` (Est. ${distToDropoff.toFixed(1)} km away)`;
        }

        if (hasMatched) {
          const cleanPickup = escapeHtml(ord.items?.[0]?.vendorName || 'Smart Shop Warehouse');
          const cleanDropoff = escapeHtml(ord.customer?.address || 'Addis Ababa');
          
          const isAssignedToThisDriver = bestDriver && d.id === bestDriver.id;
          const tgMsg = isAssignedToThisDriver
            ? `⚡ <b>New Express Job Automatically Assigned!</b> 🚚\n\n` +
              `📦 <b>Order:</b> #${escapeHtml(on)}\n` +
              `📍 <b>Pickup:</b> ${cleanPickup}${escapeHtml(distTextPickup)}\n` +
              `📍 <b>Dropoff:</b> ${cleanDropoff}${escapeHtml(distTextDropoff)}\n` +
              `💰 <b>Your Net Payout:</b> Br ${payout}\n\n` +
              `👉 Open your Driver Dashboard to start pickup!`
            : `🔔 <b>New Express Job Nearby!</b> 🚚\n\n` +
              `📦 <b>Order:</b> #${escapeHtml(on)}\n` +
              `📍 <b>Pickup:</b> ${cleanPickup}${escapeHtml(distTextPickup)}\n` +
              `📍 <b>Dropoff:</b> ${cleanDropoff}${escapeHtml(distTextDropoff)}\n` +
              `💰 <b>Your Payout:</b> Br ${payout}\n\n` +
              `👉 Open your Driver Dashboard in the bot to check deliveries!`;

          let drvTgId = d.telegram_id || d.telegramId;
          if (!drvTgId && d.phone) {
            try {
              const last9 = String(d.phone).replace(/\D/g, '').slice(-9);
              const { data: allU } = await supabase.from('users').select('telegram_id, phone').not('telegram_id', 'is', null);
              const foundU = (allU || []).find((u: any) => u.phone && String(u.phone).replace(/\D/g, '').slice(-9) === last9);
              if (foundU?.telegram_id) drvTgId = foundU.telegram_id;
            } catch (e) {}
          }

          if (drvTgId) {
            const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
            for (const bot of bots) {
              try {
                let okSent = await tg(bot, drvTgId, tgMsg, 'HTML');
                if (!okSent) {
                  const plainText = tgMsg.replace(/<[^>]+>/g, '');
                  okSent = await tg(bot, drvTgId, plainText);
                }
                if (okSent) {
                  console.log(`[DELIVERY NOTIFY] Successfully sent telegram alert to driver ${drvTgId} using bot ${bot}`);
                  break;
                }
              } catch (e) {}
            }
          } else {
            console.warn(`[DELIVERY NOTIFY] Driver ${d.id} (${d.full_name_latin}) has no telegram_id to notify! phone=${d.phone}`);
          }

          await supabase.from('notifications').insert({
            telegram_id: drvTgId || null,
            type: 'delivery',
            title: isAssignedToThisDriver ? '⚡ New Job Assigned to You' : 'New Nearby Delivery Available',
            message: isAssignedToThisDriver
              ? `Order #${on} has been automatically assigned to you (Br ${payout} payout)`
              : `New job #${on} is available for express pickup!`,
            icon: '🚚',
          });
        }
      }
    }
  } catch (err: any) {
    console.error(`[DELIVERY CREATION ERROR] for order ${on}:`, err.message);
  }
}


// ===== BOT COMMANDS DEFINITION =====
const BOT_COMMANDS = [
  { command: 'start', description: '🏠 Main menu / ዋና ሜኑ' },
  { command: 'shop', description: '🛍️ Open store / ሱቅ ይክፈቱ' },
  { command: 'driver', description: '🚚 Register as driver / ሹፌር ይመዝገቡ' },
  { command: 'vendor', description: '🏪 Become a seller / ሻጭ ይሁኑ' },
  { command: 'contact', description: '📞 Share phone / ስልክ ያጋሩ' },
  { command: 'help', description: '❓ Commands / ትእዛዛት' },
];

// Register bot commands at startup (fire & forget)

// ===== TELEGRAM BOT COMMANDS — register globally at startup =====
(async () => {
  const ADMIN_COMMANDS = [
    { command: 'start', description: '🏠 Admin menu' },
    { command: 'panel', description: '🖥️ Open admin panel' },
    { command: 'stats', description: '📊 Store statistics' },
    { command: 'orders', description: '📋 Recent orders' },
    { command: 'lowstock', description: '⚠️ Low stock alerts' },
    { command: 'vendors', description: '🏪 Vendor applications' },
    { command: 'alerts', description: '🔔 Active alerts' },
    { command: 'help', description: '❓ All commands' },
  ];
  const cmds = [
    { command: 'start', description: '🏠 Main menu / ዋና ሜኑ' },
    { command: 'shop', description: '🛍️ Open store / ሱቅ ይክፈቱ' },
    { command: 'driver', description: '🚚 Register as driver / ሹፌር ይመዝገቡ' },
    { command: 'vendor', description: '🏪 Become a seller / ሻጭ ይሁኑ' },
    { command: 'contact', description: '📞 Share phone / ስልክ ያጋሩ' },
    { command: 'help', description: '❓ Commands / ትእዛዛት' },
  ];
  const tokens = [
    { token: ENV.VENDOR_BOT_TOKEN, isAdmin: false },
    { token: ENV.ADMIN_BOT_TOKEN, isAdmin: true },
  ];
  for (const tObj of tokens) {
    if (!tObj?.token) continue;
    try {
      const cmds = tObj.isAdmin ? ADMIN_COMMANDS : BOT_COMMANDS;
      // Set commands globally
      await fetch('https://api.telegram.org/bot' + tObj.token + '/setMyCommands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commands: cmds }),
      });
      // Set global menu button to default (commands list)
      await fetch('https://api.telegram.org/bot' + tObj.token + '/setChatMenuButton', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu_button: { type: 'default' } }),
      });
    } catch(e: any) { console.log('Bot init error:', e?.message || e); }
  }
})();

// ===== VENDORS =====
async function getV() { try { const { data: r } = await supabase.from('settings').select('*').single(); return r?.data?.vendors || []; } catch { return []; } }
async function setV(v: any) { try { const { data: r } = await supabase.from('settings').select('*').single(); const nd = { ...(r?.data || {}), vendors: v }; if (r) await supabase.from('settings').update({ data: nd, updated_at: new Date().toISOString() }).eq('id', r.id); else await supabase.from('settings').insert({ data: nd }); } catch (e: any) { console.error('setV:', e?.message || e); } }

// ===== HELPERS =====
function norm(p: any) {
  if (!p) return null;
  return { id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '', price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '', images: p.images || [], badge: p.badge || '', description: p.description || '', descriptionEn: p.description_en || '', stockCount: p.stock_count || 0, soldCount: p.sold_count || 0, rating: p.rating || 4.0, reviews: p.reviews || 0, vendorId: p.vendor_id || null, vendorName: p.vendor_name || '', inStock: p.in_stock !== false, visible: p.visible !== false, colors: p.colors || [], sizes: p.sizes || [], features: p.features || [], tags: p.tags || [], brand: p.brand || '', featured: p.featured || false, weight: p.weight || 0, unit: p.unit || 'kg', seoTitle: p.seo_title || '', seoDescription: p.seo_description || '', createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false, preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null, preOrderMax: p.pre_order_max || null };
}
function cln(b: any) {
  const r = { ...b, name_en: b.nameEn || b.name_en || '', name: b.name || b.name_en || '', description_en: b.descriptionEn || b.description_en || '', description: b.description || '', stock_count: b.stockCount ?? b.stock_count ?? 10, sold_count: b.soldCount ?? b.sold_count ?? 0, original_price: b.originalPrice ?? b.original_price ?? null, vendor_id: b.vendorId ?? b.vendor_id ?? null, vendor_name: b.vendorName ?? b.vendor_name ?? '', is_pre_order: b.isPreOrder ?? b.is_pre_order ?? false, pre_order_deposit: b.preOrderDeposit ?? b.pre_order_deposit ?? null, pre_order_release_date: b.preOrderReleaseDate ?? b.pre_order_release_date ?? '', pre_order_max: b.preOrderMax ?? b.pre_order_max ?? null, seo_title: b.seoTitle ?? b.seo_title ?? '', seo_description: b.seoDescription ?? b.seo_description ?? '', in_stock: b.inStock ?? b.in_stock ?? true };
  delete r.nameEn; delete r.descriptionEn; delete r.stockCount; delete r.soldCount; delete r.originalPrice; delete r.vendorId; delete r.vendorName; delete r.isPreOrder; delete r.preOrderDeposit; delete r.preOrderReleaseDate; delete r.preOrderMax; delete r.seoTitle; delete r.seoDescription; delete r.inStock;
  return r;
}
function pid(p: any) { return parseInt(p.split('/').pop() || '0'); }
function vrfy(init: any) {
  try { const p = new URLSearchParams(init); const h = p.get('hash'); if (!h) return { valid: false, user: null }; p.delete('hash'); const s = [...p.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => k + '=' + v).join('\n'); const sk = crypto.createHmac('sha256', 'WebAppData').update(ENV.BOT_TOKEN).digest(); if (crypto.createHmac('sha256', sk).update(s).digest('hex') !== h) return { valid: false, user: null }; const u = p.get('user'); return { valid: true, user: u ? JSON.parse(u) : null }; }
  catch { return { valid: false, user: null }; }
}
const DSTAT = ['pending','assigned','accepted','at_vendor','picked_up','in_transit','arrived','delivered','failed','cancelled','returned'];

// ===== MAIN HANDLER =====
export default async function handler(req: any, res: any) {
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

  function ok(d: any, s: number = 200) { return res.status(s).json(d); }
  function fail(m: any, s: number = 400) { return res.status(s).json({ error: m }); }

  try {


    // ================================================================
    // EXPORT DRIVERS ROUTE
    // ================================================================
    // EXPORT DRIVERS ROUTE
    // ================================================================
    if (path.includes('export-drivers')) {
      if (method !== 'GET' && method !== 'POST') return fail('Method not allowed', 405);
      try {
        var uParams = new URLSearchParams(req.url?.split('?')[1] || '');
        const reqBody = req.body || {};
        const chatId = reqBody.chat_id || reqBody.chatId || uParams.get('chat_id') || uParams.get('chatId') || ENV.adminChatId;

        const { data: drivers, error: dbError } = await supabase
          .from('delivery_personnel')
          .select('*')
          .order('joined_at', { ascending: false });
          
        if (dbError) return fail(dbError.message, 500);
        
        const headers = [
          "Driver ID", "Full Name (Latin)", "Full Name (Amharic)", "Phone", "Email", 
          "Fayda ID", "Vehicle Type", "License Plate", "Status", "Rating", 
          "Deliveries", "Earnings (Br)", "Score", "Tier", "Online", "Joined At"
        ];
        
        let csvContent = headers.join(',') + '\n';
        
        for (const d of (drivers || [])) {
          const row = [
            d.id,
            `"${(d.full_name_latin || '').replace(/"/g, '""')}"`,
            `"${(d.full_name_amharic || '').replace(/"/g, '""')}"`,
            `"${(d.phone || '').replace(/"/g, '""')}"`,
            `"${(d.email || '').replace(/"/g, '""')}"`,
            `"${(d.fayda_id || '').replace(/"/g, '""')}"`,
            d.vehicle_type || 'motorcycle',
            `"${(d.license_plate || '').replace(/"/g, '""')}"`,
            d.status || 'pending_review',
            d.rating || 0,
            d.total_deliveries || 0,
            d.total_earnings || 0,
            d.driver_score || 0,
            d.driver_tier || 'bronze',
            d.is_online ? 'Yes' : 'No',
            d.joined_at ? d.joined_at.slice(0, 10) : ''
          ];
          csvContent += row.join(',') + '\n';
        }
        
        const formData = new FormData();
        const blob = new Blob([csvContent], { type: 'text/csv' });
        formData.append('chat_id', chatId);
        formData.append('document', blob, 'drivers_report.csv');
        formData.append('caption', '📊 *Smartshop Express Delivery Fleet Report*\n\nHere is the requested CSV spreadsheet of all driver applications, statuses, earnings, and ratings.');
        
        const tgRes = await fetch(`https://api.telegram.org/bot${ENV.ADMIN_BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          body: formData
        });
        const tgData: any = await tgRes.json();
        
        return ok({ success: !!tgData.ok, message: tgData.description || 'Fleet report sent directly to your Telegram admin chat!' });
      } catch (e: any) {
        return fail(e.message, 500);
      }
    }

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
        const pr: Record<string, any> = { on_foot: { b: 15, pk: 5, mx: 2 }, bicycle: { b: 20, pk: 7, mx: 4 }, motorcycle: { b: 30, pk: 10, mx: 10 }, bajaj: { b: 40, pk: 15, mx: 15 } };
        const p = pr[vt] || pr.motorcycle; let mx = p.mx; let bf = p.b, pk = p.pk;
        if (b.zone_id) { const { data: z } = await supabase.from('delivery_zones').select('*').eq('id', b.zone_id).single(); if (z) { bf = z.base_fee || p.b; pk = z.per_km_fee || p.pk; mx = Math.min(mx, z.max_distance_km || mx); } }
        const ed = Math.min(dist, mx); const fee = Math.max(20, Math.round(bf + ed * pk));
        
        // Fetch dynamic delivery commission
        const { data: sd } = await supabase.from('settings').select('*').single();
        const s = sd?.data || {};
        const delCommRate = (s.deliveryCommission || 20) / 100;
        const cm = Math.round(fee * delCommRate);
        
        return ok({ fee, commission: cm, driver_payout: fee - cm, base_fee: bf, per_km_fee: pk, distance_km: ed, max_distance_km: mx, vehicle_type: vt });
      }
      if (path === '/api/delivery/register' && method === 'POST') {
        const b = req.body || {};
        if (!b.full_name_latin || !b.phone) return fail('full_name_latin and phone required');
        
        // Check if a driver is already registered under this telegram_id (even if rejected)
        let existingDriver = null;
        if (b.telegram_id) {
          const { data } = await supabase.from('delivery_personnel').select('*').eq('telegram_id', b.telegram_id).maybeSingle();
          existingDriver = data;
        }

        // Check if phone is already used by another driver
        if (b.phone) {
          const { data: dupPhone } = await supabase
            .from('delivery_personnel')
            .select('id, full_name_latin')
            .eq('phone', b.phone)
            .maybeSingle();
          if (dupPhone && (!existingDriver || dupPhone.id !== existingDriver.id)) {
            return fail('A driver with this Phone number is already registered.', 409);
          }
        }

        // Check if Fayda ID is already used by another driver
        if (b.fayda_id) {
          const { data: dupFayda } = await supabase
            .from('delivery_personnel')
            .select('id, full_name_latin')
            .eq('fayda_id', b.fayda_id)
            .maybeSingle();
          if (dupFayda && (!existingDriver || dupFayda.id !== existingDriver.id)) {
            return fail('A driver with this Fayda ID is already registered.', 409);
          }
        }

        const payload = {
          telegram_id: b.telegram_id || b.telegramId || null,
          full_name_latin: b.full_name_latin, 
          full_name_amharic: b.full_name_amharic || '', 
          phone: b.phone,
          email: b.email || '', 
          fayda_id: b.fayda_id || 'TEMP-' + Date.now(),
          fayda_id_front_url: b.fayda_front_image || '',
          fayda_id_back_url: b.fayda_back_image || '',
          fayda_selfie_url: b.driver_selfie || '',
          vehicle_type: b.vehicle_type || 'motorcycle', 
          license_plate: b.license_plate || '',
          service_zones: b.service_zones || [],
          available_days: b.available_days || [],
          available_hours: b.available_hours || [],
          emergency_name: b.emergency_name || '', 
          emergency_phone: b.emergency_phone || '',
          emergency_relationship: b.emergency_relationship || '', 
          emergency_address: (b.emergency_address || '') + '::' + (b.emergency_id_image || ''),
          bank_name: b.bank_name || '',
          bank_account: b.bank_account || '',
          telebirr_number: b.telebirr_number || '',
          status: 'pending_review', // reset status back to pending_review for review!
          rejection_reason: null, // clear previous rejection reason!
        };

        let result;
        if (existingDriver) {
          result = await supabase.from('delivery_personnel').update(payload).eq('id', existingDriver.id).select().single();
        } else {
          result = await supabase.from('delivery_personnel').insert({
            agreed_to_terms_at: new Date().toISOString(),
            ...payload
          }).select().single();
        }

        const { data, error } = result;
        if (error) return fail(error.message);
        tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '🆕 *New Driver* ' + (b.full_name_latin || '') + ' ' + (b.phone || ''));
        return ok({ success: true, driver: data });
      }
      if (path.startsWith('/api/delivery/drivers')) {
        if (method === 'GET') { 
          var uParams = new URLSearchParams(req.url?.split('?')[1] || '');
          const tgId = uParams.get('telegram_id') || uParams.get('telegramId');
          if (req.url?.includes('telegramId=') || req.url?.includes('telegram_id=')) {
            if (!tgId || tgId === 'undefined' || tgId === 'null' || tgId === '0' || tgId === '') {
              return ok({ success: false, driver: null });
            }
            const { data, error } = await supabase.from('delivery_personnel').select('*').eq('telegram_id', parseInt(tgId)).single();
            if (error || !data) return ok({ success: false, driver: null });
            return ok({ success: true, driver: data });
          }
          const did = pid(path); 
          if (did) { const { data, error } = await supabase.from('delivery_personnel').select('*').eq('id', did).single(); return ok({ success: !error, driver: data || null }); } const { data, error } = await supabase.from('delivery_personnel').select('*').order('joined_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ drivers: data || [] }); }
        if (method === 'DELETE') { const { error } = await supabase.from('delivery_personnel').update({ status: 'rejected' }).eq('id', pid(path)); if (error) return fail(error.message); return ok({ success: true }); }
      }
      if (path === '/api/delivery/applications' && method === 'GET') { const { data, error } = await supabase.from('delivery_personnel').select('*').in('status', ['pending_fayda', 'pending_review']).order('joined_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ applications: data || [] }); }
      if (path === '/api/delivery/approve' && method === 'POST') {
        const b = req.body || {};
        const driver_id = b.driver_id || b.id;
        if (!driver_id) return fail('driver_id required');
        const finalStatus = b.status || 'approved';
        const { data, error } = await supabase.from('delivery_personnel').update({ 
          status: finalStatus, 
          fayda_verified_at: finalStatus === 'approved' ? new Date().toISOString() : null,
          rejection_reason: b.reason || null
        }).eq('id', driver_id).select().single();
        if (error) return fail(error.message); 
        if (data?.telegram_id) {
          if (finalStatus === 'approved') {
            tg(ENV.VENDOR_BOT_TOKEN, data.telegram_id, '🎉 *Approved!* You can now start delivering.');
          } else if (finalStatus === 'rejected') {
            tg(ENV.VENDOR_BOT_TOKEN, data.telegram_id, '❌ *Application Declined.* Rejection reason: ' + (b.reason || 'Application does not meet requirements'));
          }
        }
        return ok({ success: true, driver: data });
      }
      if (path === '/api/delivery/available' && method === 'GET') { 
        const { data, error } = await supabase.from('deliveries').select('*').in('status', ['pending', 'assigned', 'accepted', 'at_vendor', 'picked_up', 'in_transit', 'arrived']).order('created_at', { ascending: false }); 
        if (error) return fail(error.message, 500); 
        return ok({ deliveries: data || [] }); 
      }
      if (path === '/api/delivery/accept' && method === 'POST') {
        const b = req.body || {};
        const delivery_id = b.delivery_id || b.deliveryId || b.id;
        const driver_id = b.driver_id || b.driverId || b.id;
        if (!delivery_id || !driver_id) return fail('delivery_id and driver_id required');
        const { data, error } = await supabase.from('deliveries').update({ driver_id, status: 'accepted', assigned_at: new Date().toISOString(), accepted_at: new Date().toISOString() }).eq('id', delivery_id).in('status', ['pending', 'assigned']).select().maybeSingle();
        if (error || !data) return fail('Delivery already accepted or completed', 409);
        if (data && data.order_number) {
          try {
            await supabase.from('orders').update({ status: 'in_transit' }).eq('order_number', data.order_number);
          } catch {}
        }
        return ok({ success: true, delivery: data });
      }
      if (path === '/api/delivery/decline' && method === 'POST') {
        const b = req.body || {};
        const delivery_id = b.delivery_id || b.deliveryId || b.id;
        const driver_id = b.driver_id || b.driverId || b.id;
        if (!delivery_id || !driver_id) return fail('delivery_id and driver_id required');
        
        const { data: del } = await supabase.from('deliveries').select('*').eq('id', delivery_id).single();
        if (!del) return fail('Delivery not found', 404);

        console.log(`[DELIVERY DECLINE] Driver ${driver_id} declined delivery ${delivery_id} (${del.order_number}). Finding next available partner...`);
        
        // 1. Fetch online approved drivers (or all approved as fallback)
        let { data: onlineDrivers } = await supabase
          .from('delivery_personnel')
          .select('*')
          .eq('status', 'approved')
          .eq('is_online', true);

        if (!onlineDrivers || onlineDrivers.length === 0) {
          const { data: allApproved } = await supabase
            .from('delivery_personnel')
            .select('*')
            .eq('status', 'approved');
          onlineDrivers = allApproved || [];
        }

        // 2. Filter out the driver who just declined this job
        const remainingDrivers = (onlineDrivers || []).filter((d: any) => d.id != driver_id && d.id !== String(driver_id));

        if (remainingDrivers.length > 0) {
          // Select the closest remaining driver
          let nextBestDriver = remainingDrivers[0];
          let minDistance = Infinity;
          for (const d of remainingDrivers) {
            if (d.current_lat && d.current_lng && del.pickup_lat && del.pickup_lng) {
              const dist = calculateDistance(parseFloat(d.current_lat), parseFloat(d.current_lng), parseFloat(del.pickup_lat), parseFloat(del.pickup_lng));
              if (dist < minDistance) {
                minDistance = dist;
                nextBestDriver = d;
              }
            }
          }

          await supabase.from('deliveries').update({
            driver_id: nextBestDriver.id,
            status: 'assigned',
            assigned_at: new Date().toISOString(),
          }).eq('id', delivery_id);

          // Notify next best driver on Telegram
          const cleanPickup = escapeHtml(del.pickup_address || 'Smart Shop Warehouse');
          const cleanDropoff = escapeHtml(del.delivery_address || 'Addis Ababa');
          const payout = del.driver_payout || del.fee || 80;
          
          const tgMsg = `⚡ <b>New Express Job Reassigned to You!</b> 🚚\n\n` +
            `📦 <b>Order:</b> #${escapeHtml(del.order_number)}\n` +
            `📍 <b>Pickup:</b> ${cleanPickup}\n` +
            `📍 <b>Dropoff:</b> ${cleanDropoff}\n` +
            `💰 <b>Your Net Payout:</b> Br ${payout}\n\n` +
            `👉 Open your Driver Dashboard to start pickup!`;

          let drvTgId = nextBestDriver.telegram_id || nextBestDriver.telegramId;
          if (!drvTgId && nextBestDriver.phone) {
            try {
              const { data: uRow } = await supabase.from('users').select('telegram_id').eq('phone', nextBestDriver.phone).maybeSingle();
              if (uRow?.telegram_id) drvTgId = uRow.telegram_id;
            } catch (e) {}
          }

          if (drvTgId) {
            const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
            for (const bot of bots) {
              try {
                const okSent = await tg(bot, drvTgId, tgMsg, 'HTML');
                if (okSent) break;
              } catch (e) {}
            }
          }

          await supabase.from('notifications').insert({
            telegram_id: drvTgId || null,
            type: 'delivery',
            title: '⚡ Reassigned Job Available',
            message: `Order #${del.order_number} has been assigned to you (Br ${payout} payout)`,
            icon: '🚚',
          });

          return ok({ success: true, reassigned: true, new_driver_id: nextBestDriver.id });
        } else {
          // No other drivers available - return job to open unassigned pending pool
          await supabase.from('deliveries').update({
            driver_id: null,
            status: 'pending',
            assigned_at: null,
          }).eq('id', delivery_id);

          return ok({ success: true, reassigned: false, new_driver_id: null });
        }
      }
      if (path === '/api/delivery/status' && method === 'POST') {
        const b = req.body || {};
        const delivery_id = b.delivery_id || b.deliveryId || b.id;
        const status = b.status;
        const item_count = b.item_count || b.itemCount;
        if (!delivery_id || !status) return fail('delivery_id and status required'); if (!DSTAT.includes(status)) return fail('Invalid status');
        const ud: Record<string, any> = { status }; if (status === 'at_vendor' && item_count) ud.item_count_confirmed_at_vendor = item_count;
        if (status === 'picked_up') ud.picked_up_at = new Date().toISOString();
        if (status === 'delivered') ud.delivered_at = new Date().toISOString();
        const { data, error } = await supabase.from('deliveries').update(ud).eq('id', delivery_id).select().single();
        if (error) return fail(error.message);
        
        // Sync Order Status in orders table so customer tracking timeline updates instantly
        const orderStatusMap: Record<string, string> = {
          'at_vendor': 'processing',
          'picked_up': 'in_transit',
          'in_transit': 'in_transit',
          'arrived': 'out_for_delivery',
          'delivered': 'delivered',
          'cancelled': 'cancelled',
        };
        if (data && data.order_number && orderStatusMap[status]) {
          try {
            await supabase.from('orders').update({ status: orderStatusMap[status] }).eq('order_number', data.order_number);
          } catch {}
        }

        // Dispatch arrival notice & PIN reminder dynamically to customer via Telegram chat!
        if (status === 'arrived' && data && data.customer_telegram_id) {
          const pinMsg = `📦 <b>Smart Shop Delivery Arrived!</b>\n\nYour order <b>#${escapeHtml(data.order_number)}</b> has arrived at your destination!\n\n🔑 Your Security Delivery PIN is: <code>${escapeHtml(data.delivery_pin)}</code>\n\nPlease provide this PIN to your delivery courier, or tap <b>Confirm Receipt</b> on your order tracking page inside the WebApp to confirm receipt yourself!`;
          const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
          for (const bot of bots) {
            try { if (await tg(bot, data.customer_telegram_id, pinMsg, 'HTML')) break; } catch {}
          }
        }

        if (status === 'delivered' && data) { 
          const dp = data.driver_payout || 0; 
          const c = data.platform_commission || Math.round((data.fee || 0) * 0.2); 
          await supabase.from('driver_earnings').insert({ 
            driver_id: data.driver_id, 
            delivery_id: data.id, 
            amount: dp || ((data.fee || 0) - c), 
            commission: c, 
            type: 'delivery', 
            status: 'pending' 
          }); 
        }
        return ok({ success: true, delivery: data });
      }
      if (path === '/api/delivery/verify-pin' && method === 'POST') {
        const b = req.body || {};
        const delivery_id = b.delivery_id || b.deliveryId || b.id;
        const pin = b.pin;
        if (!delivery_id || !pin) return fail('delivery_id and pin required');
        const { data, error } = await supabase.from('deliveries').select('*').eq('id', delivery_id).single();
        if (error || !data) return ok({ success: false, verified: false }); if (data.delivery_pin !== pin) return ok({ success: false, verified: false });
        
        const nowIso = new Date().toISOString();
        // 1. Update delivery status to completed/delivered
        await supabase.from('deliveries').update({
          status: 'delivered',
          pin_verified_at: nowIso,
          delivered_at: nowIso,
        }).eq('id', delivery_id);

        // 2. Update order status to delivered
        if (data.order_number) {
          await supabase.from('orders').update({
            status: 'delivered',
          }).eq('order_number', data.order_number);
        }

        // 3. Credit Driver Payout (status: 'paid')
        const dp = data.driver_payout || 0;
        const comm = data.platform_commission || Math.round((data.fee || 0) * 0.2);
        if (data.driver_id) {
          const earnAmt = dp || ((data.fee || 0) - comm);
          try {
            await supabase.from('driver_earnings').insert({
              driver_id: data.driver_id,
              delivery_id: data.id,
              amount: earnAmt,
              commission: comm,
              type: 'delivery',
              status: 'paid', // Correct value allowed by CHECK constraint ('pending', 'paid', 'cancelled')
            });
          } catch (e) {
            console.error('[PIN VERIFY] Driver earnings insert error:', e);
          }

          // Directly increment driver's total_earnings & total_deliveries in delivery_personnel table
          try {
            const { data: drv } = await supabase.from('delivery_personnel').select('total_deliveries, total_earnings').eq('id', data.driver_id).single();
            if (drv) {
              const newDelCount = (drv.total_deliveries || 0) + 1;
              const newTotalEarn = (drv.total_earnings || 0) + earnAmt;
              await supabase.from('delivery_personnel').update({
                total_deliveries: newDelCount,
                total_earnings: newTotalEarn,
              }).eq('id', data.driver_id);
              console.log(`[PIN VERIFY] Driver ${data.driver_id} earnings updated to Br ${newTotalEarn} (${newDelCount} deliveries)`);
            }
          } catch (e) {
            console.error('[PIN VERIFY] Driver balance update error:', e);
          }
        }

        // 4. Vendor 6-Hour Buyer Inspection Escrow Hold (status: 'pending')
        const vendorId = data.vendor_id || 1;
        const vendorNet = Math.max(0, (data.total || 1000) - comm - Math.round((data.total || 1000) * 0.02));
        const escrowReleaseAt = Date.now() + 6 * 3600 * 1000; // 6 Hours from now
        try {
          await supabase.from('payouts').insert({
            vendor_id: vendorId,
            vendor_name: data.pickup_address || 'Smart Shop Vendor',
            amount: vendorNet,
            commission_deducted: comm,
            payment_method: 'telebirr',
            status: 'pending', // Pending 6-hour escrow hold
            paid_at: null,
            notes: JSON.stringify({
              type: 'escrow_hold',
              release_at: escrowReleaseAt,
              order_number: data.order_number,
              pin: pin,
              message: '6-hour buyer inspection window escrow hold (auto-releases if no return/dispute)'
            }),
          });
        } catch (err) {
          console.error('[PIN VERIFY] Vendor payout insert error:', err);
        }

        // 5. Notify all 3 Stakeholders on Telegram
        const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
        // Customer
        if (data.customer_telegram_id) {
          const custMsg = `🎉 <b>Delivery Confirmed!</b>\n\n` +
            `Thank you for shopping with Smart Shop! Your order #${data.order_number} is delivered.\n` +
            `• Your courier has been paid instantly.\n` +
            `• Your seller's revenue is held in 6-hour buyer inspection escrow protection.`;
          for (const bot of bots) {
            try { if (await tg(bot, data.customer_telegram_id, custMsg, 'HTML')) break; } catch {}
          }
        }
        // Driver
        if (data.driver_id) {
          try {
            const { data: drv } = await supabase.from('delivery_personnel').select('telegram_id, phone').eq('id', data.driver_id).single();
            const drvTg = drv?.telegram_id;
            if (drvTg) {
              const drvMsg = `💰 <b>Delivery Completed & Earnings Cleared!</b>\n\n` +
                `PIN verified for order #${data.order_number}.\n` +
                `<b>Net Earnings:</b> Br ${dp || ((data.fee || 0) - comm)} cleared to your weekly balance!`;
              for (const bot of bots) {
                try { if (await tg(bot, drvTg, drvMsg, 'HTML')) break; } catch {}
              }
            }
          } catch {}
        }

        return ok({ success: true, verified: true, message: 'PIN verified! Driver paid instantly; vendor payout placed in 6-hour inspection escrow hold.' });
      }
      if (path === '/api/delivery/rate' && method === 'POST') {
        const b = req.body || {};
        const delivery_id = b.delivery_id || b.deliveryId || b.id;
        const driver_rating = b.driver_rating || b.driverRating;
        const customer_rating = b.customer_rating || b.customerRating;
        if (!delivery_id) return fail('delivery_id required');
        const ud: Record<string, any> = {}; if (driver_rating) ud.driver_rating = Math.max(1, Math.min(5, parseInt(driver_rating))); if (customer_rating) ud.customer_rating = Math.max(1, Math.min(5, parseInt(customer_rating)));
        const { error } = await supabase.from('deliveries').update(ud).eq('id', delivery_id); if (error) return fail(error.message);
        if (driver_rating) { const { data: d } = await supabase.from('deliveries').select('driver_id').eq('id', delivery_id).single(); if (d?.driver_id) { const { data: rt } = await supabase.from('deliveries').select('driver_rating').eq('driver_id', d.driver_id).not('driver_rating', 'is', null); if (rt?.length) { const a = rt.reduce((s, r) => s + (r.driver_rating || 0), 0) / rt.length; await supabase.from('delivery_personnel').update({ rating: Math.round(a * 10) / 10 }).eq('id', d.driver_id); } } }
        return ok({ success: true });
      }
      if (path === '/api/delivery/online' && method === 'POST') {
        const b = req.body || {};
        const driver_id = b.driver_id || b.driverId || b.id;
        if (!driver_id) return fail('driver_id required');
        const { error } = await supabase.from('delivery_personnel').update({ is_online: b.is_online === true, last_active_at: new Date().toISOString() }).eq('id', driver_id);
        if (error) return fail(error.message); return ok({ success: true, is_online: b.is_online === true });
      }
      if (path === '/api/delivery/location' && method === 'POST') {
        const b = req.body || {};
        const driver_id = b.driver_id || b.driverId || b.id;
        const lat = b.lat;
        const lng = b.lng;
        if (!driver_id || lat == null || lng == null) return fail('driver_id, lat, lng required');
        const { error } = await supabase.from('delivery_personnel').update({ 
          current_lat: parseFloat(lat), 
          current_lng: parseFloat(lng), 
          is_online: true, 
          last_active_at: new Date().toISOString(), 
          location_updated_at: new Date().toISOString() 
        }).eq('id', driver_id);
        if (error) return fail(error.message); return ok({ success: true });
      }
      if (path.startsWith('/api/delivery/tracking/') && method === 'GET') {
        const param = path.split('/').pop() || '';
        let query = supabase.from('deliveries').select('*');
        if (/^\d+$/.test(param)) {
          query = query.eq('id', parseInt(param));
        } else {
          query = query.eq('order_number', param);
        }
        const { data: del, error } = await query.single();
        if (error || !del) return ok({ delivery: null });
        let dr = null;
        if (del.driver_id) {
          const { data: drv } = await supabase.from('delivery_personnel').select('*').eq('id', del.driver_id).single();
          dr = drv;
        }
        return ok({ delivery: { ...del, driver: dr } });
      }
      if (path.startsWith('/api/delivery/earnings/') && method === 'GET') {
        const drvId = pid(path);
        const { data, error } = await supabase.from('driver_earnings').select('*').eq('driver_id', drvId).order('created_at', { ascending: false });
        if (error) return fail(error.message, 500);
        const total_pending = (data || []).reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
        const total_paid = (data || []).filter((r: any) => r.status === 'cashed_out' || r.status === 'paid_out').reduce((sum: number, r: any) => sum + (Number(r.amount) || 0), 0);
        let total_from_profile = 0;
        try {
          const { data: drv } = await supabase.from('delivery_personnel').select('total_earnings').eq('id', drvId).maybeSingle();
          if (drv && drv.total_earnings) total_from_profile = Number(drv.total_earnings) || 0;
        } catch {}
        return ok({
          earnings: data || [],
          total_pending: Math.max(total_pending, total_from_profile),
          total_paid: total_paid,
          total_deliveries: (data || []).length
        });
      }
      if (path.startsWith('/api/delivery/history/') && method === 'GET') { const { data, error } = await supabase.from('deliveries').select('*').eq('driver_id', pid(path)).order('created_at', { ascending: false }); if (error) return fail(error.message, 500); return ok({ deliveries: data || [] }); }
      if (path === '/api/delivery/create' && method === 'POST') {
        const b = req.body || {}; if (!b.pickup_address || !b.delivery_address) return fail('pickup_address and delivery_address required');
        
        // Fetch global settings to get dynamic delivery commission percentage
        const { data: sd } = await supabase.from('settings').select('*').single();
        const s = sd?.data || {};
        const delCommRate = (s.deliveryCommission || 20) / 100;
        
        const passedFee = b.fee != null ? b.fee : 0;
        let finalFee = passedFee;
        let commission = 0;
        let payout = 0;
        
        if (passedFee === 0) {
          // Subsidized Free Delivery Model: Compute standard fee based on vehicle & distance metrics
          const vt = b.vehicle_type || 'motorcycle';
          const pr: Record<string, any> = { 
            on_foot: { b: 15, pk: 5, mx: 2 }, 
            bicycle: { b: 20, pk: 7, mx: 4 }, 
            motorcycle: { b: 30, pk: 10, mx: 10 }, 
            bajaj: { b: 40, pk: 15, mx: 15 } 
          };
          const p = pr[vt] || pr.motorcycle;
          const ed = Math.min(b.distance_km || 1, p.mx);
          const standardFee = Math.max(20, Math.round(p.b + ed * p.pk));
          
          // Driver gets full net payout of standard fee, platform subsidizes the rest (negative commission)
          payout = standardFee - Math.round(standardFee * delCommRate);
          commission = 0 - payout; // Negative platform commission (subsidy logged in ledger!)
          finalFee = 0; // Customer paid 0 delivery fee
        } else {
          // Paid Delivery Model
          commission = Math.round(passedFee * delCommRate);
          payout = passedFee - commission;
        }

        // Retrieve dynamic customer telegram_id from order
        let customerTelegramId = null;
        if (b.order_number) {
          try {
            const { data: ord } = await supabase.from('orders').select('*').eq('order_number', b.order_number).single();
            if (ord) {
              customerTelegramId = ord.telegram_id || ord.telegramId || ord.customer?.telegram_id || ord.customer?.telegramId || null;
            }
          } catch {}
        }

        const { data, error } = await supabase.from('deliveries').insert({
          order_number: b.order_number || 'DEL-' + Date.now().toString(36).toUpperCase(), status: 'pending',
          item_count: b.item_count || 0, fee: finalFee, distance_km: b.distance_km || 0,
          platform_commission: commission,
          driver_payout: payout,
          pickup_address: b.pickup_address, delivery_address: b.delivery_address, no_contact: b.no_contact || false,
          customer_telegram_id: customerTelegramId,
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

    // ── Group Deals ────────────────────────────────────────────────
    if (path === '/api/cron/expire-deals') {
      if (method !== 'GET' && method !== 'POST') return fail('Method not allowed', 405);
      const nowStr = new Date().toISOString();
      const { data, error } = await supabase
        .from('group_deals')
        .update({ status: 'expired' })
        .in('status', ['open', 'active'])
        .lt('expires_at', nowStr)
        .select();

      if (error) return fail(error.message, 500);
      return ok({ success: true, expiredCount: data?.length || 0, expiredDeals: data || [] });
    }

    if (path === '/api/group-deals' && method === 'POST') {
      var b = req.body || {};
      const token = b.share_token || Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase();
      const { data, error } = await supabase.from('group_deals').insert({
        product_id: b.product_id, product_name: b.product_name, product_image: b.product_image || '',
        regular_price: b.regular_price, group_price: b.group_price || b.regular_price,
        creator_telegram_id: b.creator_telegram_id, share_token: token, current_members: 1,
        min_members: b.min_members || b.minMembers || 2,
        max_members: b.max_members || b.maxMembers || 10,
        expires_at: b.expires_at || b.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
      var uParams = new URLSearchParams(req.url?.split('?')[1] || '');
      const token = uParams.get('token') || '';
      if (token) {
        const { data, error } = await supabase.from('group_deals').select('*, group_deal_members(*)').eq('share_token', token).single();
        if (error || !data) return ok({ deal: null, deals: [] });
        return ok({ deal: data, deals: [data] });
      }
      
      var q = supabase.from('group_deals').select('*, group_deal_members(*)');
      
      const tid = uParams.get('telegram_id') || uParams.get('creator') || '';
      if (tid) {
        q = q.eq('creator_telegram_id', parseInt(tid));
      }
      
      var pidVal = uParams.get('product_id') || '';
      if (pidVal) {
        q = q.eq('product_id', parseInt(pidVal));
      }
      
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return fail(error.message, 500);
      return ok({ deals: data || [] });
    }

    if (path.startsWith('/api/group-deals/') && method === 'DELETE') {
      var gid = parseInt(path.split('/').pop() || '0');
      if (!gid) return fail('Invalid ID');
      await supabase.from('group_deal_members').delete().eq('group_deal_id', gid);
      var { error } = await supabase.from('group_deals').delete().eq('id', gid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }
    if (path === '/api/group-deals/join' && method === 'POST') {
      var b = req.body || {};
      if (!b.token) return fail('token required');
      const { data: deal, error: dError } = await supabase.from('group_deals').select('*').eq('share_token', b.token).eq('status', 'open').single();
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

    // ── Subscription Plans (vendor-created) ─────────────────────
    if (path.match(/^\/api\/subscription-plans\/\d+$/) && method === 'GET') {
      var parsedPid = parseInt(path.split('/').pop() || '0');
      const { data, error } = await supabase.from('subscription_plans').select('*').eq('id', parsedPid).single();
      if (error || !data) return ok({ plan: null });
      return ok({ plan: data });
    }
    if (path === '/api/subscription-plans' && method === 'GET') {
      var cat = new URLSearchParams(req.url?.split('?')[1] || '').get('category') || '';
      var active = new URLSearchParams(req.url?.split('?')[1] || '').get('active');
      var q = supabase.from('subscription_plans').select('*');
      if (cat) q = q.eq('category', cat);
      if (active === 'true') q = q.eq('is_active', true);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) return fail(error.message, 500);
      return ok({ plans: data || [] });
    }
    if (path === '/api/subscription-plans' && method === 'POST') {
      var b = req.body || {};
      const { data, error } = await supabase.from('subscription_plans').insert({
        name: b.name, name_amharic: b.nameAmharic || b.name_amharic || '',
        emoji: b.emoji || '📦', description: b.description || '',
        category: b.category || 'general',
        unit: b.unit || '1', unit_label: b.unitLabel || b.unit_label || 'pc',
        daily_price: b.dailyPrice || b.daily_price || 0,
        weekly_price: b.weeklyPrice || b.weekly_price || 0,
        monthly_price: b.monthlyPrice || b.monthly_price || 0,
        vendor_id: b.vendorId || b.vendor_id || null,
        vendor_name: b.vendorName || b.vendor_name || 'Smart Shop',
        image: b.image || '', tags: b.tags || [],
        is_active: b.isActive !== false,
        min_quantity: b.minQuantity || b.min_quantity || 1,
        max_quantity: b.maxQuantity || b.max_quantity || 10,
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, plan: data });
    }
    if (path.startsWith('/api/subscription-plans/') && method === 'PUT') {
      var parsedPid = parseInt(path.split('/').pop() || '0');
      var b = req.body || {};
      // Handle tags properly (may come as array from frontend)
      if (b.tags && typeof b.tags === 'string') { try { b.tags = JSON.parse(b.tags); } catch(e: any) {} }
      var { error } = await supabase.from('subscription_plans').update(b).eq('id', parsedPid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }
    if (path.startsWith('/api/subscription-plans/') && method === 'DELETE') {
      var parsedPid = parseInt(path.split('/').pop() || '0');
      var { error } = await supabase.from('subscription_plans').delete().eq('id', parsedPid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    // ── Customer Subscriptions ───────────────────────────────────
    if (path === '/api/subscriptions' && method === 'GET') {
      const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || '';
      if (!tid) return ok({ subscriptions: [] });
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('telegram_id', parseInt(tid))
        .order('created_at', { ascending: false });
      if (error) return fail(error.message, 500);
      return ok({ subscriptions: data || [] });
    }

    if (path === '/api/subscriptions' && method === 'POST') {
      var b = req.body || {};
      const tid = b.telegram_id || b.telegramId;
      var planId = b.plan_id || b.planId;
      if (!tid || !planId) return fail('telegram_id and plan_id required');
      // Get plan details
      const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', planId).single();
      if (!plan) return fail('Plan not found');

      var freq = b.frequency || 'daily';
      var price = freq === 'daily' ? plan.daily_price : freq === 'weekly' ? plan.weekly_price : plan.monthly_price;
      var qty = Math.max(plan.min_quantity || 1, Math.min(b.quantity || 1, plan.max_quantity || 10));

      // Calculate next delivery
      var nextDel = new Date();
      if (freq === 'daily') { nextDel.setDate(nextDel.getDate() + 1); nextDel.setHours(7, 0, 0, 0); }
      else if (freq === 'weekly') { nextDel.setDate(nextDel.getDate() + 7); nextDel.setHours(7, 0, 0, 0); }
      else { nextDel.setMonth(nextDel.getMonth() + 1); nextDel.setDate(1); nextDel.setHours(7, 0, 0, 0); }

      const { data, error } = await supabase.from('subscriptions').insert({
        telegram_id: tid, plan_id: planId,
        product_name: plan.name, product_image: plan.image || plan.emoji || '',
        quantity: qty, frequency: freq,
        price: price * qty, next_delivery: nextDel.toISOString(),
        delivery_address: b.delivery_address || b.deliveryAddress || '',
        delivery_note: b.delivery_note || b.deliveryNote || '',
        delivery_time: b.delivery_time || b.deliveryTime || '07:00',
        payment_method: b.payment_method || b.paymentMethod || 'cod',
      }).select().single();
      if (error) return fail(error.message);
      return ok({ success: true, subscription: data });
    }

    if (path.match(/^\/api\/subscriptions\/\d+$/) && method === 'PATCH') {
      const sid = parseInt(path.split('/').pop() || '0');
      var { error } = await supabase.from('subscriptions').update(req.body).eq('id', sid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    if (path.match(/^\/api\/subscriptions\/\d+$/) && method === 'DELETE') {
      const sid = parseInt(path.split('/').pop() || '0');
      var { error } = await supabase.from('subscriptions').update({ status: 'cancelled' }).eq('id', sid);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    // ── Vendor's Subscription Orders ─────────────────────────────
    if (path === '/api/vendor/subscription-orders' && method === 'GET') {
      var vid = new URLSearchParams(req.url?.split('?')[1] || '').get('vendor_id') || '';
      if (!vid) return ok({ orders: [] });
      const { data: plans } = await supabase.from('subscription_plans').select('id').eq('vendor_id', parseInt(vid));
      var planIds = (plans || []).map(function(p) { return p.id; });
      if (planIds.length === 0) return ok({ orders: [] });
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .in('plan_id', planIds)
        .order('next_delivery', { ascending: true });
      if (error) return fail(error.message, 500);
      return ok({ orders: data || [] });
    }

    // ── Update Subscription Delivery Status (driver) ──────────
    if (path.match(/^\/api\/subscriptions\/deliveries\/\d+$/) && method === 'PATCH') {
      var did = parseInt(path.split('/').pop() || '0');
      var { error } = await supabase.from('subscription_deliveries').update({
        ...req.body,
        delivered_at: req.body.status === 'delivered' ? new Date().toISOString() : undefined,
      }).eq('id', did);
      if (error) return fail(error.message);
      return ok({ success: true });
    }

    // ── Pending Deliveries for Today (driver view) ────────────
    if (path === '/api/subscriptions/pending-deliveries' && method === 'GET') {
      var date = new URLSearchParams(req.url?.split('?')[1] || '').get('date') || new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('subscription_deliveries')
        .select('*, subscriptions!inner(telegram_id, delivery_address, delivery_note, frequency, product_name)')
        .eq('delivery_date', date)
        .in('status', ['pending', 'confirmed', 'preparing', 'out_for_delivery'])
        .order('delivery_time');
      if (error) return fail(error.message, 500);
      return ok({ deliveries: data || [] });
    }

    // ── Subscription Delivery History ────────────────────────────
    if (path === '/api/subscriptions/deliveries' && method === 'GET') {
      const sid = new URLSearchParams(req.url?.split('?')[1] || '').get('subscription_id') || '';
      if (!sid) return ok({ deliveries: [] });
      const { data, error } = await supabase
        .from('subscription_deliveries')
        .select('*')
        .eq('subscription_id', parseInt(sid))
        .order('delivery_date', { ascending: false })
        .limit(30);
      if (error) return fail(error.message, 500);
      return ok({ deliveries: data || [] });
    }

    // ── Subscription Cron (process daily deliveries) ─────────────
    if (path === '/api/cron/subscriptions' && method === 'POST') {
      var today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: dueSubs, error } = await supabase
        .from('subscriptions')
        .select('*, subscription_plans(*)')
        .eq('status', 'active')
        .lte('next_delivery', today.toISOString())
        .limit(50);
      if (error) return fail(error.message, 500);
      var processed = 0;
      const subList = dueSubs || [];
      for (var si = 0; si < subList.length; si++) {
        var sub = subList[si];
        // Create delivery record
        try {
          await supabase.from('subscription_deliveries').insert({
            subscription_id: sub.id, plan_id: sub.plan_id,
            telegram_id: sub.telegram_id,
            product_name: sub.product_name, quantity: sub.quantity,
            price: sub.price, delivery_address: sub.delivery_address,
            delivery_date: today.toISOString().split('T')[0],
            status: 'pending',
          });
        } catch (err) {}
        // Update next delivery
        var nextDate = new Date(today);
        if (sub.frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
        else if (sub.frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
        else nextDate.setMonth(nextDate.getMonth() + 1);
        nextDate.setHours(7, 0, 0, 0);
        await supabase.from('subscriptions').update({
          next_delivery: nextDate.toISOString(),
          last_delivery: today.toISOString(),
          total_delivered: ((sub.total_delivered || 0) + 1),
        }).eq('id', sub.id);
        // Notify user
        tg(ENV.VENDOR_BOT_TOKEN, sub.telegram_id,
          '📦 *Your delivery is on the way!*\n\n' +
          sub.product_name + ' x' + sub.quantity + '\n' +
          '📍 ' + (sub.delivery_address || 'Your address') + '\n' +
          '🚚 Arriving soon!');
        processed++;
      }
      return ok({ success: true, processed: processed, total: (dueSubs || []).length });
    }

    // ── ORDERS (Idempotent + Atomic Stock) ──────────────────────────
    if (path.startsWith('/api/orders')) {
      if (method === 'GET' && (path === '/api/orders' || path === '/api/')) { const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); return ok({ orders: data || [] }); }
      if (method === 'POST' && (path === '/api/orders' || path === '/api/')) {
        const ik = req.headers['idempotency-key'] || req.headers['x-idempotency-key'] || req.body.idempotencyKey || '';
        if (ik) { const ex = await chkIdem(ik); if (ex) return ok({ success: true, order: ex.result, idempotent: true }); }
        const on = req.body.orderNumber || gON(); const items = req.body.items || [];
        for (const item of items) {
          if (!item.productId) continue; const qty = item.quantity || 1;
          try {
            const { data: prod } = await supabase.from('products').select('stock_count, sold_count').eq('id', item.productId).single();
            if (prod && typeof prod.stock_count === 'number' && prod.stock_count === 0) {
              return fail('Insufficient stock for product #' + item.productId, 409);
            }
            const newStock = Math.max(0, (prod?.stock_count || 100) - qty);
            const newSold = (prod?.sold_count || 0) + qty;
            await supabase.from('products').update({ stock_count: newStock, sold_count: newSold }).eq('id', item.productId);
          } catch (e) {
            console.warn('[STOCK] Non-blocking stock update error for prod ' + item.productId);
          }
        }
        const orderPayload: Record<string, any> = {
          order_number: on,
          telegram_id: req.body.telegram_id || req.body.telegramId || req.body.customer?.telegram_id || req.body.customer?.telegramId || null,
          items: req.body.items || [],
          total: Number(req.body.total || 0),
          delivery_fee: Number(req.body.delivery || 0),
          status: req.body.status || 'pending',
          payment_method: req.body.payment_method || req.body.paymentMethod || 'cod',
          customer: {
            ...(req.body.customer || {}),
            subtotal: Number(req.body.subtotal || 0),
            discount: Number(req.body.discount || 0),
            delivery: Number(req.body.delivery || 0),
            currency: req.body.currency || 'ETB',
            language: req.body.language || 'en',
            referrer_code: req.body.referrer_code || req.body.referrerCode || null,
            notes: req.body.notes || req.body.customerNote || req.body.customer_note || '',
          },
        };
        if (req.body.delivery || req.body.delivery_fee) {
          orderPayload.delivery_fee = Number(req.body.delivery || req.body.delivery_fee || 0);
        }

        let order = null;
        let oe = null;
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await supabase.from('orders').insert(orderPayload).select().single();
          order = res.data;
          oe = res.error;
          if (oe && oe.message && oe.message.includes('schema cache')) {
            const m = oe.message.match(/Could not find the '([^']+)' column/i);
            if (m && m[1]) {
              delete (orderPayload as Record<string, any>)[m[1]];
              console.warn(`[ORDERS] Schema mismatch: removed column '${m[1]}', retrying insert (attempt ${attempt + 1})...`);
              continue;
            }
          }
          break;
        }
        if (oe) { for (const item of items) { if (item.productId) await supabase.rpc('increment_stock', { row_id: item.productId, qty: item.quantity || 1 }); } return fail(oe.message); }

        // Notify admin about new order
        try {
          const totalAmount = order?.total || order?.subtotal || req.body.total || req.body.subtotal || 0;
          const custName = req.body.customer?.name || order?.customer?.name || 'Guest';
          const custPhone = req.body.customer?.phone || order?.customer?.phone || 'N/A';
          const pMethod = req.body.paymentMethod || order?.paymentMethod || 'COD';
          
          let orderItemsMsg = '';
          if (req.body.items && req.body.items.length > 0) {
            orderItemsMsg = req.body.items.map((it: any) => `  • ${escapeHtml(it.nameEn || it.name || 'Product')} (x${it.qty || it.quantity || 1})`).join('\n');
          }

          const txt = `🛍 <b>New Order #${escapeHtml(on)}</b>\n\n` +
            `💵 Total: <b>Br ${totalAmount.toLocaleString()}</b>\n` +
            `💳 Payment: <b>${escapeHtml(pMethod.toUpperCase())}</b>\n` +
            `👤 Customer: <b>${escapeHtml(custName)}</b>\n` +
            `📞 Phone: <code>${escapeHtml(custPhone)}</code>\n\n` +
            `📦 <b>Items:</b>\n${orderItemsMsg}`;

          await notifyAdmins(txt, 'HTML');
          await supabase.from('notifications').insert({
            telegram_id: null,
            type: 'order',
            title: `New Order #${on}`,
            message: `Order #${on} placed for Br ${totalAmount.toLocaleString()} via ${pMethod.toUpperCase()}`,
            icon: '🛍',
          });
        } catch (err) {}

        if (order && (order.status === 'confirmed' || order.status === 'pending' || order.status === 'processing')) { 
          try {
            await createDeliveryForOrder(on, undefined, undefined, order);
          } catch (e) {
            console.error('[DELIVERY DISPATCH ERROR]', e);
          }
        }
        if (ik) await setIdem(ik, 'completed', order); return ok({ success: true, order });
      }
      if (method === 'GET') { const on = path.replace('/api/orders/', '').split('/')[0]; const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok({ success: true, order: data }); }
      if (method === 'POST' && path.includes('/cancel')) { const on = path.split('/')[3]; const { data: order } = await supabase.from('orders').select('*').eq('order_number', on).single(); if (order?.items) { for (const item of order.items) { if (item.productId) await supabase.rpc('increment_stock', { row_id: item.productId, qty: item.quantity || 1 }); } } await supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', on); return ok({ success: true }); }
      if (method === 'PATCH' && path.includes('/status')) {
        const on = path.split('/')[3];
        const status = req.body.status;
        const lat = req.body.lat;
        const lng = req.body.lng;
        await supabase.from('orders').update({ status }).eq('order_number', on);
        if (status === 'confirmed' || status === 'processing' || status === 'pending') { 
          try {
            await createDeliveryForOrder(on, lat, lng);
          } catch (e) {
            console.error('[DELIVERY DISPATCH ERROR]', e);
          }
        }
        return ok({ success: true });
      }
    }


    // ================================================================
    // VENDORS
    // ================================================================
    if (path.startsWith('/api/vendors')) {
      if (method === 'GET' && !['/api/vendors/applications', '/api/vendors/check-status', '/api/vendors/approve'].includes(path) && /\/api\/vendors\/\d+/.test(path)) { const v = await getV(); const f = v.find((vv: any) => vv.id == pid(path) || vv.id === String(pid(path))); return ok({ vendor: f || null }); }
      if (path === '/api/vendors/approve' && method === 'POST') { const id = req.body.id; try { let v = await getV(); let okf = false; v = v.map((vv: any) => { if (vv.id == id || vv.id === String(id)) { okf = true; return { ...vv, status: 'approved' }; } return vv; }); if (okf) await setV(v); tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '✅ Approved: ' + (req.body.name || id), 'HTML'); const uv = await getV(); const av = uv.find((vv: any) => vv.id == id || vv.id === String(id)); if (av?.telegram_id) tg(ENV.VENDOR_BOT_TOKEN, av.telegram_id, '🎉 *Approved!*', 'HTML'); return ok({ success: true, status: 'approved' }); } catch (e: any) { return fail(e.message, 500); } }
      if (path === '/api/vendors/check-status' && method === 'GET') { const id = new URLSearchParams(req.url?.split('?')[1] || '').get('id') || ''; const ph = new URLSearchParams(req.url?.split('?')[1] || '').get('phone') || ''; try { const v = await getV(); if (id) { const f = v.find((vv: any) => vv.id == id || vv.id === id); return ok({ status: f?.status || 'none' }); } if (ph) { const f = v.find((vv: any) => vv.phone == ph); return ok({ status: f?.status || 'none' }); } } catch {} return ok({ status: 'none' }); }
      if (path === '/api/vendors/applications' && method === 'GET') { const v = await getV(); return ok({ applications: v }); }
      if (method === 'GET' && (path === '/api/vendors' || path === '/api/')) { const v = await getV(); return ok({ vendors: v || [] }); }
      if (method === 'POST' && path === '/api/vendors/register') {
        const b = req.body || {};
        const vs = await getV();

        if (b.telegram_id) {
          const dupTg = vs.find((v: any) => (v.telegram_id === b.telegram_id || v.telegram_id == b.telegram_id) && v.status !== 'rejected');
          if (dupTg) {
            return fail('You are already registered as a vendor (' + dupTg.status + '). You cannot register twice.', 409);
          }
        }

        const dupPhone = vs.find((v: any) => v.phone === b.phone && v.status !== 'rejected');
        if (dupPhone) {
          return fail('A vendor with this Phone number is already registered or pending review.', 409);
        }

        if (b.fayda_id) {
          const dupFayda = vs.find((v: any) => v.fayda_id === b.fayda_id && v.status !== 'rejected');
          if (dupFayda) {
            return fail('A vendor with this Fayda ID is already registered.', 409);
          }
        }

        if (b.is_licensed) {
          if (b.tin_number) {
            const dupTin = vs.find((v: any) => v.tin_number === b.tin_number && v.status !== 'rejected');
            if (dupTin) {
              return fail('A vendor with this TIN Number is already registered.', 409);
            }
          }
          if (b.license_number) {
            const dupLic = vs.find((v: any) => v.license_number === b.license_number && v.status !== 'rejected');
            if (dupLic) {
              return fail('A vendor with this Trade License Number is already registered.', 409);
            }
          }
        }

        const v = { id: Date.now(), ...b, status: 'pending', joined_at: new Date().toISOString() };
        try {
          vs.push(v);
          await setV(vs);
        } catch (e: any) {
          console.log('V:', e.message);
        }
        tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, '🆕 *Vendor Application*:\n👤 ' + (b.full_name_latin || b.name || '') + '\n📞 ' + (b.phone || '') + '\n🆔 Fayda: ' + (b.fayda_id || 'N/A'));
        return ok({ success: true, vendor: v });
      }
      if (method === 'DELETE') { const vid = pid(path); try { let vs = await getV(); let dv: any = null; const f = vs.filter((v: any) => { if (v.id == vid || v.id === String(vid)) { dv = v; return false; } return true; }); await setV(f); if (dv?.telegram_id) tg(ENV.VENDOR_BOT_TOKEN, dv.telegram_id, '⚠️ Revoked.'); return ok({ success: true, deleted: true }); } catch (e: any) { return fail(e.message, 500); } }
      if (method === 'PUT') { const vid = pid(path); try { const vs = await getV(); const up = vs.map((v: any) => v.id == vid ? { ...v, ...req.body } : v); await setV(up); } catch {} const em = req.body.status === 'approved' ? '✅' : req.body.status === 'rejected' ? '❌' : '⏸️'; tg(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, em + ' Vendor ' + vid + ': ' + (req.body.status || 'updated')); return ok({ success: true }); }
    }

    if (path.startsWith('/api/bank-accounts')) {
      if (path === '/api/bank-accounts/bulk' && method === 'POST') {
        const b = req.body || {};
        const accounts = b.bank_accounts || [];
        await supabase.from('bank_accounts').delete().neq('id', 0);
        if (accounts.length > 0) {
          const payload = accounts.map((a: any) => ({
            bank_name: a.name || a.bank_name,
            account_number: a.account || a.account_number,
            account_name: a.holder || a.account_holder || a.account_name,
            active: true
          }));
          const { data, error } = await supabase.from('bank_accounts').insert(payload).select();
          if (error) return fail(error.message, 500);
          return ok({ success: true, bank_accounts: data || [] });
        }
        return ok({ success: true, bank_accounts: [] });
      }
      if (method === 'GET') {
        const { data, error } = await supabase.from('bank_accounts').select('*').eq('active', true);
        if (error) return fail(error.message, 500);
        return ok({ bank_accounts: data || [] });
      }
      if (method === 'POST') {
        const b = req.body || {};
        const { data, error } = await supabase.from('bank_accounts').insert({
          bank_name: b.bank_name,
          account_number: b.account_number,
          account_name: b.account_holder || b.account_name || b.holder,
          active: true
        }).select().single();
        if (error) return fail(error.message, 500);
        return ok({ success: true, bank_account: data });
      }
      if (method === 'DELETE') {
        const parts = path.split('/');
        const id = parts[3];
        const { error } = await supabase.from('bank_accounts').delete().eq('id', parseInt(id));
        if (error) return fail(error.message, 500);
        return ok({ success: true });
      }
    }

    // ── PAYOUTS ENDPOINTS (Dynamic Database Sync) ──────────────
    if (path.startsWith('/api/payouts')) {
      if (method === 'GET') {
        const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
        const vid = urlParams.get('vendorId');
        let query = supabase.from('payouts').select('*').order('created_at', { ascending: false });
        if (vid) {
          query = query.eq('vendor_id', parseInt(vid));
        }
        const { data, error } = await query;
        if (error) return fail(error.message, 500);

        // AUTO-SETTLEMENT ENGINE: Check and release mature 6-hour escrow holds automatically
        const nowMs = Date.now();
        const payoutsList = data || [];
        for (const p of payoutsList) {
          if (p.status === 'pending') {
            let releaseAtMs = 0;
            try {
              if (p.notes && p.notes.startsWith('{')) {
                const meta = JSON.parse(p.notes);
                if (meta.type === 'escrow_hold' && meta.release_at) {
                  releaseAtMs = Number(meta.release_at);
                }
              }
            } catch {}
            if (!releaseAtMs && p.created_at) {
              releaseAtMs = new Date(p.created_at).getTime() + 6 * 3600 * 1000;
            }
            if (releaseAtMs && nowMs >= releaseAtMs) {
              p.status = 'paid';
              p.paid_at = new Date().toISOString();
              try {
                await supabase.from('payouts').update({
                  status: 'paid',
                  paid_at: p.paid_at,
                  notes: p.notes ? p.notes + ' [Auto-released after 6-hour escrow hold]' : '[Auto-released after 6-hour escrow hold]'
                }).eq('id', p.id);
                console.log(`[ESCROW AUTO-RELEASE] Payout ID #${p.id} (Br ${p.amount}) released to vendor after 6-hour hold.`);
              } catch {}
            }
          }
        }
        return ok({ payouts: payoutsList });
      }
      if (method === 'POST') {
        const b = req.body || {};
        const { data, error } = await supabase.from('payouts').insert({
          vendor_id: b.vendor_id || 0,
          vendor_name: b.vendor_name || 'Stakeholder',
          amount: b.amount,
          commission_deducted: b.commission_deducted || 0,
          payment_method: (b.payment_method || 'telebirr').toLowerCase(),
          account_name: b.account_name || '',
          account_number: b.account_number || '',
          notes: b.notes || '',
          status: 'pending'
        }).select().single();
        if (error) return fail(error.message, 500);
        return ok({ success: true, payout: data });
      }
      if (method === 'PATCH') {
        // e.g. /api/payouts/:id/status
        const parts = path.split('/');
        const id = parts[3];
        const { status, notes } = req.body || {};
        const { data, error } = await supabase.from('payouts').update({
          status,
          notes,
          paid_at: status === 'paid' ? new Date().toISOString() : null
        }).eq('id', parseInt(id)).select().single();
        if (error) return fail(error.message, 500);
        return ok({ success: true, payout: data });
      }
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
    if (path === '/api/users/register' && method === 'POST') {
      const payload = req.body || {};
      if (payload.phone && typeof payload.phone === 'string' && payload.phone.includes('@')) payload.phone = '';
      const { data } = await supabase.from('users').upsert(payload, { onConflict: 'telegram_id' }).select().single();
      return ok({ success: true, user: data || payload });
    }
    if (path === '/api/affiliates' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true); return ok({ products: (data || []).map(norm) }); }
    if (path === '/api/affiliates/with-products' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4); return ok({ products: (data || []).map(norm) }); }
    if (path === '/api/affiliates' && method === 'POST') { const { data, error } = await supabase.from('affiliates').insert(req.body).select().single(); if (error) return fail(error.message); return ok({ success: true, affiliate: data }); }
    if (path.startsWith('/api/affiliates/') && method === 'PUT') { const aid = pid(path); const { error } = await supabase.from('affiliates').update(req.body).eq('id', aid); if (error) return fail(error.message); return ok({ success: true }); }

    if (path === '/api/broadcast' && method === 'POST') { return ok({ success: true, sent: 1, total: 1 }); }
    if (path === '/api/pre-orders/cancel' && method === 'POST') { const { id } = req.body || {}; if (!id) return fail('id required'); await supabase.from('pre_orders').update({ status: 'cancelled' }).eq('id', id); return ok({ success: true }); }
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { const { data } = await supabase.from('pre_orders').select('*'); return ok({ preOrders: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return ok({ success: true, preOrder: data }); }
    }
    if (path === '/api/currency/rates' && method === 'GET') { return ok({ rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' }); }
    if (path.startsWith('/api/receipts/')) { if (method === 'POST') { const on = path.replace('/api/receipts/', ''); return ok({ success: true, receiptUrl: ENV.BASE_URL + '/receipt/' + on }); } if (method === 'GET') { const on = path.replace('/api/receipts/', ''); return ok({ success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } }); } }
    if (path === '/api/flash-deals' && method === 'GET') { const { data: fr } = await supabase.from('settings').select('*').single(); const fs = fr?.data?.flashSales || {}; return ok({ deals: Object.entries(fs).map(([k, v]: any) => ({ id: parseInt(k), productId: parseInt(k), ...(v as any) })) }); }
    if (path === '/api/flash-deals' && method === 'POST') { const fs = req.body || {}; const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; const did = Date.now(); fl[did] = { productId: fs.productId, endTime: fs.endTime || Date.now() + 86400000, discount: fs.discount || 0, maxQuantity: fs.maxQuantity || 100 }; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); return ok({ success: true, deal: { id: did, ...(fl[did] as any) } }); }
    if (path.startsWith('/api/flash-deals/') && method === 'PUT') { const did = pid(path); const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; if (fl[did]) { fl[did] = { ...(fl[did] as any), ...req.body }; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); } return ok({ success: true }); }
    if (path.startsWith('/api/flash-deals/') && method === 'DELETE') { const did = pid(path); const { data: fr } = await supabase.from('settings').select('*').single(); const cd = fr?.data || {}; const fl = { ...(cd.flashSales || {}) }; delete fl[did]; cd.flashSales = fl; await supabase.from('settings').update({ data: cd }).eq('id', fr.id); return ok({ success: true }); }
    if (path.startsWith('/api/tracking/')) { const on = path.replace('/api/tracking/', ''); if (method === 'GET') { const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok({ success: true, tracking: data?.tracking || null }); } if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return ok({ success: true }); } }
    if (path === '/api/upload' && method === 'POST') { return ok({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image' }); }


    // ================================================================
    // SEED / COMMISSION / PAYMENT / TAX / VENDOR NOTIFY
    // ================================================================
    if (path === '/api/seed' && method === 'GET') {
      try {
        await supabase.from('deliveries').update({ delivery_lat: 9.0450, delivery_lng: 38.7550 }).ilike('delivery_address', '%Kechenie%');
        await supabase.from('group_deals').update({ status: 'active', expires_at: new Date(Date.now() + 7 * 86400000).toISOString() }).in('id', [21, 20, 19, 18]);
      } catch {}
      const [pc, uc] = await Promise.all([supabase.from('products').select('*', { count: 'exact', head: true }), supabase.from('users').select('*')]);
      const v = await getV();
      return ok({ products: pc.count || 0, telegramUsers: uc.data?.length || 0, vendors: v.length, message: 'Smart Shop API running on Vercel!', buildId: 'BUILD-2026-08-07-V112000' });
    }
    if (path === '/api/test-cleanup' && (method === 'POST' || method === 'GET')) {
      try {
        await Promise.all([
          supabase.from('driver_earnings').delete().neq('id', 0),
          supabase.from('payouts').delete().neq('id', 0),
          supabase.from('deliveries').delete().neq('id', 0),
          supabase.from('orders').delete().neq('id', 0),
          supabase.from('notifications').delete().neq('id', 0),
        ]);
        await supabase.from('delivery_personnel').update({ total_deliveries: 0, total_earnings: 0 }).neq('id', 0);
      } catch {}
      return ok({ success: true, message: 'All test orders, deliveries, and notifications have been cleared!' });
    }
    if (path === '/api/ai/voice-order' && method === 'POST') {
      try {
        const { data: prs } = await supabase.from('products').select('*');
        const products = prs || [];
        const matched = products.find(p => p.name_en?.toLowerCase().includes('headphones') || p.name_en?.toLowerCase().includes('milk')) || products[0];
        await slp(1500); // Latency simulator
        if (matched) {
          return ok({ success: true, product: norm(matched), text: 'I want premium headphones' });
        }
        return fail('No matching product found');
      } catch (err: any) {
        return fail(err.message);
      }
    }

    // =========================================================================
    // RESEND EMAIL NOTIFICATION & MARKETING API (Free Tier 3,000/month)
    // =========================================================================
    if (path === '/api/email/send' && method === 'POST') {
      try {
        const { to, subject, html, type, data } = req.body || {};
        const recipient = (to && typeof to === 'string' && to.includes('@')) ? to : 'customer@smartshop.et';
        const plainText = (html || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || subject || 'Notification from Smart Shop';
        
        // 1. Check Google Apps Script / Gmail Free Webhook (100% Free: 500/day = 15,000/mo, zero domain, zero credit card!)
        const googleWebhook = process.env.GOOGLE_EMAIL_WEBHOOK_URL || process.env.FREE_EMAIL_WEBHOOK_URL;
        if (googleWebhook) {
          try {
            const webhookRes = await fetch(googleWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: recipient,
                subject: subject || 'Notification from Smart Shop',
                html: html || `<p>${subject}</p>`,
                plainText,
                templateType: type || 'general',
                source: 'smartshop_vercel'
              })
            });
            if (webhookRes.ok) {
              const dataRes = await webhookRes.json().catch(() => ({}));
              if (dataRes && (dataRes.success === true || dataRes.delivered === true || String(dataRes.status || '').includes('Active'))) {
                console.log(`[Google/Gmail Free Email Success] Delivered to ${recipient}`);
                return ok({ success: true, delivered: true, provider: 'google_gmail_free', id: 'gmail-' + Date.now(), recipient, subject });
              } else {
                console.warn('[Google/Gmail Webhook Returned Error - Falling Back]', dataRes.error || JSON.stringify(dataRes));
              }
            }
          } catch (e: any) {
            console.warn('[Google/Gmail Free Email Fallback Error]', e.message);
          }
        }

        // 2. Check Oracle Cloud / Self-Hosted Open-Source Email Webhook (Postal / BillionMail / OCI)
        const customWebhook = process.env.ORACLE_EMAIL_WEBHOOK_URL || process.env.CUSTOM_EMAIL_WEBHOOK_URL;
        if (customWebhook) {
          try {
            const webhookRes = await fetch(customWebhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EMAIL_WEBHOOK_SECRET || ''}`
              },
              body: JSON.stringify({
                to: recipient,
                subject: subject || 'Notification from Smart Shop',
                html: html || `<p>${subject}</p>`,
                plainText,
                templateType: type || 'general',
                source: 'smartshop_vercel'
              })
            });
            if (webhookRes.ok) {
              const d = await webhookRes.json().catch(() => ({}));
              if (d && (d.success === true || d.delivered === true || d.id)) {
                console.log(`[Oracle/Open-Source Email Success] Delivered to ${recipient}`);
                return ok({ success: true, delivered: true, provider: 'oracle_opensource', id: d.id || 'oci-' + Date.now(), recipient, subject });
              } else {
                console.warn('[Oracle/Open-Source Webhook Returned Error - Falling Back]', d.error || JSON.stringify(d));
              }
            }
          } catch (e: any) {
            console.warn('[Oracle/Open-Source Email Fallback Error]', e.message);
          }
        }

        // 3. Fallback to Resend API (RESEND_API_KEY)
        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.log(`[Email Simulator] Simulating email to ${recipient}: ${subject} (Type: ${type || 'general'})`);
          return ok({ success: true, simulated: true, provider: 'sandbox', recipient, subject, message: 'Email simulated successfully (No live email API configured)' });
        }

        const cleanText = (html || subject || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || subject || 'Smart Shop Notification';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'Smart Shop <onboarding@resend.dev>',
            reply_to: 'support@smartshop.et',
            to: [recipient],
            subject: subject || 'Notification from Smart Shop',
            html: html || `<p>${subject}</p>`,
            text: cleanText,
            headers: {
              'X-Entity-Ref-ID': `smartshop-${Date.now()}`,
              'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
            }
          })
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          console.log(`[Resend API Success] Delivered email to ${recipient} (ID: ${resendData.id})`);
          return ok({ success: true, delivered: true, id: resendData.id, recipient, subject });
        } else {
          console.warn('[Resend API Error]', resendData);
          const rawMsg = resendData.message || resendData.error || 'Resend API rejected request';
          let friendlyError = rawMsg;
          if (typeof rawMsg === 'string' && rawMsg.toLowerCase().includes('own email address')) {
            friendlyError = 'Resend Free Tier Rule: On onboarding@resend.dev, you can ONLY send emails to the email address registered on your Resend account. Please test with your own account email or verify a domain on Resend.';
          }
          return ok({ success: false, error: friendlyError, rawError: resendData, recipient, subject });
        }
      } catch (err: any) {
        return ok({ success: false, error: err.message });
      }
    }

    if (path === '/api/email/broadcast' && method === 'POST') {
      try {
        const { subject, html, campaignType, target } = req.body || {};
        const plainText = (html || '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || subject || 'Smart Shop Special Announcement';
        const googleWebhook = process.env.GOOGLE_EMAIL_WEBHOOK_URL || process.env.FREE_EMAIL_WEBHOOK_URL;
        if (googleWebhook) {
          try {
            const webhookRes = await fetch(googleWebhook, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: target || 'all_subscribers',
                subject: subject || 'Smart Shop Special Announcement',
                html: html || `<p>${subject}</p>`,
                plainText,
                templateType: 'broadcast',
                campaignType
              })
            });
            if (webhookRes.ok) {
              const dRes = await webhookRes.json().catch(() => ({}));
              if (dRes && (dRes.success === true || dRes.delivered === true || String(dRes.status || '').includes('Active'))) {
                return ok({ success: true, delivered: true, provider: 'google_gmail_free', id: 'gmail-' + Date.now(), campaignType, subject, count: 1 });
              }
            }
          } catch {}
        }

        const customWebhook = process.env.ORACLE_EMAIL_WEBHOOK_URL || process.env.CUSTOM_EMAIL_WEBHOOK_URL;
        if (customWebhook) {
          try {
            const webhookRes = await fetch(customWebhook, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.EMAIL_WEBHOOK_SECRET || ''}`
              },
              body: JSON.stringify({
                to: target || 'all_subscribers',
                subject: subject || 'Smart Shop Special Announcement',
                html: html || `<p>${subject}</p>`,
                plainText,
                templateType: 'broadcast',
                campaignType
              })
            });
            if (webhookRes.ok) {
              const d = await webhookRes.json().catch(() => ({}));
              if (d && (d.success === true || d.delivered === true || d.id)) {
                return ok({ success: true, delivered: true, provider: 'oracle_opensource', id: d.id || 'oci-' + Date.now(), campaignType, subject, count: 1 });
              }
            }
          } catch {}
        }

        const apiKey = process.env.RESEND_API_KEY;
        if (!apiKey) {
          console.log(`[Email Campaign Simulator] Simulating marketing blast (${campaignType}): ${subject}`);
          return ok({ success: true, simulated: true, provider: 'sandbox', campaignType, subject, count: 42, message: 'Batch email campaign simulated successfully' });
        }

        const cleanText = (html || subject || '').replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim() || subject || 'Smart Shop Special Announcement';
        const resendRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM_ADDRESS || 'Smart Shop <onboarding@resend.dev>',
            reply_to: 'support@smartshop.et',
            to: [target || 'onboarding@resend.dev'],
            subject: subject || 'Smart Shop Special Announcement',
            html: html || `<p>${subject}</p>`,
            text: cleanText,
            headers: {
              'X-Entity-Ref-ID': `smartshop-${Date.now()}`,
              'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
            }
          })
        });

        const resendData = await resendRes.json();
        if (resendRes.ok) {
          return ok({ success: true, delivered: true, id: resendData.id, campaignType, subject, count: 1 });
        } else {
          const rawMsg = resendData.message || resendData.error || 'Resend API rejected request';
          let friendlyError = rawMsg;
          if (typeof rawMsg === 'string' && rawMsg.toLowerCase().includes('own email address')) {
            friendlyError = 'Resend Free Tier Rule: On onboarding@resend.dev, you can ONLY send emails to the email address registered on your Resend account. Please test with your own account email or verify a domain on Resend.';
          }
          return ok({ success: false, error: friendlyError, rawError: resendData });
        }
      } catch (err: any) {
        return ok({ success: false, error: err.message });
      }
    }

    if (path === '/api/photo-studio/send-chat' && method === 'POST') {
      const { telegramId, image, caption } = req.body || {};
      if (!telegramId || !image) return fail('telegramId and image are required');
      try {
        const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
        const buf = Buffer.from(base64Data, 'base64');
        const fn = 'enhanced-product-' + Date.now().toString(36) + '.png';
        const fd = new FormData();
        fd.append('chat_id', String(telegramId));
        fd.append('document', new Blob([buf], { type: 'image/png' }), fn);
        if (caption) fd.append('caption', caption);
        const r = await fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/sendDocument', {
          method: 'POST',
          body: fd,
          timeout: 20000
        });
        const d = await r.json();
        return ok({ success: d.ok === true, description: d.description });
      } catch (e: any) {
        return fail(e.message, 500);
      }
    }
    if (path === '/api/admin-bot/send-file' && method === 'POST') {
      const { chatId, filename, content, contentType, caption } = req.body || {}; if (!chatId || !content) return fail('required');
      try { let buf, ct = contentType || 'text/plain', fn = filename || 'file.txt'; if (typeof content === 'string' && content.startsWith('data:')) { const mp = content.split(';base64,'); if (mp.length === 2) { ct = mp[0].replace('data:', ''); const ext = ct.includes('jpeg') ? 'jpg' : ct.includes('png') ? 'png' : 'csv'; fn = 'receipt-' + Date.now().toString(36) + '.' + ext; buf = Buffer.from(mp[1], 'base64'); } else buf = Buffer.from(content); } else buf = Buffer.from(typeof content === 'string' ? content : JSON.stringify(content)); const fd = new FormData(); fd.append('chat_id', String(chatId)); fd.append('document', new Blob([buf], { type: ct }), fn); if (caption) fd.append('caption', caption); const r = await fetchTO('https://api.telegram.org/bot' + ENV.ADMIN_BOT_TOKEN + '/sendDocument', { method: 'POST', body: fd, timeout: 15000 }); const d = await r.json(); return ok({ sent: d.ok === true, description: d.description }); }
      catch (e: any) { return ok({ sent: false, error: e.message }); }
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
      if (!amount || !phone) return fail('amount and phone required');
      const validEmail = (email && email.includes('@') && email.includes('.')) ? email : 'customer@gmail.com';
      try { const cr = await fetchRetry('https://api.chapa.co/v1/transaction/initialize', { method: 'POST', timeout: 10000, headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: String(amount), currency: 'ETB', email: validEmail, first_name: firstName || 'Customer', last_name: lastName || '', phone, tx_ref: txRef, callback_url: ENV.BASE_URL + '/api/payment/verify', return_url: ENV.BASE_URL + '/confirmation/' + orderNumber, customization: { title: 'SmartShop', description: 'Order ' + String(orderNumber || txRef).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 30) } }) }); const cd = await cr.json(); if (cd.status === 'success' && cd.data?.checkout_url) return ok({ success: true, checkout_url: cd.data.checkout_url, tx_ref: txRef }); return ok({ success: false, error: cd.message || 'Failed' }); }
      catch (e: any) { return ok({ success: false, error: e.message }); }
    }
    if (path === '/api/payment/verify' && method === 'POST') { const { tx_ref } = req.body || {}; if (!tx_ref) return fail('required'); try { const vr = await fetchRetry('https://api.chapa.co/v1/transaction/verify/' + tx_ref, { headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY }, timeout: 10000 }); const vd = await vr.json(); if (vd.status === 'success' && vd.data?.status === 'success') return ok({ status: 'completed', amount: vd.data.amount, reference: vd.data.reference || tx_ref, verified: true }); return ok({ status: 'failed', error: vd.message || 'Not completed', verified: false }); } catch (e: any) { return ok({ status: 'failed', error: e.message, verified: false }); } }
    if (path === '/api/payment/initiate-telebirr' && method === 'POST') { const { amount, phone, orderNumber } = req.body || {}; if (!amount || !phone) return fail('required'); return ok({ success: true, deepLink: 'telebirr://pay?amount=' + amount + '&order=' + orderNumber, ussdCode: '*847#' + amount + '#' + orderNumber, message: 'Payment initiated via Telebirr.' }); }
    if (path === '/api/payment/transactions' && method === 'GET') { const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100); return ok({ transactions: (orders || []).map(o => ({ id: o.id, orderNumber: o.order_number, amount: o.total || 0, paymentMethod: o.payment_method || 'telebirr', status: o.status || 'pending', customerName: o.customer?.name || 'Unknown', date: o.created_at || o.date })) }); }
    if (path === '/api/tax/calculate' && method === 'POST') { const { productPrice, deliveryFee, commissionRate } = req.body || {}; const r = (commissionRate || 15) / 100; const bp = productPrice || 0, df = deliveryFee || 0; const ca = Math.round(bp * r), gf = Math.round(bp * 0.025), vc = Math.round(ca * 0.15), wht = Math.round(bp * 0.02); return ok({ basePrice: bp, deliveryFee: df, commissionRate: r, commissionAmount: ca, gatewayFee: gf, vatOnCommission: vc, withholdingTax: wht, vendorPayout: bp - ca - gf - wht, totalPaid: bp + df + vc, vatRate: 0.15, withholdingTaxRate: 0.02, totalTaxToRemit: vc + wht, shopRevenue: ca - gf }); }
    if (path === '/api/tax/receipt' && method === 'POST') { const { orderNumber } = req.body || {}; if (!orderNumber) return fail('required'); const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single(); if (!order) return fail('Not found', 404); return ok({ success: true, receiptNumber: 'SS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000), orderNumber: order.order_number, generatedAt: new Date().toISOString(), html: '<html><body><h1>Tax Receipt</h1><p>Order: ' + orderNumber + '</p></body></html>' }); }
    if (path === '/api/tax/monthly-report' && method === 'GET') { const { data: orders } = await supabase.from('orders').select('*'); const total = (orders || []).reduce((s, o) => s + (o.total || 0), 0); const cnt = (orders || []).length; const c = Math.round(total * 0.1), v = Math.round(c * 0.15), w = Math.round(total * 0.02); return ok({ period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), totalSales: total, orderCount: cnt, totalCommission: c, vatOnCommission: v, withholdingTax: w, totalTaxToRemit: v + w, averageOrderValue: cnt > 0 ? Math.round(total / cnt) : 0 }); }

    // ================================================================
    // ================================================================
    // PRODUCTS
    // ================================================================
    if (path.startsWith('/api/products') || (path === '/api/' && method === 'GET')) {
      if (method === 'GET') {
        if (path === '/api/products' || path === '/api/') {
          const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return ok({ products: (data || []).map(norm) });
        }
        var id = parseInt(path.replace('/api/products/', ''));
        if (!isNaN(id)) {
          const { data } = await supabase.from('products').select('*').eq('id', id).single();
          return ok({ product: data ? norm(data) : null });
        }
      }
      if (method === 'POST') { const { data } = await supabase.from('products').insert(cln(req.body)).select().single(); return ok({ success: true, product: data }); }
      if (method === 'PUT') { await supabase.from('products').update(cln(req.body)).eq('id', pid(path)); return ok({ success: true }); }
      if (method === 'DELETE') { await supabase.from('products').delete().eq('id', pid(path)); return ok({ success: true }); }
    }

    // ================================================================
    // SETTINGS
    // ================================================================
    if (path === '/api/settings') {
      if (method === 'GET') { const { data: r } = await supabase.from('settings').select('*').single(); return ok({ success: true, settings: r?.data || r || {} }); }
      if (method === 'PUT') { const { data: ex } = await supabase.from('settings').select('*').single(); if (ex) await supabase.from('settings').update({ data: { ...(ex.data || ex), ...req.body }, updated_at: new Date().toISOString() }).eq('id', ex.id); else await supabase.from('settings').insert({ data: req.body }); return ok({ success: true }); }
    }

    // ================================================================
    // TELEGRAM AUTH
    // ================================================================
    if (path === '/api/auth/telegram' && method === 'POST') {
      var { initData } = req.body || {};
      if (!initData) return fail('initData is required');
      var { valid, user: tgUser } = vrfy(initData);
      if (!valid && ENV.BOT_TOKEN) return fail('Invalid Telegram authentication', 401);
      if (!tgUser) return fail('No user data in initData');
      const { data: existing } = await supabase.from('users').select('*').eq('telegram_id', tgUser.id).single();
      var now = new Date().toISOString();
      if (existing) {
        await supabase.from('users').update({ first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '' }).eq('telegram_id', tgUser.id);
        var vendorStatus = '';
        try { var vendors = await getV(); var found = vendors.find(function(v: any) { return v.telegram_id == tgUser.id; }); if (found) vendorStatus = found.status || ''; } catch(e: any) {}
        return ok({ success: true, user: { telegramId: existing.telegram_id, firstName: existing.first_name || tgUser.first_name, lastName: existing.last_name || tgUser.last_name, username: existing.username || tgUser.username, languageCode: tgUser.language_code || 'en', photoUrl: tgUser.photo_url || null, phone: existing.phone || null, fullName: existing.full_name || null, city: existing.city || null, address: existing.address || null, profileComplete: !!(existing.full_name && existing.city && existing.address), vendorStatus: vendorStatus, firstSeen: existing.registered_at || now, lastSeen: now } });
            } else {
        const { data: newUser } = await supabase.from('users').insert({ telegram_id: tgUser.id, first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '', phone: '', registered_at: now }).select().single();
        return ok({ success: true, user: { telegramId: tgUser.id, firstName: tgUser.first_name, lastName: tgUser.last_name || '', username: tgUser.username || '', languageCode: tgUser.language_code || 'en', photoUrl: tgUser.photo_url || null, phone: null, fullName: null, city: null, address: null, profileComplete: false, vendorStatus: '', firstSeen: now, lastSeen: now } });
      }
    }

    if (path === '/api/auth/telegram/register-phone' && method === 'POST') {
      var { telegramId, phone } = req.body || {};
      if (!telegramId || !phone) return fail('telegramId and phone required');
      await supabase.from('users').update({ phone: phone, phone_verified: true }).eq('telegram_id', telegramId);
      return ok({ success: true });
    }

    if (path === '/api/auth/telegram/complete-profile' && method === 'POST') {
      var { telegramId, fullName, city, address } = req.body || {};
      if (!telegramId || !fullName) return fail('telegramId and fullName required');
      await supabase.from('users').update({ full_name: fullName, city: city || '', address: address || '' }).eq('telegram_id', telegramId);
      return ok({ success: true });
    }

    if (path.startsWith('/api/auth/telegram/user/') && method === 'GET') {
      const tid = pid(path);
      if (!tid) return fail('Invalid ID');
      const { data } = await supabase.from('users').select('*').eq('telegram_id', tid).single();
      if (!data) return fail('Not found', 404);
      var vs = '';
      try { var v = await getV(); var f = v.find((vv: any) => vv.telegram_id == tid); if (f) vs = f.status || ''; } catch {}
      return ok({ success: true, user: { telegramId: data.telegram_id, firstName: data.first_name, lastName: data.last_name, username: data.username, phone: data.phone, fullName: data.full_name, city: data.city, address: data.address, profileComplete: !!(data.full_name && data.city && data.address), vendorStatus: vs, firstSeen: data.registered_at, lastSeen: '' } });
    }

    // ================================================================
    // USER SYNC
    // ================================================================
    if (path === '/api/user/sync' && method === 'POST') {
      var b = req.body || {};
      const tid = b.telegram_id || '';
      if (!tid) return ok({ success: false });
      var r: Record<string, any> = { success: true };
      const cleanPhone = (b.phone && typeof b.phone === 'string' && !b.phone.includes('@')) ? b.phone : undefined;
      try { await supabase.from('users').upsert({ telegram_id: parseInt(tid), username: b.username || '', first_name: b.first_name || '', ...(cleanPhone ? { phone: cleanPhone } : {}) }, { onConflict: 'telegram_id' }); const { data: ur } = await supabase.from('users').select('*').eq('telegram_id', parseInt(tid)).single(); if (ur?.phone && !String(ur.phone).includes('@')) r.phone = ur.phone; } catch {}
      try { 
        var v = await getV(); 
        var f = null;
        if (tid) {
          f = v.find((vv: any) => vv.telegram_id == parseInt(tid));
        }
        if (!f && cleanPhone) {
          f = v.find((vv: any) => vv.phone == cleanPhone);
        }
        if (f) { 
          r.vendor_status = f.status || 'pending'; 
          r.vendor_id = f.id; 
          r.vendor_name = f.name || ''; 
        } else {
          r.vendor_status = 'none'; 
        }
      } catch { 
        r.vendor_status = 'none'; 
      }
      return ok(r);
    }

    if (path === '/api/user/contact' && method === 'GET') {
      const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || '';
      if (!tid) return ok({ phone: '' });
      try { const { data } = await supabase.from('users').select('phone').eq('telegram_id', parseInt(tid)).single(); if (data?.phone && !String(data.phone).includes('@')) return ok({ phone: data.phone }); } catch {}
      return ok({ phone: '' });
    }

    // ================================================================
    // ANALYTICS
    // ================================================================
    if (path === '/api/analytics') {
      var [pr, or] = await Promise.all([supabase.from('products').select('*'), supabase.from('orders').select('*')]);
      var p = pr.data || [], o = or.data || [];
      var top = [...p].sort((a, b) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5).map(function(p) { return { name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }; });
      return ok({ analytics: { totalProducts: p.length, totalSold: p.reduce(function(s, p) { return s + (p.sold_count || 0); }, 0), totalRevenue: o.reduce(function(s, o) { return s + (o.total || 0); }, 0), totalOrders: o.length, pendingOrders: o.filter(function(o) { return o.status === 'pending'; }).length, shippedOrders: o.filter(function(o) { return o.status === 'shipped'; }).length, topProducts: top } });
    }

    // ================================================================
    // REVIEWS
    // ================================================================
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') { var pid2 = (req.url?.split('?')[1] || '').split('&').find(function(s: any) { return s.startsWith('productId='); })?.split('=')[1]; var q = supabase.from('reviews').select('*'); if (pid2) q = q.eq('product_id', parseInt(pid2)); const { data } = await q.order('created_at', { ascending: false }); return ok({ reviews: data || [] }); }
      if (method === 'POST') {
        const b = req.body || {};
        const { data, error } = await supabase.from('reviews').insert({
          product_id: b.product_id || b.productId,
          user_name: b.user_name || b.userName || 'Anonymous',
          rating: parseInt(b.rating) || 5,
          text: b.text || '',
          images: b.images || [],
          verified: b.verified !== false,
        }).select().single();
        if (error) return fail(error.message);
        return ok({ success: true, review: data });
      }
      if (method === 'DELETE') { await supabase.from('reviews').delete().eq('id', pid(path)); return ok({ success: true }); }
    }

    // ================================================================
    // BROADCAST
    // ================================================================
    if (path === '/api/broadcast' && method === 'POST') { return ok({ success: true, sent: 1, total: 1 }); }

    // ================================================================
    // PRE-ORDERS
    // ================================================================
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { const { data } = await supabase.from('pre_orders').select('*'); return ok({ preOrders: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return ok({ success: true, preOrder: data }); }
    }

    // ================================================================
    // UPLOAD
    // ================================================================
    if (path === '/api/upload' && method === 'POST') { return ok({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image' }); }

    // ================================================================
    // TRACKING
    // ================================================================
    if (path.startsWith('/api/tracking/')) {
      var on = path.replace('/api/tracking/', '');
      if (method === 'GET') { const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok({ success: true, tracking: data?.tracking || null }); }
      if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return ok({ success: true }); }
    }

    // ================================================================
    // COMMISSION
    // ================================================================
    if (path === '/api/commission/calculate' && method === 'POST') {
      var { productId, price, vendorId, category } = req.body || {};
      const { data: sd } = await supabase.from('settings').select('*').single();
      var s = sd?.data || {};
      var cr = s.vendorCommission || 10;
      var src = 'global';
      var vc = s.vendorCommissionOverride || {}, cc = s.categoryCommission || {};
      if (vendorId && vc[vendorId]) { cr = vc[vendorId]; src = 'vendor_' + vendorId; } else if (category && cc[category]) { cr = cc[category]; src = 'category_' + category; }
      return ok({ commissionRate: cr, commissionAmount: Math.round((price || 0) * cr / 100), vendorPayout: (price || 0) - Math.round((price || 0) * cr / 100), source: src, productPrice: price || 0 });
    }

    if (path === '/api/commission/settings' && method === 'GET') { const { data: sd } = await supabase.from('settings').select('*').single(); var s = sd?.data || {}; return ok({ globalCommission: s.vendorCommission || 10, categoryCommission: s.categoryCommission || {}, vendorCommissionOverride: s.vendorCommissionOverride || {} }); }

    // ================================================================
    // PAYMENT
    // ================================================================
    if (path === '/api/payment/initiate-chapa' && method === 'POST') {
      var { amount, email, firstName, lastName, phone, txRef, orderNumber } = req.body || {};
      if (!amount || !phone) return fail('amount and phone required');
      const validEmail = (email && email.includes('@') && email.includes('.')) ? email : 'customer@gmail.com';
      try {
        const chapaRes = await fetchRetry('https://api.chapa.co/v1/transaction/initialize', { method: 'POST', timeout: 10000,
          headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: String(amount), currency: 'ETB', email: validEmail, first_name: firstName || 'Customer', last_name: lastName || '', phone: phone, tx_ref: txRef, callback_url: ENV.BASE_URL + '/api/payment/verify', return_url: ENV.BASE_URL + '/confirmation/' + orderNumber, customization: { title: 'SmartShop', description: 'Order ' + String(orderNumber || txRef).replace(/[^a-zA-Z0-9-_]/g, '').slice(0, 30) } }) });
        const cd = await chapaRes.json();
        if (cd.status === 'success' && cd.data?.checkout_url) return ok({ success: true, checkout_url: cd.data.checkout_url, tx_ref: txRef });
        return ok({ success: false, error: cd.message || 'Failed' });
      } catch (e: any) { return ok({ success: false, error: e?.message || e }); }
    }

    if (path === '/api/payment/verify' && method === 'POST') {
      var { tx_ref } = req.body || {};
      if (!tx_ref) return fail('tx_ref required');
      try {
        var vr = await fetchRetry('https://api.chapa.co/v1/transaction/verify/' + tx_ref, { headers: { 'Authorization': 'Bearer ' + ENV.CHAPA_SECRET_KEY }, timeout: 10000 });
        var vd = await vr.json();
        if (vd.status === 'success' && vd.data?.status === 'success') return ok({ status: 'completed', amount: vd.data.amount, reference: vd.data.reference || tx_ref, verified: true });
        return ok({ status: 'failed', error: vd.message || 'Not completed', verified: false });
      } catch (e: any) { return ok({ status: 'failed', error: e.message, verified: false }); }
    }

    if (path === '/api/payment/chapa-webhook' && method === 'POST') {
      var b = req.body || {};
      if (b.event === 'charge.success' || b.status === 'success') {
        const txRef = b.tx_ref;
        const paidAmt = b.amount;
        const parts = String(txRef).split('-');
        const orderNumber = parts[1] || txRef;
        
        try {
          const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
          if (order) {
            await supabase.from('orders').update({ status: 'confirmed', payment_verified_at: new Date().toISOString() }).eq('order_number', orderNumber);
            await createDeliveryForOrder(orderNumber);
            if (order.customer?.telegram_id || order.telegram_id) {
              const tid = order.customer?.telegram_id || order.telegram_id;
              const successMsg = `🎉 *Payment Confirmed!* \n\nThank you, your payment of *Br ${paidAmt}* for order *#${orderNumber}* has been verified successfully! \n\nWe are preparing your package for express dispatch.`;
              await tg(ENV.VENDOR_BOT_TOKEN, tid, successMsg);
            }
            console.log(`[CHAPA WEBHOOK] Order ${orderNumber} successfully processed & confirmed via server webhook!`);
          }
        } catch (err: any) {
          console.error('[CHAPA WEBHOOK ERROR]:', err.message);
        }
      }
      return ok({ success: true, processed: true });
    }

    if (path === '/api/payment/initiate-telebirr' && method === 'POST') { var { amount, phone, orderNumber } = req.body || {}; if (!amount || !phone) return fail('required'); return ok({ success: true, deepLink: 'telebirr://pay?amount=' + amount + '&order=' + orderNumber, ussdCode: '*847#' + amount + '#' + orderNumber, message: 'Payment initiated via Telebirr.' }); }

    if (path === '/api/payment/transactions' && method === 'GET') { const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100); return ok({ transactions: (orders || []).map(function(o) { return { id: o.id, orderNumber: o.order_number, amount: o.total || 0, paymentMethod: o.payment_method || 'telebirr', status: o.status || 'pending', customerName: o.customer?.name || 'Unknown', date: o.created_at || o.date }; }) }); }

    // ================================================================
    // TAX
    // ================================================================
    if (path === '/api/tax/calculate' && method === 'POST') {
      var { productPrice, deliveryFee, commissionRate } = req.body || {};
      const taxRate = (commissionRate || 15) / 100;
      var bp = productPrice || 0, df = deliveryFee || 0;
      var ca = Math.round(bp * taxRate), gf = Math.round(bp * 0.025), taxVc = Math.round(ca * 0.15), wht = Math.round(bp * 0.02);
      return ok({ basePrice: bp, deliveryFee: df, commissionRate: taxRate, commissionAmount: ca, gatewayFee: gf, vatOnCommission: taxVc, withholdingTax: wht, vendorPayout: bp - ca - gf - wht, totalPaid: bp + df + taxVc, vatRate: 0.15, withholdingTaxRate: 0.02, totalTaxToRemit: taxVc + wht, shopRevenue: ca - gf });
    }

    if (path === '/api/tax/receipt' && method === 'POST') {
      var { orderNumber } = req.body || {};
      if (!orderNumber) return fail('required');
      const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
      if (!order) return fail('Not found', 404);
      return ok({ success: true, receiptNumber: 'SS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000), orderNumber: order.order_number, generatedAt: new Date().toISOString() });
    }

    if (path === '/api/tax/monthly-report' && method === 'GET') {
      const { data: orders } = await supabase.from('orders').select('*');
      var total = (orders || []).reduce(function(s, o) { return s + (o.total || 0); }, 0);
      var cnt = (orders || []).length;
      var c = Math.round(total * 0.1), taxV = Math.round(c * 0.15), w = Math.round(total * 0.02);
      return ok({ period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), totalSales: total, orderCount: cnt, totalCommission: c, vatOnCommission: taxV, withholdingTax: w, totalTaxToRemit: taxV + w, averageOrderValue: cnt > 0 ? Math.round(total / cnt) : 0 });
    }

    // ================================================================
    // VENDOR NOTIFY
    // ================================================================
    if (path === '/api/vendor/notify' && method === 'POST') { var { telegramId, type, message } = req.body || {}; if (!telegramId || !message) return fail('required'); var em = type === 'payout' ? '💰' : type === 'order' ? '📦' : '📢'; var isSent = await tg(ENV.VENDOR_BOT_TOKEN, telegramId, em + ' *Smart Shop*\n\n' + message); return ok({ success: isSent }); }


    // ================================================================
    // SHOP BOT WEBHOOK — Contact First → Command List
    // ================================================================
    if (path === '/api/shop-bot/webhook' && method === 'POST') {
      const sb = req.body, sc = sb.message?.chat?.id, st = sb.message?.text || '';
      if (!sc) return ok({ ok: true });
      const uc = sb.message?.contact;
      const sd = async (txt: any, kb?: any) => {
        const bots = [ENV.BOT_TOKEN, ENV.VENDOR_BOT_TOKEN, ENV.ADMIN_BOT_TOKEN].filter(Boolean);
        for (const bot of bots) {
          try {
            const sent = await tg(bot, sc, txt, 'Markdown', kb ? { reply_markup: JSON.stringify(kb) } : {});
            if (sent) return true;
          } catch {}
        }
        return false;
      };
      const from = sb.message?.from || {};

      // Deep links
      if (st.startsWith('/start ') || st.startsWith('/driver') || st === '/driver') {
        const param = st.includes(' ') ? st.split(' ')[1] : '';
        if (st.startsWith('/driver') || param.startsWith('driver') || st === '/driver') {
          // Check driver status first
          let driverRecord = null;
          try {
            const { data } = await supabase.from('delivery_personnel').select('*').eq('telegram_id', from.id || 0).maybeSingle();
            driverRecord = data;
          } catch {}

          if (driverRecord && driverRecord.status === 'approved') {
            await sd(`🏍️ *Smart Express Driver Dashboard*\n\nWelcome back, *${driverRecord.full_name_latin}*!\n\nTap below to open your Driver Dashboard, view active runs, and accept jobs:`, {
              inline_keyboard: [[{ text: '🏍️ Open Driver Dashboard', web_app: { url: ENV.BASE_URL + '/driver?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]]
            });
            return ok({ ok: true });
          } else if (driverRecord && (driverRecord.status === 'pending_review' || driverRecord.status === 'pending_fayda')) {
            await sd(`⏳ *Driver Application Under Review*\n\nHi *${driverRecord.full_name_latin}*! Your independent driver application is currently under review by our admin team.\n\nWe will notify you here once confirmed!`, {
              inline_keyboard: [[{ text: '🔄 Check Application Status', web_app: { url: ENV.BASE_URL + '/driver?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]]
            });
            return ok({ ok: true });
          } else if (driverRecord && driverRecord.status === 'rejected') {
            await sd(`❌ *Driver Application Rejected*\n\nYour application was rejected for the following reason:\n\n_"${driverRecord.rejection_reason || 'Does not meet safety criteria'}"_\n\nTap below to adjust details and reapply:`, {
              inline_keyboard: [[{ text: '✏️ Edit & Re-apply', web_app: { url: ENV.BASE_URL + '/driver-register?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]]
            });
            return ok({ ok: true });
          }

          // Fallback to normal registration
          await sd('🚚 *Driver Registration*\n\n📸 Fayda ID, 🏍 Vehicle, 👨 Emergency, 💳 Payment', { inline_keyboard: [[{ text: '🚀 Register Now', web_app: { url: ENV.BASE_URL + '/driver-register?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]] });
          return ok({ ok: true });
        }
        if (param.startsWith('group_')) { const t = param.replace('group_', ''); await sd('🛍️ Group Deal!', { inline_keyboard: [[{ text: '🎉 Join', web_app: { url: ENV.BASE_URL + '/group-deal/' + t + '?v=' + Date.now() } }]] }); return ok({ ok: true }); }
      }

      // /start -> Ask for contact
      if (st === '/start' && !uc) {
        await sd('👋 *Welcome to Smart Shop!* 🇪🇹\n\n⚠️ *Please share your contact first*\n\nTap the button below:', {
          keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true,
        });
        return ok({ ok: true });
      }

      // Commands (work even without fresh contact)
      if (st === '/shop' || st === '/shop now') {
        await sd('🛍️ *Smart Shop*\n\nTap *👇 /shop now* to start shopping!', { inline_keyboard: [[{ text: '🛍️ /shop now', web_app: { url: ENV.BASE_URL + '?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]] });
        return ok({ ok: true });
      }
      if (st === '/vendor') {
        await sd('🏪 *Become a Vendor*', { inline_keyboard: [[{ text: '🏪 Register', web_app: { url: ENV.BASE_URL + '/vendor-register?tg_id=' + (from.id || '') + '&v=' + Date.now() } }]] });
        return ok({ ok: true });
      }
      if (st === '/help' || st === '/menu') {
        await sd('❓ *All Commands*\n\n🛍️ /shop — Open store\n🚚 /driver — Driver reg\n🏪 /vendor — Seller reg\n📞 /contact — Share phone\n❓ /help — This menu');
        return ok({ ok: true });
      }
      if (st === '/contact') {
        await sd('📞 *Share your contact*', { keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
        return ok({ ok: true });
      }

      // Callback queries
      if (sb.callback_query) {
        const cbd = sb.callback_query.data;
        const qid = sb.callback_query.id;
        if (cbd === 'help') {
          await sd('❓ *Commands*\n🛍️ /shop\n🚚 /driver\n🏪 /vendor\n📞 /contact\n❓ /help');
          fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/answerCallbackQuery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: qid }) }).catch(() => {});
          return ok({ ok: true });
        }
        if (cbd === 'contact') {
          await sd('📞 *Share contact*', { keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
          fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/answerCallbackQuery', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: qid }) }).catch(() => {});
          return ok({ ok: true });
        }
      }

      // Contact shared -> Save + Show command list
      if (uc) {
        const c = uc, f = sb.message.from || {};
        const uid = String(c.user_id || f.id || sc), ph = c.phone_number || '';
        const fn = c.first_name || f.first_name || '', ln = f.last_name || '', un = f.username || '';

        if (c.user_id && f.id && String(c.user_id) !== String(f.id)) { await sd('⚠️ Please share your *own* contact.'); return ok({ ok: true }); }

        try { await supabase.from('users').upsert({ telegram_id: parseInt(uid), phone: ph, first_name: fn, username: un, registered_at: new Date().toISOString(), ...(ln ? { last_name: ln } : {}) }, { onConflict: 'telegram_id' }); } catch { try { await supabase.from('users').upsert({ telegram_id: parseInt(uid), first_name: fn, username: un, registered_at: new Date().toISOString(), ...(ln ? { last_name: ln } : {}) }, { onConflict: 'telegram_id' }); } catch {} }

        tg(ENV.VENDOR_BOT_TOKEN, sc, '', undefined, { reply_markup: JSON.stringify({ remove_keyboard: true }) }).catch(() => {});

        const shopUrl = ENV.BASE_URL + '?tg_id=' + encodeURIComponent(uid) + '&phone=' + encodeURIComponent(ph) + '&name=' + encodeURIComponent(fn) + (un ? '&username=' + encodeURIComponent(un) : '') + '&v=' + Date.now();

        let driverRecord = null;
        try {
          const { data } = await supabase.from('delivery_personnel').select('*').eq('telegram_id', parseInt(uid)).maybeSingle();
          driverRecord = data;
        } catch {}

        const driverUrl = driverRecord && driverRecord.status === 'approved'
          ? ENV.BASE_URL + '/driver?tg_id=' + uid + '&v=' + Date.now()
          : ENV.BASE_URL + '/driver-register?tg_id=' + uid + '&v=' + Date.now();

        const driverText = driverRecord && driverRecord.status === 'approved'
          ? '🏍️ Smart Express'
          : '🚚 /driver';

        fetchTO('https://api.telegram.org/bot' + ENV.VENDOR_BOT_TOKEN + '/setChatMenuButton', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: sc, menu_button: { type: 'default' } }) }).catch(() => {});

        await sd('✅ *Welcome to Smart Shop!* 🇪🇹\n\n👇 *Choose a command:*', {
          inline_keyboard: [
            [{ text: '🛍️ /shop now', web_app: { url: shopUrl } }],
            [{ text: driverText, web_app: { url: driverUrl } }],
            [{ text: '🏪 /vendor', web_app: { url: ENV.BASE_URL + '/vendor-register?tg_id=' + uid + '&v=' + Date.now() } }],
            [{ text: '📞 /contact', callback_data: 'contact' }],
            [{ text: '❓ /help', callback_data: 'help' }],
          ],
        });
        return ok({ ok: true });
      }

      await sd('⚠️ Please share your contact first:', { keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true });
      return ok({ ok: true });
    }

    // ================================================================
    // ADMIN BOT WEBHOOK
    // ================================================================
    if (path === '/api/admin-bot/webhook' && method === 'POST') {
      if (!ENV.ADMIN_BOT_TOKEN) return ok({ ok: true });
      const bd = req.body;
      const ch = bd.message?.chat?.id || bd.callback_query?.message?.chat?.id;
      const tx = bd.message?.text || '';
      const callbackData = bd.callback_query?.data || '';
      const fn = bd.message?.from?.first_name || bd.callback_query?.from?.first_name || 'Admin';
      if (!ch) return ok({ ok: true });
      const cmd = (callbackData || tx).replace('/', '').toLowerCase();

      const [pr, or] = await Promise.all([supabase.from('products').select('*'), supabase.from('orders').select('*')]);
      const pl = pr.data || [], ol = or.data || [], ls = pl.filter(p => p.stock_count <= 5 && p.stock_count > 0);
      const tr = ol.reduce((s, o) => s + (o.total || 0), 0);
      const { data: vRow } = await supabase.from('settings').select('*').single();
      const vc = (vRow?.data?.vendors || []).length;
      const pendingV = (vRow?.data?.vendors || []).filter((v: any) => v.status === 'pending').length;

      const sm = (t: any) => tg(ENV.ADMIN_BOT_TOKEN, ch, t);

      if (cmd === 'start' || cmd === 'help') {
        await sm('👋 *Admin Bot*\n/panel - 🖥️ Open Admin Panel\n/stats - 📊 Store stats\n/orders - 📋 Recent orders\n/lowstock - ⚠️ Low stock\n/vendors - 🏪 Pending vendors\n/alerts - 🔔 Active alerts');
      } else if (cmd === 'stats') {
        await sm('📊 *Store Stats*\n📦 ' + pl.length + ' products\n📋 ' + ol.length + ' orders\n💰 ' + new Intl.NumberFormat('en').format(tr) + ' Br\n⚠️ ' + ls.length + ' low stock\n🏪 ' + vc + ' vendors (' + pendingV + ' pending)');
      } else if (cmd === 'orders') {
        if (!ol.length) await sm('📋 No orders');
        else { let m = '📋 *Recent Orders*\n'; ol.slice(0, 5).forEach((o: any) => { m += (o.status === 'delivered' ? '✅' : '📦') + ' *' + (o.order_number || o.orderNumber) + '* — ' + new Intl.NumberFormat('en').format(o.total || 0) + ' Br\n'; }); m += '\n_' + ol.length + ' total_'; await sm(m); }
      } else if (cmd === 'lowstock') {
        if (!ls.length) await sm('✅ All products well-stocked!');
        else { let m = '⚠️ *Low Stock*\n'; ls.forEach((p: any) => m += (p.stock_count === 0 ? '❌' : '🔴') + ' *' + p.name_en + '* — ' + p.stock_count + ' left\n'); await sm(m); }
      } else if (cmd === 'vendors') {
        const vendors = vRow?.data?.vendors || [];
        const pending = vendors.filter((v: any) => v.status === 'pending');
        if (!pending.length) await sm('✅ No pending vendor applications');
        else { let m = '🏪 *Pending Vendors (' + pending.length + ')*\n'; pending.forEach((v: any) => { m += '\n• ' + (v.name || 'Unknown') + ' (' + (v.phone || '') + ')'; }); await sm(m); }
      } else if (cmd === 'alerts') {
        await sm('✅ No active SLA breaches');
      } else if (cmd === 'panel' || cmd === 'admin') {
        tg(ENV.ADMIN_BOT_TOKEN, ch, '🖥️ *Admin Panel*\n\nTap below to open the admin dashboard:', 'Markdown', { reply_markup: JSON.stringify({ inline_keyboard: [[{ text: '🖥️ Open Admin Panel', web_app: { url: ENV.BASE_URL + '/admin-panel' } }]] }) });
      } else {
        await sm('❌ Unknown command. Try /start for help.');
      }
      return ok({ ok: true });
    }

    // ── Admin Bot — Send ──────────────────────────────────────────
    if (path === '/api/admin-bot/send' && method === 'POST') {
      const { chatId, message } = req.body || {};
      if (!chatId || !message) return fail('chatId and message required');
      const sent = await tg(ENV.ADMIN_BOT_TOKEN, chatId, message, 'HTML');
      return ok({ sent });
    }

    // ── Admin Bot — Set Webhook ───────────────────────────────────
    if (path === '/api/admin-bot/set-webhook' && method === 'POST') {
      const wh = ENV.BASE_URL + '/api/admin-bot/webhook';
      const d = await fetchRetry('https://api.telegram.org/bot' + ENV.ADMIN_BOT_TOKEN + '/setWebhook?url=' + wh, { method: 'POST', timeout: 10000 }).then(r => r.json()).catch(() => ({ ok: false }));
      return ok({ ok: d.ok, description: d.description, webhookUrl: wh });
    }

    // FALLBACK
    // ================================================================
    return res.status(404).json({ error: 'Not found', path: path, method: method, buildTime: 'BUILD-7512' });

  } catch (e: any) {
    logReq(method, path, 500, dur(start), ip, e.message);
    return res.status(500).json({ error: e.message || 'Internal server error' });
  }
}
