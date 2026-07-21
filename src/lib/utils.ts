import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency?: string): string {
  // Try to get user's selected currency from localStorage
  const userCurrency = currency || (typeof window !== 'undefined' ? 
    (() => { try { const c = localStorage.getItem('ss_currency'); return c ? JSON.parse(c) : 'ETB'; } catch { return 'ETB'; } })() : 'ETB');
  const rates: Record<string, number> = { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 };
  const symbols: Record<string, string> = { ETB: 'Br', USD: '$', EUR: '€', GBP: '£', KES: 'KSh' };
  const rate = rates[userCurrency] || 1;
  const sym = symbols[userCurrency] || 'Br';
  const converted = price * rate;
  if (userCurrency === 'ETB') return `Br ${Math.round(converted).toLocaleString()}`;
  return `${sym}${converted.toFixed(2)}`;
}

export function formatPriceWithCurrency(price: number, currency: string, rates?: Record<string, number>): string {
  const r = rates?.[currency] ?? { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }[currency] ?? 1;
  const sym = { ETB: 'Br', USD: '$', EUR: '€', GBP: '£', KES: 'KSh' }[currency] || currency;
  const converted = price * r;
  if (currency === 'ETB') return `${sym} ${Math.round(converted).toLocaleString()}`;
  return `${sym}${converted.toFixed(2)}`;
}

export function stars(rating: number = 0): string {
  const f = Math.floor(rating);
  const h = rating % 1 >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return '★'.repeat(f) + (h ? '½' : '') + '☆'.repeat(e);
}

export function getDeliveryEstimate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2 + Math.floor(Math.random() * 4));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function generateOrderNumber(): string {
  return 'ETH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}

/** Generate a printable digital receipt HTML */
export function generateReceiptHTML(receipt: {
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentReference?: string;
  storeName?: string;
}): string {
  const store = receipt.storeName || 'Smart Shop';
  const ref = receipt.paymentReference || `PAY-${receipt.orderNumber}`;
  const itemsRows = receipt.items.map(it => `
    <tr>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px">${it.name} × ${it.quantity}</td>
      <td style="padding:6px 8px;border-bottom:1px solid #e5e7eb;font-size:12px;text-align:right">Br ${it.total.toLocaleString()}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Receipt - ${receipt.orderNumber}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f3f4f6; padding:20px; }
    .receipt { max-width:420px; margin:0 auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { background:linear-gradient(135deg,#6C63FF,#4F46E5); padding:24px; text-align:center; color:white; }
    .header h1 { font-size:20px; font-weight:700; margin-bottom:4px; }
    .header p { font-size:11px; opacity:0.9; }
    .order-no { font-size:13px; font-family:monospace; background:rgba(255,255,255,0.15); display:inline-block; padding:4px 12px; border-radius:20px; margin-top:8px; }
    .body { padding:20px; }
    .section { margin-bottom:16px; }
    .section-title { font-size:10px; text-transform:uppercase; letter-spacing:0.08em; color:#9ca3af; font-weight:600; margin-bottom:8px; }
    .info-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; }
    .info-row .label { color:#6b7280; }
    .info-row .value { font-weight:500; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    th { text-align:left; font-size:10px; text-transform:uppercase; color:#9ca3af; font-weight:600; padding:6px 8px; border-bottom:2px solid #e5e7eb; }
    .totals { border-top:2px solid #e5e7eb; padding-top:12px; margin-top:12px; }
    .total-row { display:flex; justify-content:space-between; font-size:13px; padding:3px 0; }
    .total-row.final { font-size:18px; font-weight:700; color:#6C63FF; border-top:2px solid #e5e7eb; padding-top:8px; margin-top:8px; }
    .footer { text-align:center; padding:20px; font-size:11px; color:#9ca3af; border-top:1px solid #e5e7eb; }
    .badge { background:#dbeafe; color:#4F46E5; font-size:9px; padding:2px 8px; border-radius:10px; font-weight:600; }
    @media print { body { background:white; padding:0; } .receipt { box-shadow:none; } }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div style="font-size:28px;margin-bottom:6px;">🏪</div>
      <h1>${store}</h1>
      <p>Digital Receipt</p>
      <div class="order-no">${receipt.orderNumber}</div>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">Order Info</div>
        <div class="info-row"><span class="label">Date</span><span class="value">${receipt.date}</span></div>
        <div class="info-row"><span class="label">Payment</span><span class="value">${receipt.paymentMethod} <span class="badge">${ref.substring(0, 12)}</span></span></div>
        <div class="info-row"><span class="label">Status</span><span class="value" style="color:#10b981">✅ Paid</span></div>
      </div>

      <div class="section">
        <div class="section-title">Customer</div>
        <div class="info-row"><span class="label">Name</span><span class="value">${receipt.customerName}</span></div>
        <div class="info-row"><span class="label">Phone</span><span class="value">${receipt.customerPhone}</span></div>
        <div class="info-row"><span class="label">Address</span><span class="value">${receipt.customerAddress}</span></div>
      </div>

      <div class="section">
        <div class="section-title">Items</div>
        <table>
          <tr><th>Item</th><th style="text-align:right">Total</th></tr>
          ${itemsRows}
        </table>
      </div>

      <div class="totals">
        <div class="total-row"><span>Subtotal</span><span>Br ${receipt.subtotal.toLocaleString()}</span></div>
        ${receipt.discount > 0 ? `<div class="total-row" style="color:#10b981"><span>Discount</span><span>-Br ${receipt.discount.toLocaleString()}</span></div>` : ''}
        <div class="total-row final"><span>Total</span><span>Br ${receipt.total.toLocaleString()}</span></div>
      </div>
    </div>
    <div class="footer">
      <p>Thank you for shopping with ${store}! 🎉</p>
      <p style="margin-top:4px;font-size:10px;">For returns & exchanges, contact within 7 days</p>
    </div>
  </div>
  <script>window.print();</script>
</body>
</html>`;
}

/** Format time remaining for countdown timers */
export function formatTimeRemaining(ms: number): string {
  if (ms <= 0) return 'Ended';
  const totalSec = Math.floor(ms / 1000);
  const d = Math.floor(totalSec / 86400);
  const h = Math.floor((totalSec % 86400) / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** Format countdown as compact string */
export function formatCountdown(endTimestamp: number): string {
  const remaining = endTimestamp - Date.now();
  return formatTimeRemaining(remaining);
}

/** Check if a flash deal is still active */
export function isFlashDealActive(deal: { end: number }): boolean {
  return Date.now() < deal.end;
}

/** Calculate discount percentage */
export function calcDiscount(original: number, current: number): number {
  if (!original || original <= 0) return 0;
  return Math.round((1 - current / original) * 100);
}

/** Generate a unique ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

/** Group items by vendor */
export function groupByVendor(items: any[], vendorField = 'vendorName'): Record<string, any[]> {
  return items.reduce((acc, item) => {
    const key = item[vendorField] || 'Smart Shop';
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, any[]>);
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Check if string is valid URL */
export function isValidUrl(str: string): boolean {
  try { new URL(str); return true; } catch { return false; }
}

/** Truncate text with ellipsis */
export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}
