// ============================================
// Smart Shop — ማህበር ግዢ (Group Buying)
// Free: Supabase + Telegram
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
  shareToken: string;
  status: 'open' | 'active' | 'fulfilled' | 'expired';
  expiresAt: string;
  createdAt: string;
}

// ── Pricing tiers: more people = bigger discount ─────────────────
const PRICING_TIERS: Array<{ min: number; discount: number; label: string }> = [
  { min: 2, discount: 0.05, label: '5% OFF' },
  { min: 3, discount: 0.10, label: '10% OFF' },
  { min: 5, discount: 0.15, label: '15% OFF' },
  { min: 10, discount: 0.25, label: '25% OFF' },
];

/**
 * Calculate the group price based on member count
 */
export function calculateGroupPrice(regularPrice: number, members: number): number {
  let bestDiscount = 0;
  for (const tier of PRICING_TIERS) {
    if (members >= tier.min) bestDiscount = Math.max(bestDiscount, tier.discount);
  }
  return Math.round(regularPrice * (1 - bestDiscount));
}

/**
 * Get the discount label for a given member count
 */
export function getDiscountLabel(members: number): string {
  let bestLabel = 'No discount';
  for (const tier of PRICING_TIERS) {
    if (members >= tier.min) bestLabel = tier.label;
  }
  return bestLabel;
}

/**
 * Get the next tier threshold (how many more members needed)
 */
export function getNextTierMembers(members: number): number | null {
  for (const tier of PRICING_TIERS) {
    if (members < tier.min) return tier.min;
  }
  return null; // Max tier reached
}

/**
 * Get the savings at current tier
 */
export function getSavings(regularPrice: number, members: number): number {
  return regularPrice - calculateGroupPrice(regularPrice, members);
}

/**
 * Create a new group deal via API
 */
export async function createGroupDeal(params: {
  productId: number;
  productName: string;
  productImage: string;
  regularPrice: number;
  creatorTelegramId: number;
}): Promise<GroupDeal> {
  const groupPrice = calculateGroupPrice(params.regularPrice, 1); // Start at 1 person
  const res = await fetch('/api/group-deals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      product_id: params.productId,
      product_name: params.productName,
      product_image: params.productImage,
      regular_price: params.regularPrice,
      group_price: groupPrice,
      creator_telegram_id: params.creatorTelegramId,
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create group deal');
  return data.deal;
}

/**
 * Join an existing group deal
 */
export async function joinGroupDeal(params: {
  token: string;
  telegramId: number;
  fullName: string;
  phone: string;
}): Promise<{ success: boolean; deal: GroupDeal; message: string }> {
  const res = await fetch('/api/group-deals/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token: params.token,
      telegram_id: params.telegramId,
      full_name: params.fullName,
      phone: params.phone,
    }),
  });
  return res.json();
}

/**
 * Get group deal by share token
 */
export async function getGroupDeal(token: string): Promise<GroupDeal | null> {
  const res = await fetch(`/api/group-deals?token=${token}`);
  const data = await res.json();
  return data.deal || null;
}

/**
 * Generate Telegram share text for a group deal
 */
export function generateShareText(deal: GroupDeal): string {
  const savings = getSavings(deal.regularPrice, deal.currentMembers + 1);
  const nextTier = getNextTierMembers(deal.currentMembers + 1);
  const spotsLeft = deal.maxMembers - deal.currentMembers;
  const dealPrice = calculateGroupPrice(deal.regularPrice, deal.currentMembers + 1);
  const link = `https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken}`;

  let msg =
    `🛍️ *ማህበር ግዢ — Group Buy!*\n\n` +
    `📦 *${deal.productName}*\n` +
    `💰 መደበኛ ዋጋ: Br ${deal.regularPrice}\n` +
    `🎉 *የቡድን ዋጋ: Br ${dealPrice}* (ቆጠብህ ${savings} Br!)\n\n`;

  if (nextTier) {
    msg += `🎯 ${nextTier} ሰዎች ሲሆኑ ${getDiscountLabel(nextTier)}!\n`;
  }
  msg +=
    `👥 የቀሩ ቦታዎች: ${spotsLeft}\n` +
    `⏰ የሚያበቃው: ${new Date(deal.expiresAt).toLocaleDateString()}\n\n` +
    `👇 ለመቀላቀል አንኳኩ:\n${link}`;

  return msg;
}

/**
 * Share group deal to Telegram
 */
export function shareToTelegram(deal: GroupDeal): void {
  const text = generateShareText(deal);
  const tg = (window as any).Telegram?.WebApp;

  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(text, { allowGroupChats: true, allowBotChats: false });
  } else {
    const link = `https://t.me/smart_shopping_et_bot?start=group_${deal.shareToken}`;
    navigator.clipboard.writeText(link).then(() => {
      // Toast shown by caller
    });
  }
}
