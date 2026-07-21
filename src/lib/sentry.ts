/**
 * Error Tracking — Sentry integration
 * Only initializes in production. Set VITE_SENTRY_DSN in Netlify env vars.
 */

export function initSentry() {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    // Dynamic import to avoid bundling in dev
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN as string,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.1,
        integrations: [Sentry.browserTracingIntegration()],
      });
      console.log('[Sentry] Initialized');
    }).catch(() => {});
  }
}

export function reportError(error: Error, context?: Record<string, unknown>) {
  if (import.meta.env.PROD) {
    import('@sentry/react').then((Sentry) => {
      Sentry.captureException(error, { extra: context });
    }).catch(() => {});
  } else {
    console.error('[Error]', error, context);
  }
}
