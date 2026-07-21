/**
 * Image CDN utilities — Cloudinary-style transformations
 * Falls back to Unsplash with params if no CDN configured
 */

const CDN_URL = 'https://images.unsplash.com';

interface ImageOptions {
  w?: number;
  h?: number;
  q?: number;
  fit?: 'cover' | 'contain' | 'fill';
}

const defaults: ImageOptions = { w: 400, h: 400, q: 80, fit: 'cover' };

/**
 * Generates an optimized image URL with size/quality params.
 * Works with Unsplash and any Cloudinary-style CDN.
 */
export function img(src: string, opts: ImageOptions = {}): string {
  if (!src) return placeholder(400);

  const { w, h, q, fit } = { ...defaults, ...opts };

  // Unsplash
  if (src.includes('images.unsplash.com')) {
    const base = src.split('?')[0];
    return `${base}?w=${w}&h=${h}&q=${q}&fit=${fit}&auto=format`;
  }

  // Cloudinary-style (already has transformations)
  if (src.includes('cloudinary.com')) return src;

  return src;
}

/**
 * Generates a low-quality placeholder (30px wide) for lazy-load blur-up.
 */
export function placeholder(size = 40): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <rect fill="#e2e8f0" width="${size}" height="${size}"/>
      <text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="${size * 0.3}">📦</text>
    </svg>`
  )}`;
}

/**
 * Blur placeholder for skeleton loading (inline SVG data URI).
 */
export function blurHash(w = 400, h = 400): string {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
      <filter id="b"><feGaussianBlur stdDeviation="20"/></filter>
      <rect width="100%" height="100%" fill="#e2e8f0" filter="url(#b)"/>
    </svg>`
  )}`;
}
