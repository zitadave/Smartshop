// ============================================
// Smart Shop — Wedding / Gift Registry
// Ethiopian culture: የሰርግ ስጦታ መዝገብ
// Stack: Supabase + Telegram (FREE)
// ============================================

export interface GiftRegistry {
  id: number;
  coupleName: string;
  coupleAmharicName: string;
  weddingDate: string;
  weddingLocation: string;
  message: string;
  items: RegistryItem[];
  shareToken: string;
  creatorTelegramId: number;
  createdAt: string;
}

export interface RegistryItem {
  id: number;
  registryId: number;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  purchased: number;
}

// ── Create wedding registry ──────────────────────────────────
export async function createRegistry(params: {
  coupleName: string;
  coupleAmharicName?: string;
  weddingDate: string;
  weddingLocation?: string;
  message?: string;
  telegramId: number;
  productIds: number[];
}): Promise<GiftRegistry> {
  const res = await fetch('/api/registries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create registry');
  return data.registry;
}

// ── Get registry by share token ──────────────────────────────
export async function getRegistryByToken(token: string): Promise<GiftRegistry | null> {
  const res = await fetch(`/api/registries/${token}`);
  const data = await res.json();
  return data.registry || null;
}

// ── Purchase a registry item (gift) ──────────────────────────
export async function purchaseRegistryItem(params: {
  token: string;
  itemId: number;
  quantity: number;
  buyerName: string;
  buyerTelegramId: number;
  message?: string;
}): Promise<{ success: boolean }> {
  const res = await fetch('/api/registries/contribute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

// ── Share registry to wedding guests ─────────────────────────
export function shareRegistry(registry: GiftRegistry): void {
  const link = `https://t.me/smart_shopping_et_bot?start=registry_${registry.shareToken}`;
  
  const remainingItems = registry.items
    .filter(i => i.purchased < i.quantity)
    .map(i => `  • ${i.productName}: ${i.purchased}/${i.quantity} ተገዝቷል`);

  let msg = `💍 *የ${registry.coupleAmharicName || registry.coupleName} ሰርግ ስጦታ መዝገብ*\n\n`;
  msg += `📅 የሰርግ ቀን: ${new Date(registry.weddingDate).toLocaleDateString()}\n\n`;
  msg += `🎁 *የተመረጡ ስጦታዎች:*\n`;
  msg += remainingItems.join('\n');
  msg += `\n\n👇 ስጦታ ለመግዛት አንኳኩ:\n${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(msg, { allowGroupChats: true });
  } else {
    navigator.clipboard.writeText(link);
  }
}

// ── Generate registry progress bar ───────────────────────────
export function getRegistryProgress(items: RegistryItem[]): {
  total: number;
  purchased: number;
  percentage: number;
} {
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const purchased = items.reduce((s, i) => s + i.price * i.purchased, 0);
  return {
    total,
    purchased,
    percentage: total > 0 ? Math.round((purchased / total) * 100) : 0,
  };
}
