// ============================================
// Smart Shop — Smart Reseller (Affiliate 2.0)
// Stack: Existing affiliate system + Telegram (FREE)
// ============================================

// ── Commission tiers (volume-based) ─────────────────────────
const COMMISSION_TIERS = [
  { minSales: 0, rate: 0.05 },     // 0-9 sales: 5%
  { minSales: 10, rate: 0.08 },    // 10-49 sales: 8%
  { minSales: 50, rate: 0.12 },    // 50-199 sales: 12%
  { minSales: 200, rate: 0.15 },   // 200+ sales: 15%
];

export function getCommissionRate(totalSales: number): number {
  let rate = COMMISSION_TIERS[0].rate;
  for (const tier of COMMISSION_TIERS) {
    if (totalSales >= tier.minSales) rate = tier.rate;
  }
  return rate;
}

// ── Generate referral code from Telegram ID ─────────────────
export function generateReferralCode(telegramId: number): string {
  const hash = Math.abs(telegramId * 16807 % 2147483647);
  return 'SS' + hash.toString(36).toUpperCase().padStart(5, '0').slice(-5);
}

// ── Create referral link ────────────────────────────────────
export function createReferralLink(productId: number, telegramId: number): string {
  const code = generateReferralCode(telegramId);
  return `https://smartshop-steel.vercel.app/?ref=${code}&product=${productId}`;
}

// ── Fetch reseller stats ────────────────────────────────────
export interface ResellerStats {
  referralCode: string;
  totalClicks: number;
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayout: number;
  commissionRate: number;
  recentSales: Array<{
    productName: string;
    amount: number;
    commission: number;
    date: string;
  }>;
}

export async function getResellerStats(telegramId: number): Promise<ResellerStats> {
  const res = await fetch(`/api/reseller/stats/${telegramId}`);
  const data = await res.json();
  return data;
}

// ── Share product with referral link ────────────────────────
export function shareProduct(product: {
  id: number;
  name: string;
  price: number;
  image: string;
}, telegramId: number): void {
  const link = createReferralLink(product.id, telegramId);
  
  const message =
    `🛍️ *${product.name}*\n` +
    `💰 Br ${product.price.toLocaleString()}\n\n` +
    `👇 ከዚህ ብትገዙ ደስ ይለኛል! አመሰግናለሁ 🙏\n${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true, allowBotChats: false });
  } else {
    navigator.clipboard.writeText(link);
  }
}

// ── Withdraw earnings ───────────────────────────────────────
export async function requestWithdrawal(params: {
  telegramId: number;
  amount: number;
  method: 'telebirr' | 'bank';
  accountNumber: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/reseller/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

// ── Get top resellers leaderboard ───────────────────────────
export interface TopReseller {
  name: string;
  referralCode: string;
  totalSales: number;
  totalCommission: number;
  rank: number;
}

export async function getResellerLeaderboard(limit = 10): Promise<TopReseller[]> {
  const res = await fetch(`/api/reseller/leaderboard?limit=${limit}`);
  const data = await res.json();
  return data.leaders || [];
}
