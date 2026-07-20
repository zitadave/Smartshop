export interface Product {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  price: number;
  originalPrice: number | null;
  image: string;
  images: string[];
  badge: string;
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
  sku: string;
  commission: number;
  userReviews: Review[];
  questions: QnA[];
  priceHistory: PricePoint[];
  createdAt: string;
  features: string[];
}

export interface Review {
  id: number;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

export interface QnA {
  question: string;
  askedBy: string;
  askedAt: string;
  answers: Answer[];
}

export interface Answer {
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

export interface PricePoint {
  price: number;
  date: string;
}

export interface Category {
  id: string;
  icon: string;
  labelEn: string;
  labelAm: string;
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
  id?: string;
  orderNumber: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  subtotal: number;
  discount: number;
  delivery: number;
  paymentMethod: string;
  customer: Customer;
  date: string;
  createdAt: string;
  currency: string;
  language: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned' | 'refunded';

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Customer {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
}

export interface Vendor {
  id: number;
  name: string;
  phone: string;
  email: string;
  shopName: string;
  description: string;
  ownerId: number;
  commission: number;
  balance: number;
  totalSales: number;
  status: 'active' | 'pending' | 'suspended';
  joinedAt: string;
}

export interface Profile {
  name: string;
  phone: string;
  registered: boolean;
  joinedAt: string;
}

export interface FlashSale {
  end: number;
  startedAt: number;
}

export interface BundleDeal {
  withId: number;
  discount: number;
}

export interface Coupon {
  code: string;
  discount: number;
  minOrder: number;
  maxUses: number;
  used: number;
  expires: string;
  active: boolean;
}

export interface GiftCard {
  code: string;
  amount: number;
  phone: string;
  message: string;
  from: string;
  date: string;
  used: boolean;
}

export type Language = 'am' | 'en' | 'om' | 'ti' | 'so';

export interface AppSettings {
  vendorRegistration: boolean;
  vendorCommission: number;
  vendorApproval: boolean;
  commissionRates: Record<string, number>;
  flashSales: Record<number, FlashSale>;
  sponsoredProducts: number[];
  bundleDeals: Record<number, BundleDeal>;
  coupons: Coupon[];
  subscriptionPlans: any[];
  storeName: string;
  deliveryFee: number;
  minOrder: number;
}
