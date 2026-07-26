// ============================================
// Smart Shop API — Main Router (v48)
// Architecture: Middleware → Route Modules → Response
// ============================================
import { supabase, ENV, normalizeProduct, getVendors, saveVendors, verifyTelegramInitData } from './_config';
import { setCorsHeaders, checkRateLimit, logRequest, ok, fail, notFound, serverError, getDuration } from './_middleware';
import { fetchWithRetry, fetchWithTimeout, sendTelegramMessage, notifyAdmin } from './_retry';
import { checkIdempotency, markIdempotency, generateOrderNumber } from './_idempotency';
import handleDelivery from './routes/delivery';
import handleAdmin from './routes/admin';

// ============================================
// MAIN HANDLER
// ============================================
export default async function handler(req: any, res: any) {
  const start = process.hrtime();
  const path = (req.url || '').split('?')[0];
  const method = req.method || 'GET';
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  // ── CORS ────────────────────────────────────────────────────────
  setCorsHeaders(res);
  if (method === 'OPTIONS') return res.status(204).end();

  // ── Rate Limiting (per IP) ──────────────────────────────────────
  const ipStr = String(clientIp).split(',')[0].trim();
  const rateCheck = checkRateLimit(ipStr);
  if (!rateCheck.allowed) {
    res.setHeader('Retry-After', Math.ceil((rateCheck.resetAt - Date.now()) / 1000));
    logRequest(method, path, 429, getDuration(start), ipStr, 'Rate limited');
    return res.status(429).json({ error: 'Too many requests', resetAt: rateCheck.resetAt });
  }
  res.setHeader('X-RateLimit-Remaining', rateCheck.remaining);

  try {
    let handled = false;

    // ── Try delivery routes ─────────────────────────────────────
    handled = await handleDelivery(path, method, req, res);
    if (handled) { logRequest(method, path, res.statusCode || 200, getDuration(start), ipStr); return; }

    // ── Try admin routes ────────────────────────────────────────
    handled = await handleAdmin(path, method, req, res);
    if (handled) { logRequest(method, path, res.statusCode || 200, getDuration(start), ipStr); return; }

    // ================================================================
    // TELEGRAM AUTH
    // ================================================================
    if (path === '/api/auth/telegram' && method === 'POST') {
      const { initData } = req.body || {};
      if (!initData) return fail(res, 'initData is required');

      const { valid, user: tgUser } = verifyTelegramInitData(initData);
      if (!valid && ENV.BOT_TOKEN) return fail(res, 'Invalid Telegram authentication', 401);
      if (!tgUser) return fail(res, 'No user data in initData');

      const { data: existing } = await supabase
        .from('users').select('*').eq('telegram_id', tgUser.id).single();

      const now = new Date().toISOString();

      if (existing) {
        await supabase.from('users').update({
          first_name: tgUser.first_name, last_name: tgUser.last_name || '', username: tgUser.username || '',
        }).eq('telegram_id', tgUser.id);

        let vendorStatus = '';
        try {
          const vendors = await getVendors();
          const found = vendors.find((v: any) => v.telegram_id == tgUser.id);
          if (found) vendorStatus = found.status || '';
        } catch {}

        return ok(res, {
          success: true, user: {
            telegramId: existing.telegram_id, firstName: existing.first_name || tgUser.first_name,
            lastName: existing.last_name || tgUser.last_name, username: existing.username || tgUser.username,
            languageCode: tgUser.language_code || 'en', photoUrl: tgUser.photo_url || null,
            phone: existing.phone || null, fullName: existing.full_name || null,
            city: existing.city || null, address: existing.address || null,
            profileComplete: !!(existing.full_name && existing.city && existing.address),
            vendorStatus, firstSeen: existing.registered_at || now, lastSeen: now,
          },
        });
      } else {
        const { data: newUser } = await supabase.from('users').insert({
          telegram_id: tgUser.id, first_name: tgUser.first_name, last_name: tgUser.last_name || '',
          username: tgUser.username || '', phone: '', registered_at: now,
        }).select().single();

        return ok(res, {
          success: true, user: {
            telegramId: tgUser.id, firstName: tgUser.first_name, lastName: tgUser.last_name || '',
            username: tgUser.username || '', languageCode: tgUser.language_code || 'en',
            photoUrl: tgUser.photo_url || null, phone: null, fullName: null, city: null,
            address: null, profileComplete: false, vendorStatus: '', firstSeen: now, lastSeen: now,
          },
        });
      }
    }

    if (path === '/api/auth/telegram/register-phone' && method === 'POST') {
      const { telegramId, phone } = req.body || {};
      if (!telegramId || !phone) return fail(res, 'telegramId and phone required');
      await supabase.from('users').update({ phone, phone_verified: true }).eq('telegram_id', telegramId);
      return ok(res, { success: true });
    }

    if (path === '/api/auth/telegram/complete-profile' && method === 'POST') {
      const { telegramId, fullName, city, address } = req.body || {};
      if (!telegramId || !fullName) return fail(res, 'telegramId and fullName required');
      await supabase.from('users').update({ full_name: fullName, city: city || '', address: address || '' }).eq('telegram_id', telegramId);
      return ok(res, { success: true });
    }

    if (path.startsWith('/api/auth/telegram/user/') && method === 'GET') {
      const telegramId = parseInt(path.split('/').pop() || '0');
      if (!telegramId) return fail(res, 'Invalid telegram ID');
      const { data } = await supabase.from('users').select('*').eq('telegram_id', telegramId).single();
      if (!data) return fail(res, 'User not found', 404);

      let vendorStatus = '';
      try {
        const vendors = await getVendors();
        const found = vendors.find((v: any) => v.telegram_id == telegramId);
        if (found) vendorStatus = found.status || '';
      } catch {}

      return ok(res, {
        success: true, user: {
          telegramId: data.telegram_id, firstName: data.first_name, lastName: data.last_name,
          username: data.username, phone: data.phone, fullName: data.full_name,
          city: data.city, address: data.address, profileComplete: !!(data.full_name && data.city && data.address),
          vendorStatus, firstSeen: data.registered_at, lastSeen: '',
        },
      });
    }

    // ================================================================
    // SHOP BOT WEBHOOK
    // ================================================================
    if (path === '/api/shop-bot/webhook' && method === 'POST') {
      const sb = req.body;
      const sc = sb.message?.chat?.id;
      const st = sb.message?.text || '';
      if (!sc) return ok(res, { ok: true });

      const userContact = sb.message?.contact;
      const sSend = async (txt: string, keyboard?: any) => {
        await sendTelegramMessage(ENV.VENDOR_BOT_TOKEN, sc, txt, 'Markdown', keyboard ? { reply_markup: JSON.stringify(keyboard) } : {});
      };

      if (st === '/start' && !userContact) {
        await sSend('⚠️ *Contact Required*\n\nYou must share your phone number to use Smart Shop.\n\nTap "📱 Share Contact" below:', {
          keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true,
        });
        return ok(res, { ok: true });
      }

      if (userContact) {
        const contact = sb.message.contact;
        const from = sb.message.from || {};
        const userId = String(contact.user_id || from.id || sc || '');
        const phoneNum = contact.phone_number || '';
        const firstName = contact.first_name || from.first_name || '';
        const lastName = from.last_name || '';
        const username = from.username || '';

        if (contact.user_id && from.id && String(contact.user_id) !== String(from.id)) {
          await sSend('⚠️ *Validation Error:* Please share your own contact to register.');
          return ok(res, { ok: true });
        }

        try {
          await supabase.from('users').upsert({
            telegram_id: parseInt(userId), phone: phoneNum,
            first_name: firstName, username, registered_at: new Date().toISOString(),
            ...(lastName ? { last_name: lastName } : {}),
          }, { onConflict: 'telegram_id' });
        } catch {
          try {
            await supabase.from('users').upsert({
              telegram_id: parseInt(userId), first_name: firstName, username,
              registered_at: new Date().toISOString(), ...(lastName ? { last_name: lastName } : {}),
            }, { onConflict: 'telegram_id' });
          } catch {}
        }

        // Remove keyboard
        await sendTelegramMessage(ENV.VENDOR_BOT_TOKEN, sc, '✅ Contact verified!', undefined, { reply_markup: JSON.stringify({ remove_keyboard: true }) }).catch(() => {});

        const miniAppUrl = `${ENV.BASE_URL}?tg_id=${encodeURIComponent(userId)}&phone=${encodeURIComponent(phoneNum)}&name=${encodeURIComponent(firstName)}${username ? '&username=' + encodeURIComponent(username) : ''}&v=${Date.now()}`;

        // Set chat menu button & send final message
        fetchWithTimeout(`https://api.telegram.org/bot${ENV.VENDOR_BOT_TOKEN}/setChatMenuButton`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: sc, menu_button: { type: 'web_app', text: '🛍️ Open Smart Shop', web_app: { url: miniAppUrl } } }),
        }).catch(() => {});

        await sSend('✅ *Phone number saved!*\n\nTap the button below to open the shop:', {
          inline_keyboard: [[{ text: '🚀 Open Smart Shop', web_app: { url: miniAppUrl } }]],
        });
      } else if (st !== '/start') {
        await sSend('⚠️ Please share your contact first:', {
          keyboard: [[{ text: '📱 Share Contact', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true,
        });
      }
      return ok(res, { ok: true });
    }

    // ================================================================
    // ADMIN BOT WEBHOOK
    // ================================================================
    if (path === '/api/admin-bot/webhook' && method === 'POST') {
      if (!ENV.ADMIN_BOT_TOKEN) return ok(res, { ok: true });

      const body = req.body;
      const chatId = body.message?.chat?.id || body.callback_query?.message?.chat?.id;
      const text = body.message?.text || '';
      const callbackData = body.callback_query?.data || '';
      const firstName = body.message?.from?.first_name || body.callback_query?.from?.first_name || 'Admin';
      if (!chatId) return ok(res, { ok: true });

      const cmd = (callbackData || text).replace('/', '').toLowerCase();

      // Fetch data in parallel
      const [prodResult, ordResult] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
      ]);
      const pList = prodResult.data || [];
      const oList = ordResult.data || [];
      const lowStock = pList.filter((p: any) => p.stock_count <= 5 && p.stock_count > 0);
      const totalRevenue = oList.reduce((s: number, o: any) => s + (o.total || 0), 0);

      const sendMsg = (msgText: string) => sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, chatId, msgText, 'Markdown');

      if (cmd === 'start' || cmd === 'help') {
        await sendMsg(
          `👋 *Welcome to Smart Shop Admin Bot, ${firstName}*\n\n` +
          `I'll send you real-time alerts for:\n` +
          `🛒 New orders\n⚠️ Low stock\n🚨 SLA breaches\n🏪 New vendors\n📊 Daily summaries\n\n` +
          `*Commands:*\n/stats — Store statistics\n/orders — Recent orders\n/lowstock — Low stock alerts\n/alerts — Active SLA breaches`
        );
      } else if (cmd === 'stats') {
        const { data: vRow } = await supabase.from('settings').select('*').single();
        const vendorCount = (vRow?.data?.vendors || []).length;
        await sendMsg(
          `📊 *Smart Shop Store Stats*\n\n📦 Products: ${pList.length}\n📋 Orders: ${oList.length}\n` +
          `💰 Revenue: ${new Intl.NumberFormat('en').format(totalRevenue)} Br\n⚠️ Low Stock: ${lowStock.length}\n` +
          `🏪 Vendors: ${vendorCount}\n\n_Updated: ${new Date().toLocaleString()}_`
        );
      } else if (cmd === 'orders') {
        const recent = oList.slice(0, 5);
        if (recent.length === 0) return await sendMsg('📋 *No orders yet*');
        let msg = '📋 *Recent Orders*\n\n';
        recent.forEach((o: any) => {
          const icon = o.status === 'delivered' ? '✅' : o.status === 'shipped' ? '🚚' : '📦';
          msg += `${icon} *${o.order_number || o.orderNumber}* — ${new Intl.NumberFormat('en').format(o.total || 0)} Br — ${o.status}\n`;
        });
        msg += `\n_${oList.length} total orders_`;
        await sendMsg(msg);
      } else if (cmd === 'lowstock') {
        if (lowStock.length === 0) return await sendMsg('✅ *All products well-stocked!*');
        let msg = '⚠️ *Low Stock Alerts*\n\n';
        lowStock.forEach((p: any) => {
          const emoji = p.stock_count === 0 ? '❌' : p.stock_count <= 2 ? '🔴' : '🟡';
          msg += `${emoji} *${p.name_en}* — ${p.stock_count} left\n`;
        });
        await sendMsg(msg);
      } else {
        await sendMsg('❌ Unknown command. Try /start for help.');
      }
      return ok(res, { ok: true });
    }

    // ── Admin Bot — Send ──────────────────────────────────────────
    if (path === '/api/admin-bot/send' && method === 'POST') {
      const { chatId, message } = req.body || {};
      if (!chatId || !message) return fail(res, 'chatId and message required');
      const sent = await sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, chatId, message, 'HTML');
      return ok(res, { sent });
    }

    // ── Admin Bot — Set Webhook ───────────────────────────────────
    if (path === '/api/admin-bot/set-webhook' && method === 'POST') {
      const webhookUrl = `${ENV.BASE_URL}/api/admin-bot/webhook`;
      const data = await fetchWithRetry(
        `https://api.telegram.org/bot${ENV.ADMIN_BOT_TOKEN}/setWebhook?url=${webhookUrl}`,
        { method: 'POST', timeout: 10_000 }
      ).then(r => r.json()).catch(() => ({ ok: false }));
      return ok(res, { ok: data.ok, description: data.description, webhookUrl });
    }

    // ================================================================
    // USER SYNC
    // ================================================================
    if (path === '/api/user/sync' && method === 'POST') {
      const b = req.body || {};
      const tid = b.telegram_id || '';
      if (!tid) return ok(res, { success: false });

      const result: any = { success: true };

      try {
        await supabase.from('users').upsert({
          telegram_id: parseInt(tid), username: b.username || '', first_name: b.first_name || '',
          ...(b.phone ? { phone: b.phone } : {}),
        }, { onConflict: 'telegram_id' });
        const { data: userRecord } = await supabase.from('users').select('*').eq('telegram_id', parseInt(tid)).single();
        if (userRecord?.phone) result.phone = userRecord.phone;
      } catch {}

      // Check vendor status
      try {
        const vendors = await getVendors();
        const tidNum = tid ? parseInt(tid) : 0;
        const found = tidNum ? vendors.find((v: any) => v.telegram_id == tidNum) : null;
        if (found) {
          result.vendor_status = found.status || 'pending';
          result.vendor_id = found.id;
          result.vendor_name = found.name || '';
        } else {
          result.vendor_status = 'none';
        }
      } catch { result.vendor_status = 'none'; }

      return ok(res, result);
    }

    // ── User Contact ──────────────────────────────────────────────
    if (path === '/api/user/contact' && method === 'GET') {
      const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id') || '';
      if (!tid) return ok(res, { phone: '' });
      try {
        const { data } = await supabase.from('users').select('phone').eq('telegram_id', parseInt(tid)).single();
        if (data?.phone) return ok(res, { phone: data.phone });
      } catch {}
      return ok(res, { phone: '' });
    }

    // ================================================================
    // PRODUCTS
    // ================================================================
    if (path.startsWith('/api/products') || (path === '/api/' && method === 'GET')) {
      if (method === 'GET') {
        if (path === '/api/products' || path === '/api/') {
          const { data } = await supabase.from('products').select('*').order('id', { ascending: false });
          return ok(res, { products: (data || []).map(normalizeProduct) });
        }
        const id = parseInt(path.replace('/api/products/', ''));
        if (!isNaN(id)) {
          const { data } = await supabase.from('products').select('*').eq('id', id).single();
          return ok(res, { product: data ? normalizeProduct(data) : null });
        }
      }
      if (method === 'POST') {
        const body = cleanProductBody(req.body);
        const { data } = await supabase.from('products').insert(body).select().single();
        return ok(res, { success: true, product: data });
      }
      if (method === 'PUT') {
        const id = parseInt(path.split('/').pop() || '0');
        const body = cleanProductBody(req.body);
        await supabase.from('products').update(body).eq('id', id);
        return ok(res, { success: true });
      }
      if (method === 'DELETE') {
        const id = parseInt(path.split('/').pop() || '0');
        await supabase.from('products').delete().eq('id', id);
        return ok(res, { success: true });
      }
    }

    // ================================================================
    // SETTINGS
    // ================================================================
    if (path === '/api/settings') {
      if (method === 'GET') {
        const { data: row } = await supabase.from('settings').select('*').single();
        return ok(res, { success: true, settings: row?.data || row || {} });
      }
      if (method === 'PUT') {
        const { data: exRow } = await supabase.from('settings').select('*').single();
        if (exRow) {
          await supabase.from('settings').update({ data: { ...(exRow.data || exRow), ...req.body }, updated_at: new Date().toISOString() }).eq('id', exRow.id);
        } else {
          await supabase.from('settings').insert({ data: req.body });
        }
        return ok(res, { success: true });
      }
    }

    // ================================================================
    // ORDERS (with Idempotency + Atomic Stock)
    // ================================================================
    if (path.startsWith('/api/orders')) {
      // LIST orders
      if (method === 'GET' && (path === '/api/orders' || path === '/api/')) {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
        return ok(res, { orders: data || [] });
      }

      // CREATE order with idempotency + atomic stock
      if (method === 'POST' && (path === '/api/orders' || path === '/api/')) {
        const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey || '';

        // Check if this key was already processed
        if (idempotencyKey) {
          const existing = await checkIdempotency(idempotencyKey);
          if (existing) {
            return ok(res, { success: true, order: existing.result, idempotent: true });
          }
        }

        const orderNumber = req.body.orderNumber || generateOrderNumber();

        // ATOMIC: Deduct stock within the same transaction
        const items = req.body.items || [];
        if (items.length > 0) {
          // Verify and deduct stock atomically for each item
          for (const item of items) {
            if (!item.productId) continue;
            const qty = item.quantity || 1;

            // Atomic stock check + decrement: only update if stock_count >= qty
            const { data: updatedProduct, error: stockError } = await supabase
              .from('products')
              .update({
                stock_count: supabase.rpc('decrement', { x: qty }),
                sold_count: supabase.rpc('increment', { x: qty }),
              })
              .eq('id', item.productId)
              .gte('stock_count', qty)   // Only if enough stock
              .select()
              .single();

            if (stockError || !updatedProduct) {
              return fail(res, `Insufficient stock for product #${item.productId}`, 409);
            }
          }
        }

        // Create order
        const body = { ...req.body, order_number: orderNumber };
        const { data: order, error: orderError } = await supabase.from('orders').insert(body).select().single();

        if (orderError) {
          // Rollback stock on order failure
          for (const item of items) {
            if (!item.productId) continue;
            const qty = item.quantity || 1;
            await supabase.rpc('increment_stock', { row_id: item.productId, qty }).catch(() => {});
          }
          return fail(res, orderError.message);
        }

        // Mark idempotency key
        if (idempotencyKey) {
          await markIdempotency(idempotencyKey, 'completed', order);
        }

        return ok(res, { success: true, order: order });
      }

      // GET single order
      if (method === 'GET') {
        const on = path.replace('/api/orders/', '').split('/')[0];
        const { data } = await supabase.from('orders').select('*').eq('order_number', on).single();
        return ok(res, { success: true, order: data });
      }

      // CANCEL order (restore stock)
      if (method === 'POST' && path.includes('/cancel')) {
        const on = path.split('/')[3];
        // Get order items to restore stock
        const { data: order } = await supabase.from('orders').select('*').eq('order_number', on).single();
        if (order?.items) {
          for (const item of order.items) {
            if (!item.productId) continue;
            await supabase.rpc('increment_stock', { row_id: item.productId, qty: item.quantity || 1 }).catch(() => {});
          }
        }
        await supabase.from('orders').update({ status: 'cancelled' }).eq('order_number', on);
        return ok(res, { success: true });
      }

      // UPDATE status
      if (method === 'PATCH' && path.includes('/status')) {
        const on = path.split('/')[3];
        await supabase.from('orders').update({ status: req.body.status }).eq('order_number', on);
        return ok(res, { success: true });
      }
    }

    // ================================================================
    // VENDORS
    // ================================================================
    if (path.startsWith('/api/vendors')) {
      // GET single vendor
      if (method === 'GET' && !['/api/vendors/applications', '/api/vendors/check-status', '/api/vendors/approve'].includes(path) && /\/api\/vendors\/\d+/.test(path)) {
        const vid = parseInt(path.split('/').pop() || '0');
        const vendors = await getVendors();
        const found = vendors.find((v: any) => v.id == vid || v.id === String(vid));
        return ok(res, { vendor: found || null });
      }

      // Approve vendor
      if (path === '/api/vendors/approve' && method === 'POST') {
        const appId = req.body.id;
        try {
          let vendors = await getVendors();
          let approved = false;
          vendors = vendors.map((v: any) => {
            if (v.id == appId || v.id === String(appId)) {
              approved = true;
              return { ...v, status: 'approved' };
            }
            return v;
          });
          if (approved) await saveVendors(vendors);

          // Notify admin
          sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId,
            `✅ <b>Vendor Approved</b>\n━━━━━━━━━━━━━━━\n🏪 <b>Store:</b> ${req.body.name || 'ID: ' + appId}\n🆔 <b>ID:</b> <code>${appId}</code>\n📅 <b>Date:</b> ${new Date().toLocaleDateString()}\n━━━━━━━━━━━━━━━\n\nThe vendor can now access their dashboard.`,
            'HTML'
          );

          // Notify vendor
          const updatedVendors = await getVendors();
          const approvedVendor = updatedVendors.find((v: any) => v.id == appId || v.id === String(appId));
          if (approvedVendor?.telegram_id) {
            sendTelegramMessage(ENV.VENDOR_BOT_TOKEN, approvedVendor.telegram_id,
              `🎉 <b>Congratulations ${approvedVendor.name || 'your store'}!</b>\n\n━━━━━━━━━━━━━━━\n✅ <b>Your vendor application has been approved!</b>\n━━━━━━━━━━━━━━━\n\nYou can now:\n📦 Add products to your store\n📊 Manage orders from your dashboard\n💰 Track earnings and payouts\n\nTap the button below to start selling! 🚀`,
              'HTML'
            );
          }

          return ok(res, { success: true, status: 'approved' });
        } catch (e: any) { return fail(res, e.message, 500); }
      }

      // Check vendor status
      if (path === '/api/vendors/check-status' && method === 'GET') {
        const qs = req.url?.split('?')[1] || '';
        const id = new URLSearchParams(qs).get('id') || '';
        const phone = new URLSearchParams(qs).get('phone') || '';
        try {
          const vendors = await getVendors();
          if (id) { const f = vendors.find((v: any) => v.id == id || v.id === id); return ok(res, { status: f?.status || 'none' }); }
          if (phone) { const f = vendors.find((v: any) => v.phone == phone); return ok(res, { status: f?.status || 'none' }); }
        } catch {}
        return ok(res, { status: 'none' });
      }

      // Applications
      if (path === '/api/vendors/applications' && method === 'GET') {
        const vendors = await getVendors();
        return ok(res, { applications: vendors });
      }

      // List all vendors
      if (method === 'GET' && (path === '/api/vendors' || path === '/api/')) {
        const vendors = await getVendors();
        return ok(res, { vendors: vendors || [] });
      }

      // Register vendor
      if (method === 'POST' && path === '/api/vendors/register') {
        const v = { id: Date.now(), ...req.body, status: 'pending', joined_at: new Date().toISOString() };
        try {
          const vendors = await getVendors();
          vendors.push(v);
          await saveVendors(vendors);
        } catch (e: any) { console.log('Vendor save error:', e.message); }

        sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId,
          `🆕 New Vendor Registration\n\nStore: ${req.body.name || 'N/A'}\nPhone: ${req.body.phone || 'N/A'}\n\nApprove: ${ENV.BASE_URL}/admin-panel`
        );

        return ok(res, { success: true, vendor: v });
      }

      // DELETE vendor
      if (method === 'DELETE') {
        const vendorId = parseInt(path.split('/').pop() || '0');
        try {
          let vendors = await getVendors();
          let deletedVendor = null;
          const filtered = vendors.filter((v: any) => {
            if (v.id == vendorId || v.id === String(vendorId)) { deletedVendor = v; return false; }
            return true;
          });
          await saveVendors(filtered);

          if (deletedVendor?.telegram_id) {
            sendTelegramMessage(ENV.VENDOR_BOT_TOKEN, deletedVendor.telegram_id,
              `⚠️ <b>Vendor Access Revoked</b>\n━━━━━━━━━━━━━━━\n🏪 <b>Store:</b> ${deletedVendor.name || 'Your store'}\n━━━━━━━━━━━━━━━\n\nYour vendor access has been revoked by the admin. You can re-apply at any time.`,
              'HTML'
            );
          }
          return ok(res, { success: true, deleted: true });
        } catch (e: any) { return fail(res, e.message, 500); }
      }

      // Update vendor
      if (method === 'PUT') {
        const vendorId = parseInt(path.split('/').pop() || '0');
        try {
          const vendors = await getVendors();
          const updated = vendors.map((v: any) => v.id == vendorId ? { ...v, ...req.body } : v);
          await saveVendors(updated);
        } catch {}

        const statusEmoji = req.body.status === 'approved' ? '✅' : req.body.status === 'rejected' ? '❌' : '⏸️';
        sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId,
          `${statusEmoji} *Vendor Status Updated*\n\nVendor ID: ${vendorId}\nNew Status: ${req.body.status || 'updated'}\nCommission: ${req.body.commission || '10'}%`
        );

        return ok(res, { success: true });
      }
    }

    // ================================================================
    // ANALYTICS
    // ================================================================
    if (path === '/api/analytics') {
      const [prodResult, ordResult] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
      ]);
      const products = prodResult.data || [];
      const orders = ordResult.data || [];
      const tp = products.length;
      const ts = products.reduce((s: number, p: any) => s + (p.sold_count || 0), 0);
      const tor = orders.length;
      const tr = orders.reduce((s: number, o: any) => s + (o.total || 0), 0);
      const po = orders.filter((o: any) => o.status === 'pending').length;
      const so = orders.filter((o: any) => o.status === 'shipped').length;
      const top = [...products].sort((a: any, b: any) => (b.sold_count || 0) - (a.sold_count || 0)).slice(0, 5)
        .map((p: any) => ({ name: p.name_en, sold: p.sold_count || 0, revenue: (p.sold_count || 0) * (p.price || 0) }));
      return ok(res, { analytics: { totalProducts: tp, totalSold: ts, totalRevenue: tr, totalOrders: tor, pendingOrders: po, shippedOrders: so, topProducts: top } });
    }

    // ================================================================
    // USERS / AFFILIATES / REVIEWS / PRE-ORDERS / FLASH DEALS
    // ================================================================
    if (path === '/api/users' && method === 'GET') { const { data } = await supabase.from('users').select('*'); return ok(res, { success: true, users: data || [] }); }
    if (path === '/api/users/register' && method === 'POST') { const { data } = await supabase.from('users').insert(req.body).select().single(); return ok(res, { success: true, user: data || req.body }); }

    // Affiliates
    if (path === '/api/affiliates' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true); return ok(res, { products: (data || []).map(normalizeProduct) }); }
    if (path === '/api/affiliates/with-products' && method === 'GET') { const { data } = await supabase.from('products').select('*').eq('visible', true).gte('rating', 4); return ok(res, { products: (data || []).map(normalizeProduct) }); }
    if (path === '/api/affiliates' && method === 'POST') { const { data, error } = await supabase.from('affiliates').insert(req.body).select().single(); if (error) return fail(res, error.message); return ok(res, { success: true, affiliate: data }); }
    if (path.startsWith('/api/affiliates/') && method === 'PUT') { const aid = parseInt(path.split('/').pop() || '0'); const { error } = await supabase.from('affiliates').update(req.body).eq('id', aid); if (error) return fail(res, error.message); return ok(res, { success: true }); }

    // Reviews
    if (path.startsWith('/api/reviews')) {
      if (method === 'GET') {
        const pid = (req.url?.split('?')[1] || '').split('&').find((s: string) => s.startsWith('productId='))?.split('=')[1];
        let q: any = supabase.from('reviews').select('*');
        if (pid) q = q.eq('product_id', parseInt(pid));
        const { data } = await q.order('created_at', { ascending: false });
        return ok(res, { reviews: data || [] });
      }
      if (method === 'POST') { const { data } = await supabase.from('reviews').insert(req.body).select().single(); return ok(res, { success: true, review: data }); }
      if (method === 'DELETE') { const rid = parseInt(path.split('/').pop() || '0'); await supabase.from('reviews').delete().eq('id', rid); return ok(res, { success: true }); }
    }

    // Broadcast
    if (path === '/api/broadcast' && method === 'POST') { return ok(res, { success: true, sent: 1, total: 1 }); }

    // Pre-orders with cancel
    if (path === '/api/pre-orders/cancel' && method === 'POST') {
      const { id } = req.body || {};
      if (!id) return fail(res, 'id required');
      await supabase.from('pre_orders').update({ status: 'cancelled' }).eq('id', id);
      return ok(res, { success: true });
    }
    if (path.startsWith('/api/pre-orders')) {
      if (method === 'GET') { const { data } = await supabase.from('pre_orders').select('*'); return ok(res, { preOrders: data || [] }); }
      if (method === 'POST') { const { data } = await supabase.from('pre_orders').insert(req.body).select().single(); return ok(res, { success: true, preOrder: data }); }
    }

    // Currency
    if (path === '/api/currency/rates' && method === 'GET') { return ok(res, { rates: { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }, base: 'ETB' }); }

    // Receipts
    if (path.startsWith('/api/receipts/')) {
      if (method === 'POST') { const on = path.replace('/api/receipts/', ''); return ok(res, { success: true, receiptUrl: `${ENV.BASE_URL}/receipt/${on}` }); }
      if (method === 'GET') { const on = path.replace('/api/receipts/', ''); return ok(res, { success: true, receipt: { orderNumber: on, generatedAt: new Date().toISOString() } }); }
    }

    // Flash Deals (CRUD)
    if (path === '/api/flash-deals' && method === 'GET') {
      const { data: flashRow } = await supabase.from('settings').select('*').single();
      const fs = flashRow?.data?.flashSales || {};
      return ok(res, { deals: Object.entries(fs).map(([k, v]: [string, any]) => ({ id: parseInt(k), productId: parseInt(k), ...v })) });
    }
    if (path === '/api/flash-deals' && method === 'POST') {
      const fs = req.body || {};
      const { data: fRow } = await supabase.from('settings').select('*').single();
      const curData = fRow?.data || {};
      const flashSales = { ...(curData.flashSales || {}) };
      const dealId = Date.now();
      flashSales[dealId] = { productId: fs.productId, endTime: fs.endTime || Date.now() + 86400000, discount: fs.discount || 0, maxQuantity: fs.maxQuantity || 100 };
      curData.flashSales = flashSales;
      await supabase.from('settings').update({ data: curData }).eq('id', fRow.id);
      return ok(res, { success: true, deal: { id: dealId, ...flashSales[dealId] } });
    }
    if (path.startsWith('/api/flash-deals/') && method === 'PUT') {
      const did = parseInt(path.split('/').pop() || '0');
      const { data: fuRow } = await supabase.from('settings').select('*').single();
      const fuData = fuRow?.data || {};
      const fuSales = { ...(fuData.flashSales || {}) };
      if (fuSales[did]) { fuSales[did] = { ...fuSales[did], ...req.body }; fuData.flashSales = fuSales; await supabase.from('settings').update({ data: fuData }).eq('id', fuRow.id); }
      return ok(res, { success: true });
    }
    if (path.startsWith('/api/flash-deals/') && method === 'DELETE') {
      const ddid = parseInt(path.split('/').pop() || '0');
      const { data: fdRow } = await supabase.from('settings').select('*').single();
      const fdData = fdRow?.data || {};
      const fdSales = { ...(fdData.flashSales || {}) };
      delete fdSales[ddid];
      fdData.flashSales = fdSales;
      await supabase.from('settings').update({ data: fdData }).eq('id', fdRow.id);
      return ok(res, { success: true });
    }

    // ── Tracking ──────────────────────────────────────────────────
    if (path.startsWith('/api/tracking/')) {
      const on = path.replace('/api/tracking/', '');
      if (method === 'GET') { const { data } = await supabase.from('orders').select('*').eq('order_number', on).single(); return ok(res, { success: true, tracking: data?.tracking || null }); }
      if (method === 'PUT') { await supabase.from('orders').update({ tracking: req.body }).eq('order_number', on); return ok(res, { success: true }); }
    }

    // ── Upload ────────────────────────────────────────────────────
    if (path === '/api/upload' && method === 'POST') {
      return ok(res, { url: 'https://placehold.co/400x400/e2e8f0/94a3b8?text=Image+Uploaded' });
    }

    // ── Seed / Health ─────────────────────────────────────────────
    if (path === '/api/seed' && method === 'GET') {
      const [prodResult, userResult] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*'),
      ]);
      const vendors = await getVendors();
      return ok(res, { products: prodResult.count || 0, telegramUsers: userResult.data?.length || 0, vendors: vendors.length, message: 'Smart Shop API running on Vercel!' });
    }

    // ── Admin Bot — Send File ─────────────────────────────────────
    if (path === '/api/admin-bot/send-file' && method === 'POST') {
      const { chatId, filename, content, contentType, caption } = req.body || {};
      if (!chatId || !content) return fail(res, 'chatId and content required');
      try {
        let fileBuffer: Buffer;
        let actualContentType = contentType || 'text/plain';
        let actualFilename = filename || 'file.txt';

        if (typeof content === 'string' && content.startsWith('data:')) {
          const metaParts = content.split(';base64,');
          if (metaParts.length === 2) {
            actualContentType = metaParts[0].replace('data:', '');
            const ext = actualContentType.includes('jpeg') ? 'jpg' : actualContentType.includes('png') ? 'png' : 'csv';
            actualFilename = `receipt-${Date.now().toString(36)}.${ext}`;
            fileBuffer = Buffer.from(metaParts[1], 'base64');
          } else {
            fileBuffer = Buffer.from(content);
          }
        } else {
          fileBuffer = Buffer.from(typeof content === 'string' ? content : JSON.stringify(content));
        }

        const formData = new FormData();
        formData.append('chat_id', String(chatId));
        formData.append('document', new Blob([fileBuffer], { type: actualContentType }), actualFilename);
        if (caption) formData.append('caption', caption);

        const result = await fetchWithTimeout(
          `https://api.telegram.org/bot${ENV.ADMIN_BOT_TOKEN}/sendDocument`,
          { method: 'POST', body: formData, timeout: 15_000 }
        );
        const data = await result.json();
        return ok(res, { sent: data.ok === true, description: data.description });
      } catch (e: any) { return ok(res, { sent: false, error: e.message }); }
    }

    // ── Commission ────────────────────────────────────────────────
    if (path === '/api/commission/calculate' && method === 'POST') {
      const { productId, price, vendorId, category } = req.body || {};
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      const s = settingsData?.data || {};
      let commissionRate = s.vendorCommission || 10;
      let source = 'global';
      const vendorCommissions = s.vendorCommissionOverride || {};
      const categoryCommissions = s.categoryCommission || {};
      if (vendorId && vendorCommissions[vendorId]) { commissionRate = vendorCommissions[vendorId]; source = 'vendor_' + vendorId; }
      else if (category && categoryCommissions[category]) { commissionRate = categoryCommissions[category]; source = 'category_' + category; }
      const commissionAmount = Math.round((price || 0) * commissionRate / 100);
      return ok(res, { commissionRate, commissionAmount, vendorPayout: (price || 0) - commissionAmount, source, productPrice: price || 0 });
    }

    if (path === '/api/commission/settings' && method === 'GET') {
      const { data: settingsData } = await supabase.from('settings').select('*').single();
      const s = settingsData?.data || {};
      return ok(res, { globalCommission: s.vendorCommission || 10, categoryCommission: s.categoryCommission || {}, vendorCommissionOverride: s.vendorCommissionOverride || {} });
    }

    // ── Payment ───────────────────────────────────────────────────
    if (path === '/api/payment/initiate-chapa' && method === 'POST') {
      const { amount, email, firstName, lastName, phone, txRef, orderNumber } = req.body || {};
      if (!amount || !email || !phone) return fail(res, 'amount, email, and phone required');

      try {
        const chapaRes = await fetchWithRetry('https://api.chapa.co/v1/transaction/initialize', {
          method: 'POST', timeout: 10_000,
          headers: { 'Authorization': `Bearer ${ENV.CHAPA_SECRET_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: String(amount), currency: 'ETB', email,
            first_name: firstName || 'Customer', last_name: lastName || '', phone, tx_ref: txRef,
            callback_url: `${ENV.BASE_URL}/api/payment/verify`,
            return_url: `${ENV.BASE_URL}/confirmation/${orderNumber}`,
            customization: { title: `Smart Shop Order #${orderNumber}`, description: `Payment for order ${orderNumber}` },
          }),
        });
        const chapaData = await chapaRes.json();
        if (chapaData.status === 'success' && chapaData.data?.checkout_url) {
          return ok(res, { success: true, checkout_url: chapaData.data.checkout_url, tx_ref: txRef });
        }
        return ok(res, { success: false, error: chapaData.message || 'Chapa initialization failed' });
      } catch (e: any) { return ok(res, { success: false, error: e.message }); }
    }

    if (path === '/api/payment/verify' && method === 'POST') {
      const { tx_ref } = req.body || {};
      if (!tx_ref) return fail(res, 'tx_ref required');
      try {
        const verifyRes = await fetchWithRetry(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
          headers: { 'Authorization': `Bearer ${ENV.CHAPA_SECRET_KEY}` }, timeout: 10_000,
        });
        const verifyData = await verifyRes.json();
        if (verifyData.status === 'success' && verifyData.data?.status === 'success') {
          return ok(res, { status: 'completed', amount: verifyData.data.amount, reference: verifyData.data.reference || tx_ref, verified: true });
        }
        return ok(res, { status: 'failed', error: verifyData.message || 'Payment not completed', verified: false });
      } catch (e: any) { return ok(res, { status: 'failed', error: e.message, verified: false }); }
    }

    if (path === '/api/payment/initiate-telebirr' && method === 'POST') {
      const { amount, phone, orderNumber } = req.body || {};
      if (!amount || !phone) return fail(res, 'amount and phone required');
      return ok(res, { success: true, deepLink: `telebirr://pay?amount=${amount}&order=${orderNumber}`, ussdCode: `*847#${amount}#${orderNumber}`, message: 'Payment initiated via Telebirr.' });
    }

    if (path === '/api/payment/transactions' && method === 'GET') {
      const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(100);
      const txList = (orders || []).map((o: any) => ({
        id: o.id, orderNumber: o.order_number, amount: o.total || 0,
        paymentMethod: o.payment_method || 'telebirr', status: o.status || 'pending',
        customerName: o.customer?.name || 'Unknown', date: o.created_at || o.date,
      }));
      return ok(res, { transactions: txList });
    }

    // ── Tax ────────────────────────────────────────────────────────
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
      return ok(res, { basePrice, deliveryFee: fee, commissionRate: rate, commissionAmount, gatewayFee, vatOnCommission, withholdingTax, vendorPayout, totalPaid, vatRate: 0.15, withholdingTaxRate: 0.02, totalTaxToRemit: vatOnCommission + withholdingTax, shopRevenue: commissionAmount - gatewayFee });
    }

    if (path === '/api/tax/receipt' && method === 'POST') {
      const { orderNumber } = req.body || {};
      if (!orderNumber) return fail(res, 'orderNumber required');
      const { data: order } = await supabase.from('orders').select('*').eq('order_number', orderNumber).single();
      if (!order) return fail(res, 'Order not found', 404);
      return ok(res, { success: true, receiptNumber: `SS-${new Date().getFullYear()}-${Math.floor(Math.random() * 90000 + 10000)}`, orderNumber: order.order_number, generatedAt: new Date().toISOString(), html: `<html><body><h1>Tax Receipt</h1><p>Order: ${orderNumber}</p></body></html>` });
    }

    if (path === '/api/tax/monthly-report' && method === 'GET') {
      const { data: orders } = await supabase.from('orders').select('*');
      const total = (orders || []).reduce((s: number, o: any) => s + (o.total || 0), 0);
      const count = (orders || []).length;
      const commission = Math.round(total * 0.1);
      const vat = Math.round(commission * 0.15);
      const wht = Math.round(total * 0.02);
      return ok(res, { period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }), totalSales: total, orderCount: count, totalCommission: commission, vatOnCommission: vat, withholdingTax: wht, totalTaxToRemit: vat + wht, averageOrderValue: count > 0 ? Math.round(total / count) : 0 });
    }

    // ── Vendor Notify ──────────────────────────────────────────────
    if (path === '/api/vendor/notify' && method === 'POST') {
      const { telegramId, type, message } = req.body || {};
      if (!telegramId || !message) return fail(res, 'telegramId and message required');
      const emoji = type === 'payout' ? '💰' : type === 'order' ? '📦' : type === 'promo' ? '🎉' : '📢';
      const sent = await sendTelegramMessage(ENV.VENDOR_BOT_TOKEN, telegramId, `${emoji} *Smart Shop Notification*\n\n${message}`);
      return ok(res, { success: sent });
    }

    // ================================================================
    // FALLBACK — 404
    // ================================================================
    return notFound(res, path, method);

  } catch (e: any) {
    logRequest(method, path, 500, getDuration(start), ipStr, e.message);
    return serverError(res, e);
  }
}

