import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currency = 'ETB'): string {
  if (currency === 'USD') return '$' + (price * 0.019).toFixed(2);
  return 'Br ' + price.toLocaleString();
}

export function stars(rating: number = 0): string {
  const f = Math.floor(rating);
  const h = rating % 1 >= 0.5 ? 1 : 0;
  const e = 5 - f - h;
  return '★'.repeat(f) + (h ? '½' : '') + '☆'.repeat(e);
}

export function getDeliveryEstimate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 2 + Math.floor(Math.random() * 4));
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function generateOrderNumber(): string {
  return 'ETH-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
}
