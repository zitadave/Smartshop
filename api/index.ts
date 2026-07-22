import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ===== CONFIG =====
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '';

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
    tags: p.tags || [], brand: p.brand || '', featured: p.featured || false,
    weight: p.weight || 0, unit: p.unit || 'kg',
    seoTitle: p.seo_title || '', seoDescription: p.seo_description || '',
    createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false,
    preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null,
    preOrderMax: p.pre_order_max || null,
  };
}

/**
 * Verify Telegram WebApp initData HMAC-SHA256 signature.
 * This ensures the data came from Telegram and hasn't been tampered with.
 */
function verifyTelegramInitData(initData: string): { valid: boolean; user?: any } {
  try {
    if (!initData || !BOT_TOKEN) {
      // If no bot token configured, accept data as-is (dev mode)
      const params = new URLSearchParams(initData);
      const userStr = params.get('user');
      return { valid: true, user: userStr ? JSON.parse(userStr) : null };
    }

    const params = new URLSearchParams(initData);
    const hash = params.get('hash') || '';
    if (!hash) return { valid: false };

    params.delete('hash');

    // Sort keys alphabetically
    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    // HMAC-SHA256: secret = HMAC_SHA256('WebAppData', botToken)
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computedHash !== hash) return { valid: false };

    const userStr = params.get('user');
    return { valid: true, user: userStr ? JSON.parse(userStr) : null };
  } catch (e) {
    return { valid: false };
  }
}

