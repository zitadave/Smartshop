// ============================================
// Smart Shop — Complete Subscription System
// Stack: Supabase + Vercel Cron (FREE)
// ============================================

export type SubscriptionFrequency = 'daily' | 'weekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type DeliveryStatus = 'pending' | 'out_for_delivery' | 'delivered' | 'failed' | 'cancelled';

// ── Subscription Plan (created by vendors) ──────────────────
export interface SubscriptionPlan {
  id: number;
  name: string;
  nameAmharic: string;
  emoji: string;
  description: string;
  category: string;
  unit: string;
  unitLabel: string;
  dailyPrice: number;
  weeklyPrice: number;
  monthlyPrice: number;
  vendorId?: number;
  vendorName: string;
  image: string;
  tags: string[];
  isActive: boolean;
  minQuantity: number;
  maxQuantity: number;
  createdAt: string;
}

// ── Customer Subscription ──────────────────────────────────
export interface Subscription {
  id: number;
  telegramId: number;
  planId: number;
  plan?: SubscriptionPlan;
  productName: string;
  productImage: string;
  quantity: number;
  frequency: SubscriptionFrequency;
  price: number;
  nextDelivery: string;
  status: SubscriptionStatus;
  deliveryAddress: string;
  deliveryNote: string;
  deliveryTime: string;
  paymentMethod: string;
  totalDelivered: number;
  lastDelivery: string | null;
  createdAt: string;
}

// ── Delivery Record ────────────────────────────────────────
export interface SubscriptionDelivery {
  id: number;
  subscriptionId: number;
  planId: number;
  telegramId: number;
  productName: string;
  quantity: number;
  price: number;
  deliveryAddress: string;
  deliveryDate: string;
  status: DeliveryStatus;
  deliveredAt: string | null;
  notes: string;
  createdAt: string;
}

// ── Ethiopian subscription categories ──────────────────────
export const SUBSCRIPTION_CATEGORIES = [
  { id: 'dairy', name: 'ወተት እና እንቁላል', nameEn: 'Milk & Eggs', emoji: '🥛' },
  { id: 'bakery', name: 'ዳቦ እና መጋገሪያ', nameEn: 'Bakery', emoji: '🍞' },
  { id: 'drinks', name: 'መጠጦች', nameEn: 'Drinks', emoji: '💧' },
  { id: 'groceries', name: 'ግሮሰሪ', nameEn: 'Groceries', emoji: '🛒' },
  { id: 'general', name: 'ሌሎች', nameEn: 'Other', emoji: '📦' },
];

// ── Discount display text ──────────────────────────────────
export function getDiscountText(freq: SubscriptionFrequency): string {
  const discounts: Record<SubscriptionFrequency, { pct: number; label: string }> = {
    daily: { pct: 15, label: 'Save 15% daily' },
    weekly: { pct: 10, label: 'Save 10% weekly' },
    monthly: { pct: 5, label: 'Save 5% monthly' },
  };
  return discounts[freq]?.label || '';
}

export function getDiscountPercent(freq: SubscriptionFrequency): number {
  return { daily: 15, weekly: 10, monthly: 5 }[freq] || 0;
}

// ── Calculate price for a plan at given frequency ──────────
export function getPlanPrice(plan: SubscriptionPlan, freq: SubscriptionFrequency, quantity = 1): number {
  const basePrice = freq === 'daily' ? plan.dailyPrice : freq === 'weekly' ? plan.weeklyPrice : plan.monthlyPrice;
  return basePrice * quantity;
}

// ── Format frequency to Amharic ────────────────────────────
export function formatFrequency(freq: SubscriptionFrequency): string {
  const labels: Record<SubscriptionFrequency, string> = {
    daily: 'በየቀኑ',
    weekly: 'በየሳምንቱ',
    monthly: 'በየወሩ',
  };
  return labels[freq];
}

// ── Next delivery date label ───────────────────────────────
export function formatNextDelivery(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = d.getTime() - now.getTime();
  const hours = Math.round(diff / (1000 * 60 * 60));

  if (hours <= 0) return 'Today 🚚';
  if (hours <= 24) return `In ${hours}h`;
  if (hours <= 48) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ═══════════════════════════════════════════════════════════
// API FUNCTIONS
// ═══════════════════════════════════════════════════════════

// ── Fetch all subscription plans ───────────────────────────
export async function fetchPlans(category?: string): Promise<SubscriptionPlan[]> {
  const params = new URLSearchParams();
  params.set('active', 'true');
  if (category) params.set('category', category);
  const res = await fetch(`/api/subscription-plans?${params}`);
  const data = await res.json();
  return data.plans || [];
}

// ── Create a subscription plan (vendor) ───────────────────
export async function createPlan(plan: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
  const res = await fetch('/api/subscription-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plan),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to create plan');
  return data.plan;
}

// ── Subscribe to a plan ────────────────────────────────────
export async function createSubscription(params: {
  telegramId: number;
  planId: number;
  frequency: SubscriptionFrequency;
  quantity: number;
  deliveryAddress: string;
  deliveryNote?: string;
  deliveryTime?: string;
  paymentMethod?: string;
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

// ── Get user's subscriptions ───────────────────────────────
export async function getUserSubscriptions(telegramId: number): Promise<Subscription[]> {
  const res = await fetch(`/api/subscriptions?telegram_id=${telegramId}`);
  const data = await res.json();
  return data.subscriptions || [];
}

// ── Update subscription ───────────────────────────────────
export async function updateSubscription(
  id: number,
  updates: Partial<Subscription>
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/subscriptions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  return res.json();
}

// ── Cancel subscription ───────────────────────────────────
export async function cancelSubscription(id: number): Promise<{ success: boolean }> {
  const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
  return res.json();
}

// ── Get delivery history for a subscription ────────────────
export async function getDeliveryHistory(subscriptionId: number): Promise<SubscriptionDelivery[]> {
  const res = await fetch(`/api/subscriptions/deliveries?subscription_id=${subscriptionId}`);
  const data = await res.json();
  return data.deliveries || [];
}

// ── Get vendor's subscription orders ──────────────────────
export async function getVendorSubscriptionOrders(vendorId: number): Promise<Subscription[]> {
  const res = await fetch(`/api/vendor/subscription-orders?vendor_id=${vendorId}`);
  const data = await res.json();
  return data.orders || [];
}

// ── Calculate savings compared to buying retail ────────────
export function calculateSavings(plan: SubscriptionPlan, freq: SubscriptionFrequency, quantity = 1): number {
  // Simulated retail price (daily price × 30 for monthly, etc.)
  const dailyTotal = plan.dailyPrice * quantity * 30;
  const monthlyTotal = plan.monthlyPrice * quantity;
  if (freq === 'monthly') return dailyTotal - monthlyTotal;
  return 0;
}
