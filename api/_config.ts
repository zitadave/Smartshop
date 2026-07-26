// ============================================
// Smart Shop API — Shared Configuration
// ============================================
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// ── Env — NO hardcoded fallbacks for secrets ───────────────────────
export const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://auaendcgszofgvdfdajt.supabase.co',
  get SUPABASE_KEY() { return process.env.SUPABASE_SERVICE_KEY || ''; },
  get BOT_TOKEN() { return process.env.TELEGRAM_BOT_TOKEN || ''; },
  get ADMIN_BOT_TOKEN() { return process.env.TELEGRAM_ADMIN_BOT_TOKEN || ''; },
  get VENDOR_BOT_TOKEN() { return process.env.VENDOR_BOT_TOKEN || ''; },
  adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '336997351',
  CHAPA_SECRET_KEY: process.env.CHAPA_SECRET_KEY || '',
  get BASE_URL() {
    return process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://smartshop-steel.vercel.app';
  },
};

// ── Supabase client (service_role — server-side only) ──────────────
export const supabase = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY, {
  auth: { persistSession: false },
});

// ── Product Normalizer ─────────────────────────────────────────────
export function normalizeProduct(p: any) {
  if (!p) return null;
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
    preOrderDeposit: p.pre_order_deposit || null,
    preOrderReleaseDate: p.pre_order_release_date || null,
    preOrderMax: p.pre_order_max || null,
  };
}

// ── Vendor Helpers (stored in settings.data.vendors) ──────────────
export async function getVendors(): Promise<any[]> {
  try {
    const { data: row } = await supabase.from('settings').select('*').single();
    return (row?.data?.vendors) || [];
  } catch { return []; }
}

export async function saveVendors(vendors: any[]): Promise<void> {
  try {
    const { data: row } = await supabase.from('settings').select('*').single();
    const newData = { ...(row?.data || {}), vendors };
    if (row) {
      await supabase.from('settings').update({ data: newData, updated_at: new Date().toISOString() }).eq('id', row.id);
    } else {
      await supabase.from('settings').insert({ data: newData });
    }
  } catch (e: any) { console.error('saveVendors error:', e?.message || e); }
}

// ── Telegram Auth Verification ─────────────────────────────────────
export function verifyTelegramInitData(initData: string): { valid: boolean; user: any } {
  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    if (!hash) return { valid: false, user: null };
    params.delete('hash');

    const dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(ENV.BOT_TOKEN).digest();
    const computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (computedHash !== hash) return { valid: false, user: null };
    const userStr = params.get('user');
    return { valid: true, user: userStr ? JSON.parse(userStr) : null };
  } catch {
    return { valid: false, user: null };
  }
}
