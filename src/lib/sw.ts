/**
 * Smart Shop — Service Worker Registration v3
 * Handles offline caching, PWA install prompt, and update notifications.
 */

const SW_PATH = '/sw.js';

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH, {
        updateViaCache: 'none',
      });

      // Check for updates every hour
      setInterval(() => { registration.update(); }, 3600000);

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (!installing) return;

        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            // Dispatch custom event for UI to show update notification
            window.dispatchEvent(new CustomEvent('sw-update', {
              detail: { registration }
            }));
          }
        });
      });

      // Handle messages from SW
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'CACHE_UPDATED') {
          // Cache was updated
        }
      });

      console.log('[PWA] Service Worker registered');
    } catch (err) {
      console.warn('[PWA] Service Worker registration failed:', err);
    }
  });
}

/** Clear all caches */
export async function clearSWCache() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: 'CLEAR_CACHE' });
}

/** Prompt user to update when new SW is available */
export function listenForSWUpdate(callback: () => void) {
  window.addEventListener('sw-update', () => {
    callback();
  });
}
