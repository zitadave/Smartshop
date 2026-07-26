// ============================================
// Smart Shop — AI Product Photo Studio
// Stack: @imgly/background-removal (MIT, FREE)
//        Canvas API (built-in)
// ============================================

// Dynamic import so it only loads when needed (code splitting)
let removeBackgroundFn: any = null;
async function getBgRemover() {
  if (!removeBackgroundFn) {
    try {
      const mod = await import('@imgly/background-removal');
      removeBackgroundFn = mod.removeBackground;
    } catch {
      console.warn('Background removal not available, using fallback');
      return null;
    }
  }
  return removeBackgroundFn;
}

// ── Image processing results ─────────────────────────────────
export interface ProcessedPhoto {
  originalBlob: Blob;
  processedBlob: Blob;
  thumbnailBlob: Blob;
  detailBlob: Blob;
  originalUrl: string;
  processedUrl: string;
  thumbnailUrl: string;
  detailUrl: string;
  width: number;
  height: number;
  processingTimeMs: number;
}

// ── Auto-enhance image (brightness + contrast) ───────────────
function autoEnhance(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightness: number = 1.08,
  contrast: number = 1.12
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate histogram for adaptive enhancement
  let hist = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[gray]++;
  }

  // Find dark and light percentiles for contrast stretching
  let total = data.length / 4;
  let cumSum = 0;
  let low = 0, high = 255;
  for (let i = 0; i < 256; i++) {
    cumSum += hist[i];
    if (cumSum >= total * 0.01 && low === 0) low = i;
    if (cumSum >= total * 0.99) { high = i; break; }
  }

  // Apply adaptive enhancement
  for (let i = 0; i < data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      let val = data[i + j];
      // Contrast stretch
      val = ((val - low) / (high - low)) * 255;
      // Brightness
      val *= brightness;
      // Contrast
      val = 128 + (val - 128) * contrast;
      data[i + j] = Math.max(0, Math.min(255, Math.round(val)));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ── Smart crop: center product with padding ──────────────────
function smartCrop(
  ctx: CanvasRenderingContext2D,
  img: ImageBitmap | HTMLImageElement,
  targetSize: number
): void {
  const padding = targetSize * 0.08; // 8% padding
  const maxDim = targetSize - padding * 2;

  // Scale to fit with aspect ratio
  const scale = Math.min(maxDim / img.width, maxDim / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  const x = (targetSize - w) / 2;
  const y = (targetSize - h) / 2;

  // White background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetSize, targetSize);

  ctx.drawImage(img, x, y, w, h);
}

// ── Convert canvas to blob ──────────────────────────────────
function canvasToBlob(canvas: HTMLCanvasElement, quality = 0.88): Promise<Blob> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/webp', quality);
  });
}

// ── Main: process product photo ──────────────────────────────
export async function processProductPhoto(
  file: File,
  options?: {
    targetSize?: number;
    removeBackground?: boolean;
  }
): Promise<ProcessedPhoto> {
  const startTime = Date.now();
  const targetSize = options?.targetSize || 800;

  // Step 1: Read file
  let blobToProcess: Blob = file;
  const originalUrl = URL.createObjectURL(file);

  // Step 2: AI background removal (if requested)
  if (options?.removeBackground !== false) {
    const remover = await getBgRemover();
    if (remover) {
      blobToProcess = await remover(file, {
        model: 'medium',
        output: { format: 'image/png', quality: 0.9 },
      });
    }
  }

  // Step 3: Decode image
  const img = await createImageBitmap(blobToProcess);
  const width = img.width;
  const height = img.height;

  // Step 4: Main processed version
  const mainCanvas = document.createElement('canvas');
  mainCanvas.width = targetSize;
  mainCanvas.height = targetSize;
  const mainCtx = mainCanvas.getContext('2d')!;

  smartCrop(mainCtx, img, targetSize);
  autoEnhance(mainCtx, targetSize, targetSize);

  const processedBlob = await canvasToBlob(mainCanvas);
  const processedUrl = URL.createObjectURL(processedBlob);

  // Step 5: Thumbnail (200x200)
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 200;
  thumbCanvas.height = 200;
  const thumbCtx = thumbCanvas.getContext('2d')!;
  thumbCtx.drawImage(mainCanvas, 0, 0, 200, 200);
  const thumbnailBlob = await canvasToBlob(thumbCanvas, 0.7);
  const thumbnailUrl = URL.createObjectURL(thumbnailBlob);

  // Step 6: Detail view (zoom center 2x)
  const detailCanvas = document.createElement('canvas');
  detailCanvas.width = 400;
  detailCanvas.height = 400;
  const detailCtx = detailCanvas.getContext('2d')!;
  const zoomRegion = targetSize * 0.3;
  detailCtx.drawImage(
    mainCanvas,
    targetSize / 2 - zoomRegion / 2,
    targetSize / 2 - zoomRegion / 2,
    zoomRegion,
    zoomRegion,
    0, 0, 400, 400
  );
  const detailBlob = await canvasToBlob(detailCanvas);
  const detailUrl = URL.createObjectURL(detailBlob);

  const processingTimeMs = Date.now() - startTime;

  return {
    originalBlob: file,
    processedBlob,
    thumbnailBlob,
    detailBlob,
    originalUrl,
    processedUrl,
    thumbnailUrl,
    detailUrl,
    width,
    height,
    processingTimeMs,
  };
}

// ── Upload processed photo to server ─────────────────────────
export async function uploadProductPhoto(
  processed: ProcessedPhoto,
  productId?: number,
  telegramId?: number
): Promise<string[]> {
  const formData = new FormData();
  formData.append('image', processed.processedBlob, 'product.webp');
  formData.append('thumbnail', processed.thumbnailBlob, 'thumb.webp');
  formData.append('detail', processed.detailBlob, 'detail.webp');
  if (productId) formData.append('productId', String(productId));
  if (telegramId) formData.append('telegramId', String(telegramId));

  const res = await fetch('/api/upload-photo', {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  return data.urls || [];
}
