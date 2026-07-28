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
}): Promise<{ success: boolean; deal?: GroupDeal; newPrice?: number; error?: string }> {
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
export function generateShareMessage(deal: GroupDeal | any): string {
  const parsed = parseSerializedName(deal.productName || deal.product_name || '');
  const displayName = parsed.name || deal.productName || deal.product_name || '';
  
  const link = `https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken || deal.share_token}`;
  
  let msg = `🛍️ *ማህበር ግዢ — Group Buy!*\n\n`;
  msg += `📦 *${displayName}*\n`;
  
  if (parsed.campaignType === 'target') {
    msg += `💰 መደበኛ ዋጋ: Br ${(deal.regularPrice || deal.regular_price || 0).toLocaleString()}\n`;
    msg += `🎯 *ዒላማ ዋጋ: Br ${parsed.targetPrice.toLocaleString()}* (If and Only If ${parsed.targetCount} join!)\n\n`;
    msg += `👥 ዒላማ አባላት: ${deal.currentMembers || deal.current_members || 0}/${parsed.targetCount}\n`;
    msg += `⏳ ${Math.max(0, parsed.targetCount - (deal.currentMembers || deal.current_members || 0))} more members needed to unlock the discount!\n`;
  } else {
    const savings = (deal.regularPrice || deal.regular_price || 0) - (deal.groupPrice || deal.group_price || 0);
    const spotsLeft = (deal.maxMembers || deal.max_members || 10) - (deal.currentMembers || deal.current_members || 0);
    const nextTier = getNextTier(deal.currentMembers || deal.current_members || 0);
    msg += `💰 መደበኛ ዋጋ: Br ${(deal.regularPrice || deal.regular_price || 0).toLocaleString()}\n`;
    msg += `🎉 *የቡድን ዋጋ: Br ${(deal.groupPrice || deal.group_price || 0).toLocaleString()}*`;
    if (savings > 0) msg += ` (ቆጥበህ ${savings.toLocaleString()} Br!)`;
    msg += `\n\n`;
    msg += `👥 የተቀሩ ቦታዎች: ${spotsLeft}\n`;
    if (nextTier) {
      const nextPrice = calculateGroupPrice(deal.regularPrice || deal.regular_price || 0, nextTier.minMembers);
      msg += `🎯 ተጨማሪ ${nextTier.minMembers - (deal.currentMembers || deal.current_members || 0)} ሰው ከተቀላቀለ → Br ${nextPrice.toLocaleString()}\n`;
    }
  }
  
  msg += `⏰ የሚያበቃበት: ${new Date(deal.expiresAt || deal.expires_at || Date.now()).toLocaleDateString()}\n\n`;
  msg += `👇 ለመቀላቀል አንኳኩ:\n${link}`;
  
  return msg;
}

// ── Share group deal to Telegram ─────────────────────────────
export function shareToTelegram(deal: GroupDeal | any): void {
  const message = generateShareMessage(deal);
  
  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true, allowBotChats: false });
  } else {
    navigator.clipboard.writeText(`https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken || deal.share_token}`);
  }
}

// ── Parse serialized custom group buy attributes ─────────────
export function parseSerializedName(rawName: string): { 
  name: string; 
  description: string; 
  color: string; 
  size: string;
  campaignType: 'progressive' | 'target';
  targetPrice: number;
  targetCount: number;
} {
  if (!rawName) return { name: '', description: '', color: '', size: '', campaignType: 'progressive', targetPrice: 0, targetCount: 3 };
  const parts = rawName.split('::');
  return {
    name: parts[0] || '',
    description: parts[1] || '',
    color: parts[2] || '',
    size: parts[3] || '',
    campaignType: (parts[4] as any) || 'progressive',
    targetPrice: Number(parts[5]) || 0,
    targetCount: Number(parts[6]) || 3,
  };
}
