import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ===== CONFIG =====
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
const VENDOR_BOT_TOKEN = process.env.VENDOR_BOT_TOKEN || '7761374287:AAHreFF93x92F4tMqRoA1swcNiJoDv5M-Rk';
var adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '336997351';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ===== VENDOR HELPERS (store vendors in settings.data.vendors since no vendors table) =====
async function getVendors() {
  try {
    var { data: row } = await supabase.from('settings').select('*').single();
    var vendors = (row?.data?.vendors) || [];
    return vendors;
  } catch(e) { return []; }
}

async function saveVendors(vendors) {
  try {
    var { data: row } = await supabase.from('settings').select('*').single();
    var newData = { ...(row?.data || {}), vendors: vendors };
    if (row) {
      await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', row.id);
    } else {
      await supabase.from('settings').insert({ data: newData });
    }
  } catch(e) { console.log('saveVendors error:', e?.message || e); }
}

// ===== HELPERS =====
function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

function normalizeProduct(p) {
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

function verifyTelegramInitData(initData) {
  try {
    if (!initData || !BOT_TOKEN) {
      var params = new URLSearchParams(initData);
      var userStr = params.get('user');
      return { valid: true, user: userStr ? JSON.parse(userStr) : null };
    }
    var params = new URLSearchParams(initData);
    var hash = params.get('hash') || '';
    if (!hash) return { valid: false };
    params.delete('hash');
    var dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => k + '=' + v)
      .join('\n');
    var secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    var computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (computedHash !== hash) return { valid: false };
    var userStr = params.get('user');
    return { valid: true, user: userStr ? JSON.parse(userStr) : null };
  } catch (e) {
    return { valid: false };
  }
}

