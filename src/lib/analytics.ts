/**
 * Privacy-first Analytics
 * Tracks only essential events. No cookies, no PII.
 * Set VITE_UMAMI_URL and VITE_UMAMI_ID in Netlify env vars.
 */

type EventName = 'page_view' | 'product_click' | 'add_to_cart' | 'remove_from_cart' | 'checkout_start' | 'order_placed' | 'search' | 'wishlist_toggle';

let _enabled = false;

export function initAnalytics() {
  // Umami — privacy-first, self-hosted option
  if (import.meta.env.VITE_UMAMI_URL && import.meta.env.VITE_UMAMI_ID) {
    const script = document.createElement('script');
    script.async = true;
    script.src = import.meta.env.VITE_UMAMI_URL as string;
    script.setAttribute('data-website-id', import.meta.env.VITE_UMAMI_ID as string);
    document.head.appendChild(script);
    _enabled = true;
  }

  // Fallback: local console-based logging in dev
  if (import.meta.env.DEV) {
    _enabled = true;
  }
}

export function trackEvent(name: EventName, data?: Record<string, string | number>) {
  if (!_enabled) return;

  // Umami tracking
  if (typeof (window as any).umami !== 'undefined') {
    (window as any).umami.track(name, data);
  }

  // Dev logging
  if (import.meta.env.DEV) {
    console.log(`[Analytics] ${name}`, data);
  }
}

/**
 * Higher-order function to wrap any click handler with analytics.
 */
export function withAnalytics<T extends (...args: any[]) => void>(
  fn: T,
  eventName: EventName,
  getData?: (...args: Parameters<T>) => Record<string, string | number>
): T {
  return ((...args: Parameters<T>) => {
    trackEvent(eventName, getData?.(...args));
    fn(...args);
  }) as T;
}
