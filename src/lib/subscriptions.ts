// ============================================
// Smart Shop — Complete Subscription System
// Stack: Supabase + Vercel Cron (FREE)
// ============================================

export type SubscriptionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';
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
    biweekly: { pct: 8, label: 'Save 8% bi-weekly' },
    monthly: { pct: 5, label: 'Save 5% monthly' },
  };
  return discounts[freq]?.label || '';
}

export function getDiscountPercent(freq: SubscriptionFrequency): number {
  return { daily: 15, weekly: 10, biweekly: 8, monthly: 5 }[freq] || 0;
}

// ── Calculate price for a plan at given frequency ──────────
export function getPlanPrice(plan: any, freq: SubscriptionFrequency, quantity = 1): number {
  const dailyPrice = plan.dailyPrice !== undefined ? plan.dailyPrice : (plan.daily_price || 0);
  const weeklyPrice = plan.weeklyPrice !== undefined ? plan.weeklyPrice : (plan.weekly_price || 0);
  const monthlyPrice = plan.monthlyPrice !== undefined ? plan.monthlyPrice : (plan.monthly_price || 0);
  
  // Parse custom biweekly price from JSONB tags
  const biweeklyTag = plan.tags?.find?.((t: string) => t.startsWith?.('biweeklyPrice:'));
  const biweeklyPrice = biweeklyTag ? parseInt(biweeklyTag.split(':')[1]) : 0;

  const basePrice = freq === 'daily' ? dailyPrice : freq === 'weekly' ? weeklyPrice : freq === 'biweekly' ? biweeklyPrice : monthlyPrice;
  return basePrice * quantity;
}

