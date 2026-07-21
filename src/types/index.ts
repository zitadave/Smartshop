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
}

export type CategoryId = 'all' | 'electronics' | 'fashion' | 'home' | 'beauty' | 'groceries' | 'books' | 'sports' | 'baby';
export type BadgeType = '' | 'sale' | 'hot' | 'new' | 'best-seller' | 'popular' | 'premium' | 'big-deal' | 'educational';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
export type SortMode = '' | 'price_low' | 'price_high' | 'newest';
export type Language = 'am' | 'en' | 'om' | 'ti' | 'so';
export type Currency = 'ETB' | 'USD';
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'cart' | 'wish';

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
}

export interface Order {
  orderNumber: string;
  status: OrderStatus;
  items: { id: number; name: string; quantity: number; price: number; total: number }[];
  total: number;
  subtotal: number;
  discount: number;
  paymentMethod: string;
  customer: { name: string; phone: string; city: string; address: string };
  date: string;
  createdAt: string;
}

export interface Profile {
  name: string;
  phone: string;
  registered: boolean;
  joinedAt: string;
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
};
