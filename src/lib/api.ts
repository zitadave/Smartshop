/**
 * Smart Shop API Client
 * Works with any backend: Render, Cloudflare Workers, or local dev server
 */

const API_BASE = 'https://smartshop-api.zitadave61.workers.dev';

async function request<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API Error ${res.status}: ${text}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return res.json();
  }

  return res as unknown as T;
}

// ==================== PRODUCTS ====================

export const productsApi = {
  list: () => request<{ products: any[] }>('/api/products'),
  get: (id: number) => request<{ product: any }>(`/api/products/${id}`),
  create: (data: any) => request<{ success: boolean; product: any }>('/api/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<{ success: boolean; product: any }>(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }),
};

// ==================== ORDERS ====================

export const ordersApi = {
  list: () => request<{ orders: any[] }>('/api/orders'),
  get: (orderNumber: string) => request<{ success: boolean; order: any }>(`/api/orders/${orderNumber}`),
  create: (data: any) => request<{ success: boolean; order: any }>('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (orderNumber: string, status: string) => request<{ success: boolean }>(`/api/orders/${orderNumber}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  cancel: (orderNumber: string) => request<{ success: boolean }>(`/api/orders/${orderNumber}/cancel`, { method: 'POST' }),
};

// ==================== VENDORS ====================

export const vendorsApi = {
  list: () => request<{ vendors: any[] }>('/api/vendors'),
  register: (data: any) => request<{ success: boolean; vendor: any }>('/api/vendors/register', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<{ success: boolean }>(`/api/vendors/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ==================== SETTINGS ====================

export const settingsApi = {
  get: () => request<{ success: boolean; settings: any }>('/api/settings'),
  update: (data: any) => request<{ success: boolean }>('/api/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ==================== AFFILIATES ====================

export const affiliatesApi = {
  list: () => request<{ products: any[] }>('/api/affiliates'),
  listWithProducts: () => request<{ products: any[] }>('/api/affiliates/with-products'),
  create: (data: any) => request<{ success: boolean }>('/api/affiliates', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<{ success: boolean }>(`/api/affiliates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ==================== UPLOAD ====================

export const uploadApi = {
  image: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{ url: string }>('/api/upload', { method: 'POST', body: formData });
  },
};

// ==================== USERS ====================

export const usersApi = {
  list: () => request<{ success: boolean; users: any[] }>('/api/users'),
  register: (data: any) => request<{ success: boolean; user: any }>('/api/users/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ==================== ANALYTICS ====================

export const analyticsApi = {
  get: (days = 14) => request<{ analytics: any }>(`/api/analytics?days=${days}`),
};

// ==================== BROADCAST ====================

export const broadcastApi = {
  send: (message: string) => request<{ success: boolean; sent: number; total: number }>('/api/broadcast', { method: 'POST', body: JSON.stringify({ message }) }),
};

// ==================== PHOTO REVIEWS ====================

export const reviewsApi = {
  list: (productId?: number) => request<{ reviews: any[] }>(`/api/reviews${productId ? `?productId=${productId}` : ''}`),
  create: (data: { productId: number; rating: number; text: string; images?: string[]; userName?: string }) =>
    request<{ success: boolean; review: any }>('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
  delete: (reviewId: string) => request<{ success: boolean }>(`/api/reviews/${reviewId}`, { method: 'DELETE' }),
};

// ==================== PRE-ORDERS ====================

export const preOrdersApi = {
  create: (data: { productId: number; quantity: number; deposit: number; phone: string; name: string }) =>
    request<{ success: boolean; preOrder: any }>('/api/pre-orders', { method: 'POST', body: JSON.stringify(data) }),
  list: () => request<{ preOrders: any[] }>('/api/pre-orders'),
  cancel: (id: number) => request<{ success: boolean }>(`/api/pre-orders/${id}/cancel`, { method: 'POST' }),
};

// ==================== CURRENCY RATES ====================

export const currencyApi = {
  getRates: () => request<{ rates: Record<string, number>; base: string }>('/api/currency/rates'),
};

// ==================== RECEIPTS ====================

export const receiptsApi = {
  generate: (orderNumber: string) => request<{ success: boolean; receiptUrl: string }>(`/api/receipts/${orderNumber}`, { method: 'POST' }),
  get: (orderNumber: string) => request<{ success: boolean; receipt: any }>(`/api/receipts/${orderNumber}`),
};

// ==================== FLASH DEALS ====================

export const flashDealsApi = {
  list: () => request<{ deals: any[] }>('/api/flash-deals'),
  create: (data: { productId: number; endTime: number; discount?: number; maxQuantity?: number }) =>
    request<{ success: boolean; deal: any }>('/api/flash-deals', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<{ success: boolean }>(`/api/flash-deals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: number) => request<{ success: boolean }>(`/api/flash-deals/${id}`, { method: 'DELETE' }),
};

// ==================== ORDER TRACKING ====================

export const trackingApi = {
  get: (orderNumber: string) => request<{ success: boolean; tracking: any }>(`/api/tracking/${orderNumber}`),
  update: (orderNumber: string, data: any) => request<{ success: boolean }>(`/api/tracking/${orderNumber}`, { method: 'PUT', body: JSON.stringify(data) }),
};
