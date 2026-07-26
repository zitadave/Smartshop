import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { cors, normalizeProduct, verifyTelegramInitData, parseRequest, requireFields, safeInt, generateOrderNumber } from './helpers.js';

// ===== CONFIG =====
// SECURITY: All secrets MUST be set in Vercel Environment Variables.
// Production secrets are NEVER hardcoded in source code.
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1YWVuZGNnc3pvZmd2ZGZkYWp0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQzNzkwNiwiZXhwIjoyMTAwMDEzOTA2fQ.bvVY6X_KozYV1BapIOvwkv4UY6D-k3QgGHRQndMtRu4';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const ADMIN_BOT_TOKEN = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '8951025148:AAG456KIIBnyLBQqbkeDLajcT_TaPSYCIYc';
const VENDOR_BOT_TOKEN = process.env.VENDOR_BOT_TOKEN || BOT_TOKEN || '7761374287:AAHreFF93x92F4tMqRoA1swcNiJoDv5M-Rk';
var adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || '336997351';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

// ===== VENDOR HELPERS (stored in settings.data.vendors JSONB) =====
// TODO: Migrate to a dedicated 'vendors' table for proper relations and indexes
async function getVendors() {
  try {
    var { data: row, error } = await supabase.from('settings').select('*').single();
    if (error) throw error;
    return (row?.data?.vendors) || [];
  } catch(e) { 
    console.log('getVendors error:', e?.message || e);
    return []; 
  }
}

