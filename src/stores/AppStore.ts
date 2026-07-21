import { create } from 'zustand';
import type { Product, CartItem, Order, Profile, Language, AppSettings, GiftCard, PhotoReview, FlashDeal, BroadcastMessage, ThemePreset } from '@/types';

interface AppState {
  // Data
  products: Product[];
  settings: AppSettings;

  // UI State
  language: Language;
  darkMode: boolean;
  currency: 'ETB' | 'USD' | 'EUR' | 'GBP' | 'KES';
  themePreset: ThemePreset;
  customAccent: string;

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
  priceAlerts: { id: number; price: number; name: string; active: boolean }[];

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

  // === NEW FEATURES ===

  // Photo Reviews
  photoReviews: PhotoReview[];

  // Flash Deals
  flashDeals: FlashDeal[];

  // Broadcast Messages
  broadcastMessages: BroadcastMessage[];

  // Pre-Orders
  preOrders: any[];

  // Currency Rates
  currencyRates: Record<string, number>;

  // Digital Receipts
  digitalReceipts: Record<string, string>; // orderNumber -> receiptUrl

  // Order Tracking
  orderTracking: Record<string, any>;

  // Seen Broadcast IDs
  seenBroadcasts: string[];

  // Actions
  setProducts: (products: Product[]) => void;
  setSettings: (settings: AppSettings) => void;
  setLanguage: (lang: Language) => void;
  setDarkMode: (dark: boolean) => void;
  setThemePreset: (preset: ThemePreset) => void;
  setCustomAccent: (color: string) => void;
  setCurrency: (currency: 'ETB' | 'USD' | 'EUR' | 'GBP' | 'KES') => void;
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

  // === NEW ACTIONS ===
  addPhotoReview: (review: PhotoReview) => void;
  removePhotoReview: (reviewId: string) => void;
  setPhotoReviews: (reviews: PhotoReview[]) => void;
  setFlashDeals: (deals: FlashDeal[]) => void;
  setBroadcastMessages: (messages: BroadcastMessage[]) => void;
  markBroadcastSeen: (id: string) => void;
  addPreOrder: (preOrder: any) => void;
  setCurrencyRates: (rates: Record<string, number>) => void;
  setDigitalReceipt: (orderNumber: string, url: string) => void;
  setOrderTracking: (orderNumber: string, tracking: any) => void;
  applyThemePreset: (preset: ThemePreset) => void;
}

const loadPersisted = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch { return fallback; }
};

const savePersisted = (key: string, value: any) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
};

