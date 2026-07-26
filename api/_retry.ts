// ============================================
// Smart Shop API — Retry with Exponential Backoff & Timeout
// ============================================

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 5_000;  // 5 seconds
const DEFAULT_BASE_DELAY_MS = 200; // 200ms initial delay

/**
 * Sleep for given ms (promise-based)
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const timeout = options.timeout || DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Retry wrapper with exponential backoff + jitter
 * Retries on: network errors, 5xx status codes, timeouts
 * Does NOT retry on: 4xx (client errors)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit & { timeout?: number; maxRetries?: number } = {}
): Promise<Response> {
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options);

      // Don't retry 4xx client errors
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // 5xx or other server errors — retry
      if (response.status >= 500 && attempt < maxRetries) {
        const delay = calculateBackoff(attempt);
        console.warn(`[RETRY] ${url} returned ${response.status}, retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (err: any) {
      lastError = err;
      if (err.name === 'AbortError') {
        console.warn(`[TIMEOUT] ${url} timed out, attempt ${attempt + 1}/${maxRetries}`);
      } else {
        console.warn(`[NETWORK ERROR] ${url}: ${err.message}, attempt ${attempt + 1}/${maxRetries}`);
      }

      if (attempt < maxRetries) {
        const delay = calculateBackoff(attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError || new Error(`Request failed after ${maxRetries} retries: ${url}`);
}

/**
 * Exponential backoff with jitter
 * Formula: baseDelay * 2^attempt + random(0, 100)ms jitter
 */
function calculateBackoff(attempt: number): number {
  const exponential = DEFAULT_BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = Math.random() * 100;
  return Math.min(exponential + jitter, 10_000); // Cap at 10s
}

/**
 * Send Telegram message with retry + timeout
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string | number,
  text: string,
  parseMode: string = 'Markdown',
  extra: Record<string, any> = {}
): Promise<boolean> {
  if (!botToken) return false;
  try {
    const body: any = { chat_id: chatId, text, parse_mode: parseMode, disable_web_page_preview: true, ...extra };
    const res = await fetchWithRetry(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeout: 5_000,
        maxRetries: 2,
      }
    );
    const data = await res.json();
    return data.ok === true;
  } catch (e) {
    console.error('Telegram send failed:', e);
    return false;
  }
}

/**
 * Send Telegram notification to admin
 */
export async function notifyAdmin(text: string): Promise<boolean> {
  // Dynamic import to avoid circular deps
  const { ENV } = require('./_config');
  return sendTelegramMessage(ENV.ADMIN_BOT_TOKEN, ENV.adminChatId, text);
}
