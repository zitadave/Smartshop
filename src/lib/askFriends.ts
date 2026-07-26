// ============================================
// Smart Shop — "Ask Friends" for Opinions
// Stack: Telegram API (FREE)
// ============================================

export interface ProductCard {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  category: string;
}

// ── Share a product to Telegram friends for their opinion ──
export function askFriends(product: ProductCard): void {
  const link = `https://smartshop-steel.vercel.app/product/${product.id}`;
  
  const message =
    `🛍️ *${product.name}*\n` +
    `💰 Br ${product.price.toLocaleString()}` +
    (product.originalPrice ? ` ~~${product.originalPrice.toLocaleString()}~~` : '') +
    `\n⭐ ${product.rating}/5 | ${product.category}\n\n` +
    `ምን ይመስላችኋል? ልገዛው እፈልጋለሁ 🤔\n\n` +
    `👇 አይተህ ንገረኝ:\n${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true });
  } else {
    const shareText = `ምን ይመስላችኋል? ${product.name} - Br ${product.price}\n${link}`;
    navigator.clipboard.writeText(shareText);
  }
}

// ── Share a poll to Telegram group ─────────────────────────
export function askFriendsPoll(product1: ProductCard, product2: ProductCard): void {
  const link1 = `https://smartshop-steel.vercel.app/product/${product1.id}`;
  const link2 = `https://smartshop-steel.vercel.app/product/${product2.id}`;
  
  const message =
    `📊 *የትኛውን ልገዛ? (Which should I buy?)*\n\n` +
    `1️⃣ *${product1.name}* — Br ${product1.price.toLocaleString()}\n` +
    `   ⭐ ${product1.rating}/5\n` +
    `   ${link1}\n\n` +
    `2️⃣ *${product2.name}* — Br ${product2.price.toLocaleString()}\n` +
    `   ⭐ ${product2.rating}/5\n` +
    `   ${link2}\n\n` +
    `ምን ትላላችሁ? 🤔`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(message, { allowGroupChats: true });
  }
}
