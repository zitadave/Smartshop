// Shared Promotions System — connects admin, vendors, and shop
// Model 1: Commission on original price (admin fully protected)
// Model 4: Admin sets price floors, vendors buy promotion slots

export interface PromotionRequest {
  id: string; vendorId: number; vendorName: string; productId: number; productName: string;
  type: 'discount' | 'flashdeal' | 'bogo'; discountPercent: number; originalPrice: number;
  startDate: string; endDate: string; status: 'pending' | 'approved' | 'rejected';
  submittedAt: string; adminNote?: string; featuredSlot?: boolean; slotFee?: number;
}

export interface PriceFloor { category: string; minPricePct: number; }

export interface PromotionSlot { id: string; name: string; price: number; duration: string; active: boolean; }

const STORAGE_KEY = 'ss_promotions_data';

export function loadPromotionsData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

export function savePromotionsData(data: any) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActivePromotions(): PromotionRequest[] {
  const data = loadPromotionsData();
  const requests: PromotionRequest[] = data.requests || [];
  return requests.filter(r =>
    r.status === 'approved' &&
    new Date(r.startDate) <= new Date() &&
    new Date(r.endDate) > new Date()
  );
}

export function getProductPromotion(productId: number): { discountPercent: number; salePrice: number; type: string } | null {
  const active = getActivePromotions();
  const promo = active.find(p => p.productId === productId);
  if (!promo) return null;
  return {
    discountPercent: promo.discountPercent,
    salePrice: Math.round(promo.originalPrice * (1 - promo.discountPercent / 100)),
    type: promo.type,
  };
}

export function getCommissionPrice(originalPrice: number, commissionPct: number = 10): number {
  return Math.round(originalPrice * commissionPct / 100);
}
