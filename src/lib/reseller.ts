// ============================================
// Smart Shop — Smart Reseller Program
// Free: Existing affiliate system + Telegram
// ============================================

// ── Commission tiers: higher volume = higher rate ────────────────
const COMMISSION_TIERS: Array<{ minSales: number; rate: number; title: string }> = [
  { minSales: 0, rate: 5, title: 'ጀማሪ (Beginner)' },
  { minSales: 10, rate: 8, title: 'ሻጭ (Seller)' },
  { minSales: 50, rate: 12, title: 'ነጋዴ (Merchant)' },
  { minSales: 200, rate: 15, title: 'ንግድ ባለሙያ (Pro)' },
];

/**
 * Generate a unique referral code from Telegram ID
 */
export function generateReferralCode(telegramId: number): string {
  // Use a simple hash to create a short, readable code
  const hash = ((telegramId * 16807) % 2147483647).toString(36).toUpperCase();
  return 'SS' + hash.substring(0, 5);
}

/**
 * Create a referral link for a product
 */
export function createReferralLink(productId: number, telegramId: number): string {
  const code = generateReferralCode(telegramId);
  return `https://smartshop-steel.vercel.app/?ref=${code}&product=${productId}`;
}

/**
 * Get the commission rate for a reseller based on their total sales
 */
export function getCommissionRate(totalSales: number): { rate: number; title: string; nextTier?: string } {
  let current = COMMISSION_TIERS[0];
  let next = null;

  for (let i = COMMISSION_TIERS.length - 1; i >= 0; i--) {
    if (totalSales >= COMMISSION_TIERS[i].minSales) {
      current = COMMISSION_TIERS[i];
      if (i < COMMISSION_TIERS.length - 1) {
        next = COMMISSION_TIERS[i + 1];
      }
      break;
    }
  }

  return {
    rate: current.rate,
    title: current.title,
    nextTier: next ? `${next.minSales - totalSales} more sales to reach ${next.title} (${next.rate}%)` : undefined,
  };
}

/**
 * Share a product as a reseller via Telegram
 */
export function shareProductAsReseller(product: { id: number; name: string; price: number; image: string }, telegramId: number): void {
  const link = createReferralLink(product.id, telegramId);
  const msg =
    `🛍️ *${product.name}*\n` +
    `💰 Br ${product.price}\n\n` +
    `ጓደኞቼ ከዚህ ቢገዙ ደስ ይለኛል! 🙏\n` +
    `ለእኔም ድጋፍ ይሆናል።\n\n` +
    `${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(msg, { allowGroupChats: true });
  } else {
    navigator.clipboard.writeText(link);
  }
}

/**
 * Get reseller stats from API
 */
export async function getResellerStats(telegramId: number): Promise<{
  totalClicks: number;
  totalSales: number;
  totalCommission: number;
  pendingPayout: number;
  referralCode: string;
  commissionRate: number;
  title: string;
  nextTier?: string;
}> {
  const res = await fetch(`/api/reseller/stats/${telegramId}`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  const stats = await res.json();

  const commissionInfo = getCommissionRate(stats.totalSales);
  return { ...stats, ...commissionInfo };
}