// ── Format frequency to Amharic ────────────────────────────
export function formatFrequency(freq: SubscriptionFrequency): string {
  const labels: Record<SubscriptionFrequency, string> = {
    daily: 'በየቀኑ',
    weekly: 'በየሳምንቱ',
    biweekly: 'በየሁለት ሳምንቱ',
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

// ── Fetch subscription plans with caching ─────────────────
let plansCache: { data: SubscriptionPlan[]; expiry: number } | null = null;

export async function fetchPlans(category?: string, forceRefresh = false): Promise<SubscriptionPlan[]> {
  // Use cache for 2 minutes unless forced refresh
  if (!forceRefresh && plansCache && Date.now() < plansCache.expiry) {
    let result = plansCache.data;
    if (category) result = result.filter(p => p.category === category);
    return result;
  }
  
  const params = new URLSearchParams();
  params.set('active', 'true');
  if (category && category !== 'all') params.set('category', category);
  
  let plans: SubscriptionPlan[] = [];
  try {
    const res = await fetch(`/api/subscription-plans?${params}`);
    if (res.ok) {
      const data = await res.json();
      const rawPlans = data.plans || [];
      plans = rawPlans.map((p: any) => ({
        id: p.id,
        name: p.name,
        nameAmharic: p.nameAmharic || p.name_amharic || '',
        emoji: p.emoji || '📦',
        description: p.description || '',
        category: p.category || 'general',
        unit: p.unit || '1',
        unitLabel: p.unitLabel || p.unit_label || 'pc',
        dailyPrice: Number(p.dailyPrice !== undefined ? p.dailyPrice : (p.daily_price || 0)),
        weeklyPrice: Number(p.weeklyPrice !== undefined ? p.weeklyPrice : (p.weekly_price || 0)),
        monthlyPrice: Number(p.monthlyPrice !== undefined ? p.monthlyPrice : (p.monthly_price || 0)),
        vendorId: p.vendorId || p.vendor_id || null,
        vendorName: p.vendorName || p.vendor_name || 'Smart Shop',
        image: p.image || '',
        tags: p.tags || [],
        isActive: p.isActive !== undefined ? p.isActive : (p.is_active !== false),
        minQuantity: Number(p.minQuantity !== undefined ? p.minQuantity : (p.min_quantity || 1)),
        maxQuantity: Number(p.maxQuantity !== undefined ? p.maxQuantity : (p.max_quantity || 10)),
        createdAt: p.createdAt || p.created_at || '',
      }));
    }
  } catch (e) {
    console.warn('Could not fetch subscription plans:', e);
  }
  
  // Cache result
  plansCache = { data: plans, expiry: Date.now() + 120000 };
  
  return plans;
}

// ── Fetch plans grouped by category ────────────────────────
export async function fetchPlansGrouped(): Promise<Record<string, SubscriptionPlan[]>> {
  const all = await fetchPlans();
  return all.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, SubscriptionPlan[]>);
}

// ── Get featured/popular plans for homepage ────────────────
export async function fetchFeaturedPlans(limit = 6): Promise<SubscriptionPlan[]> {
  const all = await fetchPlans();
  const score = (p: any) => {
    let s = 0;
    if (p.tags?.includes('popular')) s += 100;
    if (p.tags?.includes('essential')) s += 50;
    const dailyPrice = p.dailyPrice !== undefined ? p.dailyPrice : (p.daily_price || 0);
    if (dailyPrice > 0) s += 30;
    return s;
  };
  return all.sort((a, b) => score(b) - score(a)).slice(0, limit);
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
  try {
    const res = await fetch(`/api/subscriptions?telegram_id=${telegramId}`);
    if (res.ok) {
      const data = await res.json();
      return data.subscriptions || [];
    }
  } catch (e) {
    console.error('Failed to fetch user subscriptions:', e);
  }
  return [];
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
  try {
    const res = await fetch(`/api/subscriptions/deliveries?subscription_id=${subscriptionId}`);
    if (res.ok) {
      const data = await res.json();
      const raw = data.deliveries || [];
      return raw.map((d: any) => ({
        id: d.id,
        subscriptionId: d.subscription_id || d.subscriptionId,
        planId: d.plan_id || d.planId,
        telegramId: d.telegram_id || d.telegramId,
        productName: d.product_name || d.productName,
        quantity: d.quantity,
        price: d.price,
        deliveryAddress: d.delivery_address || d.deliveryAddress,
        deliveryDate: d.delivery_date || d.deliveryDate,
        status: d.status,
        deliveredAt: d.delivered_at || d.deliveredAt,
        notes: d.notes,
        createdAt: d.created_at || d.createdAt,
      }));
    }
  } catch (e) {
    console.error('Failed to get delivery history:', e);
  }
  return [];
}

// ── Get vendor's subscription orders ──────────────────────
export async function getVendorSubscriptionOrders(vendorId: number): Promise<Subscription[]> {
  try {
    const res = await fetch(`/api/vendor/subscription-orders?vendor_id=${vendorId}`);
    if (res.ok) {
      const data = await res.json();
      return data.orders || [];
    }
  } catch (e) {
    console.error('Failed to get vendor subscription orders:', e);
  }
  return [];
}

// ── Calculate savings compared to buying retail ────────────
export function calculateSavings(plan: any, freq: SubscriptionFrequency, quantity = 1): { saved: number; pct: number } {
  const dailyPrice = plan.dailyPrice !== undefined ? plan.dailyPrice : (plan.daily_price || 0);
  const weeklyPrice = plan.weeklyPrice !== undefined ? plan.weeklyPrice : (plan.weekly_price || 0);
  const monthlyPrice = plan.monthlyPrice !== undefined ? plan.monthlyPrice : (plan.monthly_price || 0);

  const dailyTotal = dailyPrice * quantity * 30;
  if (freq === 'monthly' && monthlyPrice > 0 && dailyPrice > 0) {
    const saved = dailyTotal - (monthlyPrice * quantity);
    return { saved, pct: Math.round((saved / dailyTotal) * 100) };
  }
  if (freq === 'weekly' && weeklyPrice > 0 && dailyPrice > 0) {
    const weeklyRetail = dailyPrice * quantity * 7;
    const saved = weeklyRetail - (weeklyPrice * quantity);
    return { saved, pct: Math.round((saved / weeklyRetail) * 100) };
  }
  return { saved: 0, pct: 0 };
}

// ── Get a color for a plan based on its category ───────────
export function getPlanCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    dairy: 'from-blue-400 to-blue-500',
    bakery: 'from-amber-400 to-orange-500',
    drinks: 'from-cyan-400 to-blue-500',
    groceries: 'from-green-400 to-emerald-500',
    general: 'from-purple-400 to-violet-500',
  };
  return colors[category] || 'from-slate-400 to-slate-500';
}
