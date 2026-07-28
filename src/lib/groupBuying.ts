// ============================================
// Smart Shop — ማህበር ግዢ (Group Buying)
// Ethiopian-inspired: like መሃበር saving groups
// Stack: Supabase + Telegram API (FREE)
// ============================================

export interface GroupDeal {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  regularPrice: number;
  groupPrice: number;
  minMembers: number;
  maxMembers: number;
  currentMembers: number;
  creatorTelegramId: number;
  creatorName: string;
  shareToken: string;
  status: 'open' | 'active' | 'fulfilled' | 'expired';
  expiresAt: string;
  createdAt: string;
}

export interface GroupDealMember {
  id: number;
  groupDealId: number;
  telegramId: number;
  fullName: string;
  phone: string;
  quantity: number;
  paid: boolean;
  joinedAt: string;
}

// ── Progressive discount tiers ───────────────────────────────
// More members = bigger savings for everyone
const DISCOUNT_TIERS = [
  { minMembers: 2, discount: 0.05 },   // 2 people → 5% off
  { minMembers: 3, discount: 0.10 },   // 3 people → 10% off
  { minMembers: 5, discount: 0.15 },   // 5 people → 15% off
  { minMembers: 8, discount: 0.20 },   // 8 people → 20% off
  { minMembers: 10, discount: 0.25 },  // 10 people → 25% off
];

export function calculateGroupPrice(regularPrice: number, memberCount: number): number {
  let bestDiscount = 0;
  for (const tier of DISCOUNT_TIERS) {
    if (memberCount >= tier.minMembers) {
      bestDiscount = Math.max(bestDiscount, tier.discount);
    }
  }
  return Math.round(regularPrice * (1 - bestDiscount));
}

export function getSavingsAmount(regularPrice: number, memberCount: number): number {
  return regularPrice - calculateGroupPrice(regularPrice, memberCount);
}

export function getNextTier(currentMembers: number): { minMembers: number; discount: number } | null {
  for (const tier of DISCOUNT_TIERS) {
    if (currentMembers < tier.minMembers) return tier;
  }
  return null;
}

// ── Create a group deal ──────────────────────────────────────
export async function createGroupDeal(params: {
  productId: number;
  productName: string;
  productImage: string;
  regularPrice: number;
  telegramId: number;
  creatorName: string;
}): Promise<GroupDeal> {
  const groupPrice = calculateGroupPrice(params.regularPrice, 1);
  
  const res = await fetch('/api/group-deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: params.productId,
      product_name: params.productName,
      product_image: params.productImage,
      regular_price: params.regularPrice,
      group_price: groupPrice,
      creator_telegram_id: params.telegramId,
      creator_name: params.creatorName,
    }),
  });
  
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create group deal');
  return data.deal;
}

// ── Join a group deal via share token ────────────────────────
export async function joinGroupDeal(params: {
  token: string;
  telegramId: number;
  fullName: string;
  phone: string;
}): Promise<{ success: boolean; deal?: GroupDeal; newPrice?: number }> {
  const res = await fetch('/api/group-deals/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  
  return res.json();
}

// ── Get active deals for a product ───────────────────────────
export async function getActiveDealsForProduct(productId: number): Promise<GroupDeal[]> {
  const res = await fetch(`/api/group-deals?product_id=${productId}`);
  const data = await res.json();
  return data.deals || [];
}

// ── Get user's group deals ───────────────────────────────────
export async function getUserGroupDeals(telegramId: number): Promise<GroupDeal[]> {
  const res = await fetch(`/api/group-deals?creator=${telegramId}`);
  const data = await res.json();
  return data.deals || [];
}

// ── Generate Telegram share message ───────────────────────────
export function generateShareMessage(deal: GroupDeal): string {
  const savings = deal.regularPrice - deal.groupPrice;
  const spotsLeft = deal.maxMembers - deal.currentMembers;
  const nextTier = getNextTier(deal.currentMembers);
  const link = `https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken}`;
  
  let msg = `🛍️ *ማህበር ግዢ — Group Buy!*\n\n`;
  msg += `📦 *${deal.productName}*\n`;
  msg += `💰 መደበኛ ዋጋ: Br ${deal.regularPrice.toLocaleString()}\n`;
  msg += `🎉 *የቡድን ዋጋ: Br ${deal.groupPrice.toLocaleString()}*`;
  if (savings > 0) msg += ` (ቆጥበህ ${savings.toLocaleString()} Br!)`;
  msg += `\n\n`;
  msg += `👥 የተቀሩ ቦታዎች: ${spotsLeft}\n`;
  if (nextTier) {
    const nextPrice = calculateGroupPrice(deal.regularPrice, nextTier.minMembers);
    msg += `🎯 ተጨማሪ ${nextTier.minMembers - deal.currentMembers} ሰው ከተቀላቀለ → Br ${nextPrice.toLocaleString()}\n`;
  }
  msg += `⏰ የሚያበቃበት: ${new Date(deal.expiresAt).toLocaleDateString()}\n\n`;
  msg += `👇 ለመቀላቀል አንኳኩ:\n${link}`;
  
  return msg;
}

// ── Share group deal to Telegram ─────────────────────────────
export function shareToTelegram(deal: GroupDeal): void {
  const message = generateShareMessage(deal);
  
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true, allowBotChats: false });
  } else {
    navigator.clipboard.writeText(`https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken}`);
  }
}

// ── Parse serialized custom group buy attributes ─────────────
export function parseSerializedName(rawName: string): { name: string; description: string; color: string; size: string } {
  if (!rawName) return { name: '', description: '', color: '', size: '' };
  const parts = rawName.split('::');
  return {
    name: parts[0] || '',
    description: parts[1] || '',
    color: parts[2] || '',
    size: parts[3] || '',
  };
}