// ===== MAIN HANDLER =====
export default async function handler(req: any, res: any) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const path = req.url?.split('?')[0] || '';
  const method = req.method || 'GET';

  try {
    // ================================================================
    // TELEGRAM AUTH
    // ================================================================
    if (path === '/api/auth/telegram' && method === 'POST') {
      const { initData } = req.body || {};
      if (!initData) return res.status(400).json({ error: 'initData is required' });

      // Verify HMAC signature
      const { valid, user: tgUser } = verifyTelegramInitData(initData);
      if (!valid && BOT_TOKEN) {
        return res.status(401).json({ error: 'Invalid Telegram authentication' });
      }

      if (!tgUser) return res.status(400).json({ error: 'No user data in initData' });

      // Check if user exists in our database
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        // Update last seen
        await supabase
          .from('users')
          .update({ last_seen: now, first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '' })
          .eq('telegram_id', tgUser.id);

        return res.json({
          success: true,
          user: {
            telegramId: existing.telegram_id,
            firstName: existing.first_name || tgUser.first_name,
            lastName: existing.last_name || tgUser.last_name,
            username: existing.username || tgUser.username,
            languageCode: tgUser.language_code || 'en',
            photoUrl: tgUser.photo_url || null,
            phone: existing.phone || null,
            fullName: existing.full_name || null,
            city: existing.city || null,
            address: existing.address || null,
            profileComplete: !!(existing.full_name && existing.city && existing.address),
            firstSeen: existing.created_at || now,
            lastSeen: now,
          },
        });
      } else {
        // Create new user
        const { data: newUser } = await supabase
          .from('users')
          .insert({
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            username: tgUser.username || '',
            language_code: tgUser.language_code || 'en',
            photo_url: tgUser.photo_url || null,
            created_at: now,
            last_seen: now,
          })
          .select()
          .single();

        return res.json({
          success: true,
          user: {
            telegramId: tgUser.id,
            firstName: tgUser.first_name,
            lastName: tgUser.last_name || '',
            username: tgUser.username || '',
            languageCode: tgUser.language_code || 'en',
            photoUrl: tgUser.photo_url || null,
            phone: null,
            fullName: null,
            city: null,
            address: null,
            profileComplete: false,
            firstSeen: now,
            lastSeen: now,
          },
        });
      }
    }

    // ================================================================
    // TELEGRAM AUTH — Register Phone
    // ================================================================
    if (path === '/api/auth/telegram/register-phone' && method === 'POST') {
      const { telegramId, phone } = req.body || {};
      if (!telegramId || !phone) return res.status(400).json({ error: 'telegramId and phone required' });

      await supabase.from('users').update({ phone, phone_verified: true }).eq('telegram_id', telegramId);

      return res.json({ success: true });
    }

    // ================================================================
    // TELEGRAM AUTH — Complete Profile
    // ================================================================
    if (path === '/api/auth/telegram/complete-profile' && method === 'POST') {
      const { telegramId, fullName, city, address } = req.body || {};
      if (!telegramId || !fullName) return res.status(400).json({ error: 'telegramId and fullName required' });

      await supabase
        .from('users')
        .update({ full_name: fullName, city: city || '', address: address || '' })
        .eq('telegram_id', telegramId);

      return res.json({ success: true });
    }

    // ================================================================
    // TELEGRAM AUTH — Get current user
    // ================================================================
    if (path.startsWith('/api/auth/telegram/user/') && method === 'GET') {
      const telegramId = parseInt(path.split('/').pop() || '0');
      if (!telegramId) return res.status(400).json({ error: 'Invalid telegram ID' });

      const { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      if (!data) return res.status(404).json({ error: 'User not found' });

      return res.json({
        success: true,
        user: {
          telegramId: data.telegram_id,
          firstName: data.first_name,
          lastName: data.last_name,
          username: data.username,
          phone: data.phone,
          fullName: data.full_name,
          city: data.city,
          address: data.address,
          profileComplete: !!(data.full_name && data.city && data.address),
          firstSeen: data.created_at,
          lastSeen: data.last_seen,
        },
      });
    }

    // ================================================================
    // ADMIN BOT WEBHOOK — receives commands from Telegram
    // ================================================================
    if (path === '/api/admin-bot/webhook' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ ok: true });

      const body = req.body;
      const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
      const text = body.message?.text || '';
      const callbackData = body.callback_query?.data || '';
      const firstName = body.message?.from?.first_name || body.callback_query?.from?.first_name || 'Admin';

      if (!chatId) return res.status(200).json({ ok: true });

      // Determine command from text or callback
      const command = callbackData || text;
      const cmd = command.replace('/', '').toLowerCase();

      // Fetch store data for responses
      const { data: products } = await supabase.from('products').select('*');
      const { data: orders } = await supabase.from('orders').select('*');
      const pList = products || [];
      const oList = orders || [];
      const lowStock = pList.filter((p: any) => p.stock_count <= 5 && p.stock_count > 0);
      const totalRevenue = oList.reduce((s: number, o: any) => s + (o.total || 0), 0);

      const sendMsg = async (text: string, parseMode = 'Markdown') => {
        await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true }),
        });
      };

      if (cmd === 'start' || cmd === 'help') {
        await sendMsg(
          `👋 *Welcome to Smart Shop Admin Bot, ${firstName}!*\n\n` +
          `I'll send you real-time alerts for:\n` +
          `🛒 New orders\n⚠️ Low stock\n🚨 SLA breaches\n🏪 New vendors\n📊 Daily summaries\n\n` +
          `*Commands:*\n/stats — Store statistics\n/orders — Recent orders\n/lowstock — Low stock alerts\n/alerts — Active SLA breaches`,
          'Markdown'
        );
      } else if (cmd === 'stats') {
        await sendMsg(
          `📊 *Smart Shop Store Stats*\n\n` +
          `📦 Products: ${pList.length}\n` +
          `📋 Orders: ${oList.length}\n` +
          `💰 Revenue: ${new Intl.NumberFormat('en').format(totalRevenue)} Br\n` +
          `⚠️ Low Stock: ${lowStock.length}\n` +
          `🏪 Vendors: ${(await supabase.from('vendors').select('*')).data?.length || 0}\n\n` +
          `_Updated: ${new Date().toLocaleString()}_`,
          'Markdown'
        );
      } else if (cmd === 'orders') {
        const recent = oList.slice(0, 5);
        if (recent.length === 0) {
          await sendMsg('📋 *No orders yet*', 'Markdown');
        } else {
          let msg = '📋 *Recent Orders*\n\n';
          recent.forEach((o: any) => {
            const icon = o.status === 'delivered' ? '✅' : o.status === 'shipped' ? '🚚' : '📦';
            msg += `${icon} *${o.order_number || o.orderNumber}* — ${new Intl.NumberFormat('en').format(o.total || 0)} Br — ${o.status}\n`;
          });
          msg += `\n_${oList.length} total orders_`;
          await sendMsg(msg, 'Markdown');
        }
      } else if (cmd === 'lowstock') {
        if (lowStock.length === 0) {
          await sendMsg('✅ *All products well-stocked!*', 'Markdown');
        } else {
          let msg = '⚠️ *Low Stock Alerts*\n\n';
          lowStock.forEach((p: any) => {
            const emoji = p.stock_count === 0 ? '❌' : p.stock_count <= 2 ? '🔴' : '🟡';
            msg += `${emoji} *${p.name_en}* — ${p.stock_count} left\n`;
          });
          await sendMsg(msg, 'Markdown');
        }
      } else if (cmd === 'alerts') {
        await sendMsg('✅ *No active SLA breaches*', 'Markdown');
      } else {
        await sendMsg(`❌ Unknown command. Try /start for help.`, 'Markdown');
      }

      return res.json({ ok: true });
    }

    // ================================================================
    // ADMIN BOT — Send notification
    // ================================================================
    if (path === '/api/admin-bot/send' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ sent: false, error: 'No bot token' });
      const { chatId, message } = req.body || {};
      if (!chatId || !message) return res.status(400).json({ error: 'chatId and message required' });

      const result = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      const data = await result.json();
      return res.json({ sent: data.ok === true });
    }

    // ================================================================
    // ADMIN BOT — Set webhook
    // ================================================================
    if (path === '/api/admin-bot/set-webhook' && method === 'POST') {
      const baseUrl = req.headers['x-forwarded-proto'] + '://' + req.headers['x-forwarded-host'];
      const webhookUrl = `${baseUrl}/api/admin-bot/webhook`;
      if (!ADMIN_BOT_TOKEN) return res.json({ error: 'No admin bot token configured' });

      const result = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/setWebhook?url=${webhookUrl}`, {
        method: 'POST',
      });
      const data = await result.json();
      return res.json({ ok: data.ok, description: data.description, webhookUrl });
    }

    // ================================================================
    // PRODUCTS
    // ================================================================
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
      if (method === 'POST') {
        // Convert camelCase frontend fields to snake_case for database
        const body = {
          ...req.body,
          name_en: req.body.nameEn || req.body.name_en || '',
          name: req.body.name || req.body.name_en || '',
          description_en: req.body.descriptionEn || req.body.description_en || '',
          description: req.body.description || '',
          stock_count: req.body.stockCount ?? req.body.stock_count ?? 10,
          sold_count: req.body.soldCount ?? req.body.sold_count ?? 0,
          original_price: req.body.originalPrice ?? req.body.original_price ?? null,
          vendor_id: req.body.vendorId ?? req.body.vendor_id ?? null,
          vendor_name: req.body.vendorName ?? req.body.vendor_name ?? '',
          is_pre_order: req.body.isPreOrder ?? req.body.is_pre_order ?? false,
          pre_order_deposit: req.body.preOrderDeposit ?? req.body.pre_order_deposit ?? null,
          pre_order_release_date: req.body.preOrderReleaseDate ?? req.body.pre_order_release_date ?? '',
          pre_order_max: req.body.preOrderMax ?? req.body.pre_order_max ?? null,
          seo_title: req.body.seoTitle ?? req.body.seo_title ?? '',
          seo_description: req.body.seoDescription ?? req.body.seo_description ?? '',
          in_stock: req.body.inStock ?? req.body.in_stock ?? true,
        };
        // Remove camelCase keys to avoid conflicts
        delete body.nameEn; delete body.descriptionEn; delete body.stockCount; delete body.soldCount;
        delete body.originalPrice; delete body.vendorId; delete body.vendorName;
        delete body.isPreOrder; delete body.preOrderDeposit; delete body.preOrderReleaseDate;
        delete body.preOrderMax; delete body.seoTitle; delete body.seoDescription;
        delete body.inStock;
        const { data } = await supabase.from('products').insert(body).select().single();
        return res.json({ success: true, product: data });
      }
      if (method === 'PUT') {
        const id = parseInt(path.split('/').pop() || '0');
        const body = {
          ...req.body,
          name_en: req.body.nameEn || req.body.name_en,
          name: req.body.name || req.body.name,
          description_en: req.body.descriptionEn || req.body.description_en,
          description: req.body.description,
          stock_count: req.body.stockCount ?? req.body.stock_count,
          original_price: req.body.originalPrice ?? req.body.original_price,
          vendor_id: req.body.vendorId ?? req.body.vendor_id,
          vendor_name: req.body.vendorName ?? req.body.vendor_name,
          is_pre_order: req.body.isPreOrder ?? req.body.is_pre_order,
          pre_order_deposit: req.body.preOrderDeposit ?? req.body.pre_order_deposit,
          pre_order_release_date: req.body.preOrderReleaseDate ?? req.body.pre_order_release_date,
          pre_order_max: req.body.preOrderMax ?? req.body.pre_order_max,
          seo_title: req.body.seoTitle ?? req.body.seo_title,
          seo_description: req.body.seoDescription ?? req.body.seo_description,
          in_stock: req.body.inStock ?? req.body.in_stock,
        };
        delete body.nameEn; delete body.descriptionEn; delete body.stockCount; delete body.soldCount;
        delete body.originalPrice; delete body.vendorId; delete body.vendorName;
        delete body.isPreOrder; delete body.preOrderDeposit; delete body.preOrderReleaseDate;
        delete body.preOrderMax; delete body.seoTitle; delete body.seoDescription;
        delete body.inStock;
        await supabase.from('products').update(body).eq('id', id);
        return res.json({ success: true });
      }
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
    if (path === '/api/upload' && method === 'POST') {
      // For now, return the uploaded file as a data URL or use placeholder
      // In production, this would upload to Supabase Storage
      return res.json({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image+Uploaded' });
    }

    // ===== SEED / HEALTH =====
    if (path === '/api/seed' && method === 'GET') {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { data: telegramUsers } = await supabase.from('users').select('*');
      return res.json({ products: count || 0, telegramUsers: telegramUsers?.length || 0, message: 'Smart Shop API running on Vercel!' });
    }

    // ===== PAYMENT - Initiate Chapa Payment =====
    if (path === '/api/payment/initiate-chapa' && method === 'POST') {
      const { amount, email, firstName, lastName, phone, txRef, orderNumber } = req.body || {};
      if (!amount || !email || !phone) return res.status(400).json({ error: 'amount, email, and phone required' });
      
      // In production, this would call Chapa API:
      // const chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
      //   method: 'POST',
      //   headers: { 'Authorization': 'Bearer ' + CHAPA_SECRET_KEY, 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, currency: 'ETB', email, first_name: firstName, last_name: lastName, phone, tx_ref: txRef, callback_url: 'https://smartshop-steel.vercel.app/api/payment/verify', return_url: 'https://smartshop-steel.vercel.app/confirmation/' + orderNumber })
      // });
      
      return res.json({
        success: true,
        checkout_url: 'https://checkout.chapa.co/payment/' + txRef,
        tx_ref: txRef,
        message: 'Payment initiated. Redirect customer to checkout URL.',
      });
    }

    // ===== PAYMENT - Verify Chapa Payment =====
    if (path === '/api/payment/verify' && method === 'POST') {
      const { tx_ref } = req.body || {};
      if (!tx_ref) return res.status(400).json({ error: 'tx_ref required' });
      
      // In production, verify with Chapa:
      // const res = await fetch('https://api.chapa.co/v1/transaction/verify/' + tx_ref, { headers: { 'Authorization': 'Bearer ' + CHAPA_SECRET_KEY } });
      
      return res.json({
        status: 'completed',
        amount: req.body.amount || 0,
        reference: 'CHAPA-' + Date.now().toString(36).toUpperCase(),
        verified: true,
      });
    }

    // ===== PAYMENT - Initiate Telebirr =====
    if (path === '/api/payment/initiate-telebirr' && method === 'POST') {
      const { amount, phone, orderNumber } = req.body || {};
      if (!amount || !phone) return res.status(400).json({ error: 'amount and phone required' });
      
      return res.json({
        success: true,
        deepLink: 'telebirr://pay?amount=' + amount + '&order=' + orderNumber,
        ussdCode: '*847#' + amount + '#' + orderNumber,
        message: 'Payment initiated via Telebirr.',
      });
    }

    // ===== PAYMENT - Transaction History =====
    if (path === '/api/payment/transactions' && method === 'GET') {
      const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
      const txList = (orders || []).map((o: any) => ({
        id: o.id,
        orderNumber: o.order_number,
        amount: o.total || 0,
        paymentMethod: o.payment_method || 'telebirr',
        status: o.status || 'pending',
        customerName: o.customer?.name || 'Unknown',
        date: o.created_at || o.date,
      }));
      return res.json({ transactions: txList });
    }

    // ===== TAX - Calculate Tax Breakdown =====
    if (path === '/api/tax/calculate' && method === 'POST') {
      const { productPrice, deliveryFee, commissionRate } = req.body || {};
      const rate = (commissionRate || 15) / 100;
      const basePrice = productPrice || 0;
      const fee = deliveryFee || 0;
      const commissionAmount = Math.round(basePrice * rate);
      const gatewayFee = Math.round(basePrice * 0.025);
      const vatOnCommission = Math.round(commissionAmount * 0.15);
      const withholdingTax = Math.round(basePrice * 0.02);
      const vendorPayout = basePrice - commissionAmount - gatewayFee - withholdingTax;
      const totalPaid = basePrice + fee + vatOnCommission;
      
      return res.json({
        basePrice, deliveryFee: fee, commissionRate: rate, commissionAmount,
        gatewayFee, vatOnCommission, withholdingTax, vendorPayout, totalPaid,
        vatRate: 0.15, withholdingTaxRate: 0.02,
        totalTaxToRemit: vatOnCommission + withholdingTax,
        shopRevenue: commissionAmount - gatewayFee,
      });
    }

    // ===== TAX - Generate Receipt =====
    if (path === '/api/tax/receipt' && method === 'POST') {
      const { orderNumber } = req.body || {};
      if (!orderNumber) return res.status(400).json({ error: 'orderNumber required' });
      
      const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });
      
      return res.json({
        success: true,
        receiptNumber: 'SS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000),
        orderNumber: order.order_number,
        generatedAt: new Date().toISOString(),
        html: '<html><body><h1>Tax Receipt</h1><p>Order: ' + orderNumber + '</p></body></html>',
      });
    }

    // ===== TAX - Generate Report =====
    if (path === '/api/tax/monthly-report' && method === 'GET') {
      const { data: orders } = await supabase.from('orders').select('*');
      const total = (orders || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
      const count = (orders || []).length;
      const commission = Math.round(total * 0.1);
      const vat = Math.round(commission * 0.15);
      const wht = Math.round(total * 0.02);
      
      return res.json({
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalSales: total,
        orderCount: count,
        totalCommission: commission,
        vatOnCommission: vat,
        withholdingTax: wht,
        totalTaxToRemit: vat + wht,
        averageOrderValue: count > 0 ? Math.round(total / count) : 0,
      });
    }

    // ===== FALLBACK =====
    return res.status(404).json({ error: 'Not found', path, method });

  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

    // ================================================================
    // ADMIN BOT — Send file to Telegram chat
    // ================================================================
    if (path === '/api/admin-bot/send-file' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ sent: false, error: 'No bot token' });
      const { chatId, filename, content, contentType, caption } = req.body || {};
      if (!chatId || !content) return res.status(400).json({ error: 'chatId and content required' });

      try {
        // Use Telegram sendDocument API with file content as FormData
        const boundary = '----FormBoundary' + Math.random().toString(36).substring(2);
        const enc = new TextEncoder();
        const fileContent = typeof content === 'string' ? content : JSON.stringify(content);
        const fileBytes = enc.encode(fileContent);
        
        // Build multipart body manually
        const parts = [];
        parts.push('--' + boundary);
        parts.push('Content-Disposition: form-data; name="chat_id"');
        parts.push('');
        parts.push(String(chatId));
        
        parts.push('--' + boundary);
        parts.push(`Content-Disposition: form-data; name="document"; filename="${filename || 'file.csv'}"`);
        parts.push(`Content-Type: ${contentType || 'text/csv'}`);
        parts.push('');
        parts.push(fileContent);
        
        if (caption) {
          parts.push('--' + boundary);
          parts.push('Content-Disposition: form-data; name="caption"');
          parts.push('');
          parts.push(caption);
        }
        
        parts.push('--' + boundary + '--');
        
        const body = parts.join('\r\n');
        
        const result = await fetch(`https://api.telegram.org/bot${ADMIN_BOT_TOKEN}/sendDocument`, {
          method: 'POST',
          headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
          body: body,
        });
        const data = await result.json();
        return res.json({ sent: data.ok === true, description: data.description });
      } catch (e: any) {
        return res.json({ sent: false, error: e.message });
      }
    }

    // ================================================================
    // COMMISSION — Calculate commission for a product
    // ================================================================
    if (path === '/api/commission/calculate' && method === 'POST') {
      const { productId, price, vendorId, category } = req.body || {};
      // Get settings for commission rates
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      const s = settingsData?.data || {};
      const globalCommission = s.vendorCommission || 10;
      const categoryCommissions = s.categoryCommission || {};
      const vendorCommissions = s.vendorCommissionOverride || {};
      
      // Commission priority: vendor-specific > category-specific > global
      let commissionRate = globalCommission;
      let source = 'global';
      
      if (vendorId && vendorCommissions[vendorId]) {
        commissionRate = vendorCommissions[vendorId];
        source = `vendor_${vendorId}`;
      } else if (category && categoryCommissions[category]) {
        commissionRate = categoryCommissions[category];
        source = `category_${category}`;
      }
      
      const commissionAmount = Math.round((price || 0) * commissionRate / 100);
      const vendorPayout = (price || 0) - commissionAmount;
      
      return res.json({
        commissionRate,
        commissionAmount,
        vendorPayout,
        source,
        productPrice: price || 0,
      });
    }

    // ================================================================
    // COMMISSION — Update commission settings
    // ================================================================
    if (path === '/api/commission/settings' && method === 'GET') {
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      const s = settingsData?.data || {};
      return res.json({
        globalCommission: s.vendorCommission || 10,
        categoryCommission: s.categoryCommission || {},
        vendorCommissionOverride: s.vendorCommissionOverride || {},
      });
    }
