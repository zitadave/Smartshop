/**
 * Smart Shop — Admin Telegram Bot
 *
 * Dedicated bot for admin notifications & remote management.
 * Sends real-time alerts for orders, stock, SLA, and payments.
 * Supports commands: /start, /stats, /orders, /lowstock, /alerts
 *
 * BOT SETUP:
 * 1. @BotFather → /newbot → SmartShopAdminBot
 * 2. /setcommands:
 *    start - Welcome & menu
 *    stats - Store statistics
 *    orders - Recent orders
 *    lowstock - Low stock alerts
 *    alerts - Active SLA breaches
 * 3. Set TELEGRAM_ADMIN_BOT_TOKEN in Vercel env vars
 */

import { generateId, formatPrice } from '@/lib/utils';
import type { OrderFulfillment } from '@/lib/orderFulfillment';

// ============================================================
// Types
// ============================================================

export type BotCommand = 'start' | 'stats' | 'orders' | 'lowstock' | 'alerts' | 'help' | 'unknown';

export interface BotMessage {
  chatId: string;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  buttons?: { text: string; callback_data: string }[][];
}

export interface BotUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from?: { id: number; first_name: string; username?: string };
    chat: { id: number; type: string };
    text?: string;
    date: number;
  };
  callback_query?: {
    id: string;
    from: { id: number; first_name: string };
    message: { message_id: number; chat: { id: number } };
    data: string;
  };
}

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'low_stock' | 'sla_breach' | 'vendor_pending' | 'large_order' | 'daily_summary';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
  sent: boolean;
  sentAt?: string;
}

// ============================================================
// Command Parser
// ============================================================

export function parseCommand(text: string): { command: BotCommand; args: string } {
  if (!text || !text.startsWith('/')) return { command: 'unknown', args: '' };
  const parts = text.split(' ');
  const cmd = parts[0].toLowerCase().replace('/', '') as BotCommand;
  const args = parts.slice(1).join(' ');
  if (['start', 'stats', 'orders', 'lowstock', 'alerts', 'help'].includes(cmd)) {
    return { command: cmd, args };
  }
  return { command: 'unknown', args: text };
}

// ============================================================
// Command Response Builders
// ============================================================

export function buildStartResponse(firstName: string): BotMessage {
  return {
    chatId: '',
    text: `👋 *Welcome to Smart Shop Admin Bot, ${firstName}!*\n\nI'll notify you about:\n• 🛒 New orders\n• ⚠️ Low stock alerts\n• 📊 Daily store summary\n• 🚨 SLA breaches\n• 🏪 New vendor registrations\n\n*Commands:*\n/stats — View store statistics\n/orders — Recent orders\n/lowstock — Low stock products\n/alerts — Active SLA alerts\n/help — Show this menu`,
    parseMode: 'Markdown',
    buttons: [
      [{ text: '📊 Stats', callback_data: 'stats' }, { text: '📋 Orders', callback_data: 'orders' }],
      [{ text: '⚠️ Low Stock', callback_data: 'lowstock' }, { text: '🚨 Alerts', callback_data: 'alerts' }],
    ],
  };
}

export function buildStatsResponse(stats: {
  products: number; orders: number; revenue: number; vendors: number;
  lowStock: number; pendingVendors: number; slaBreaches: number;
}): BotMessage {
  const lines = [
    '📊 *Smart Shop — Store Statistics*',
    '',
    `📦 Products: ${stats.products}`,
    `📋 Orders: ${stats.orders}`,
    `💰 Revenue: ${formatPrice(stats.revenue)}`,
    `🏪 Vendors: ${stats.vendors}`,
    '',
    `⚠️ Low Stock: ${stats.lowStock}`,
    `⏳ Pending Vendors: ${stats.pendingVendors}`,
    `🚨 SLA Breaches: ${stats.slaBreaches}`,
    '',
    `_Last updated: ${new Date().toLocaleString()}_`,
  ];
  return { chatId: '', text: lines.join('\n'), parseMode: 'Markdown' };
}

export function buildOrdersResponse(orders: any[]): BotMessage {
  if (orders.length === 0) return { chatId: '', text: '📋 *No recent orders*', parseMode: 'Markdown' };
  const lines = ['📋 *Recent Orders*\n'];
  orders.slice(0, 5).forEach(o => {
    const icon = o.status === 'delivered' ? '✅' : o.status === 'shipped' ? '🚚' : o.status === 'processing' ? '📦' : '⏳';
    lines.push(`${icon} *${o.orderNumber}* — ${formatPrice(o.total || 0)} — ${o.status}`);
    if (o.customer?.name) lines.push(`   👤 ${o.customer.name}`);
    lines.push('');
  });
  lines.push(`_Showing ${Math.min(5, orders.length)} of ${orders.length} orders_`);
  return { chatId: '', text: lines.join('\n'), parseMode: 'Markdown' };
}

