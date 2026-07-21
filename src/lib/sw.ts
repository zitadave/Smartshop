/**
 * Service Worker registration with automatic updates.
 * Caches API responses for offline support and instant loading.
 */

const SW_PATH = '/sw.js';

export function registerSW() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register(SW_PATH);

      // Check for updates on page navigation
      registration.addEventListener('updatefound', () => {
        const installing = registration.installing;
        if (installing) {
          installing.addEventListener('statechange', () => {
            if (installing.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              console.log('[SW] New version available — refresh to update');
            }
          });
        }
      });

      console.log('[SW] Registered');
    } catch (err) {
      console.warn('[SW] Registration failed', err);
    }
  });
}

/**
 * Sends a message to the service worker to clear all caches.
 */
export async function clearSWCache() {
  if (!('serviceWorker' in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: 'CLEAR_CACHE' });
}
