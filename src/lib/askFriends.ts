// ============================================
// Smart Shop — "Ask Friends" for Opinions
// Free: Telegram API
// ============================================

/**
 * Share a product to Telegram friends for their opinion
 */
export function askFriends(product: {
  id: number;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  description: string;
}): void {
  const link = `https://smartshop-steel.vercel.app/product/${product.id}`;
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const stars = '⭐'.repeat(Math.round(product.rating));

  let msg =
    `🛍️ *${product.name}*\n` +
    `${stars} ${product.rating}/5\n`;

  if (hasDiscount) {
    msg += `💰 ~~Br ${product.originalPrice}~~ → *Br ${product.price}* (ቅናሽ!)\n`;
  } else {
    msg += `💰 Br ${product.price}\n`;
  }

  msg +=
    `\n${product.description?.substring(0, 100) || ''}\n\n` +
    `🤔 *ምን ይመስላችኋል? ልገዛው እፈልጋለሁ*\n\n` +
    `አይተህ ንገረኝ 👇\n${link}`;

  const tg = (window as any).Telegram?.WebApp;
  if (tg?.switchInlineQuery) {
    tg.switchInlineQuery(msg, { allowGroupChats: true });
  } else {
    navigator.clipboard.writeText(link);
  }
}
