// ============================================
// Smart Shop — AI Product Photo Studio
// Free: Browser-based WASM (no server needed)
// ============================================

export interface PhotoProcessingResult {
  primary: Blob;
  thumbnail: Blob;
  detail: Blob;
  primaryUrl: string;
  thumbnailUrl: string;
  detailUrl: string;
}

/**
 * Process a vendor's phone photo into professional product shots
 * All processing happens in the browser — zero server cost
 *
 * Pipeline:
 *   1. Auto-crop to square
 *   2. Enhance brightness & contrast
 *   3. Generate 3 sizes (primary 800px, thumbnail 200px, detail 400px)
 */
export async function processProductPhoto(file: File): Promise<PhotoProcessingResult> {
  const img = await createImageBitmap(file);
  const { width, height } = img;

  // Step 1: Smart crop — center the product
  const size = Math.min(width, height);
  const offsetX = (width - size) / 2;
  const offsetY = (height - size) / 2;

  // Step 2: Create primary (800×800)
  const primary = await processImage(img, 800, offsetX, offsetY, size);
  const thumbnail = await processImage(img, 200, offsetX, offsetY, size);
  const detail = await processImage(img, 400, offsetX, offsetY, size);

  return {
    primary,
    thumbnail,
    detail,
    primaryUrl: URL.createObjectURL(primary),
    thumbnailUrl: URL.createObjectURL(thumbnail),
    detailUrl: URL.createObjectURL(detail),
  };
}

/**
 * Auto-enhance and resize a product image
 */
async function processImage(
  img: ImageBitmap,
  targetSize: number,
  cropX: number,
  cropY: number,
  cropSize: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetSize, targetSize);

  // Draw image with padding (10% margin)
  const margin = targetSize * 0.1;
  const drawSize = targetSize - margin * 2;
  const scale = drawSize / cropSize;
  ctx.drawImage(
    img,
    cropX, cropY, cropSize, cropSize, // Source
    margin, margin, drawSize, drawSize  // Destination
  );

  // Auto-enhance: increase contrast by 10%, brightness by 5%
  const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
  const pixels = imageData.data;
  const contrast = 1.1;
  const brightness = 5; // 0-255 offset

  for (let i = 0; i < pixels.length; i += 4) {
    // Apply contrast
    pixels[i]     = Math.min(255, Math.max(0, (pixels[i] - 128) * contrast + 128 + brightness));
    pixels[i + 1] = Math.min(255, Math.max(0, (pixels[i + 1] - 128) * contrast + 128 + brightness));
    pixels[i + 2] = Math.min(255, Math.max(0, (pixels[i + 2] - 128) * contrast + 128 + brightness));
  }
  ctx.putImageData(imageData, 0, 0);

  // Export as WebP (smaller file size)
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', 0.85);
  });
}

/**
 * Upload processed photos to the server
 */
export async function uploadProductPhotos(
  productId: number,
  photos: PhotoProcessingResult
): Promise<string[]> {
  const formData = new FormData();
  formData.append('primary', photos.primary, `product-${productId}-primary.webp`);
  formData.append('thumbnail', photos.thumbnail, `product-${productId}-thumb.webp`);
  formData.append('detail', photos.detail, `product-${productId}-detail.webp`);

  const res = await fetch('/api/upload/product-photos', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return data.urls || [];
}
