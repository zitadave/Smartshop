import { create } from 'zustand';
import type { Product, CartItem, Order, Profile, Language, AppSettings, GiftCard } from '@/types';

interface AppState {
  // Data
  products: Product[];
  settings: AppSettings;
  
  // UI State
  language: Language;
  darkMode: boolean;
  currency: 'ETB' | 'USD';
  
  // Cart
  cart: CartItem[];
  
  // Orders
  orders: Order[];
  
  // Profile
  profile: Profile;
  
  // Wishlist
  wishlist: Product[];
  
  // Notifications
  notifications: { icon: string; text: string; time: string }[];
  
  // Price alerts
  priceAlerts: { id: number; price: number; name: string }[];
  
  // Followed vendors
  followedVendors: number[];
  
  // Compare list
  compareList: number[];
  
  // Recently viewed
  recentViews: Product[];
  
  // Loyalty
  loyaltyPoints: number;
  
  // Gift cards
  giftCards: GiftCard[];
  
  // Saved addresses
  savedAddresses: any[];
  
  // Saved payments
  savedPayments: any[];
  
  // Actions
  setProducts: (products: Product[]) => void;
  setSettings: (settings: AppSettings) => void;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  toggleCurrency: () => void;
  addToCart: (product: Product, qty?: number) => void;
  removeFromCart: (id: number) => void;
  updateCartQty: (id: number, qty: number) => void;
  clearCart: () => void;
  getCartCount: () => number;
  getCartTotal: () => number;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderNumber: string, status: string) => void;
  setProfile: (profile: Profile) => void;
  updateProfileName: (name: string) => void;
  updateProfilePhone: (phone: string) => void;
  toggleWishlist: (product: Product) => void;
  isInWishlist: (id: number) => boolean;
  addNotification: (icon: string, text: string) => void;
  clearNotifications: () => void;
  togglePriceAlert: (id: number, price: number, name: string) => void;
  hasPriceAlert: (id: number) => boolean;
  toggleFollowVendor: (id: number) => void;
  isFollowingVendor: (id: number) => boolean;
  toggleCompare: (id: number) => void;
  isInCompare: (id: number) => boolean;
  addRecentView: (product: Product) => void;
  addLoyaltyPoints: (points: number) => void;
  addAddress: (address: any) => void;
  removeAddress: (idx: number) => void;
  addSavedPayment: (payment: any) => void;
  addGiftCard: (card: GiftCard) => void;
}

const loadPersisted = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

