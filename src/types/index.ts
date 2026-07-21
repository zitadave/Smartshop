// ============================================================
// TYPES — Strict, comprehensive, no `any`
// ============================================================

export interface Product {
  id: number;
  name: string;
  nameEn: string;
  category: CategoryId;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  badge: BadgeType;
  description: string;
  descriptionEn: string;
  stockCount: number;
  soldCount: number;
  rating: number;
  reviews: number;
  vendorId: number | null;
  vendorName: string;
  inStock: boolean;
  visible: boolean;
  colors: string[];
  sizes: string[];
  features: string[];
  createdAt: string;
  /** Pre-order fields */
  isPreOrder?: boolean;
  preOrderDeposit?: number;
  preOrderReleaseDate?: string;
  preOrderMax?: number;
  preOrdered?: number;
}

export type CategoryId = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty' | 'groceries' | 'books' | 'sports' | 'baby';
export type BadgeType = '' | 'sale' | 'hot' | 'new' | 'best-seller' | 'popular' | 'premium' | 'big-deal' | 'educational' | 'pre-order';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
export type SortMode = '' | 'price_low' | 'price_high' | 'newest';
export type Language = 'am' | 'en' | 'om' | 'ti' | 'so';
export type Currency = 'ETB' | 'USD';
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cart' | 'wish';
export type ThemePreset = 'default' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'rose';

export interface Category {
  id: CategoryId;
  icon: string;
  label: string;
}

export interface CartItem {
  id: number;
  name: string;
  nameEn: string;
  price: number;
  qty: number;
  image: string;
  vendorName: string;
  vendorId: number | null;
  maxQty: number;
  /** Pre-order flag */
  isPreOrder?: boolean;
  preOrderDeposit?: number;
}

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  items: { id: number; name: string; quantity: number; price: number; total: number; image?: string }[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  customer: { name: string; phone: string; city: string; address: string };
  date: string;
  createdAt: string;
  /** Receipt fields */
  receiptUrl?: string;
  receiptGenerated?: boolean;
  /** Tracking fields */
  tracking?: OrderTracking;
  /** Flash sale flag */
  isFlashDeal?: boolean;
  /** Pre-order flag */
  isPreOrder?: boolean;
}

export interface OrderTracking {
  carrier: string;
  trackingNumber: string;
  status: string;
  lastUpdate: string;
  estimatedDelivery: string;
  /** Map coordinates for live tracking */
  coordinates: { lat: number; lng: number };
  /** Status timeline */
  timeline: { label: string; time: string; completed: boolean; location?: string }[];
}

export interface PhotoReview {
  id: string;
  productId: number;
  userName: string;
  rating: number;
  text: string;
  images: string[];
  createdAt: string;
  verified: boolean;
}

export interface DigitalReceipt {
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: { name: string; quantity: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentReference: string;
  storeName: string;
  storeAddress: string;
}

export interface FlashDeal {
  productId: number;
  endTime: number; // timestamp
  startedAt: number;
  discountPercent: number;
  maxQuantity: number;
  soldQuantity: number;
  active: boolean;
}

export interface BroadcastMessage {
  id: string;
  title: string;
  message: string;
  icon: string;
  type: 'info' | 'promo' | 'alert' | 'event';
  link?: string;
  createdAt: string;
  expiresAt?: string;
  seen: boolean;
}

export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  symbol: string;
}

export interface AppSettings {
  vendorCommission?: number;
  freeDeliveryThreshold?: number;
  deliveryFee?: number;
  flashSales?: Record<string, { end: number; startedAt: number; discount?: number; maxQty?: number }>;
  sponsoredProducts?: number[];
  bundleDeals?: Record<string, { withId: number; discount: number }>;
  coupons?: { code: string; discount: number; used: number; active: boolean; createdAt: string }[];
  /** Dynamic theme */
  themePreset?: ThemePreset;
  accentColor?: string;
  /** Broadcast messages */
  broadcastMessages?: BroadcastMessage[];
  /** Pre-order settings */
  preOrderEnabled?: boolean;
  preOrderDefaultDeposit?: number;
  /** Currency settings */
  baseCurrency?: string;
  /** Price drop alert settings */
  priceAlertEnabled?: boolean;
  priceAlertCheckInterval?: number; // minutes
}