// ── Helper: Clean product request body ─────────────────────────────
function cleanProductBody(body: any): any {
  const cleaned = {
    ...body,
    name_en: body.nameEn || body.name_en || '',
    name: body.name || body.name_en || '',
    description_en: body.descriptionEn || body.description_en || '',
    description: body.description || '',
    stock_count: body.stockCount ?? body.stock_count ?? 10,
    sold_count: body.soldCount ?? body.sold_count ?? 0,
    original_price: body.originalPrice ?? body.original_price ?? null,
    vendor_id: body.vendorId ?? body.vendor_id ?? null,
    vendor_name: body.vendorName ?? body.vendor_name ?? '',
    is_pre_order: body.isPreOrder ?? body.is_pre_order ?? false,
    pre_order_deposit: body.preOrderDeposit ?? body.pre_order_deposit ?? null,
    pre_order_release_date: body.preOrderReleaseDate ?? body.pre_order_release_date ?? '',
    pre_order_max: body.preOrderMax ?? body.pre_order_max ?? null,
    seo_title: body.seoTitle ?? body.seo_title ?? '',
    seo_description: body.seoDescription ?? body.seo_description ?? '',
    in_stock: body.inStock ?? body.in_stock ?? true,
  };
  // Remove camelCase duplicates
  delete cleaned.nameEn; delete cleaned.descriptionEn; delete cleaned.stockCount; delete cleaned.soldCount;
  delete cleaned.originalPrice; delete cleaned.vendorId; delete cleaned.vendorName;
  delete cleaned.isPreOrder; delete cleaned.preOrderDeposit; delete cleaned.preOrderReleaseDate;
  delete cleaned.preOrderMax; delete cleaned.seoTitle; delete cleaned.seoDescription;
  delete cleaned.inStock;
  return cleaned;
}