export function buildLowStockResponse(products: any[]): BotMessage {
  if (products.length === 0) return { chatId: '', text: '✅ *All products are well-stocked!*', parseMode: 'Markdown' };
  const lines = ['⚠️ *Low Stock Alerts*\n'];
  products.slice(0, 10).forEach(p => {
    const emoji = p.stockCount === 0 ? '❌' : p.stockCount <= 2 ? '🔴' : '🟡';
    lines.push(`${emoji} *${p.nameEn}* — ${p.stockCount} left — ${formatPrice(p.price)}`);
  });
  return { chatId: '', text: lines.join('\n'), parseMode: 'Markdown' };
}

export function buildAlertsResponse(breaches: { orderNumber: string; status: string; hours: number }[]): BotMessage {
  if (breaches.length === 0) return { chatId: '', text: '✅ *No active SLA breaches*', parseMode: 'Markdown' };
  const lines = ['🚨 *Active SLA Breaches*\n'];
  breaches.forEach(b => {
    lines.push(`⚠️ *${b.orderNumber}* — ${b.status} — ${b.hours}h elapsed`);
  });
  return { chatId: '', text: lines.join('\n'), parseMode: 'Markdown' };
}

// ============================================================
// HTTP Sender — sends message to Telegram Bot API
// ============================================================

const BOT_API_BASE = 'https://api.telegram.org/bot';

export async function sendBotMessage(
  botToken: string,
  chatId: string | number,
  message: BotMessage
): Promise<boolean> {
  try {
    const body: any = {
      chat_id: chatId,
      text: message.text,
      parse_mode: message.parseMode || 'HTML',
      disable_web_page_preview: true,
    };

    if (message.buttons) {
      body.reply_markup = {
        inline_keyboard: message.buttons.map(row =>
          row.map(btn => ({ text: btn.text, callback_data: btn.callback_data }))
        ),
      };
    }

    const res = await fetch(`${BOT_API_BASE}${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

export async function sendBotPhoto(
  botToken: string,
  chatId: string | number,
  photoUrl: string,
  caption?: string
): Promise<boolean> {
  try {
    const res = await fetch(`${BOT_API_BASE}${botToken}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption, parse_mode: 'HTML' }),
    });
    const data = await res.json();
    return data.ok === true;
  } catch {
    return false;
  }
}

// ============================================================
// Notification Queue
// ============================================================

const NOTIFICATIONS_KEY = 'ss_bot_notifications';

export function getPendingNotifications(): AdminNotification[] {
  try { return JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]'); } catch { return []; }
}

export function queueNotification(notif: AdminNotification): void {
  const all = getPendingNotifications();
  all.unshift(notif);
  try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all.slice(0, 50))); } catch {}
}

export function markSent(id: string): void {
  const all = getPendingNotifications();
  const updated = all.map(n => n.id === id ? { ...n, sent: true, sentAt: new Date().toISOString() } : n);
  try { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated)); } catch {}
}

export function clearNotifications(): void {
  try { localStorage.removeItem(NOTIFICATIONS_KEY); } catch {}
}

// ============================================================
// Generate notifications from system events
// ============================================================

export function generateNewOrderNotification(order: {
  orderNumber: string; total: number; customerName: string;
  itemCount: number; paymentMethod: string;
}): AdminNotification {
  return {
    id: generateId(),
    type: 'new_order',
    title: '🛒 New Order!',
    message: `Order ${order.orderNumber}: ${formatPrice(order.total)} from ${order.customerName} (${order.itemCount} items) via ${order.paymentMethod}`,
    severity: 'info',
    timestamp: new Date().toISOString(),
    sent: false,
  };
}

export function generateLowStockNotification(product: { nameEn: string; stockCount: number; price: number }): AdminNotification {
  return {
    id: generateId(),
    type: 'low_stock',
    title: '⚠️ Low Stock',
    message: `${product.nameEn} — Only ${product.stockCount} left! (${formatPrice(product.price)})`,
    severity: product.stockCount === 0 ? 'critical' : 'warning',
    timestamp: new Date().toISOString(),
    sent: false,
  };
}

export function generateSLABreachNotification(orderNumber: string, status: string, hours: number): AdminNotification {
  return {
    id: generateId(),
    type: 'sla_breach',
    title: '🚨 SLA Breach',
    message: `Order ${orderNumber} exceeded ${status} threshold (${hours}h elapsed)`,
    severity: 'critical',
    timestamp: new Date().toISOString(),
    sent: false,
  };
}
