// ============================================
// Smart Shop — Multi-Vendor Price Comparison
// Stack: Supabase queries (FREE)
// ============================================

export interface PriceOption {
  vendorId: number;
  vendorName: string;
  vendorRating: number;
  vendorSales: number;
  price: number;
  originalPrice: number | null;
  deliveryFee: number;
  totalPrice: number;
  stockCount: number;
  inStock: boolean;
  badge: string;
}

export interface ComparisonResult {
  productName: string;
  productImage: string;
  options: PriceOption[];
  bestPrice: PriceOption | null;
  savings: number;
  averagePrice: number;
}

// ── Fetch price comparison for a product ─────────────────────
export async function compareProductPrices(
  productName: string,
  category?: string,
  zoneId?: number
): Promise<ComparisonResult> {
  const params = new URLSearchParams({ q: productName });
  if (category) params.set('category', category);
  if (zoneId) params.set('zone_id', String(zoneId));

  const res = await fetch(`/api/products/compare?${params}`);
  const data = await res.json();

  if (!data.options || data.options.length === 0) {
    return {
      productName,
      productImage: '',
      options: [],
      bestPrice: null,
      savings: 0,
      averagePrice: 0,
    };
  }

  const options: PriceOption[] = data.options;
  const prices = options.map(o => o.totalPrice);
  const averagePrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const bestPrice = options.reduce((best, curr) =>
    curr.totalPrice < best.totalPrice ? curr : best
  );
  const savings = prices.length > 1
    ? prices.sort((a, b) => b - a)[1] - bestPrice.totalPrice
    : 0;

  return {
    productName: data.productName || productName,
    productImage: data.productImage || '',
    options,
    bestPrice,
    savings,
    averagePrice,
  };
}

// ── Format price display ─────────────────────────────────────
export function formatPriceComparison(result: ComparisonResult): string {
  if (!result.options.length) return 'ሌላ ሻጭ አልተገኘም';

  let msg = `🆚 *${result.productName}* — ዋጋ ማወዳደር\n\n`;
  
  result.options
    .sort((a, b) => a.totalPrice - b.totalPrice)
    .forEach((opt, i) => {
      const isBest = i === 0;
      const star = '⭐'.repeat(Math.round(opt.vendorRating));
      msg += `${isBest ? '🏆 ' : '   '}*${opt.vendorName}*\n`;
      msg += `   ዋጋ: Br ${opt.price.toLocaleString()}`;
      if (opt.deliveryFee > 0) msg += ` + 🚚 ${opt.deliveryFee.toLocaleString()}`;
      msg += ` = *Br ${opt.totalPrice.toLocaleString()}*\n`;
      msg += `   ${star} (${opt.vendorRating}) | 📦 ${opt.stockCount} ቀርቷል\n`;
    });

  if (result.savings > 0) {
    msg += `\n💡 *Br ${result.savings.toLocaleString()}* ቆጥበህ ከ ${result.bestPrice?.vendorName} ብትገዛ!`;
  }

  return msg;
}
