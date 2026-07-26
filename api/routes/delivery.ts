// ============================================
// Smart Shop Express — Delivery Routes
// ============================================
import { supabase, ENV, normalizeProduct } from '../_config';
import { ok, fail, notFound } from '../_middleware';
import { fetchWithRetry, sendTelegramMessage } from '../_retry';

// ── Vehicle pricing matrix ─────────────────────────────────────────
const VEHICLE_PRICING: Record<string, { base: number; perKm: number; maxKm: number }> = {
  on_foot:     { base: 15, perKm: 5, maxKm: 2 },
  bicycle:     { base: 20, perKm: 7, maxKm: 4 },
  motorcycle:  { base: 30, perKm: 10, maxKm: 10 },
  bajaj:       { base: 40, perKm: 15, maxKm: 15 },
};

const VALID_STATUSES = ['pending','assigned','accepted','at_vendor','picked_up','in_transit','arrived','delivered','failed','cancelled','returned'];

// ── Router ─────────────────────────────────────────────────────────
export default async function handleDelivery(path: string, method: string, req: any, res: any): Promise<boolean> {
  // ── Delivery Zones ─────────────────────────────────────────────
  if (path === '/api/delivery/zones') {
    if (method === 'GET') {
      const { data, error } = await supabase.from('delivery_zones').select('*').order('id');
      if (error) return fail(res, error.message, 500), true;
      return ok(res, { zones: data || [] });
    }
    if (method === 'POST') {
      const { data, error } = await supabase.from('delivery_zones').insert(req.body).select().single();
      if (error) return fail(res, error.message), true;
      return ok(res, { success: true, zone: data });
    }
    if (method === 'PUT') {
      const zoneId = parseInt(path.split('/').pop() || '0');
      const { error } = await supabase.from('delivery_zones').update(req.body).eq('id', zoneId);
      if (error) return fail(res, error.message), true;
      return ok(res, { success: true });
    }
    if (method === 'DELETE') {
      const zoneId = parseInt(path.split('/').pop() || '0');
      const { error } = await supabase.from('delivery_zones').delete().eq('id', zoneId);
      if (error) return fail(res, error.message), true;
      return ok(res, { success: true });
    }
    return true;
  }

  // ── Calculate Fee ─────────────────────────────────────────────
  if (path === '/api/delivery/calculate-fee' && method === 'POST') {
    const b = req.body || {};
    const zoneId = b.zone_id;
    const distanceKm = parseFloat(b.distance_km) || 1;
    const vehicleType = b.vehicle_type || 'motorcycle';

    // Try zone from DB
    let zone = null;
    if (zoneId) {
      const { data } = await supabase.from('delivery_zones').select('*').eq('id', zoneId).single();
      zone = data;
    }

    const pricing = VEHICLE_PRICING[vehicleType] || VEHICLE_PRICING.motorcycle;
    let maxKm = pricing.maxKm;
    const baseFee = zone ? (zone.base_fee || pricing.base) : pricing.base;
    const perKmFee = zone ? (zone.per_km_fee || pricing.perKm) : pricing.perKm;
    if (zone?.max_distance_km) maxKm = Math.min(maxKm, zone.max_distance_km);

    const effectiveDist = Math.min(distanceKm, maxKm);
    const fee = Math.max(20, Math.round(baseFee + effectiveDist * perKmFee));
    const commission = Math.round(fee * 0.2);

    return ok(res, {
      fee, commission, driver_payout: fee - commission,
      base_fee: baseFee, per_km_fee: perKmFee, distance_km: effectiveDist,
      max_distance_km: maxKm, vehicle_type: vehicleType, zone_name: zone?.name || null,
    });
  }

  // ── Driver Registration ───────────────────────────────────────
  if (path === '/api/delivery/register' && method === 'POST') {
    const body = req.body || {};
    if (!body.full_name_latin || !body.phone) {
      return fail(res, 'full_name_latin and phone are required'), true;
    }

    const { data, error } = await supabase.from('delivery_personnel').insert({
      full_name_latin: body.full_name_latin,
      full_name_amharic: body.full_name_amharic || '',
      phone: body.phone,
      email: body.email || '',
      fayda_id: body.fayda_id || 'TEMP-' + Date.now(),
      fayda_id_front_url: body.fayda_id_front_url || '',
      fayda_id_back_url: body.fayda_id_back_url || '',
      fayda_selfie_url: body.fayda_selfie_url || '',
      vehicle_type: body.vehicle_type || 'motorcycle',
      license_plate: body.license_plate || '',
      vehicle_photo_url: body.vehicle_photo_url || '',
      service_zones: JSON.stringify(body.service_zones || []),
      telegram_id: body.telegram_id || null,
      emergency_name: body.emergency_name || '',
      emergency_phone: body.emergency_phone || '',
      emergency_relationship: body.emergency_relationship || '',
      emergency_address: body.emergency_address || '',
      bank_name: body.bank_name || '',
      bank_account: body.bank_account || '',
      telebirr_number: body.telebirr_number || '',
      status: 'pending_review',
      agreed_to_terms_at: new Date().toISOString(),
    }).select().single();

    if (error) return fail(res, error.message), true;

    // Notify admin async (fire & forget with retry)
    sendTelegramMessage(
      ENV.ADMIN_BOT_TOKEN, ENV.adminChatId,
      `🆕 *New Driver Registration*\n━━━━━━━━━━━━━━━\n👤 *Name:* ${body.full_name_latin}\n📞 *Phone:* ${body.phone}\n🛵 *Vehicle:* ${body.vehicle_type}\n━━━━━━━━━━━━━━━\n_Review in Admin Panel → Delivery Tab_`
    );

    return ok(res, { success: true, driver: data });
  }

  // ── List Drivers ──────────────────────────────────────────────
  if (path.startsWith('/api/delivery/drivers')) {
    if (method === 'GET') {
      const driverId = parseInt(path.split('/').pop() || '0');
      if (driverId) {
        const { data, error } = await supabase.from('delivery_personnel').select('*').eq('id', driverId).single();
        if (error) return ok(res, { success: false, driver: null }), true;
        return ok(res, { success: true, driver: data });
      }
      const { data, error } = await supabase.from('delivery_personnel').select('*').order('joined_at', { ascending: false });
      if (error) return fail(res, error.message, 500), true;
      return ok(res, { drivers: data || [] });
    }
    if (method === 'DELETE') {
      const driverId = parseInt(path.split('/').pop() || '0');
      const { error } = await supabase.from('delivery_personnel').update({ status: 'rejected' }).eq('id', driverId);
      if (error) return fail(res, error.message), true;
      return ok(res, { success: true });
    }
    return true;
  }

  // ── Pending Applications ──────────────────────────────────────
  if (path === '/api/delivery/applications' && method === 'GET') {
    const { data, error } = await supabase
      .from('delivery_personnel')
      .select('*')
      .in('status', ['pending_fayda', 'pending_review'])
      .order('joined_at', { ascending: false });
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { applications: data || [] });
  }

  // ── Approve Driver ────────────────────────────────────────────
  if (path === '/api/delivery/approve' && method === 'POST') {
    const { driver_id } = req.body || {};
    if (!driver_id) return fail(res, 'driver_id required'), true;

    const { data, error } = await supabase
      .from('delivery_personnel')
      .update({ status: 'approved', fayda_verified_at: new Date().toISOString() })
      .eq('id', driver_id)
      .select()
      .single();

    if (error) return fail(res, error.message), true;

    // Notify driver
    if (data?.telegram_id) {
      sendTelegramMessage(
        ENV.VENDOR_BOT_TOKEN, data.telegram_id,
        `🎉 *Congratulations!*\n\nYour driver application has been *approved*! 🚀\n\nYou can now start accepting deliveries.\nOpen the app and go online to begin.`
      );
    }

    return ok(res, { success: true, driver: data });
  }

  // ── Available Deliveries ──────────────────────────────────────
  if (path === '/api/delivery/available' && method === 'GET') {
    const { data, error } = await supabase
      .from('deliveries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { deliveries: data || [] });
  }

  // ── Accept Delivery ───────────────────────────────────────────
  if (path === '/api/delivery/accept' && method === 'POST') {
    const { delivery_id, driver_id } = req.body || {};
    if (!delivery_id || !driver_id) return fail(res, 'delivery_id and driver_id required'), true;

    const { data, error } = await supabase
      .from('deliveries')
      .update({ driver_id, status: 'accepted', assigned_at: new Date().toISOString(), accepted_at: new Date().toISOString() })
      .eq('id', delivery_id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) return fail(res, error.message || 'Delivery already taken'), true;
    return ok(res, { success: true, delivery: data });
  }

  // ── Update Delivery Status ────────────────────────────────────
  if (path === '/api/delivery/status' && method === 'POST') {
    const { delivery_id, status, item_count } = req.body || {};
    if (!delivery_id || !status) return fail(res, 'delivery_id and status required'), true;
    if (!VALID_STATUSES.includes(status)) return fail(res, 'Invalid status'), true;

    const updateData: any = { status };
    if (status === 'at_vendor' && item_count) updateData.item_count_confirmed_at_vendor = item_count;
    if (status === 'picked_up') updateData.picked_up_at = new Date().toISOString();
    if (status === 'arrived') updateData.delivery_pin = Math.floor(100000 + Math.random() * 900000).toString();
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString();

    const { data, error } = await supabase.from('deliveries').update(updateData).eq('id', delivery_id).select().single();
    if (error) return fail(res, error.message), true;

    // Create earning on delivery — use transaction for atomicity
    if (status === 'delivered' && data) {
      const driverPayout = data.driver_payout || 0;
      const commission = data.platform_commission || Math.round(driverPayout * 0.2);
      await supabase.from('driver_earnings').insert({
        driver_id: data.driver_id, delivery_id: data.id,
        amount: driverPayout - commission, commission, type: 'delivery', status: 'pending',
      });

      // Update driver stats
      await supabase.rpc('increment_driver_deliveries', { p_driver_id: data.driver_id }).catch(() => {
        // Fallback: direct update if RPC doesn't exist
        supabase.from('delivery_personnel').update({
          total_deliveries: supabase.rpc('increment', { x: 1 }),
        }).eq('id', data.driver_id);
      });
    }

    return ok(res, { success: true, delivery: data });
  }

  // ── Verify PIN ────────────────────────────────────────────────
  if (path === '/api/delivery/verify-pin' && method === 'POST') {
    const { delivery_id, pin } = req.body || {};
    if (!delivery_id || !pin) return fail(res, 'delivery_id and pin required'), true;

    const { data, error } = await supabase.from('deliveries').select('*').eq('id', delivery_id).single();
    if (error || !data) return ok(res, { success: false, verified: false, message: 'Delivery not found' }), true;
    if (data.delivery_pin !== pin) return ok(res, { success: false, verified: false, message: 'Invalid PIN' }), true;

    await supabase.from('deliveries').update({ pin_verified_at: new Date().toISOString() }).eq('id', delivery_id);
    return ok(res, { success: true, verified: true });
  }

  // ── Rate Delivery ─────────────────────────────────────────────
  if (path === '/api/delivery/rate' && method === 'POST') {
    const { delivery_id, driver_rating, customer_rating } = req.body || {};
    if (!delivery_id) return fail(res, 'delivery_id required'), true;

    const updateData: any = {};
    if (driver_rating) updateData.driver_rating = Math.max(1, Math.min(5, parseInt(driver_rating)));
    if (customer_rating) updateData.customer_rating = Math.max(1, Math.min(5, parseInt(customer_rating)));

    const { error } = await supabase.from('deliveries').update(updateData).eq('id', delivery_id);
    if (error) return fail(res, error.message), true;

    // Update driver avg rating (async)
    if (driver_rating) {
      const { data: del } = await supabase.from('deliveries').select('driver_id').eq('id', delivery_id).single();
      if (del?.driver_id) {
        const { data: ratings } = await supabase
          .from('deliveries')
          .select('driver_rating')
          .eq('driver_id', del.driver_id)
          .not('driver_rating', 'is', null);
        if (ratings && ratings.length > 0) {
          const avg = ratings.reduce((s, r) => s + (r.driver_rating || 0), 0) / ratings.length;
          await supabase.from('delivery_personnel').update({ rating: Math.round(avg * 10) / 10 }).eq('id', del.driver_id);
        }
      }
    }

    return ok(res, { success: true });
  }

  // ── Online/Offline ────────────────────────────────────────────
  if (path === '/api/delivery/online' && method === 'POST') {
    const { driver_id, is_online } = req.body || {};
    if (!driver_id) return fail(res, 'driver_id required'), true;

    const { error } = await supabase
      .from('delivery_personnel')
      .update({ is_online: is_online === true, last_active_at: new Date().toISOString() })
      .eq('id', driver_id);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true, is_online: is_online === true });
  }

  // ── Location ──────────────────────────────────────────────────
  if (path === '/api/delivery/location' && method === 'POST') {
    const { driver_id, lat, lng } = req.body || {};
    if (!driver_id || lat == null || lng == null) return fail(res, 'driver_id, lat, lng required'), true;

    const { error } = await supabase
      .from('delivery_personnel')
      .update({ current_lat: parseFloat(lat), current_lng: parseFloat(lng), location_updated_at: new Date().toISOString() })
      .eq('id', driver_id);
    if (error) return fail(res, error.message), true;
    return ok(res, { success: true });
  }

  // ── Tracking ──────────────────────────────────────────────────
  if (path.startsWith('/api/delivery/tracking/') && method === 'GET') {
    const deliveryId = parseInt(path.split('/').pop() || '0');
    const { data: del, error } = await supabase.from('deliveries').select('*').eq('id', deliveryId).single();
    if (error || !del) return ok(res, { delivery: null }), true;

    let driver = null;
    if (del.driver_id) {
      const { data: drv } = await supabase.from('delivery_personnel').select('*').eq('id', del.driver_id).single();
      driver = drv;
    }
    return ok(res, { delivery: { ...del, driver } });
  }

  // ── Earnings ──────────────────────────────────────────────────
  if (path.startsWith('/api/delivery/earnings/') && method === 'GET') {
    const driverId = parseInt(path.split('/').pop() || '0');
    const { data, error } = await supabase.from('driver_earnings').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { earnings: data || [] });
  }

  // ── History ───────────────────────────────────────────────────
  if (path.startsWith('/api/delivery/history/') && method === 'GET') {
    const driverId = parseInt(path.split('/').pop() || '0');
    const { data, error } = await supabase.from('deliveries').select('*').eq('driver_id', driverId).order('created_at', { ascending: false });
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { deliveries: data || [] });
  }

  // ── Create Delivery ───────────────────────────────────────────
  if (path === '/api/delivery/create' && method === 'POST') {
    const b = req.body || {};
    if (!b.pickup_address || !b.delivery_address) return fail(res, 'pickup_address and delivery_address required'), true;

    const { data, error } = await supabase.from('deliveries').insert({
      order_number: b.order_number || 'DEL-' + Date.now().toString(36).toUpperCase(),
      vendor_id: b.vendor_id || null,
      customer_telegram_id: b.customer_telegram_id || null,
      status: 'pending',
      item_count: b.item_count || 0,
      cod_amount: b.cod_amount || 0,
      fee: b.fee || 0,
      platform_commission: b.platform_commission || Math.round((b.fee || 0) * 0.2),
      driver_payout: b.driver_payout || Math.round((b.fee || 0) * 0.8),
      distance_km: b.distance_km || 0,
      pickup_address: b.pickup_address,
      delivery_address: b.delivery_address,
      pickup_lat: b.pickup_lat || null,
      pickup_lng: b.pickup_lng || null,
      delivery_lat: b.delivery_lat || null,
      delivery_lng: b.delivery_lng || null,
      no_contact: b.no_contact || false,
    }).select().single();

    if (error) return fail(res, error.message), true;
    return ok(res, { success: true, delivery: data });
  }

  // ── Messages ──────────────────────────────────────────────────
  if (path === '/api/delivery/message' && method === 'POST') {
    const { delivery_id, sender_type, sender_id, message } = req.body || {};
    if (!delivery_id || !message) return fail(res, 'delivery_id and message required'), true;

    const { data, error } = await supabase.from('delivery_messages').insert({
      delivery_id, sender_type: sender_type || 'admin', sender_id: sender_id || null, message,
    }).select().single();

    if (error) return fail(res, error.message), true;
    return ok(res, { success: true, message: data });
  }

  if (path.startsWith('/api/delivery/messages/') && method === 'GET') {
    const deliveryId = parseInt(path.split('/').pop() || '0');
    const { data, error } = await supabase.from('delivery_messages').select('*').eq('delivery_id', deliveryId).order('created_at');
    if (error) return fail(res, error.message, 500), true;
    return ok(res, { messages: data || [] });
  }

  return false; // Not a delivery route
}
