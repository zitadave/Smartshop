// ===== SHARED API HELPERS =====
// Extracted from index.ts for better organization and reusability

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
}

export function normalizeProduct(p) {
  return {
    id: p.id, name: p.name || '', nameEn: p.name_en || '', category: p.category || '',
    price: p.price || 0, originalPrice: p.original_price || null, image: p.image || '',
    images: p.images || [], badge: p.badge || '', description: p.description || '',
    descriptionEn: p.description_en || '', stockCount: p.stock_count || 0,
    soldCount: p.sold_count || 0, rating: p.rating || 4.0, reviews: p.reviews || 0,
    vendorId: p.vendor_id || null, vendorName: p.vendor_name || '',
    inStock: p.in_stock !== false, visible: p.visible !== false,
    colors: p.colors || [], sizes: p.sizes || [], features: p.features || [],
    tags: p.tags || [], brand: p.brand || '', featured: p.featured || false,
    weight: p.weight || 0, unit: p.unit || 'kg',
    seoTitle: p.seo_title || '', seoDescription: p.seo_description || '',
    createdAt: p.created_at || '', isPreOrder: p.is_pre_order || false,
    preOrderDeposit: p.pre_order_deposit || null, preOrderReleaseDate: p.pre_order_release_date || null,
    preOrderMax: p.pre_order_max || null,
  };
}

export function verifyTelegramInitData(initData, botToken) {
  try {
    if (!initData || !botToken) {
      var params = new URLSearchParams(initData);
      var userStr = params.get('user');
      return { valid: true, user: userStr ? JSON.parse(userStr) : null };
    }
    var params = new URLSearchParams(initData);
    var hash = params.get('hash') || '';
    if (!hash) return { valid: false };
    params.delete('hash');
    var dataCheckString = [...params.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => k + '=' + v)
      .join('\n');
    var crypto = require('crypto');
    var secretKey = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest();
    var computedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
    if (computedHash !== hash) return { valid: false };
    var userStr = params.get('user');
    return { valid: true, user: userStr ? JSON.parse(userStr) : null };
  } catch (e) {
    return { valid: false };
  }
}

export function parseRequest(req) {
  return {
    path: (req.url || '').split('?')[0],
    method: req.method || 'GET',
    query: Object.fromEntries(new URLSearchParams(req.url?.split('?')[1] || '')),
    body: req.body || {},
  };
}

export function requireFields(body, fields) {
  var missing = fields.filter(function(f) { return !body[f]; });
  if (missing.length > 0) {
    return { valid: false, error: 'Missing required fields: ' + missing.join(', ') };
  }
  return { valid: true };
}

export function safeInt(val, fallback) {
  var n = parseInt(val);
  return isNaN(n) ? (fallback || 0) : n;
}

export function generateOrderNumber() {
  return 'ETH-' + Date.now().toString(36).toUpperCase();
}