// ===== MAIN HANDLER =====
export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  var path = (req.url || '').split('?')[0];
  var method = req.method || 'GET';

  try {
    // ================================================================
    // TELEGRAM AUTH
    // ================================================================
    if (path === '/api/auth/telegram' && method === 'POST') {
      var { initData } = req.body || {};
      if (!initData) return res.status(400).json({ error: 'initData is required' });

      var { valid, user: tgUser } = verifyTelegramInitData(initData);
      if (!valid && BOT_TOKEN) {
        return res.status(401).json({ error: 'Invalid Telegram authentication' });
      }
      if (!tgUser) return res.status(400).json({ error: 'No user data in initData' });

      var { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', tgUser.id)
        .single();

      var now = new Date().toISOString();

      if (existing) {
        await supabase
          .from('users')
          .update({ first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '' })
          .eq('telegram_id', tgUser.id);

        // Check vendor status from settings
        var vendorStatus = '';
        try {
          var vendors = await getVendors();
          var found = vendors.find(function(v) { return v.telegram_id == tgUser.id; });
          if (found) vendorStatus = found.status || '';
        } catch(e) {}

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
            vendorStatus: vendorStatus,
            firstSeen: existing.registered_at || now,
            lastSeen: now,
          },
        });
      } else {
        var { data: newUser } = await supabase
          .from('users')
          .insert({
            telegram_id: tgUser.id,
            first_name: tgUser.first_name,
            last_name: tgUser.last_name || '',
            username: tgUser.username || '',
            phone: '',
            registered_at: now,
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
            vendorStatus: '',
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
      var { telegramId, phone } = req.body || {};
      if (!telegramId || !phone) return res.status(400).json({ error: 'telegramId and phone required' });

      await supabase.from('users').update({ phone: phone, phone_verified: true }).eq('telegram_id', telegramId);

      return res.json({ success: true });
    }

    // ================================================================
    // TELEGRAM AUTH — Complete Profile
    // ================================================================
    if (path === '/api/auth/telegram/complete-profile' && method === 'POST') {
      var { telegramId, fullName, city, address } = req.body || {};
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
      var telegramId = parseInt(path.split('/').pop() || '0');
      if (!telegramId) return res.status(400).json({ error: 'Invalid telegram ID' });

      var { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      if (!data) return res.status(404).json({ error: 'User not found' });

      // Check vendor status
      var vendorStatus = '';
      try {
        var vendors = await getVendors();
        var found = vendors.find(function(v) { return v.telegram_id == telegramId; });
        if (found) vendorStatus = found.status || '';
      } catch(e) {}

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
          vendorStatus: vendorStatus,
          firstSeen: data.registered_at,
          lastSeen: '',
        },
      });
    }

    // ================================================================
    // SHOP BOT WEBHOOK — handles contact sharing + /start
    // ================================================================
    if (path === '/api/shop-bot/webhook' && method === 'POST') {
      var sb = req.body;
      var sc = sb.message?.chat?.id;
      var st = sb.message?.text || '';

      if (!sc) return res.json({ ok: true });

      var userContact = sb.message?.contact;
      var sSend = async function(txt, keyboard) {
        var body = { chat_id: sc, text: txt, parse_mode: 'Markdown' };
        if (keyboard) body.reply_markup = JSON.stringify(keyboard);
        try {
          await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
          });
        } catch(e) {}
      };

      if (st === '/start' && !userContact) {
        await sSend('⚠️ *Contact Required*\n\nYou must share your phone number to use Smart Shop.\n\nTap "📱 Share Contact" below:', {
          keyboard: [[{ text: '📱 Share Contact', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        });
        return res.json({ ok: true });
      }

      if (userContact) {
        var contact = sb.message.contact;
        var from = sb.message.from || {};
        var userId = String(contact.user_id || from.id || sc || '');
        var phoneNum = contact.phone_number || '';
        var firstName = contact.first_name || from.first_name || '';
        var lastName = from.last_name || '';
        var username = from.username || '';

        // VALIDATE: contact must belong to sender (prevent forwarding)
        if (contact.user_id && from.id && String(contact.user_id) !== String(from.id)) {
          await sSend('⚠️ *Validation Error:* Please share your own contact to register.');
          return res.json({ ok: true });
        }

        // Save contact info to users table
        try {
          var upsertData = {
            telegram_id: parseInt(userId),
            phone: phoneNum,
            first_name: firstName,
            username: username,
            registered_at: new Date().toISOString(),
          };
          if (lastName) upsertData.last_name = lastName;
          
          await supabase.from('users').upsert(upsertData, { onConflict: 'telegram_id' });
        } catch(se) { 
          // Fallback if phone column issue
          try {
            var fallbackData = {
              telegram_id: parseInt(userId),
              first_name: firstName,
              username: username,
              registered_at: new Date().toISOString(),
            };
            if (lastName) fallbackData.last_name = lastName;
            await supabase.from('users').upsert(fallbackData, { onConflict: 'telegram_id' });
          } catch(e) {}
        }

        // Remove keyboard
        try {
          await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: sc, text: '✅ Contact verified!', reply_markup: JSON.stringify({ remove_keyboard: true }) })
          });
        } catch(e) {}

        // Build URL with user data as query params (backup for when Telegram.WebApp is unavailable)
        var miniAppUrl = 'https://smartshop-steel.vercel.app' +
          '?tg_id=' + encodeURIComponent(userId) +
          '&phone=' + encodeURIComponent(phoneNum) +
          '&name=' + encodeURIComponent(firstName) +
          (username ? '&username=' + encodeURIComponent(username) : '') +
          '&v=' + Date.now();

        // Set chat menu button
        try {
          await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/setChatMenuButton', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: sc, menu_button: { type: 'web_app', text: '🛍️ Open Smart Shop', web_app: { url: miniAppUrl } } })
          });
        } catch(e) {}

        // Send final message with URL containing user data
        await sSend('✅ *Phone number saved!*\n\nTap the button below to open the shop:', {
          inline_keyboard: [[{ text: '🚀 Open Smart Shop', web_app: { url: miniAppUrl } }]]
        });
      } else if (st !== '/start') {
        // Any text without contact - ask for contact
        await sSend('⚠️ Please share your contact first:', {
          keyboard: [[{ text: '📱 Share Contact', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true
        });
      }
      return res.json({ ok: true });
    }

    // ================================================================
    // ADMIN BOT WEBHOOK
    // ================================================================
    if (path === '/api/admin-bot/webhook' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ ok: true });

      var body = req.body;
      var chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
      var text = body.message?.text || '';
      var callbackData = body.callback_query?.data || '';
      var firstName = body.message?.from?.first_name || body.callback_query?.from?.first_name || 'Admin';

      if (!chatId) return res.status(200).json({ ok: true });

      var command = callbackData || text;
      var cmd = command.replace('/', '').toLowerCase();

      var { data: products } = await supabase.from('products').select('*');
      var { data: orders } = await supabase.from('orders').select('*');
      var pList = products || [];
      var oList = orders || [];
      var lowStock = pList.filter(function(p) { return p.stock_count <= 5 && p.stock_count > 0; });
      var totalRevenue = oList.reduce(function(s, o) { return s + (o.total || 0); }, 0);

      var sendMsg = async function(text, parseMode) {
        parseMode = parseMode || 'Markdown';
        await fetch('https://api.telegram.org/bot' + ADMIN_BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: parseMode, disable_web_page_preview: true }),
        });
      };

      if (cmd === 'start' || cmd === 'help') {
        await sendMsg(
          '👋 *Welcome to Smart Shop Admin Bot, ' + firstName + '*\n\n' +
          'I\'ll send you real-time alerts for:\n' +
          '🛒 New orders\n⚠️ Low stock\n🚨 SLA breaches\n🏪 New vendors\n📊 Daily summaries\n\n' +
          '*Commands:*\n/stats — Store statistics\n/orders — Recent orders\n/lowstock — Low stock alerts\n/alerts — Active SLA breaches'
        );
      } else if (cmd === 'stats') {
        var { data: vRow } = await supabase.from('settings').select('*').single();
        var vendorCount = (vRow?.data?.vendors || []).length;
        await sendMsg(
          '📊 *Smart Shop Store Stats*\n\n' +
          '📦 Products: ' + pList.length + '\n' +
          '📋 Orders: ' + oList.length + '\n' +
          '💰 Revenue: ' + new Intl.NumberFormat('en').format(totalRevenue) + ' Br\n' +
          '⚠️ Low Stock: ' + lowStock.length + '\n' +
          '🏪 Vendors: ' + vendorCount + '\n\n' +
          '_Updated: ' + new Date().toLocaleString() + '_'
        );
      } else if (cmd === 'orders') {
        var recent = oList.slice(0, 5);
        if (recent.length === 0) {
          await sendMsg('📋 *No orders yet*');
        } else {
          var msg = '📋 *Recent Orders*\n\n';
          recent.forEach(function(o) {
            var icon = o.status === 'delivered' ? '✅' : o.status === 'shipped' ? '🚚' : '📦';
            msg += icon + ' *' + (o.order_number || o.orderNumber) + '* — ' + new Intl.NumberFormat('en').format(o.total || 0) + ' Br — ' + o.status + '\n';
          });
          msg += '\n_' + oList.length + ' total orders_';
          await sendMsg(msg);
        }
      } else if (cmd === 'lowstock') {
        if (lowStock.length === 0) {
          await sendMsg('✅ *All products well-stocked!*');
        } else {
          var msg = '⚠️ *Low Stock Alerts*\n\n';
          lowStock.forEach(function(p) {
            var emoji = p.stock_count === 0 ? '❌' : p.stock_count <= 2 ? '🔴' : '🟡';
            msg += emoji + ' *' + p.name_en + '* — ' + p.stock_count + ' left\n';
          });
          await sendMsg(msg);
        }
      } else if (cmd === 'alerts') {
        await sendMsg('✅ *No active SLA breaches*');
      } else {
        await sendMsg('❌ Unknown command. Try /start for help.');
      }

      return res.json({ ok: true });
    }

    // ================================================================
    // ADMIN BOT — Send notification
    // ================================================================
    if (path === '/api/admin-bot/send' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ sent: false, error: 'No bot token' });
      var { chatId, message } = req.body || {};
      if (!chatId || !message) return res.status(400).json({ error: 'chatId and message required' });

      var result = await fetch('https://api.telegram.org/bot' + ADMIN_BOT_TOKEN + '/sendMessage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: 'HTML', disable_web_page_preview: true }),
      });
      var data = await result.json();
      return res.json({ sent: data.ok === true });
    }

    // ================================================================
    // ADMIN BOT — Set webhook
    // ================================================================
    if (path === '/api/admin-bot/set-webhook' && method === 'POST') {
      var baseUrl = req.headers['x-forwarded-proto'] + '://' + req.headers['x-forwarded-host'];
      var webhookUrl = baseUrl + '/api/admin-bot/webhook';
      if (!ADMIN_BOT_TOKEN) return res.json({ error: 'No admin bot token configured' });

      var result = await fetch('https://api.telegram.org/bot' + ADMIN_BOT_TOKEN + '/setWebhook?url=' + webhookUrl, {
        method: 'POST',
      });
      var data = await result.json();
      return res.json({ ok: data.ok, description: data.description, webhookUrl: webhookUrl });
    }

    // ================================================================
    // USER SYNC — universal identity
    // ================================================================
    if (path === '/api/user/sync' && method === 'POST') {
      var b = req.body || {};
      var tid = b.telegram_id || '';
      if (!tid) return res.json({ success: false });

      var result = { success: true };

      // Upsert user
      try {
        var userData = {
          telegram_id: parseInt(tid),
          username: b.username || '',
          first_name: b.first_name || '',
        };
        if (b.phone) { userData.phone = b.phone; }
        await supabase.from('users').upsert(userData, { onConflict: 'telegram_id' });

        var { data: userRecord } = await supabase.from('users').select('*').eq('telegram_id', parseInt(tid)).single();
        if (userRecord?.phone) result.phone = userRecord.phone;
      } catch(se) { console.log('User sync error:', se.message); }

      // Check vendor status from settings
      try {
        var vendors = await getVendors();
        var tidNum = tid ? parseInt(tid) : 0;
        var found = null;
        if (tidNum) {
          found = vendors.find(function(v) { return v.telegram_id == tidNum; });
        }
        if (!found && b.phone) {
          found = vendors.find(function(v) { return v.phone == b.phone; });
        }
        if (found) {
          result.vendor_status = found.status || 'pending';
          result.vendor_id = found.id;
          result.vendor_name = found.name || '';
        }
      } catch(e) {}

      return res.json(result);
    }

    // ================================================================
    // USER CONTACT — get phone by telegram_id
    // ================================================================
    if (path === '/api/user/contact' && method === 'GET') {
      var qs = req.url?.split('?')[1] || '';
      var tid = new URLSearchParams(qs).get('telegram_id') || '';
      if (!tid) return res.json({ phone: '' });
      try {
        var { data } = await supabase.from('users').select('phone').eq('telegram_id', parseInt(tid)).single();
        if (data && data.phone) return res.json({ phone: data.phone });
      } catch(e) {}
      return res.json({ phone: '' });
    }

    // ================================================================
    // PRODUCTS
    // ================================================================
    if (path.startsWith('/api/products') || (path === '/api/' && method === 'GET')) {
      if (method === 'GET') {
        if (path === '/api/products' || path === '/api/') {
          var { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return res.json({ products: (data || []).map(normalizeProduct) });
        }
        var id = parseInt(path.replace('/api/products/', ''));
        if (!isNaN(id)) {
          var { data } = await supabase.from('products').select('*').eq('id', id).single();
          return res.json({ product: data ? normalizeProduct(data) : null });
        }
      }
      if (method === 'POST') {
        var body = {
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
        delete body.nameEn; delete body.descriptionEn; delete body.stockCount; delete body.soldCount;
        delete body.originalPrice; delete body.vendorId; delete body.vendorName;
        delete body.isPreOrder; delete body.preOrderDeposit; delete body.preOrderReleaseDate;
        delete body.preOrderMax; delete body.seoTitle; delete body.seoDescription;
        delete body.inStock;
        var { data } = await supabase.from('products').insert(body).select().single();
        return res.json({ success: true, product: data });
      }
      if (method === 'PUT') {
        var id = parseInt(path.split('/').pop() || '0');
        var body = {
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
      if (method === 'DELETE') { var id = parseInt(path.split('/').pop() || '0'); await supabase.from('products').delete().eq('id', id); return res.json({ success: true }); }
    }

    // ================================================================
    // SETTINGS
    // ================================================================
    if (path === '/api/settings') {
      if (method === 'GET') { var { data: row } = await supabase.from('settings').select('*').single(); return res.json({ success: true, settings: row?.data || row || {} }); }
      if (method === 'PUT') { var { data: exRow } = await supabase.from('settings').select('*').single(); if (exRow) { await supabase.from('settings').update({ data: { ...(exRow.data || exRow), ...req.body }, updated_at: new Date().toISOString() }).eq('id', exRow.id); } else { await supabase.from('settings').insert({ data: req.body }); } return res.json({ success: true }); }
    }

    // ================================================================
    // ORDERS
    // ================================================================
    if (path.startsWith('/api/orders')) {
      if (method === 'GET' && (path === '/api/orders' || path === '/api/')) { var { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }); return res.json({ orders: data || [] }); }
      if (method === 'POST' && (path === '/api/orders' || path === '/api/')) { var body = { ...req.body, order_number: req.body.orderNumber || 'ETH-' + Date.now().toString(36).toUpperCase() }; var { data } = await supabase.from('orders').insert(body).select().single(); return res.json({ success: true, order: data || body }); }
      if (method === 'GET') { var on = path.replace('/api/orders/', '').split('/')[0]; var { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return res.json({ success: true, order: data }); }
      if (method === 'PATCH' && path.includes('/status')) { var on = path.split('/')[3]; await supabase.from('orders').update({ status: req.body.status }).eq('order_number', on); return res.json({ success: true }); }
    }

    // ================================================================
    // VENDORS — using settings.data.vendors (no vendors table exists)
    // ================================================================
    if (path.startsWith('/api/vendors')) {

      // Approve vendor
      if (path === '/api/vendors/approve' && method === 'POST') {
        var appId = req.body.id;
        try {
          var vendors = await getVendors();
          var updated = false;
          for (var i = 0; i < vendors.length; i++) {
            if (vendors[i].id == appId || vendors[i].id === String(appId)) {
              vendors[i].status = 'approved';
              updated = true;
              break;
            }
          }
          if (updated) {
            await saveVendors(vendors);
          }

          // Notify admin with beautiful card
          try {
            var bc = adminChatId || '336997351';
            var bt = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
            var approvedVendorName = req.body.name || 'ID: ' + appId;
            await fetch('https://api.telegram.org/bot' + bt + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                chat_id: bc, 
                text: '✅ <b>Vendor Approved</b>\n\n' +
                  '━━━━━━━━━━━━━━━\n' +
                  '🏪 <b>Store:</b> ' + approvedVendorName + '\n' +
                  '🆔 <b>ID:</b> <code>' + appId + '</code>\n' +
                  '📅 <b>Date:</b> ' + new Date().toLocaleDateString() + '\n' +
                  '━━━━━━━━━━━━━━━\n\n' +
                  'The vendor can now access their dashboard and start selling products.',
                parse_mode: 'HTML', 
                disable_web_page_preview: true 
              })
            });
          } catch(e) {}

          // Notify the VENDOR via shop bot
          try {
            var approvedVendor = null;
            var updatedVendors = await getVendors();
            for (var vi = 0; vi < updatedVendors.length; vi++) {
              if (updatedVendors[vi].id == appId || updatedVendors[vi].id === String(appId)) {
                approvedVendor = updatedVendors[vi];
                break;
              }
            }
            if (approvedVendor && approvedVendor.telegram_id) {
              var vendorName = approvedVendor.name || 'your store';
              var vendorNotifyMsg = '🎉 <b>Congratulations ' + vendorName + '!</b>\n\n' +
                '━━━━━━━━━━━━━━━\n' +
                '✅ <b>Your vendor application has been approved!</b>\n' +
                '━━━━━━━━━━━━━━━\n\n' +
                'You can now:\n' +
                '📦 <b>Add products</b> to your store\n' +
                '📊 <b>Manage orders</b> from your dashboard\n' +
                '💰 <b>Track earnings</b> and payouts\n\n' +
                'Tap the button below to start selling! 🚀';
              var vendorUrl = 'https://smartshop-steel.vercel.app';
              await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  chat_id: approvedVendor.telegram_id,
                  text: vendorNotifyMsg,
                  parse_mode: 'HTML',
                  reply_markup: JSON.stringify({
                    inline_keyboard: [[{ text: '🚀 Open Vendor Dashboard', web_app: { url: vendorUrl } }]]
                  })
                })
              });
            }
          } catch(e) { console.log('Vendor notify error:', e.message); }

          return res.json({ success: true, status: 'approved' });
        } catch(e) { return res.status(500).json({ error: e.message }); }
      }

      // Check vendor status
      if (path === '/api/vendors/check-status' && method === 'GET') {
        var qs = req.url?.split('?')[1] || '';
        var id = new URLSearchParams(qs).get('id') || '';
        var phone = new URLSearchParams(qs).get('phone') || '';
        try {
          var vendors = await getVendors();
          if (id) {
            var found = vendors.find(function(v) { return v.id == id || v.id === id; });
            return res.json({ status: found?.status || 'none' });
          }
          if (phone) {
            var found = vendors.find(function(v) { return v.phone == phone; });
            return res.json({ status: found?.status || 'none' });
          }
        } catch(e) {}
        return res.json({ status: 'none' });
      }

      // Get vendor applications
      if (path === '/api/vendors/applications' && method === 'GET') {
        var vendors = await getVendors();
        return res.json({ applications: vendors });
      }

      // List all vendors
      if (method === 'GET' && (path === '/api/vendors' || path === '/api/')) {
        var vendors = await getVendors();
        return res.json({ vendors: vendors || [] });
      }

      // Vendor registration
      if (method === 'POST' && path === '/api/vendors/register') {
        var v = {
          id: Date.now(),
          ...req.body,
          status: 'pending',
          joined_at: new Date().toISOString()
        };

        // Save to settings.data.vendors (persistent storage)
        try {
          var vendors = await getVendors();
          vendors.push(v);
          await saveVendors(vendors);
        } catch(se) { console.log('Vendor save error:', se.message); }

        // Send Telegram notification to admin
        try {
          var bc = adminChatId || '336997351';
          var bt = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
          var msg = '🆕 New Vendor Registration\n\nStore: ' + (req.body.name || 'N/A') + '\nPhone: ' + (req.body.phone || 'N/A') + '\n\nApprove: ' + (process.env.VERCEL_URL || 'smartshop-steel.vercel.app') + '/admin-panel';
          await fetch('https://api.telegram.org/bot' + bt + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: bc, text: msg })
          });
        } catch(e) { console.log('TG notify error:', e.message); }

        return res.json({ success: true, vendor: v });
      }

      // DELETE vendor - remove from list and notify vendor
      if (method === 'DELETE') {
        var vendorId = parseInt(path.split('/').pop() || '0');
        try {
          var vendors = await getVendors();
          var deletedVendor = null;
          var filtered = [];
          for (var i = 0; i < vendors.length; i++) {
            if (vendors[i].id == vendorId || vendors[i].id === String(vendorId)) {
              deletedVendor = vendors[i];
            } else {
              filtered.push(vendors[i]);
            }
          }
          await saveVendors(filtered);

          // Notify vendor that they were removed
          if (deletedVendor && deletedVendor.telegram_id) {
            var removeMsg = '⚠️ <b>Vendor Access Revoked</b>\n\n' +
              '━━━━━━━━━━━━━━━\n' +
              '🏪 <b>Store:</b> ' + (deletedVendor.name || 'Your store') + '\n' +
              '━━━━━━━━━━━━━━━\n\n' +
              'Your vendor access has been revoked by the admin. ' +
              'You can re-apply to become a vendor at any time.';
            await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: deletedVendor.telegram_id, text: removeMsg, parse_mode: 'HTML' })
            });
          }
          return res.json({ success: true, deleted: true });
        } catch(e) { return res.status(500).json({ error: e.message }); }
      }

      // Update vendor (PUT)
      if (method === 'PUT') {
        var vendorId = parseInt(path.split('/').pop() || '0');
        try {
          var vendors = await getVendors();
          for (var i = 0; i < vendors.length; i++) {
            if (vendors[i].id == vendorId) {
              vendors[i] = { ...vendors[i], ...req.body };
              break;
            }
          }
          await saveVendors(vendors);
        } catch(e) {}

        // Send notification to admin about status change
        try {
          var bc = adminChatId || '336997351';
          var bt = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
          var statusEmoji = req.body.status === 'approved' ? '✅' : req.body.status === 'rejected' ? '❌' : '⏸️';
          var msg = statusEmoji + ' *Vendor Status Updated*\n\nVendor ID: ' + vendorId + '\nNew Status: ' + (req.body.status || 'updated') + '\nCommission: ' + (req.body.commission || '10') + '%';
          await fetch('https://api.telegram.org/bot' + bt + '/sendMessage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: bc, text: msg, parse_mode: 'Markdown' })
          });
        } catch(e) {}

        return res.json({ success: true });
      }
    }

    // ================================================================
    // ANALYTICS
    // ================================================================
    if (path === '/api/analytics') {
      var { data: products } = await supabase.from('products').select('*');
      var { data: orders } = await supabase.from('orders').select('*');
      var tp = products?.length || 0;
      var ts = products?.reduce(function(s, p) { return s + (p.sold_count || 0); }, 0) || 0;
      var tor = orders?.length || 0;
      var tr = orders?.reduce(function(s, o) { return s + (o.total || 0); }, 0) || 0;
      var po = orders?.filter(function(o) { return o.status === 'pending'; }).length || 0;
      var so = orders?.filter(function(o) { return o.status === 'shipped'; }).length || 0;
      var top = [...(products || [])].sort(function(a, b) { return (b.sold_count || 0) - (a.sold_count || 0); }).slice(0, 5).map(function(p) { return { name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }; });
      return res.json({ analytics: { totalProducts: tp, totalSold: ts, totalRevenue: tr, totalOrders: tor, pendingOrders: po, shippedOrders: so, topProducts: top } });
    }

    // ================================================================
    // USERS
    // ================================================================
    if (path === '/api/users' && method === 'GET') { var { data } = await supabase.from('users').select('*'); return res.json({ success: true, users: data || [] }); }
    if (path === '/api/users/register' && method === 'POST') { var { data } = await supabase.from('users').insert(req.body).select().single(); return res.json({ success: true, user: data || req.body }); }

    // ================================================================
    // AFFILIATES
    // ================================================================
    if (path === '/api/affiliates' && method === 'GET') { var { data } = await supabase.from('products').select('*').eq('visible', true); return res.json({ products: (data || []).map(normalizeProduct) }); }
    if (path === '/api/affiliates/with-products' && method === 'GET') { var { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4); return res.json({ products: (data || []).map(normalizeProduct) }); }

    // ================================================================
    // REVIEWS
    // ================================================================
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') { var pid = (req.url?.split('?')[1] || '').split('&').find(function(s) { return s.startsWith('productId='); })?.split('=')[1]; var q = supabase.from('reviews').select('*'); if (pid) q = q.eq('product_id', parseInt(pid)); var { data } = await q.order('created_at', { ascending: false }); return res.json({ reviews: data || [] }); }
      if (method === 'POST') { var { data } = await supabase.from('reviews').insert(req.body).select().single(); return res.json({ success: true, review: data }); }
    }

    // ================================================================
    // BROADCAST
    // ================================================================
    if (path === '/api/broadcast' && method === 'POST') { return res.json({ success: true, sent: 1, total: 1 }); }

    // ================================================================
    // PRE-ORDERS
    // ================================================================
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { var { data } = await supabase.from('pre_orders').select('*'); return res.json({ preOrders: data || [] }); }
      if (method === 'POST') { var { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return res.json({ success: true, preOrder: data }); }
    }

    // ================================================================
    // CURRENCY
    // ================================================================
    if (path === '/api/currency/rates' && method === 'GET') { return res.json({ rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' }); }

    // ================================================================
    // RECEIPTS
    // ================================================================
    if (path.startsWith('/api/receipts/') && method === 'GET') { var on = path.replace('/api/receipts/', ''); return res.json({ success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } }); }

    // ================================================================
    // FLASH DEALS
    // ================================================================
    if (path === '/api/flash-deals' && method === 'GET') { var { data: flashRow } = await supabase.from('settings').select('*').single(); var fs = flashRow?.data?.flashSales || {}; return res.json({ deals: Object.entries(fs).map(function(e) { return { id: parseInt(e[0]), productId: parseInt(e[0]), ...e[1] }; }) }); }

    // ================================================================
    // TRACKING
    // ================================================================
    if (path.startsWith('/api/tracking/')) {
      var on = path.replace('/api/tracking/', '');
      if (method === 'GET') { var { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return res.json({ success: true, tracking: data?.tracking || null }); }
      if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return res.json({ success: true }); }
    }

    // ================================================================
    // UPLOAD
    // ================================================================
    if (path === '/api/upload' && method === 'POST') {
      return res.json({ url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image+Uploaded' });
    }

    // ================================================================
    // SEED / HEALTH
    // ================================================================
    if (path === '/api/seed' && method === 'GET') {
      var { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
      var { data: telegramUsers } = await supabase.from('users').select('*');
      var vendors = await getVendors();
      return res.json({ products: count || 0, telegramUsers: telegramUsers?.length || 0, vendors: vendors.length, message: 'Smart Shop API running on Vercel!' });
    }

    // ================================================================
    // ADMIN BOT — Send file to Telegram
    // ================================================================
    if (path === '/api/admin-bot/send-file' && method === 'POST') {
      if (!ADMIN_BOT_TOKEN) return res.status(200).json({ sent: false, error: 'No bot token' });
      var { chatId, filename, content, contentType, caption } = req.body || {};
      if (!chatId || !content) return res.status(400).json({ error: 'chatId and content required' });
      try {
        var fileBuffer;
        var actualContentType = contentType || 'text/plain';
        var actualFilename = filename || 'file.txt';

        if (typeof content === 'string' && content.startsWith('data:')) {
          var metaParts = content.split(';base64,');
          if (metaParts.length === 2) {
            actualContentType = metaParts[0].replace('data:', '');
            var ext = actualContentType.includes('jpeg') ? 'jpg' : actualContentType.includes('png') ? 'png' : 'csv';
            actualFilename = 'receipt-' + Date.now().toString(36) + '.' + ext;
            fileBuffer = Buffer.from(metaParts[1], 'base64');
          } else {
            fileBuffer = Buffer.from(content);
          }
        } else {
          fileBuffer = Buffer.from(typeof content === 'string' ? content : JSON.stringify(content));
        }

        var formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('document', new Blob([fileBuffer], { type: actualContentType }), actualFilename);
        if (caption) formData.append('caption', caption);

        var result = await fetch('https://api.telegram.org/bot' + ADMIN_BOT_TOKEN + '/sendDocument', {
          method: 'POST',
          body: formData,
        });
        var data = await result.json();
        return res.json({ sent: data.ok === true, description: data.description });
      } catch (e) {
        return res.json({ sent: false, error: e.message });
      }
    }

    // ================================================================
    // COMMISSION - Calculate
    // ================================================================
    if (path === '/api/commission/calculate' && method === 'POST') {
      var { productId, price, vendorId, category } = req.body || {};
      var { data: settingsData } = await supabase.from('settings').select('*').single();
      var s = settingsData?.data || {};
      var globalCommission = s.vendorCommission || 10;
      var categoryCommissions = s.categoryCommission || {};
      var vendorCommissions = s.vendorCommissionOverride || {};
      var commissionRate = globalCommission;
      var source = 'global';
      if (vendorId && vendorCommissions[vendorId]) { commissionRate = vendorCommissions[vendorId]; source = 'vendor_' + vendorId; }
      else if (category && categoryCommissions[category]) { commissionRate = categoryCommissions[category]; source = 'category_' + category; }
      var commissionAmount = Math.round((price || 0) * commissionRate / 100);
      var vendorPayout = (price || 0) - commissionAmount;
      return res.json({ commissionRate, commissionAmount, vendorPayout, source, productPrice: price || 0 });
    }

    // ================================================================
    // COMMISSION - Settings
    // ================================================================
    if (path === '/api/commission/settings' && method === 'GET') {
      var { data: settingsData } = await supabase.from('settings').select('*').single();
      var s = settingsData?.data || {};
      return res.json({ globalCommission: s.vendorCommission || 10, categoryCommission: s.categoryCommission || {}, vendorCommissionOverride: s.vendorCommissionOverride || {} });
    }

    // ================================================================
    // PAYMENT - Initiate Chapa Payment
    // ================================================================
    if (path === '/api/payment/initiate-chapa' && method === 'POST') {
      var { amount, email, firstName, lastName, phone, txRef, orderNumber } = req.body || {};
      if (!amount || !email || !phone) return res.status(400).json({ error: 'amount, email, and phone required' });

      var CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d0d6e765a19a5b19f4478b09a89ffd4cb42b5363';
      var BASE_URL = process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'https://smartshop-steel.vercel.app';

      try {
        var chapaRes = await fetch('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + CHAPA_SECRET_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: String(amount), currency: 'ETB', email,
            first_name: firstName || 'Customer', last_name: lastName || '',
            phone, tx_ref: txRef,
            callback_url: BASE_URL + '/api/payment/verify',
            return_url: BASE_URL + '/confirmation/' + orderNumber,
            customization: { title: 'Smart Shop Order #' + orderNumber, description: 'Payment for order ' + orderNumber },
          }),
        });
        var chapaData = await chapaRes.json();

        if (chapaData.status === 'success' && chapaData.data?.checkout_url) {
          return res.json({ success: true, checkout_url: chapaData.data.checkout_url, tx_ref: txRef });
        } else {
          return res.json({ success: false, error: chapaData.message || 'Chapa initialization failed' });
        }
      } catch (e) {
        return res.json({ success: false, error: e.message });
      }
    }

    // ================================================================
    // PAYMENT - Verify Chapa Payment
    // ================================================================
    if (path === '/api/payment/verify' && method === 'POST') {
      var { tx_ref } = req.body || {};
      if (!tx_ref) return res.status(400).json({ error: 'tx_ref required' });

      var CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-d0d6e765a19a5b19f4478b09a89ffd4cb42b5363';

      try {
        var verifyRes = await fetch('https://api.chapa.co/v1/transaction/verify/' + tx_ref, {
          headers: { 'Authorization': 'Bearer ' + CHAPA_SECRET_KEY },
        });
        var verifyData = await verifyRes.json();

        if (verifyData.status === 'success' && verifyData.data?.status === 'success') {
          return res.json({ status: 'completed', amount: verifyData.data.amount, reference: verifyData.data.reference || tx_ref, verified: true });
        } else {
          return res.json({ status: 'failed', error: verifyData.message || 'Payment not completed', verified: false });
        }
      } catch (e) {
        return res.json({ status: 'failed', error: e.message, verified: false });
      }
    }

    // ================================================================
    // PAYMENT - Initiate Telebirr
    // ================================================================
    if (path === '/api/payment/initiate-telebirr' && method === 'POST') {
      var { amount, phone, orderNumber } = req.body || {};
      if (!amount || !phone) return res.status(400).json({ error: 'amount and phone required' });

      return res.json({
        success: true,
        deepLink: 'telebirr://pay?amount=' + amount + '&order=' + orderNumber,
        ussdCode: '*847#' + amount + '#' + orderNumber,
        message: 'Payment initiated via Telebirr.',
      });
    }

    // ================================================================
    // PAYMENT - Transaction History
    // ================================================================
    if (path === '/api/payment/transactions' && method === 'GET') {
      var { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
      var txList = (orders || []).map(function(o) {
        return {
          id: o.id,
          orderNumber: o.order_number,
          amount: o.total || 0,
          paymentMethod: o.payment_method || 'telebirr',
          status: o.status || 'pending',
          customerName: o.customer?.name || 'Unknown',
          date: o.created_at || o.date,
        };
      });
      return res.json({ transactions: txList });
    }

    // ================================================================
    // TAX - Calculate Tax Breakdown
    // ================================================================
    if (path === '/api/tax/calculate' && method === 'POST') {
      var { productPrice, deliveryFee, commissionRate } = req.body || {};
      var rate = (commissionRate || 15) / 100;
      var basePrice = productPrice || 0;
      var fee = deliveryFee || 0;
      var commissionAmount = Math.round(basePrice * rate);
      var gatewayFee = Math.round(basePrice * 0.025);
      var vatOnCommission = Math.round(commissionAmount * 0.15);
      var withholdingTax = Math.round(basePrice * 0.02);
      var vendorPayout = basePrice - commissionAmount - gatewayFee - withholdingTax;
      var totalPaid = basePrice + fee + vatOnCommission;

      return res.json({
        basePrice, deliveryFee: fee, commissionRate: rate, commissionAmount,
        gatewayFee, vatOnCommission, withholdingTax, vendorPayout, totalPaid,
        vatRate: 0.15, withholdingTaxRate: 0.02,
        totalTaxToRemit: vatOnCommission + withholdingTax,
        shopRevenue: commissionAmount - gatewayFee,
      });
    }

    // ================================================================
    // TAX - Generate Receipt
    // ================================================================
    if (path === '/api/tax/receipt' && method === 'POST') {
      var { orderNumber } = req.body || {};
      if (!orderNumber) return res.status(400).json({ error: 'orderNumber required' });

      var { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
      if (!order) return res.status(404).json({ error: 'Order not found' });

      return res.json({
        success: true,
        receiptNumber: 'SS-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 90000 + 10000),
        orderNumber: order.order_number,
        generatedAt: new Date().toISOString(),
        html: '<html><body><h1>Tax Receipt</h1><p>Order: ' + orderNumber + '</p></body></html>',
      });
    }

    // ================================================================
    // TAX - Monthly Report
    // ================================================================
    if (path === '/api/tax/monthly-report' && method === 'GET') {
      var { data: orders } = await supabase.from('orders').select('*');
      var total = (orders || []).reduce(function(s, o) { return s + (o.total || 0); }, 0);
      var count = (orders || []).length;
      var commission = Math.round(total * 0.1);
      var vat = Math.round(commission * 0.15);
      var wht = Math.round(total * 0.02);

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

    // ================================================================
    // VENDOR - Send Telegram Notification
    // ================================================================
    if (path === '/api/vendor/notify' && method === 'POST') {
      var { telegramId, type, message } = req.body || {};
      if (!telegramId || !message) return res.status(400).json({ success: false, error: 'telegramId and message required' });

      var emoji = type === 'payout' ? '💰' : type === 'order' ? '📦' : type === 'promo' ? '🎉' : type === 'test' ? '🔔' : '📢';

      try {
        var tgRes = await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: telegramId,
            text: emoji + ' *Smart Shop Notification*\n\n' + message,
            parse_mode: 'Markdown',
          }),
        });
        var tgData = await tgRes.json();
        if (tgData.ok) {
          return res.json({ success: true });
        } else {
          return res.json({ success: false, error: tgData.description || 'Telegram error' });
        }
      } catch (e) {
        return res.json({ success: false, error: e.message });
      }
    }

    // ================================================================
    // FALLBACK
    // ================================================================
    return res.status(404).json({ error: 'Not found', path: path, method: method });

  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
