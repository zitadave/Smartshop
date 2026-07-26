// ============================================
// Smart Shop — Admin Feature Routes
// ============================================
import { supabase } from '../_config';
import { ok, fail } from '../_middleware';

// ── Generic CRUD helpers ───────────────────────────────────────────
function parseId(path: string): number {
  return parseInt(path.split('/').pop() || '0');
}

async function listTable(table: string, res: any, key: string, order = 'created_at', asc = false) {
  const { data, error } = await supabase.from(table).select('*').order(order, { ascending: asc });
  if (error) return fail(res, error.message, 500);
  return ok(res, { [key]: data || [] });
}

async function insertTable(table: string, body: any, res: any, key: string) {
  const { data, error } = await supabase.from(table).insert(body).select().single();
  if (error) return fail(res, error.message);
  return ok(res, { success: true, [key]: data });
}

async function updateTable(table: string, id: number, body: any, res: any) {
  const { error } = await supabase.from(table).update(body).eq('id', id);
  if (error) return fail(res, error.message);
  return ok(res, { success: true });
}

async function deleteTable(table: string, id: number, res: any) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) return fail(res, error.message);
  return ok(res, { success: true });
}

// ── Settings helpers (namespaced keys) ─────────────────────────────
async function getSettingsData(): Promise<any> {
  const { data } = await supabase.from('settings').select('*').single();
  return data?.data || {};
}

async function updateSettingsData(update: Record<string, any>): Promise<boolean> {
  const { data: exRow } = await supabase.from('settings').select('*').single();
  const newData = { ...(exRow?.data || {}), ...update };
  if (exRow) {
    await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', exRow.id);
  } else {
    await supabase.from('settings').insert({ data: newData });
  }
  return true;
}