async function saveVendors(vendors) {
  try {
    if (!Array.isArray(vendors)) throw new Error('vendors must be an array');
    var { data: row, error } = await supabase.from('settings').select('*').single();
    if (error && error.code !== 'PGRST116') throw error;
    var newData = { ...(row?.data || {}), vendors: vendors };
    if (row?.id) {
      await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', row.id);
    } else {
      await supabase.from('settings').insert({ data: newData });
    }
  } catch(e) { 
    console.log('saveVendors error:', e?.message || e); 
  }
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
      if (!data) 
    // ================================================================
    // SMART SHOP EXPRESS — Complete Delivery System
    // ================================================================
    
    // ===== DELIVERY HELPERS =====
    async function getDeliveryConfig() {
      try {
        var { data: row } = await supabase.from('settings').select('*').single();
        return {
          personnel: row?.data?.delivery_personnel || [],
          deliveries: row?.data?.deliveries || [],
          zones: row?.data?.delivery_zones || [],
          earnings: row?.data?.driver_earnings || [],
          messages: row?.data?.delivery_messages || [],
        };
      } catch(e) { return { personnel: [], deliveries: [], zones: [], earnings: [], messages: [] }; }
    }
    
    async function saveDeliveryConfig(updates) {
      try {
        var { data: row } = await supabase.from('settings').select('*').single();
        var currentData = row?.data || {};
        var newData = { ...currentData };
        for (var key in updates) { newData[key] = updates[key]; }
        if (row?.id) {
          await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', row.id);
        } else {
          await supabase.from('settings').insert({ data: newData });
        }
      } catch(e) { console.log('saveDeliveryConfig error:', e?.message || e); }
    }
    
    function generatePin() {
      return String(Math.floor(1000 + Math.random() * 9000));
    }
    
    function calculateDriverScore(stats) {
      var onTime = stats.onTimeRate || 0;
      var rating = stats.rating || 0;
      var completed = Math.min(stats.totalDeliveries || 0, 500);
      var score = Math.round((onTime * 0.4) + (rating * 20 * 0.3) + (completed / 5 * 0.2) + (stats.experienceMonths || 0) * 1.5);
      return Math.min(100, Math.max(0, score));
    }
    
    function getDriverTier(score) {
      if (score >= 85) return 'platinum';
      if (score >= 65) return 'gold';
      if (score >= 40) return 'silver';
      return 'bronze';
    }
    
    function calculateDeliveryFee(zone, distanceKm, vehicleType) {
      var baseFee = zone?.base_fee || 25;
      var perKmFee = zone?.per_km_fee || 10;
      var maxDist = zone?.max_distance_km || 10;
      var dist = Math.min(distanceKm || 1, maxDist);
      var fee = Math.round(baseFee + (dist * perKmFee));
      // Vehicle multipliers
      var multipliers = { on_foot: 0.7, bicycle: 0.85, motorcycle: 1.0, bajaj: 1.3 };
      fee = Math.round(fee * (multipliers[vehicleType] || 1.0));
      return Math.max(20, fee); // Minimum fee Br 20
    }
    
    function findBestDrivers(config, zoneNames, vehicleType, maxResults) {
      var candidates = config.personnel.filter(function(d) { 
        return d.status === 'approved' && d.is_online === true;
      });
      // Sort by driver_score descending
      candidates.sort(function(a, b) { return (b.driver_score || 0) - (a.driver_score || 0); });
      return candidates.slice(0, maxResults || 3);
    }

    // ===== DRIVER REGISTRATION =====
    if (path === '/api/delivery/register' && method === 'POST') {
      var b = req.body || {};
      if (!b.fayda_id || !b.full_name_latin || !b.phone || !b.emergency_name || !b.emergency_phone || !b.vehicle_type) {
        return res.status(400).json({ error: 'Missing required fields (fayda_id, full_name, phone, emergency, vehicle_type)' });
      }
      if (!['on_foot', 'bicycle', 'motorcycle', 'bajaj'].includes(b.vehicle_type)) {
        return res.status(400).json({ error: 'Invalid vehicle type' });
      }
      try {
        var config = await getDeliveryConfig();
        // Check for duplicate Fayda ID
        var existing = config.personnel.find(function(d) { return d.fayda_id === b.fayda_id; });
        if (existing) return res.status(409).json({ error: 'A driver with this Fayda ID already exists' });
        
        var driver = {
          id: Date.now(),
          telegram_id: b.telegram_id || null,
          full_name_amharic: b.full_name_amharic || '',
          full_name_latin: b.full_name_latin,
          phone: b.phone,
          email: b.email || '',
          fayda_id: b.fayda_id,
          fayda_id_front_url: b.fayda_id_front_url || '',
          fayda_id_back_url: b.fayda_id_back_url || '',
          fayda_selfie_url: b.fayda_selfie_url || '',
          vehicle_type: b.vehicle_type,
          license_plate: b.license_plate || '',
          vehicle_photo_url: b.vehicle_photo_url || '',
          service_zones: b.service_zones || [],
          available_hours: b.available_hours || [],
          available_days: b.available_days || [],
          emergency_name: b.emergency_name,
          emergency_phone: b.emergency_phone,
          emergency_relationship: b.emergency_relationship || 'Other',
          emergency_address: b.emergency_address || '',
          bank_name: b.bank_name || '',
          bank_account: b.bank_account || '',
          telebirr_number: b.telebirr_number || '',
          status: 'pending_fayda',
          rating: 0,
          total_deliveries: 0,
          total_earnings: 0,
          driver_score: 0,
          driver_tier: 'bronze',
          is_online: false,
          agreed_to_terms_at: b.agreed_to_terms ? new Date().toISOString() : null,
          otp_verified: false,
          joined_at: new Date().toISOString(),
          last_active_at: null,
        };
        config.personnel.push(driver);
        await saveDeliveryConfig({ delivery_personnel: config.personnel });
        
        // Notify admin
        try {
          var bt = process.env.TELEGRAM_ADMIN_BOT_TOKEN || '';
          if (bt) {
            await fetch('https://api.telegram.org/bot' + bt + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: adminChatId,
                text: '🆕 *New Driver Registration*\n\n👤 ' + b.full_name_latin + '\n🆔 Fayda: ' + b.fayda_id + '\n🚗 ' + b.vehicle_type + '\n📞 ' + b.phone + '\n\n[Approve in Admin Panel → Delivery]',
                parse_mode: 'Markdown'
              })
            });
          }
        } catch(e) {}
        
        return res.json({ success: true, driver: driver });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== GET APPLICATIONS (Admin) =====
    if (path === '/api/delivery/applications' && method === 'GET') {
      var config = await getDeliveryConfig();
      return res.json({ applications: config.personnel.filter(function(d) { return d.status === 'pending_fayda' || d.status === 'pending_review'; }) });
    }

    // ===== LIST ALL DRIVERS (Admin) =====
    if (path === '/api/delivery/drivers' && method === 'GET') {
      var config = await getDeliveryConfig();
      return res.json({ drivers: config.personnel });
    }

    // ===== APPROVE/REJECT DRIVER (Admin) =====
    if (path === '/api/delivery/approve' && method === 'POST') {
      var b = req.body || {};
      var driverId = b.id;
      var newStatus = b.status || 'approved'; // approved, rejected, suspended
      var reason = b.reason || '';
      try {
        var config = await getDeliveryConfig();
        var found = false;
        for (var i = 0; i < config.personnel.length; i++) {
          if (config.personnel[i].id == driverId || config.personnel[i].id === String(driverId)) {
            config.personnel[i].status = newStatus;
            if (reason) config.personnel[i].rejection_reason = reason;
            if (newStatus === 'approved') {
              config.personnel[i].driver_score = 60; // Starting score
              config.personnel[i].driver_tier = 'bronze';
            }
            found = true;
            break;
          }
        }
        if (!found) return res.status(404).json({ error: 'Driver not found' });
        await saveDeliveryConfig({ delivery_personnel: config.personnel });
        
        // Notify driver
        var approvedDriver = null;
        for (var j = 0; j < config.personnel.length; j++) {
          if (config.personnel[j].id == driverId || config.personnel[j].id === String(driverId)) {
            approvedDriver = config.personnel[j];
            break;
          }
        }
        if (approvedDriver?.telegram_id) {
          try {
            var msg = newStatus === 'approved'
              ? '✅ *Smart Shop Express — Application Approved!* 🎉\n\nYou can now start accepting deliveries. Open your driver dashboard to go online and receive orders.\n\n🚀 Tap below to open:'
              : '❌ *Smart Shop Express — Application Status*\n\nYour application has been reviewed.\nStatus: ' + newStatus + '\n' + (reason ? 'Reason: ' + reason : '');
            await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: approvedDriver.telegram_id,
                text: msg,
                parse_mode: 'Markdown',
                reply_markup: newStatus === 'approved' ? JSON.stringify({
                  inline_keyboard: [[{ text: '🚀 Open Driver Dashboard', web_app: { url: 'https://smartshop-steel.vercel.app/driver' } }]]
                }) : undefined
              })
            });
          } catch(e) {}
        }
        return res.json({ success: true, status: newStatus });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== DELETE/SUSPEND DRIVER (Admin) =====
    if (path.startsWith('/api/delivery/drivers/') && method === 'DELETE') {
      var driverId = parseInt(path.split('/').pop() || '0');
      try {
        var config = await getDeliveryConfig();
        var deletedDriver = null;
        var filtered = [];
        for (var i = 0; i < config.personnel.length; i++) {
          if (config.personnel[i].id == driverId || config.personnel[i].id === String(driverId)) {
            config.personnel[i].status = 'suspended';
            deletedDriver = config.personnel[i];
            filtered.push(config.personnel[i]);
          } else {
            filtered.push(config.personnel[i]);
          }
        }
        // Keep the driver record but mark as suspended
        await saveDeliveryConfig({ delivery_personnel: filtered });
        if (deletedDriver?.telegram_id) {
          try {
            await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: deletedDriver.telegram_id, text: '⚠️ *Smart Shop Express*\n\nYour delivery account has been suspended. Please contact support for more information.', parse_mode: 'Markdown' })
            });
          } catch(e) {}
        }
        return res.json({ success: true, deleted: true });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== DELIVERY ZONES =====
    if (path === '/api/delivery/zones') {
      if (method === 'GET') {
        var config = await getDeliveryConfig();
        return res.json({ zones: config.zones });
      }
      if (method === 'POST') {
        var config = await getDeliveryConfig();
        var zone = { id: Date.now(), ...req.body, active: true };
        config.zones.push(zone);
        await saveDeliveryConfig({ delivery_zones: config.zones });
        return res.json({ success: true, zone: zone });
      }
    }

    // ===== CALCULATE DELIVERY FEE =====
    if (path === '/api/delivery/calculate-fee' && method === 'POST') {
      var b = req.body || {};
      var config = await getDeliveryConfig();
      var zone = config.zones.find(function(z) { return z.name === (b.zone || b.zone_name); }) || config.zones[0] || { base_fee: 25, per_km_fee: 10, max_distance_km: 10 };
      var fee = calculateDeliveryFee(zone, b.distance_km || 1, b.vehicle_type || 'motorcycle');
      var commission = Math.round(fee * 0.2);
      return res.json({ fee: fee, commission: commission, driver_payout: fee - commission, zone: zone.name, distance: b.distance_km || 0 });
    }

    // ===== CREATE DELIVERY =====
    if (path === '/api/delivery/create' && method === 'POST') {
      var b = req.body || {};
      if (!b.order_number) return res.status(400).json({ error: 'order_number required' });
      try {
        var config = await getDeliveryConfig();
        var zone = config.zones.find(function(z) { return z.name === (b.zone || b.zone_name); }) || config.zones[0] || {};
        var distance = b.distance_km || 1;
        var vehicleType = b.vehicle_type || 'motorcycle';
        var fee = calculateDeliveryFee(zone, distance, vehicleType);
        var commission = Math.round(fee * 0.2);
        var pin = generatePin();
        
        var delivery = {
          id: Date.now(),
          order_number: b.order_number,
          driver_id: null,
          vendor_id: b.vendor_id || null,
          customer_telegram_id: b.customer_telegram_id || null,
          status: 'pending',
          item_count: b.item_count || 0,
          delivery_pin: pin,
          no_contact: b.no_contact || false,
          cod_amount: b.cod_amount || 0,
          fee: fee,
          platform_commission: commission,
          driver_payout: fee - commission,
          distance_km: distance,
          pickup_address: b.pickup_address || '',
          delivery_address: b.delivery_address || '',
          pickup_lat: b.pickup_lat || null,
          pickup_lng: b.pickup_lng || null,
          delivery_lat: b.delivery_lat || null,
          delivery_lng: b.delivery_lng || null,
          created_at: new Date().toISOString(),
        };
        
        config.deliveries.push(delivery);
        await saveDeliveryConfig({ deliveries: config.deliveries });
        
        // Auto-assign: find best drivers and offer
        var drivers = findBestDrivers(config, b.service_zones || [], vehicleType, 3);
        
        return res.json({ success: true, delivery: delivery, driver_candidates: drivers.length, pin: pin });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== GET AVAILABLE DELIVERIES (Driver) =====
    if (path === '/api/delivery/available' && method === 'GET') {
      var config = await getDeliveryConfig();
      var pending = config.deliveries.filter(function(d) { return d.status === 'pending' || d.status === 'assigned'; });
      return res.json({ deliveries: pending });
    }

    // ===== ACCEPT DELIVERY (Driver) =====
    if (path === '/api/delivery/accept' && method === 'POST') {
      var b = req.body || {};
      var deliveryId = b.id;
      var driverId = b.driver_id;
      if (!deliveryId || !driverId) return res.status(400).json({ error: 'delivery_id and driver_id required' });
      try {
        var config = await getDeliveryConfig();
        for (var i = 0; i < config.deliveries.length; i++) {
          if (config.deliveries[i].id == deliveryId) {
            config.deliveries[i].status = 'assigned';
            config.deliveries[i].driver_id = driverId;
            config.deliveries[i].assigned_at = new Date().toISOString();
            break;
          }
        }
        await saveDeliveryConfig({ deliveries: config.deliveries });
        return res.json({ success: true, status: 'assigned' });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== UPDATE DELIVERY STATUS (Driver) =====
    if (path === '/api/delivery/status' && method === 'POST') {
      var b = req.body || {};
      var deliveryId = b.id;
      var newStatus = b.status;
      if (!deliveryId || !newStatus) return res.status(400).json({ error: 'id and status required' });
      var validStatuses = ['accepted', 'at_vendor', 'picked_up', 'in_transit', 'arrived', 'delivered', 'failed'];
      if (!validStatuses.includes(newStatus)) return res.status(400).json({ error: 'Invalid status' });
      try {
        var config = await getDeliveryConfig();
        var delivery = null;
        for (var i = 0; i < config.deliveries.length; i++) {
          if (config.deliveries[i].id == deliveryId) {
            config.deliveries[i].status = newStatus;
            if (newStatus === 'accepted') config.deliveries[i].accepted_at = new Date().toISOString();
            if (newStatus === 'picked_up') config.deliveries[i].picked_up_at = new Date().toISOString();
            if (newStatus === 'delivered') config.deliveries[i].delivered_at = new Date().toISOString();
            if (newStatus === 'picked_up' && b.item_count) config.deliveries[i].item_count_confirmed_at_vendor = b.item_count;
            if (newStatus === 'delivered' && b.item_count) config.deliveries[i].item_count_confirmed_at_customer = b.item_count;
            delivery = config.deliveries[i];
            break;
          }
        }
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
        await saveDeliveryConfig({ deliveries: config.deliveries });
        
        // Notify customer
        if (delivery.customer_telegram_id) {
          var statusMessages = {
            'accepted': '🏍️ *Driver assigned!*\n\nYour delivery driver is heading to the vendor to pick up your order.',
            'picked_up': '📦 *Order picked up!*\n\nYour package is on the way! ETA depends on distance.',
            'in_transit': '🚚 *Your order is in transit!*\n\nTrack your delivery in the app.',
            'arrived': '📍 *Driver has arrived!*\n\nYour driver is at your location.',
            'delivered': '✅ *Delivered!* 🎉\n\nYour order has arrived. Thank you for shopping with Smart Shop!\n\n⭐ Please rate your delivery experience.',
          };
          var msg = statusMessages[newStatus] || '📋 *Delivery update:* ' + newStatus;
          try {
            await fetch('https://api.telegram.org/bot' + VENDOR_BOT_TOKEN + '/sendMessage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ chat_id: delivery.customer_telegram_id, text: msg, parse_mode: 'Markdown' })
            });
          } catch(e) {}
        }
        
        // If delivered, create earnings and notify admin
        if (newStatus === 'delivered') {
          var driver = config.personnel.find(function(d) { return d.id == delivery.driver_id; });
          if (driver) {
            driver.total_deliveries = (driver.total_deliveries || 0) + 1;
            driver.total_earnings = (driver.total_earnings || 0) + (delivery.driver_payout || 0);
            driver.driver_score = calculateDriverScore({ onTimeRate: 95, rating: driver.rating || 4.5, totalDeliveries: driver.total_deliveries, experienceMonths: 1 });
            driver.driver_tier = getDriverTier(driver.driver_score);
            
            config.earnings.push({
              id: Date.now(),
              driver_id: delivery.driver_id,
              delivery_id: delivery.id,
              amount: delivery.driver_payout || 0,
              commission: delivery.platform_commission || 0,
              type: 'delivery',
              status: 'pending',
              created_at: new Date().toISOString()
            });
          }
          await saveDeliveryConfig({ delivery_personnel: config.personnel, deliveries: config.deliveries, driver_earnings: config.earnings });
        }
        
        return res.json({ success: true, status: newStatus });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== VERIFY DELIVERY PIN (Driver completes delivery) =====
    if (path === '/api/delivery/verify-pin' && method === 'POST') {
      var b = req.body || {};
      var deliveryId = b.id;
      var enteredPin = b.pin;
      try {
        var config = await getDeliveryConfig();
        var delivery = config.deliveries.find(function(d) { return d.id == deliveryId; });
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
        if (delivery.delivery_pin !== enteredPin) return res.status(400).json({ error: 'Invalid PIN' });
        delivery.status = 'delivered';
        delivery.pin_verified_at = new Date().toISOString();
        delivery.delivered_at = new Date().toISOString();
        await saveDeliveryConfig({ deliveries: config.deliveries });
        return res.json({ success: true, message: 'Delivery confirmed!' });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== CONFIRM ITEM COUNT =====
    if (path === '/api/delivery/confirm-items' && method === 'POST') {
      var b = req.body || {};
      var deliveryId = b.id;
      var itemCount = b.item_count;
      var stage = b.stage || 'vendor'; // 'vendor' or 'customer'
      if (!deliveryId || !itemCount) return res.status(400).json({ error: 'id and item_count required' });
      try {
        var config = await getDeliveryConfig();
        for (var i = 0; i < config.deliveries.length; i++) {
          if (config.deliveries[i].id == deliveryId) {
            if (stage === 'vendor') config.deliveries[i].item_count_confirmed_at_vendor = itemCount;
            else config.deliveries[i].item_count_confirmed_at_customer = itemCount;
            break;
          }
        }
        await saveDeliveryConfig({ deliveries: config.deliveries });
        return res.json({ success: true });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== GET DELIVERY TRACKING (Customer) =====
    if (path.startsWith('/api/delivery/tracking/') && method === 'GET') {
      var orderNum = path.replace('/api/delivery/tracking/', '');
      try {
        var config = await getDeliveryConfig();
        var delivery = config.deliveries.find(function(d) { return d.order_number === orderNum; });
        if (!delivery) return res.status(404).json({ error: 'Delivery not found' });
        var driver = null;
        if (delivery.driver_id) {
          driver = config.personnel.find(function(d) { return d.id == delivery.driver_id; });
        }
        return res.json({ success: true, delivery: delivery, driver: driver ? { name: driver.full_name_latin, rating: driver.rating, phone: driver.phone, tier: driver.driver_tier, lat: driver.current_lat, lng: driver.current_lng, vehicle_type: driver.vehicle_type } : null });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== RATE DELIVERY =====
    if (path === '/api/delivery/rate' && method === 'POST') {
      var b = req.body || {};
      var deliveryId = b.id;
      var rating = b.rating;
      var type = b.type || 'driver'; // 'driver' or 'customer'
      if (!deliveryId || !rating) return res.status(400).json({ error: 'id and rating required' });
      if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });
      try {
        var config = await getDeliveryConfig();
        for (var i = 0; i < config.deliveries.length; i++) {
          if (config.deliveries[i].id == deliveryId) {
            if (type === 'driver') config.deliveries[i].driver_rating = rating;
            else config.deliveries[i].customer_rating = rating;
            break;
          }
        }
        // Update driver average rating
        if (type === 'driver') {
          var delivery = config.deliveries.find(function(d) { return d.id == deliveryId; });
          if (delivery?.driver_id) {
            var driverDeliveries = config.deliveries.filter(function(d) { return d.driver_id == delivery.driver_id && d.driver_rating; });
            var avgRating = 0;
            if (driverDeliveries.length > 0) {
              var sum = driverDeliveries.reduce(function(s, d) { return s + (d.driver_rating || 0); }, 0);
              avgRating = Math.round((sum / driverDeliveries.length) * 10) / 10;
            }
            for (var j = 0; j < config.personnel.length; j++) {
              if (config.personnel[j].id == delivery.driver_id) {
                config.personnel[j].rating = avgRating;
                break;
              }
            }
          }
        }
        await saveDeliveryConfig({ deliveries: config.deliveries, delivery_personnel: config.personnel });
        return res.json({ success: true });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== DELIVERY HISTORY (Driver) =====
    if (path.startsWith('/api/delivery/history/') && method === 'GET') {
      var driverId = parseInt(path.split('/').pop() || '0');
      try {
        var config = await getDeliveryConfig();
        var history = config.deliveries.filter(function(d) { return d.driver_id == driverId; });
        return res.json({ deliveries: history });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== DRIVER EARNINGS =====
    if (path.startsWith('/api/delivery/earnings/') && method === 'GET') {
      var driverId = parseInt(path.split('/').pop() || '0');
      try {
        var config = await getDeliveryConfig();
        var earnings = config.earnings.filter(function(e) { return e.driver_id == driverId; });
        var totalPending = earnings.filter(function(e) { return e.status === 'pending'; }).reduce(function(s, e) { return s + e.amount; }, 0);
        var totalPaid = earnings.filter(function(e) { return e.status === 'paid'; }).reduce(function(s, e) { return s + e.amount; }, 0);
        return res.json({ earnings: earnings, total_pending: totalPending, total_paid: totalPaid });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== UPDATE DRIVER LOCATION =====
    if (path === '/api/delivery/location' && method === 'POST') {
      var b = req.body || {};
      var driverId = b.driver_id;
      var lat = b.lat;
      var lng = b.lng;
      if (!driverId) return res.status(400).json({ error: 'driver_id required' });
      try {
        var config = await getDeliveryConfig();
        for (var i = 0; i < config.personnel.length; i++) {
          if (config.personnel[i].id == driverId) {
            config.personnel[i].current_lat = lat || null;
            config.personnel[i].current_lng = lng || null;
            config.personnel[i].location_updated_at = new Date().toISOString();
            break;
          }
        }
        await saveDeliveryConfig({ delivery_personnel: config.personnel });
        return res.json({ success: true });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== TOGGLE DRIVER ONLINE/OFFLINE =====
    if (path === '/api/delivery/online' && method === 'POST') {
      var b = req.body || {};
      var driverId = b.driver_id;
      var isOnline = b.is_online === true;
      if (!driverId) return res.status(400).json({ error: 'driver_id required' });
      try {
        var config = await getDeliveryConfig();
        for (var i = 0; i < config.personnel.length; i++) {
          if (config.personnel[i].id == driverId) {
            config.personnel[i].is_online = isOnline;
            config.personnel[i].last_active_at = new Date().toISOString();
            break;
          }
        }
        await saveDeliveryConfig({ delivery_personnel: config.personnel });
        return res.json({ success: true, is_online: isOnline });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== SEND MESSAGE (In-chat) =====
    if (path === '/api/delivery/message' && method === 'POST') {
      var b = req.body || {};
      if (!b.delivery_id || !b.sender_type || !b.message) return res.status(400).json({ error: 'delivery_id, sender_type, and message required' });
      try {
        var config = await getDeliveryConfig();
        var msg = {
          id: Date.now(),
          delivery_id: b.delivery_id,
          sender_type: b.sender_type,
          sender_id: b.sender_id || null,
          message: b.message,
          created_at: new Date().toISOString()
        };
        config.messages.push(msg);
        await saveDeliveryConfig({ delivery_messages: config.messages });
        return res.json({ success: true, message: msg });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }

    // ===== GET MESSAGES (In-chat) =====
    if (path.startsWith('/api/delivery/messages/') && method === 'GET') {
      var deliveryId = parseInt(path.split('/').pop() || '0');
      try {
        var config = await getDeliveryConfig();
        var messages = config.messages.filter(function(m) { return m.delivery_id == deliveryId; });
        return res.json({ messages: messages });
      } catch(e) { return res.status(500).json({ error: e.message }); }
    }
return res.status(404).json({ error: 'User not found' });

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
        } else {
          // CRITICAL: Explicitly set vendor_status to 'none' when no vendor found
          // so the frontend knows to show "Become a Vendor" instead of stale status
          result.vendor_status = 'none';
        }
      } catch(e) {
        result.vendor_status = 'none';
      }

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
