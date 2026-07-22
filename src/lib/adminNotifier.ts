/**
 * Smart Shop — Admin Telegram Notifier
 * Sends real-time notifications to the admin Telegram chat
 * for all important store events (create, edit, delete products, etc.)
 */
import { toast } from '@/components/Toast';

const STORAGE_KEY_TOKEN = 'ss_admin_bot_token';
const STORAGE_KEY_CHAT_ID = 'ss_admin_chat_id';

function getConfig(): { botToken: string; chatId: string } | null {
  try {
    const botToken = localStorage.getItem(STORAGE_KEY_TOKEN) || '';
    const chatId = localStorage.getItem(STORAGE_KEY_CHAT_ID) || '';
    if (!botToken || !chatId) return null;
    return { botToken, chatId };
  } catch { return null; }
}

/**
 * Send a message to the admin Telegram chat.
 * Only works if the admin has configured bot token + chat ID.
 */
export async function sendAdminTelegram(
  message: string,
  options?: { silent?: boolean }
): Promise<boolean> {
  const config = getConfig();
  if (!config) return false;

  try {
    const res = await fetch('/api/admin-bot/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chatId: config.chatId, message }),
    });
    const data = await res.json();
    if (data.sent && !options?.silent) {
      toast('📨 Telegram notification sent!', 'info');
    }
    return data.sent === true;
  } catch {
    return false;
  }
}

/** Notify when a product is created */
export function notifyProductCreated(product: { nameEn: string; price: number }) {
  return sendAdminTelegram(
    `🆕 <b>New Product Added!</b>\n\n📦 ${product.nameEn}\n💰 ${formatPriceTelegram(product.price)}\n👤 Added by admin`,
  );
}

/** Notify when a product is updated */
export function notifyProductUpdated(product: { nameEn: string; price: number }) {
  return sendAdminTelegram(
    `✏️ <b>Product Updated</b>\n\n📦 ${product.nameEn}\n💰 ${formatPriceTelegram(product.price)}`,
  );
}

/** Notify when a product is deleted */
export function notifyProductDeleted(nameEn: string) {
  return sendAdminTelegram(
    `🗑️ <b>Product Deleted</b>\n\n📦 ${nameEn}`,
  );
}

/** Notify when settings change */
export function notifySettingsChanged(detail: string) {
  return sendAdminTelegram(
    `⚙️ <b>Settings Changed</b>\n\n${detail}`,
  );
}

/** Notify when a vendor is updated */
export function notifyVendorUpdated(vendorName: string, changes: string) {
  return sendAdminTelegram(
    `🏪 <b>Vendor Updated</b>\n\n${vendorName}\n${changes}`,
  );
}

/** Notify demo/test */
export function notifyDemo(type: 'new_order' | 'low_stock') {
  if (type === 'new_order') {
    return sendAdminTelegram(
      `🛒 <b>🔔 DEMO: New Order!</b>\n\nOrder ETH-DEMO: Br 4,500 from Abebe K. (3 items) via Telebirr\n\n⚠️ <i>This is a test notification</i>`,
    );
  }
  return sendAdminTelegram(
    `⚠️ <b>🔔 DEMO: Low Stock Alert!</b>\n\nPremium Headphones — Only 2 left! (Br 1,500)\n\n⚠️ <i>This is a test notification</i>`,
  );
}

/** Notify CSV template download */
export function notifyTemplateDownloaded(count: number) {
  return sendAdminTelegram(
    `📄 <b>Bulk Import Template Downloaded</b>\n\nTemplate with ${count} sample products downloaded by admin.`,
  );
}

/** Notify bulk import results */
export function notifyBulkImportResults(success: number, failed: number) {
  return sendAdminTelegram(
    `📦 <b>Bulk Import Complete</b>\n\n✅ ${success} imported\n❌ ${failed} failed`,
  );
}

function formatPriceTelegram(price: number): string {
  return `Br ${price.toLocaleString()}`;
}