// ── Router ─────────────────────────────────────────────────────────
export default async function handleAdmin(path: string, method: string, req: any, res: any): Promise<boolean> {

  // ── Notifications ─────────────────────────────────────────────
  if (path === '/api/notifications' && method === 'GET') return listTable('notifications', res, 'notifications', 'created_at'), true;
  if (path === '/api/notifications' && method === 'POST') return insertTable('notifications', req.body, res, 'notification'), true;
  if (path.startsWith('/api/notifications/') && method === 'PATCH') {
    const nid = parseId(path);
    const { error } = await supabase.from('notifications').update(req.body).eq('id', nid);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Manual Payments ───────────────────────────────────────────
  if (path === '/api/manual-payments' && method === 'GET') return listTable('manual_payments', res, 'payments', 'created_at'), true;
  if (path === '/api/manual-payments' && method === 'POST') return insertTable('manual_payments', req.body, res, 'payment'), true;
  if (path.startsWith('/api/manual-payments/') && method === 'PATCH') {
    const pid = parseId(path);
    const { error } = await supabase.from('manual_payments').update({
      ...req.body, verified_at: req.body.status === 'verified' ? new Date().toISOString() : undefined,
    }).eq('id', pid);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Bank Accounts ─────────────────────────────────────────────
  if (path === '/api/bank-accounts') {
    if (method === 'GET') return listTable('bank_accounts', res, 'accounts', 'id'), true;
    if (method === 'POST') return insertTable('bank_accounts', req.body, res, 'account'), true;
    if (method === 'DELETE') { await supabase.from('bank_accounts').delete().eq('id', parseId(path)); return ok(res, { success: true }); }
    return true;
  }

  // ── Payouts ───────────────────────────────────────────────────
  if (path === '/api/payouts' && method === 'GET') return listTable('payouts', res, 'payouts', 'created_at'), true;
  if (path === '/api/payouts' && method === 'POST') return insertTable('payouts', req.body, res, 'payout'), true;
  if (path.startsWith('/api/payouts/') && method === 'PATCH') {
    const pid = parseId(path);
    const { error } = await supabase.from('payouts').update({
      ...req.body, paid_at: req.body.status === 'paid' ? new Date().toISOString() : undefined,
    }).eq('id', pid);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Returns ───────────────────────────────────────────────────
  if (path === '/api/returns' && method === 'GET') return listTable('returns', res, 'returns', 'created_at'), true;
  if (path === '/api/returns' && method === 'POST') return insertTable('returns', req.body, res, 'return'), true;
  if (path.startsWith('/api/returns/') && method === 'PATCH') {
    const rid = parseId(path);
    const { error } = await supabase.from('returns').update({
      ...req.body, approved_at: ['approved','rejected'].includes(req.body.status) ? new Date().toISOString() : undefined,
    }).eq('id', rid);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Order Fulfillments ────────────────────────────────────────
  if (path === '/api/fulfillments' && method === 'GET') return listTable('order_fulfillments', res, 'fulfillments', 'created_at'), true;
  if (path === '/api/fulfillments' && method === 'POST') return insertTable('order_fulfillments', req.body, res, 'fulfillment'), true;
  if (path.startsWith('/api/fulfillments/') && method === 'PATCH') {
    const fid = parseId(path);
    const tsFields: Record<string, string> = { packed: 'packed_at', shipped: 'shipped_at', delivered: 'delivered_at' };
    const update: any = { ...req.body };
    if (tsFields[req.body.status]) update[tsFields[req.body.status]] = new Date().toISOString();
    const { error } = await supabase.from('order_fulfillments').update(update).eq('id', fid);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Abandoned Carts ───────────────────────────────────────────
  if (path === '/api/abandoned-carts' && method === 'GET') return listTable('abandoned_carts', res, 'carts', 'created_at'), true;
  if (path === '/api/abandoned-carts' && method === 'POST') return insertTable('abandoned_carts', req.body, res, 'cart'), true;
  if (path.startsWith('/api/abandoned-carts/') && method === 'PATCH') return updateTable('abandoned_carts', parseId(path), req.body, res), true;

  // ── Coupon Analytics ──────────────────────────────────────────
  if (path === '/api/coupon-analytics' && method === 'GET') return listTable('coupon_analytics', res, 'usage', 'used_at'), true;
  if (path === '/api/coupon-analytics' && method === 'POST') return insertTable('coupon_analytics', req.body, res, 'entry'), true;

  // ── Admin Roles ───────────────────────────────────────────────
  if (path === '/api/admin-roles' && method === 'GET') return listTable('admin_roles', res, 'roles', 'id'), true;
  if (path === '/api/admin-roles' && method === 'POST') return insertTable('admin_roles', req.body, res, 'role'), true;
  if (path.startsWith('/api/admin-roles/') && method === 'DELETE') return deleteTable('admin_roles', parseId(path), res), true;

  // ── Admin Users ───────────────────────────────────────────────
  if (path === '/api/admin-users' && method === 'GET') {
    const { data, error } = await supabase.from('admin_users').select('*, admin_roles(*)').order('id');
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { users: data || [] });
  }
  if (path === '/api/admin-users' && method === 'POST') return insertTable('admin_users', req.body, res, 'user'), true;
  if (path.startsWith('/api/admin-users/') && (method === 'PUT' || method === 'PATCH')) return updateTable('admin_users', parseId(path), req.body, res), true;
  if (path.startsWith('/api/admin-users/') && method === 'DELETE') return deleteTable('admin_users', parseId(path), res), true;

  // ── Activity Logs ─────────────────────────────────────────────
  if (path === '/api/activity-logs' && method === 'GET') {
    const { data, error } = await supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { logs: data || [] });
  }
  if (path === '/api/activity-logs' && method === 'POST') return insertTable('activity_logs', req.body, res, 'log'), true;
  if (path === '/api/activity-logs/clear' && method === 'DELETE') {
    await supabase.from('activity_logs').delete().gt('id', 0);
    return ok(res, { success: true });
  }

  // ── Accounting Entries ────────────────────────────────────────
  if (path === '/api/accounting' && method === 'GET') {
    const { data, error } = await supabase.from('accounting_entries').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { entries: data || [] });
  }
  if (path === '/api/accounting' && method === 'POST') return insertTable('accounting_entries', req.body, res, 'entry'), true;

  // ── Promotions ────────────────────────────────────────────────
  if (path === '/api/promotions' && method === 'GET') return listTable('promotions', res, 'promotions', 'created_at'), true;
  if (path === '/api/promotions' && method === 'POST') return insertTable('promotions', req.body, res, 'promotion'), true;
  if (path.startsWith('/api/promotions/') && (method === 'PUT' || method === 'PATCH')) return updateTable('promotions', parseId(path), req.body, res), true;
  if (path.startsWith('/api/promotions/') && method === 'DELETE') return deleteTable('promotions', parseId(path), res), true;

  // ── SLA Config ────────────────────────────────────────────────
  if (path === '/api/sla-config' && method === 'GET') return listTable('sla_config', res, 'configs', 'id'), true;
  if (path === '/api/sla-config' && method === 'POST') return insertTable('sla_config', req.body, res, 'config'), true;

  // ── SLA Alerts ────────────────────────────────────────────────
  if (path === '/api/sla-alerts' && method === 'GET') {
    const { data, error } = await supabase.from('sla_alerts').select('*').order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { alerts: data || [] });
  }
  if (path.startsWith('/api/sla-alerts/') && method === 'PATCH') return updateTable('sla_alerts', parseId(path), req.body, res), true;

  // ── Security Settings (settings table, namespaced) ────────────
  if (path === '/api/security/settings') {
    if (method === 'GET') {
      const s = await getSettingsData();
      return ok(res, {
        pinEnabled: s.admin_pin_enabled || false, pin: s.admin_pin || '',
        twoFactor: s.admin_2fa || false, sessionTimeout: s.admin_session_timeout || 15,
        locked: s.admin_locked || false,
      });
    }
    if (method === 'PUT') {
      await updateSettingsData({
        admin_pin_enabled: req.body.pinEnabled, admin_pin: req.body.pin,
        admin_2fa: req.body.twoFactor, admin_session_timeout: req.body.sessionTimeout,
        admin_locked: req.body.locked,
      });
      return ok(res, { success: true });
    }
    return true;
  }

  // ── Bot Config ────────────────────────────────────────────────
  if (path === '/api/bot-config') {
    if (method === 'GET') {
      const s = await getSettingsData();
      return ok(res, {
        adminBotToken: s.admin_bot_token || '', adminChatId: s.admin_chat_id || '',
        shopBotToken: s.shop_bot_token || '', alerts: s.bot_alerts || {},
      });
    }
    if (method === 'PUT') {
      await updateSettingsData({
        admin_bot_token: req.body.adminBotToken, admin_chat_id: req.body.adminChatId,
        shop_bot_token: req.body.shopBotToken, bot_alerts: req.body.alerts,
      });
      return ok(res, { success: true });
    }
    return true;
  }
  // Bot config POST (for AdminBotManager compatibility)
  if (path === '/api/admin-bot/config' && method === 'POST') {
    await updateSettingsData({
      admin_bot_token: req.body.botToken, admin_chat_id: req.body.chatId,
    });
    return ok(res, { success: true });
  }

  // ── Loyalty Points ────────────────────────────────────────────
  if (path === '/api/loyalty' && method === 'POST') {
    const { telegram_id, points } = req.body || {};
    if (!telegram_id) return fail(res, 'telegram_id required'), true;
    const { data: user } = await supabase.from('users').select('loyalty_points').eq('telegram_id', telegram_id).single();
    const newPts = Math.max(0, (user?.loyalty_points || 0) + (parseInt(points) || 0));
    await supabase.from('users').update({ loyalty_points: newPts }).eq('telegram_id', telegram_id);
    return ok(res, { success: true, points: newPts, change: parseInt(points) || 0 });
  }
  if (path === '/api/loyalty' && method === 'GET') {
    const tid = new URLSearchParams(req.url?.split('?')[1] || '').get('telegram_id');
    if (!tid) return ok(res, { points: 0 }), true;
    const { data } = await supabase.from('users').select('loyalty_points').eq('telegram_id', parseInt(tid)).single();
    return ok(res, { points: data?.loyalty_points || 0 });
  }

  return false; // Not an admin route
}
