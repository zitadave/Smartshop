// ============================================
// Smart Shop API — Idempotency for Order Creation
// ============================================
import { supabase } from './_config';

// ── In-memory idempotency cache (in addition to DB check) ──────────
const processedKeys = new Map<string, { status: string; result: any }>();
const IDEMPOTENCY_TTL_MS = 86_400_000; // 24 hours

// Periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [key] of processedKeys) {
    // Entries don't have explicit expiry; we rely on the TTL from creation
  }
}, 60_000);

/**
 * Check if an idempotency key has already been processed
 * Returns cached result if found, null otherwise
 */
export async function checkIdempotency(key: string): Promise<{ status: string; result: any } | null> {
  // Check memory first (fast path)
  const cached = processedKeys.get(key);
  if (cached) return cached;

  // Check database (for persisted keys across cold starts)
  const { data } = await supabase
    .from('settings')
    .select('*')
    .single();

  const processedOrders = data?.data?.idempotency_keys || {};
  if (processedOrders[key]) {
    const entry = processedOrders[key];
    const age = Date.now() - new Date(entry.created_at).getTime();
    if (age < IDEMPOTENCY_TTL_MS) {
      processedKeys.set(key, entry);
      return entry;
    }
  }

  return null;
}

/**
 * Mark an idempotency key as processed
 */
export async function markIdempotency(key: string, status: string, result: any): Promise<void> {
  const entry = { status, result, created_at: new Date().toISOString() };
  processedKeys.set(key, entry);

  // Persist to DB (async — non-blocking)
  try {
    const { data: row } = await supabase.from('settings').select('*').single();
    const curData = row?.data || {};
    const processedOrders = { ...(curData.idempotency_keys || {}) };
    processedOrders[key] = entry;

    // Clean old entries
    for (const [k, v] of Object.entries(processedOrders)) {
      const age = Date.now() - new Date((v as any).created_at).getTime();
      if (age > IDEMPOTENCY_TTL_MS) delete processedOrders[k];
    }

    curData.idempotency_keys = processedOrders;
    await supabase.from('settings').update({ data: curData }).eq('id', row?.id || 0);
  } catch (e) {
    console.error('Idempotency persist error:', e);
  }
}

/**
 * Generate an order number with idempotency
 */
export function generateOrderNumber(): string {
  return 'ETH-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 4).toUpperCase();
}
