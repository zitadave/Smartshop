// ============================================
// Smart Shop — Daily Subscriptions (የደንበኝነት ምርቶች)
// Stack: Supabase + Vercel Cron (FREE)
// ============================================

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly';

export interface Subscription {
  id: number;
  telegramId: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  price: number;
  dailyPrice: number;
  nextDelivery: string;
  status: 'active' | 'paused' | 'cancelled';
  createdAt: string;
  deliveryAddress: string;
  deliveryNote: string;
}

// ── Subscription discount tiers ─────────────────────────────
// Longer commitment = bigger savings
const FREQUENCY_DISCOUNTS: Record<SubscriptionFrequency, number> = {
  daily: 0.15,    // 15% off for daily subscriptions
  weekly: 0.10,   // 10% off for weekly
  monthly: 0.05,  // 5% off for monthly
};

export function getSubscriptionPrice(regularPrice: number, frequency: SubscriptionFrequency): number {
  const discount = FREQUENCY_DISCOUNTS[frequency] || 0;
  return Math.round(regularPrice * (1 - discount));
}

// ── Common Ethiopian subscription items ─────────────────────
export const SUBSCRIPTION_TEMPLATES = [
  { name: 'ወተት', emoji: '🥛', unit: '1ሊትር', freq: 'daily' as const },
  { name: 'እንቁላል', emoji: '🥚', unit: '12ቱ', freq: 'weekly' as const },
  { name: 'ዳቦ', emoji: '🍞', unit: '1', freq: 'daily' as const },
  { name: 'ውሃ ቢን', emoji: '💧', unit: '5ሊትር', freq: 'daily' as const },
  { name: 'ቡና', emoji: '☕', unit: '500ግ', freq: 'monthly' as const },
  { name: 'ማር', emoji: '🍯', unit: '500ግ', freq: 'monthly' as const },
  { name: 'ስኳር', emoji: '🍚', unit: '1ኪሎ', freq: 'monthly' as const },
  { name: 'ዘይት', emoji: '🫒', unit: '1ሊትር', freq: 'monthly' as const },
];

// ── Create subscription ─────────────────────────────────────
export async function createSubscription(params: {
  telegramId: number;
  productId: number;
  quantity: number;
  frequency: SubscriptionFrequency;
  deliveryAddress: string;
  deliveryNote?: string;
}): Promise<Subscription> {
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Subscription failed');
  return data.subscription;
}

// ── Update subscription status ──────────────────────────────
export async function updateSubscription(
  id: number,
  updates: { status?: 'active' | 'paused' | 'cancelled'; quantity?: number }
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

// ── Get user's subscriptions ────────────────────────────────
export async function getUserSubscriptions(telegramId: number): Promise<Subscription[]> {
  const res = await fetch(`/api/subscriptions?telegram_id=${telegramId}`);
  const data = await res.json();
  return data.subscriptions || [];
}

// ── Calculate next delivery date ────────────────────────────
export function calculateNextDelivery(frequency: SubscriptionFrequency): Date {
  const now = new Date();
  const next = new Date(now);
  
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      next.setHours(7, 0, 0, 0); // Deliver at 7 AM
      break;
    case 'weekly':
      next.setDate(next.getDate() + (7 - next.getDay()));
      next.setHours(7, 0, 0, 0);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      next.setDate(1);
      next.setHours(7, 0, 0, 0);
      break;
  }
  
  return next;
}

// ── Format frequency for display ────────────────────────────
export function formatFrequency(freq: SubscriptionFrequency): string {
  const labels: Record<SubscriptionFrequency, string> = {
    daily: 'በየቀኑ',
    weekly: 'በየሳምንቱ',
    monthly: 'በየወሩ',
  };
  return labels[freq];
}
