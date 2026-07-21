/**
 * Seed sample data for new features
 * Run once on first load to populate placeholder content
 */

import type { BroadcastMessage, FlashDeal, PhotoReview } from '@/types';

export function getSampleBroadcasts(): BroadcastMessage[] {
  return [
    {
      id: 'b1',
      title: '🇪🇹 Ethiopian Coffee Festival',
      message: 'Get 25% off all premium Ethiopian coffee beans! Limited time offer.',
      icon: '🎉',
      type: 'promo',
      link: '/shop',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      seen: false,
    },
    {
      id: 'b2',
      title: '✨ New Arrivals',
      message: 'Check out our newest collection of traditional Ethiopian fashion!',
      icon: '🆕',
      type: 'event',
      link: '/shop',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      seen: false,
    },
    {
      id: 'b3',
      title: '⚠️ Free Delivery Weekend',
      message: 'Free delivery on all orders above Br 500 this weekend! 🚚',
      icon: '📢',
      type: 'info',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      seen: false,
    },
  ];
}

export function getSampleFlashDeals(productIds: number[]): Record<string, { end: number; startedAt: number; discount: number; maxQty: number }> {
  const deals: Record<string, { end: number; startedAt: number; discount: number; maxQty: number }> = {};
  const now = Date.now();
  const endIn48h = now + 48 * 3600000;

  if (productIds.length >= 3) {
    deals[String(productIds[0])] = { end: endIn48h, startedAt: now, discount: 30, maxQty: 20 };
    deals[String(productIds[1])] = { end: endIn48h, startedAt: now, discount: 20, maxQty: 15 };
    deals[String(productIds[2])] = { end: endIn48h, startedAt: now, discount: 15, maxQty: 25 };
  } else if (productIds.length > 0) {
    deals[String(productIds[0])] = { end: endIn48h, startedAt: now, discount: 25, maxQty: 10 };
  }

  return deals;
}

export function getSamplePhotoReviews(): PhotoReview[] {
  return [
    {
      id: 'r1',
      productId: 1,
      userName: 'Abebe K.',
      rating: 5,
      text: 'Excellent quality! The product exceeded my expectations. Fast delivery too!',
      images: [],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      verified: true,
    },
    {
      id: 'r2',
      productId: 2,
      userName: 'Selam W.',
      rating: 4,
      text: 'Good product for the price. Would recommend to friends.',
      images: [],
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      verified: true,
    },
  ];
}
