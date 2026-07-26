// ============================================
// Smart Shop — Wedding/Gift Registry (የሰርግ ስጦታ መዝገብ)
// Free: Supabase + Telegram
// ============================================

export interface RegistryItem {
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  purchased: number;
}

export interface GiftRegistry {
  id: number;
  coupleName: string;
  weddingDate: string;
  eventType: 'wedding' | 'birthday' | 'baby_shower' | 'other';
  message: string;
  items: RegistryItem[];
  shareToken: string;
  creatorTelegramId: number;
  createdAt: string;
}

/**
 * Create a gift registry
 */
export async function createRegistry(params: {
  coupleName: string;
  weddingDate: string;
  eventType: string;
  message?: string;
  creatorTelegramId: number;
}): Promise<GiftRegistry> {
  const res = await fetch('/api/registries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      couple_name: params.coupleName,
      wedding_date: params.weddingDate,
      event_type: params.eventType,
      message: params.message || '',
      creator_telegram_id: params.creatorTelegramId,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create registry');
  return data.registry;
}

/**
 * Add a product to a registry
 */
export async function addRegistryItem(params: {
  registryId: number;
  productId: number;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
}): Promise<void> {
  const res = await fetch(`/api/registries/${params.registryId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: params.productId,
      product_name: params.productName,
      product_image: params.productImage,
      price: params.price,
      quantity: params.quantity,
    }),
  });
  if (!res.ok) throw new Error('Failed to add item');
}

/**
 * Contribute to a registry item (purchase a gift)
 */
export async function contributeToRegistry(params: {
  token: string;
  itemIndex: number;
  quantity: number;
  contributorName: string;
  contributorTelegramId: number;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/registries/contribute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: params.token,
      item_index: params.itemIndex,
      quantity: params.quantity,
      contributor_name: params.contributorName,
      contributor_telegram_id: params.contributorTelegramId,
    }),
  });
  return res.json();
}

/**
 * Get registry by share token
 */
export async function getRegistry(token: string): Promise<GiftRegistry | null> {
  const res = await fetch(`/api/registries?token=${token}`);
  const data = await res.json();
  return data.registry || null;
}

/**
 * Share registry to Telegram
 */
export function shareRegistry(registry: GiftRegistry): void {
  const totalItems = registry.items.length;
  const purchasedItems = registry.items.filter(i => i.purchased >= i.quantity).length;
  const progress = totalItems > 0 ? Math.round((purchasedItems / totalItems) * 100) : 0;

  const link = `https://t.me/smart_shopping_et_bot?start=registry_${registry.shareToken}`;
  const eventEmojis: Record<string, string> = {
    wedding: '💍', birthday: '🎂', baby_shower: '👶', other: '🎁',
  };
  const emoji = eventEmojis[registry.eventType] || '🎁';

  const msg =
    `${emoji} *${registry.coupleName} የስጦታ መዝገብ*\n` +
    `📅 ${new Date(registry.weddingDate).toLocaleDateString()}\n` +
    `📊 እድገት: ${progress}% (${purchasedItems}/${totalItems})\n\n` +
    registry.items.map((item, i) =>
      `  ${i + 1}. ${item.productName}: ${'🟦'.repeat(Math.min(item.purchased, 10))}${'⬜'.repeat(Math.max(0, Math.min(item.quantity - item.purchased, 10)))} ${item.purchased}/${item.quantity}`
    ).join('\n') +
    `\n\n👇 ስጦታ ለመግዛት:\n${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(msg, { allowGroupChats: true });
  } else {
    navigator.clipboard.writeText(link);
  }
}