export interface Profile {
  name: string;
  phone: string;
  email?: string;
  registered: boolean;
  joinedAt: string;
  avatar?: string;
}

export interface GiftCard {
  code: string;
  balance: number;
  initialBalance: number;
  active: boolean;
  expiresAt: string;
  createdAt: string;
}

export const CATEGORIES: Category[] = [
  { id: 'all', icon: '✨', label: 'All' },
  { id: 'electronics', icon: '📱', label: 'Tech' },
  { id: 'fashion', icon: '👗', label: 'Fashion' },
  { id: 'home', icon: '🏠', label: 'Home' },
  { id: 'beauty', icon: '💄', label: 'Beauty' },
  { id: 'groceries', icon: '🍎', label: 'Food' },
  { id: 'books', icon: '📚', label: 'Books' },
  { id: 'sports', icon: '⚽', label: 'Sports' },
  { id: 'baby', icon: '👶', label: 'Baby' },
];

export const SORT_OPTIONS: { id: SortMode; icon: string; label: string }[] = [
  { id: '', icon: '🔥', label: 'Best' },
  { id: 'price_low', icon: '💵', label: 'Low→High' },
  { id: 'price_high', icon: '💰', label: 'High→Low' },
  { id: 'newest', icon: '✨', label: 'Newest' },
];

export const BADGE_COLORS: Record<BadgeType, string> = {
  '': '',
  sale: 'from-red-500 to-rose-500',
  hot: 'from-orange-500 to-amber-500',
  new: 'from-emerald-500 to-green-500',
  'best-seller': 'from-purple-500 to-violet-500',
  popular: 'from-blue-500 to-sky-500',
  premium: 'from-slate-700 to-slate-600',
  'big-deal': 'from-red-600 to-rose-600',
  educational: 'from-teal-500 to-emerald-500',
  'pre-order': 'from-blue-600 to-indigo-600',
};

export const BADGE_LABELS: Record<BadgeType, string> = {
  '': '',
  sale: 'SALE',
  hot: 'HOT',
  new: 'NEW',
  'best-seller': 'BEST SELLER',
  popular: 'POPULAR',
  premium: 'PREMIUM',
  'big-deal': 'BIG DEAL',
  educational: 'EDUCATIONAL',
  'pre-order': 'PRE-ORDER',
};

export const THEME_PRESETS: Record<ThemePreset, { primary: string; gradient: string; accent: string }> = {
  default: { primary: '#6C63FF', gradient: 'from-violet-600 to-indigo-600', accent: '#8B5CF6' },
  ocean: { primary: '#0EA5E9', gradient: 'from-cyan-500 to-blue-600', accent: '#06B6D4' },
  forest: { primary: '#10B981', gradient: 'from-emerald-500 to-green-600', accent: '#34D399' },
  sunset: { primary: '#F59E0B', gradient: 'from-amber-500 to-orange-600', accent: '#F97316' },
  midnight: { primary: '#6366F1', gradient: 'from-indigo-700 to-purple-700', accent: '#818CF8' },
  rose: { primary: '#EC4899', gradient: 'from-pink-500 to-rose-600', accent: '#F43F5E' },
};

export const CURRENCY_RATES: Record<string, CurrencyRate> = {
  ETB: { code: 'ETB', name: 'Ethiopian Birr', rate: 1, symbol: 'Br' },
  USD: { code: 'USD', name: 'US Dollar', rate: 0.019, symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', rate: 0.017, symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', rate: 0.015, symbol: '£' },
  KES: { code: 'KES', name: 'Kenyan Shilling', rate: 2.45, symbol: 'KSh' },
};
