// ============================================
// Smart Shop — Multi-Vendor Price Comparison
// Free: Supabase query
// ============================================

export interface PriceOption {
  vendorName: string;
  vendorId: number;
  vendorRating: number;
  price: number;
  originalPrice?: number;
  stockCount: number;
  deliveryFee: number;
  deliveryTime: string;
  totalPrice: number;
  isLowest: boolean;
}

export interface CompareResult {
  productId: number;
  productName: string;
  productImage: string;
  options: PriceOption[];
  savings: { bestPrice: number; worstPrice: number; youSave: number };
}

/**
 * Compare prices across all vendors for a product
 */
export async function comparePrices(productId: number): Promise<CompareResult | null> {
  const res = await fetch(`/api/products/${productId}/compare`);
  if (!res.ok) return null;
  return res.json();
}

/**
 * Find the best price for a product across vendors
 */
export async function findBestPrice(productId: number): Promise<PriceOption | null> {
  const result = await comparePrices(productId);
  if (!result || result.options.length === 0) return null;
  return result.options[0]; // First = cheapest (sorted by API)
}
