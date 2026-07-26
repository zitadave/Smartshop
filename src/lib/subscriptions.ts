// ============================================
// Smart Shop — Daily Subscriptions (የደንበኝነት ምርቶች)
// Free: Supabase + Vercel Cron
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
  nextDelivery: string;
  deliveryAddress: string;
  deliveryNote: string;
  status: 'active' | 'paused' | 'cancelled';
  totalDelivered: number;
  createdAt: string;
}

const FREQUENCY_LABELS: Record<SubscriptionFrequency, string> = {
  daily: 'በየቀኑ',
  weekly: 'በየሳምንቱ',
  monthly: 'በየወሩ',
};

const FREQUENCY_INTERVALS: Record<SubscriptionFrequency, number> = {
  daily: 1,
  weekly: 7,
  monthly: 30,
};

/**
 * Get human-readable frequency label
 */
export function getFrequencyLabel(freq: SubscriptionFrequency): string {
  return FREQUENCY_LABELS[freq];
}

/**
 * Calculate the next delivery date
 */
export function calculateNextDelivery(freq: SubscriptionFrequency): string {
  const date = new Date();
  date.setDate(date.getDate() + FREQUENCY_INTERVALS[freq]);
  return date.toISOString();
}

/**
 * Create a new subscription
 */
export async function createSubscription(params: {
  telegramId: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  price: number;
  deliveryAddress: string;
  deliveryNote?: string;
}): Promise<Subscription> {
  const res = await fetch('/api/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      telegram_id: params.telegramId,
      product_id: params.productId,
      product_name: params.productName,
      product_image: params.productImage,
      quantity: params.quantity,
      frequency: params.frequency,
      price: params.price,
      delivery_address: params.deliveryAddress,
      delivery_note: params.deliveryNote || '',
      next_delivery: calculateNextDelivery(params.frequency),
    }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create subscription');
  return data.subscription;
}

/**
 * Update subscription status (pause/resume/cancel)
 */
export async function updateSubscriptionStatus(
  id: number,
  status: 'active' | 'paused' | 'cancelled'
): Promise<void> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update subscription');
}

/**
 * Get all subscriptions for a user
 */
export async function getUserSubscriptions(telegramId: number): Promise<Subscription[]> {
  const res = await fetch(`/api/subscriptions?telegram_id=${telegramId}`);
  const data = await res.json();
  return data.subscriptions || [];
}

/**
 * Calculate monthly cost of all active subscriptions
 */
export function calculateMonthlyCost(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.status === 'active')
    .reduce((total, s) => {
      if (s.frequency === 'daily') return total + s.price * 30;
      if (s.frequency === 'weekly') return total + s.price * 4;
      return total + s.price; // monthly
    }, 0);
}