export const useStore = create<AppState>((set, get) => ({
  products: [],
  settings: {} as AppSettings,
  language: loadPersisted<Language>('ss_lang', 'am'),
  darkMode: loadPersisted<boolean>('ss_dark', false),
  currency: 'ETB',
  cart: loadPersisted<CartItem[]>('ss_cart', []),
  orders: loadPersisted<Order[]>('ss_orders', []),
  profile: loadPersisted<Profile>('ss_profile', { name: '', phone: '', registered: false, joinedAt: '' }),
  wishlist: loadPersisted<Product[]>('ss_wishlist', []),
  notifications: loadPersisted<any[]>('ss_notifs', []),
  priceAlerts: loadPersisted<any[]>('ss_price_alerts', []),
  followedVendors: loadPersisted<number[]>('ss_follows', []),
  compareList: [],
  recentViews: loadPersisted<Product[]>('ss_recent', []),
  loyaltyPoints: loadPersisted<number>('ss_loyalty', 0),
  giftCards: loadPersisted<GiftCard[]>('ss_giftcards', []),
  savedAddresses: loadPersisted<any[]>('ss_addresses', []),
  savedPayments: loadPersisted<any[]>('ss_payments', []),

  setProducts: (products) => set({ products }),
  setSettings: (settings) => set({ settings }),
  
  setLanguage: (language) => {
    localStorage.setItem('ss_lang', JSON.stringify(language));
    set({ language });
  },
  
  setDarkMode: (darkMode) => {
    localStorage.setItem('ss_dark', JSON.stringify(darkMode));
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ darkMode });
  },

  toggleCurrency: () => set((s) => ({ currency: s.currency === 'ETB' ? 'USD' : 'ETB' })),

  addToCart: (product, qty = 1) => {
    set((state) => {
      const existing = state.cart.find((i) => i.id === product.id);
      let newCart: CartItem[];
      if (existing) {
        newCart = state.cart.map((i) =>
          i.id === product.id ? { ...i, qty: Math.min(i.qty + qty, product.stockCount) } : i
        );
      } else {
        newCart = [...state.cart, {
          id: product.id, name: product.name, nameEn: product.nameEn,
          price: product.price, qty, image: product.image,
          vendorName: product.vendorName || 'Smart Shop',
          vendorId: product.vendorId, maxQty: product.stockCount
        }];
      }
      localStorage.setItem('ss_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  removeFromCart: (id) => {
    set((state) => {
      const newCart = state.cart.filter((i) => i.id !== id);
      localStorage.setItem('ss_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  updateCartQty: (id, qty) => {
    set((state) => {
      const newCart = qty <= 0
        ? state.cart.filter((i) => i.id !== id)
        : state.cart.map((i) => i.id === id ? { ...i, qty: Math.min(qty, i.maxQty) } : i);
      localStorage.setItem('ss_cart', JSON.stringify(newCart));
      return { cart: newCart };
    });
  },

  clearCart: () => {
    localStorage.setItem('ss_cart', '[]');
    set({ cart: [] });
  },

  getCartCount: () => get().cart.reduce((s, i) => s + i.qty, 0),
  getCartTotal: () => get().cart.reduce((s, i) => s + i.price * i.qty, 0),

  addOrder: (order) => {
    set((state) => {
      const newOrders = [order, ...state.orders];
      localStorage.setItem('ss_orders', JSON.stringify(newOrders));
      return { orders: newOrders };
    });
  },

  updateOrderStatus: (orderNumber, status) => {
    set((state) => {
      const newOrders = state.orders.map((o) =>
        o.orderNumber === orderNumber ? { ...o, status: status as any } : o
      );
      localStorage.setItem('ss_orders', JSON.stringify(newOrders));
      return { orders: newOrders };
    });
  },

  setProfile: (profile) => {
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    set({ profile });
  },

  updateProfileName: (name) => {
    const profile = { ...get().profile, name };
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    set({ profile });
  },

  updateProfilePhone: (phone) => {
    const profile = { ...get().profile, phone };
    localStorage.setItem('ss_profile', JSON.stringify(profile));
    set({ profile });
  },

  toggleWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.find((p) => p.id === product.id);
      const newWishlist = exists
        ? state.wishlist.filter((p) => p.id !== product.id)
        : [...state.wishlist, product];
      localStorage.setItem('ss_wishlist', JSON.stringify(newWishlist));
      return { wishlist: newWishlist };
    });
  },

  isInWishlist: (id) => get().wishlist.some((p) => p.id === id),

  addNotification: (icon, text) => {
    set((state) => {
      const newNotifs = [{ icon, text, time: new Date().toLocaleTimeString() }, ...state.notifications].slice(0, 20);
      localStorage.setItem('ss_notifs', JSON.stringify(newNotifs));
      return { notifications: newNotifs };
    });
  },

  clearNotifications: () => {
    localStorage.setItem('ss_notifs', '[]');
    set({ notifications: [] });
  },

  togglePriceAlert: (id, price, name) => {
    set((state) => {
      const exists = state.priceAlerts.find((a) => a.id === id);
      const newAlerts = exists
        ? state.priceAlerts.filter((a) => a.id !== id)
        : [...state.priceAlerts, { id, price, name }];
      localStorage.setItem('ss_price_alerts', JSON.stringify(newAlerts));
      return { priceAlerts: newAlerts };
    });
  },

  hasPriceAlert: (id) => get().priceAlerts.some((a) => a.id === id),

  toggleFollowVendor: (id) => {
    set((state) => {
      const exists = state.followedVendors.includes(id);
      const newFollows = exists
        ? state.followedVendors.filter((v) => v !== id)
        : [...state.followedVendors, id];
      localStorage.setItem('ss_follows', JSON.stringify(newFollows));
      return { followedVendors: newFollows };
    });
  },

  isFollowingVendor: (id) => get().followedVendors.includes(id),

  toggleCompare: (id) => {
    set((state) => {
      const exists = state.compareList.includes(id);
      if (exists) return { compareList: state.compareList.filter((c) => c !== id) };
      if (state.compareList.length >= 4) return state;
      return { compareList: [...state.compareList, id] };
    });
  },

  isInCompare: (id) => get().compareList.includes(id),

  addRecentView: (product) => {
    set((state) => {
      const filtered = state.recentViews.filter((v) => v.id !== product.id);
      const newViews = [product, ...filtered].slice(0, 20);
      localStorage.setItem('ss_recent', JSON.stringify(newViews));
      return { recentViews: newViews };
    });
  },

  addLoyaltyPoints: (points) => {
    const newPoints = get().loyaltyPoints + points;
    localStorage.setItem('ss_loyalty', JSON.stringify(newPoints));
    set({ loyaltyPoints: newPoints });
  },

  addAddress: (address) => {
    const newAddr = [...get().savedAddresses, address];
    localStorage.setItem('ss_addresses', JSON.stringify(newAddr));
    set({ savedAddresses: newAddr });
  },

  removeAddress: (idx) => {
    const newAddr = get().savedAddresses.filter((_, i) => i !== idx);
    localStorage.setItem('ss_addresses', JSON.stringify(newAddr));
    set({ savedAddresses: newAddr });
  },

  addSavedPayment: (payment) => {
    const newPayments = [...get().savedPayments, payment];
    localStorage.setItem('ss_payments', JSON.stringify(newPayments));
    set({ savedPayments: newPayments });
  },

  addGiftCard: (card) => {
    const newCards = [...get().giftCards, card];
    localStorage.setItem('ss_giftcards', JSON.stringify(newCards));
    set({ giftCards: newCards });
  }
}));
