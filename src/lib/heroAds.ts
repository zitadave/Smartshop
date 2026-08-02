import type { HeroAd, HeroCarouselConfig, AppSettings } from '@/types';

export const DEFAULT_HERO_ADS: HeroAd[] = [
  {
    id: 'hero-default-1',
    productId: 5,
    title: 'Ethiopian Organic Coffee 1kg',
    subtitle: '100% Yirgacheffe Arabica Beans • Direct from Farm',
    tagline: '🌟 Featured Sponsor Special',
    priceText: 'Br 800 (Standard Br 950)',
    ctaText: '🛍️ Shop Now',
    bgGradient: 'from-[#0f172a] via-[#1e293b] to-[#334155]',
    status: 'active',
    commissionRate: 25,
    durationDays: 30,
    vendorName: 'Yirgacheffe Coffee Union',
  },
  {
    id: 'hero-default-2',
    productId: 1,
    title: 'Farm-Fresh Cow Milk (1 Liter)',
    subtitle: 'Delivered directly to your doorstep every morning',
    tagline: '🥛 Daily Smart Subscription',
    priceText: 'Br 60 / liter • Save 15%',
    ctaText: '📦 Subscribe Now',
    bgGradient: 'from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]',
    status: 'active',
    commissionRate: 20,
    durationDays: 14,
    vendorName: 'Smart Shop Dairy',
  },
  {
    id: 'hero-default-3',
    productId: 2,
    title: 'Brown Eggs (6-Pack Farm Fresh)',
    subtitle: 'Organic & rich in vitamins • Zero breakage guarantee',
    tagline: '⚡ Limited Time Offer',
    priceText: 'Br 150 / pack',
    ctaText: '🔥 Order Today',
    bgGradient: 'from-[#7c2d12] via-[#9a3412] to-[#ea580c]',
    status: 'active',
    commissionRate: 25,
    durationDays: 7,
    vendorName: 'Smart Shop Farm',
  },
  {
    id: 'hero-default-4',
    productId: 6,
    title: 'Pure Ethiopian Honey (500g)',
    subtitle: 'Raw, unfiltered forest honey from highland apiaries',
    tagline: '🍯 Premium Harvest',
    priceText: 'Br 600',
    ctaText: '✨ View Special',
    bgGradient: 'from-[#065f46] via-[#059669] to-[#10b981]',
    status: 'active',
    commissionRate: 25,
    durationDays: 30,
    vendorName: 'Highland Honey Producers',
  }
];

export function getHeroCarouselConfig(settings: AppSettings): HeroCarouselConfig {
  const cfg = settings.heroCarousel;
  const maxActiveAds = typeof cfg?.maxActiveAds === 'number' ? Math.max(7, cfg.maxActiveAds) : 12; // Enforce explicitly > 6 per user request
  return {
    slideDuration: typeof cfg?.slideDuration === 'number' ? cfg.slideDuration : 6,
    maxActiveAds,
    defaultCommissionRate: typeof cfg?.defaultCommissionRate === 'number' ? cfg.defaultCommissionRate : 25,
    allowedDurations: Array.isArray(cfg?.allowedDurations) && cfg.allowedDurations.length > 0
      ? cfg.allowedDurations
      : [3, 7, 14, 30, 90],
    ads: Array.isArray(cfg?.ads) && cfg.ads.length > 0 ? cfg.ads : DEFAULT_HERO_ADS,
  };
}

export function formatAdDurationLabel(days: number): string {
  if (days === 1) return '24 Hours (1 Day)';
  if (days === 7) return '7 Days (1 Week)';
  if (days === 14) return '14 Days (2 Weeks)';
  if (days === 30) return '30 Days (1 Month)';
  if (days === 90) return '90 Days (3 Months)';
  return `${days} Days`;
}

export function calculateHeroAdCommission(price: number, commissionRate: number): { fee: number; net: number } {
  const rate = Math.max(0, Math.min(100, commissionRate));
  const fee = Math.round(price * (rate / 100));
  const net = Math.max(0, price - fee);
  return { fee, net };
}
