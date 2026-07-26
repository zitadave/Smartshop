// ============================================
// Smart Shop API — Middleware: Rate Limiting, Logging, CORS
// ============================================

// ── Simple in-memory rate limiter (per IP, sliding window) ─────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;   // 1 minute
const RATE_LIMIT_MAX = 60;              // 60 requests per minute per IP

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  rateLimitStore.set(ip, record);
  return { allowed: true, remaining: RATE_LIMIT_MAX - record.count, resetAt: record.resetAt };
}

// ── Periodic cleanup of stale rate limit entries ───────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}, 60_000);

// ── Request Logger ─────────────────────────────────────────────────
export function logRequest(method: string, path: string, statusCode: number, durationMs: number, ip: string, error?: string) {
  const timestamp = new Date().toISOString();
  const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
  const msg = [
    `[${timestamp}]`,
    `[${level}]`,
    `${method} ${path}`,
    `→ ${statusCode}`,
    `${durationMs}ms`,
    `ip=${ip}`,
    error ? `error="${error}"` : '',
  ].filter(Boolean).join(' ');
  console.log(msg);
}

// ── CORS Headers ──────────────────────────────────────────────────
export function setCorsHeaders(res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Idempotency-Key');
}

// ── Unified response helpers ───────────────────────────────────────
export function ok(res: any, data: any, status = 200) {
  return res.status(status).json(data);
}

export function fail(res: any, message: string, status = 400) {
  return res.status(status).json({ error: message });
}

export function notFound(res: any, path: string, method: string) {
  return res.status(404).json({ error: 'Not found', path, method });
}

export function serverError(res: any, error: any) {
  console.error('Server error:', error?.message || error);
  return res.status(500).json({ error: error?.message || 'Internal server error' });
}

// ── Response time tracking middleware ──────────────────────────────
export function getDuration(start: [number, number]): number {
  const diff = process.hrtime(start);
  return Math.round(diff[0] * 1000 + diff[1] / 1_000_000);
}