export const useStore = create<AppState>((set, get) => ({
  products: [],
  settings: {} as AppSettings,
  language: loadPersisted<Language>('ss_lang', 'am'),
  darkMode: loadPersisted<boolean>('ss_dark', false),
  currency: loadPersisted<'ETB' | 'USD' | 'EUR' | 'GBP' | 'KES'>('ss_currency', 'ETB'),
  themePreset: loadPersisted<ThemePreset>('ss_theme', 'default'),
  customAccent: loadPersisted<string>('ss_accent', '#6C63FF'),
  cart: loadPersisted<CartItem[]>('ss_cart', []),
  orders: loadPersisted<Order[]>('ss_orders', []),
  profile: loadPersisted<Profile>('ss_profile', { name: '', phone: '', email: '', registered: false, joinedAt: '' }),
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

  // New feature initial state
  photoReviews: loadPersisted<PhotoReview[]>('ss_photo_reviews', []),
  flashDeals: loadPersisted<FlashDeal[]>('ss_flash_deals', []),
  broadcastMessages: loadPersisted<BroadcastMessage[]>('ss_broadcasts', []),
  preOrders: loadPersisted<any[]>('ss_pre_orders', []),
  currencyRates: loadPersisted<Record<string, number>>('ss_currency_rates', { ETB: 1, USD: 0.019, EUR: 0.017, GBP: 0.015, KES: 2.45 }),
  digitalReceipts: loadPersisted<Record<string, string>>('ss_receipts', {}),
  orderTracking: loadPersisted<Record<string, any>>('ss_tracking', {}),
  seenBroadcasts: loadPersisted<string[]>('ss_seen_broadcasts', []),

  setProducts: (products) => set({ products }),
  setSettings: (settings) => set({ settings }),

  setLanguage: (language) => { savePersisted('ss_lang', language); set({ language }); },

  setDarkMode: (darkMode) => {
    savePersisted('ss_dark', darkMode);
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    set({ darkMode });
  },

  setThemePreset: (themePreset) => {
    savePersisted('ss_theme', themePreset);
    set({ themePreset });
    get().applyThemePreset(themePreset);
  },

  setCustomAccent: (customAccent) => {
    savePersisted('ss_accent', customAccent);
    set({ customAccent });
    document.documentElement.style.setProperty('--accent-color', customAccent);
  },

  setCurrency: (currency) => { savePersisted('ss_currency', currency); set({ currency }); },

  toggleCurrency: () => set((s) => {
    const currencies: ('ETB' | 'USD' | 'EUR' | 'GBP' | 'KES')[] = ['ETB', 'USD', 'EUR', 'GBP', 'KES'];
    const idx = (currencies.indexOf(s.currency) + 1) % currencies.length;
    const next = currencies[idx];
    savePersisted('ss_currency', next);
    return { currency: next };
  }),

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
          vendorId: product.vendorId, maxQty: product.stockCount,
          isPreOrder: product.isPreOrder,
          preOrderDeposit: product.preOrderDeposit,
        }];
      }
      savePersisted('ss_cart', newCart);
      return { cart: newCart };
    });
  },

  removeFromCart: (id) => {
    set((state) => {
      const newCart = state.cart.filter((i) => i.id !== id);
      savePersisted('ss_cart', newCart);
      return { cart: newCart };
    });
  },

  updateCartQty: (id, qty) => {
    set((state) => {
      const newCart = qty <= 0
        ? state.cart.filter((i) => i.id !== id)
        : state.cart.map((i) => i.id === id ? { ...i, qty: Math.min(qty, i.maxQty) } : i);
      savePersisted('ss_cart', newCart);
      return { cart: newCart };
    });
  },

  clearCart: () => { savePersisted('ss_cart', []); set({ cart: [] }); },

  getCartCount: () => get().cart.reduce((s, i) => s + i.qty, 0),
  getCartTotal: () => get().cart.reduce((s, i) => s + i.price * i.qty, 0),

  addOrder: (order) => {
    set((state) => {
      const newOrders = [order, ...state.orders];
      savePersisted('ss_orders', newOrders);
      return { orders: newOrders };
    });
  },

  updateOrderStatus: (orderNumber, status) => {
    set((state) => {
      const newOrders = state.orders.map((o) =>
        o.orderNumber === orderNumber ? { ...o, status: status as any } : o
      );
      savePersisted('ss_orders', newOrders);
      return { orders: newOrders };
    });
  },

  setProfile: (profile) => { savePersisted('ss_profile', profile); set({ profile }); },
  updateProfileName: (name) => { const profile = { ...get().profile, name }; savePersisted('ss_profile', profile); set({ profile }); },
  updateProfilePhone: (phone) => { const profile = { ...get().profile, phone }; savePersisted('ss_profile', profile); set({ profile }); },

  toggleWishlist: (product) => {
    set((state) => {
      const exists = state.wishlist.find((p) => p.id === product.id);
      const newWishlist = exists
        ? state.wishlist.filter((p) => p.id !== product.id)
        : [...state.wishlist, product];
      savePersisted('ss_wishlist', newWishlist);
      return { wishlist: newWishlist };
    });
  },

  isInWishlist: (id) => get().wishlist.some((p) => p.id === id),

  addNotification: (icon, text) => {
    set((state) => {
      const newNotifs = [{ icon, text, time: new Date().toLocaleTimeString() }, ...state.notifications].slice(0, 20);
      savePersisted('ss_notifs', newNotifs);
      return { notifications: newNotifs };
    });
  },

  clearNotifications: () => { savePersisted('ss_notifs', []); set({ notifications: [] }); },

  togglePriceAlert: (id, price, name) => {
    set((state) => {
      const exists = state.priceAlerts.find((a) => a.id === id);
      const newAlerts = exists
        ? state.priceAlerts.filter((a) => a.id !== id)
        : [...state.priceAlerts, { id, price, name, active: true }];
      savePersisted('ss_price_alerts', newAlerts);
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
      savePersisted('ss_follows', newFollows);
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
      savePersisted('ss_recent', newViews);
      return { recentViews: newViews };
    });
  },

  addLoyaltyPoints: (points) => {
    const newPoints = get().loyaltyPoints + points;
    savePersisted('ss_loyalty', newPoints);
    set({ loyaltyPoints: newPoints });
  },

  addAddress: (address) => {
    const newAddr = [...get().savedAddresses, address];
    savePersisted('ss_addresses', newAddr);
    set({ savedAddresses: newAddr });
  },

  removeAddress: (idx) => {
    const newAddr = get().savedAddresses.filter((_, i) => i !== idx);
    savePersisted('ss_addresses', newAddr);
    set({ savedAddresses: newAddr });
  },

  addSavedPayment: (payment) => {
    const newPayments = [...get().savedPayments, payment];
    savePersisted('ss_payments', newPayments);
    set({ savedPayments: newPayments });
  },

  addGiftCard: (card) => {
    const newCards = [...get().giftCards, card];
    savePersisted('ss_giftcards', newCards);
    set({ giftCards: newCards });
  },

  // === NEW ACTIONS ===

  addPhotoReview: (review) => {
    set((state) => {
      const newReviews = [review, ...state.photoReviews];
      savePersisted('ss_photo_reviews', newReviews);
      return { photoReviews: newReviews };
    });
  },

  removePhotoReview: (reviewId) => {
    set((state) => {
      const newReviews = state.photoReviews.filter(r => r.id !== reviewId);
      savePersisted('ss_photo_reviews', newReviews);
      return { photoReviews: newReviews };
    });
  },

  setPhotoReviews: (reviews) => { savePersisted('ss_photo_reviews', reviews); set({ photoReviews: reviews }); },

  setFlashDeals: (deals) => { savePersisted('ss_flash_deals', deals); set({ flashDeals: deals }); },

  setBroadcastMessages: (messages) => { savePersisted('ss_broadcasts', messages); set({ broadcastMessages: messages }); },

  markBroadcastSeen: (id) => {
    set((state) => {
      const newSeen = state.seenBroadcasts.includes(id) ? state.seenBroadcasts : [...state.seenBroadcasts, id];
      savePersisted('ss_seen_broadcasts', newSeen);
      return { seenBroadcasts: newSeen };
    });
  },

  addPreOrder: (preOrder) => {
    set((state) => {
      const newPreOrders = [preOrder, ...state.preOrders];
      savePersisted('ss_pre_orders', newPreOrders);
      return { preOrders: newPreOrders };
    });
  },

  setCurrencyRates: (rates) => { savePersisted('ss_currency_rates', rates); set({ currencyRates: rates }); },

  setDigitalReceipt: (orderNumber, url) => {
    set((state) => {
      const newReceipts = { ...state.digitalReceipts, [orderNumber]: url };
      savePersisted('ss_receipts', newReceipts);
      return { digitalReceipts: newReceipts };
    });
  },

  setOrderTracking: (orderNumber, tracking) => {
    set((state) => {
      const newTracking = { ...state.orderTracking, [orderNumber]: tracking };
      savePersisted('ss_tracking', newTracking);
      return { orderTracking: newTracking };
    });
  },

  applyThemePreset: (preset) => {
    const themes: Record<string, { primary: string; accent: string }> = {
      default: { primary: '#6C63FF', accent: '#8B5CF6' },
      ocean: { primary: '#0EA5E9', accent: '#06B6D4' },
      forest: { primary: '#10B981', accent: '#34D399' },
      sunset: { primary: '#F59E0B', accent: '#F97316' },
      midnight: { primary: '#6366F1', accent: '#818CF8' },
      rose: { primary: '#EC4899', accent: '#F43F5E' },
    };
    const theme = themes[preset];
    if (theme) {
      document.documentElement.style.setProperty('--accent-color', theme.accent);
      document.documentElement.style.setProperty('--primary-color', theme.primary);
      set({ customAccent: theme.accent });
    }
  },
}));
