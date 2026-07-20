export interface Env {
  SMART_SHOP_KV?: KVNamespace;
  DB?: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
  ADMIN_BOT_TOKEN?: string;
}

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
}

export interface Order {
  id?: number;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  total: number;
  customer: any;
  paymentMethod: string;
  date: string;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  total: number;
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
}

export interface Settings {
  vendorRegistration: boolean;
  vendorCommission: number;
  vendorApproval: boolean;
  flashSales: Record<string, any>;
  sponsoredProducts: number[];
  bundleDeals: Record<string, any>;
  coupons: any[];
  commissionRates: Record<string, number>;
}
