// ============================================
// Smart Shop — Amharic AI Customer Support
// Free: Keyword matching (no API calls)
// ============================================

export interface SupportIntent {
  type: 'tracking' | 'returns' | 'payment' | 'complaint' | 'product' | 'subscription' | 'group_buy' | 'faq';
  confidence: number;
  reply: string;
  action?: { type: 'link'; url: string; label: string };
}

type IntentPattern = {
  patterns: RegExp[];
  getReply: (text: string) => SupportIntent;
};

// ── Intent patterns with Amharic + English support ───────────────
const INTENTS: Record<string, IntentPattern> = {
  tracking: {
    patterns: [
      /(የት ነው|የት ደረሰ|መቼ ይደርሳል|መንገድ ላይ|አሁን የት|ማወቅ)/i,
      /(track|order.*where|delivery.*status|where.*order|shipping)/i,
    ],
    getReply: (text) => ({
      type: 'tracking',
      confidence: 0.85,
      reply: `📦 የእርስዎን ትእዛዝ ለመከታተል ወደ "ትእዛዞቼ" ይሂዱ። የመከታተያ ቁጥርዎን ያስገቡ እና የት እንዳለ ያያሉ።\n\nTo track your order, go to "My Orders" and enter your tracking number.`,
      action: { type: 'link', url: '/orders', label: '📋 ትእዛዞቼን ይመልከቱ' },
    }),
  },

  returns: {
    patterns: [
      /(መመለስ|ለውጥ|ተሰበረ|ተሳሳተ|አልወደድኩትም|ጉድለት|ቀዳዳ|አልሰራም|መቀየር)/i,
      /(return|refund|exchange|broken|wrong|defect|damage)/i,
    ],
    getReply: () => ({
      type: 'returns',
      confidence: 0.82,
      reply: `🔄 ምርትዎን ለመመለስ ወደ "የተመለሱ ምርቶች" ይሂዱ እና ቅጹን ይሙሉ። በ24 ሰዓታት ውስጥ መልስ ያገኛሉ።\n\nGo to "Returns" and submit the form. You'll get a response within 24 hours.`,
      action: { type: 'link', url: '/returns', label: '🔄 ምርት ይመልሱ' },
    }),
  },

  payment: {
    patterns: [
      /(ክፍያ|ገንዘብ|ከፈልኩ|አልከፈለም|ተመላሽ|ተለብር|ቻፓ|telebirr|chapa)/i,
      /(payment|pay|money|paid|telebirr|chapa|bank)/i,
    ],
    getReply: () => ({
      type: 'payment',
      confidence: 0.80,
      reply: `💳 ክፍያ ለመክፈል በቻፓ (Chapa) ወይም በተለብር (Telebirr) መክፈል ይችላሉ። ደግሞም ሲደርስ መክፈል ይችላሉ።\n\nYou can pay via Chapa, Telebirr, or Cash on Delivery.`,
    }),
  },

  subscription: {
    patterns: [
      /(ደንበኝነት|subscribe|በየቀኑ|በየሳምንቱ|በየወሩ|ዕለታዊ|ወርሃዊ)/i,
      /(subscription|subscribe|daily|weekly|monthly|recurring)/i,
    ],
    getReply: () => ({
      type: 'subscription',
      confidence: 0.78,
      reply: `📦 የደንበኝነት አገልግሎት በየቀኑ፣ በየሳምንቱ ወይም በየወሩ ምርቶች እንዲደርሱዎት ያስችላል። ወደ "ደንበኝነት" ይሂዱ እና ይጀምሩ።\n\nSubscribe for daily, weekly or monthly deliveries. Go to "Subscriptions" to start.`,
      action: { type: 'link', url: '/subscriptions', label: '📦 ደንበኝነት ይጀምሩ' },
    }),
  },

  group_buy: {
    patterns: [
      /(ማህበር|group buy|ቡድን|መሃበር|ተቀላቀለ)/i,
      /(group.*buy|group.*deal|bulk|together|mahiber)/i,
    ],
    getReply: () => ({
      type: 'group_buy',
      confidence: 0.75,
      reply: `🤝 ማህበር ግዢ ማለት ከጓደኞችዎ ጋር በመሆን ሲገዙ ቅናሽ ያገኛሉ ማለት ነው! ምርት ላይ "ማህበር ግዢ" የሚለውን ይጫኑ እና ሊንኩን ለጓደኞችዎ ያጋሩ።\n\nGroup buying = bigger discounts when friends buy together! Tap "Group Buy" on any product.`,
      action: { type: 'link', url: '/shop', label: '🛍️ ምርቶችን ይመልከቱ' },
    }),
  },

  complaint: {
    patterns: [
      /(ቅሬታ|ችግር|አልረካሁም|አላረካኝም|አስተዳዳሪ|ስህተት)/i,
      /(complain|problem|issue|manager|help|urgent|support)/i,
    ],
    getReply: () => ({
      type: 'complaint',
      confidence: 0.70,
      reply: `😔 ቅሬታዎን ሰምተናል። እባክዎ ወደ "ድጋፍ" ይሂዱ እና ችግርዎን በዝርዝር ይግለጹ። በ24 ሰዓታት ውስጥ መልስ ያገኛሉ።\n\nWe hear you! Please go to "Support" and describe your issue. We'll respond within 24 hours.`,
      action: { type: 'link', url: '/support', label: '📞 ድጋፍ ያግኙ' },
    }),
  },

  product: {
    patterns: [
      /(ምርት|እቃ|ዋጋ|price|cost|ምን ያህል|አለ|ቀረ|ቀሩ)/i,
      /(product|item|price|how much|available|stock|cost)/i,
    ],
    getReply: () => ({
      type: 'product',
      confidence: 0.65,
      reply: `🛒 ምርቶችን ለማግኘት ወደ "ሱቅ" ይሂዱ እና ይፈልጉ። የዋጋ ንጽጽር ለማድረግ ደግሞ በምርት ገፅ ላይ "ዋጋ አወዳድር" የሚለውን ይጫኑ።\n\nGo to "Shop" to find products. Tap "Compare Price" for the best deals across vendors.`,
      action: { type: 'link', url: '/shop', label: '🛒 ወደ ሱቅ ይሂዱ' },
    }),
  },
};

const FALLBACK_REPLY: SupportIntent = {
  type: 'faq',
  confidence: 0.1,
  reply: `📞 እንደገና ይጠይቁ? ወይም የሚከተሉትን ይጠቀሙ፦\n• "የት ነው?" — ትእዛዝ ለመከታተል\n• "መመለስ" — ምርት ለመመለስ\n• "ክፍያ" — ስለ ክፍያ ለመጠየቅ\n• "ማህበር ግዢ" — ስለ ቡድን ግዢ\n\nCan I help you with something else? Try asking about tracking, returns, or payment.`,
};

/**
 * Detect the intent of a customer support message
 */
export function detectSupportIntent(message: string): SupportIntent {
  for (const [, intent] of Object.entries(INTENTS)) {
    for (const pattern of intent.patterns) {
      if (pattern.test(message)) {
        return intent.getReply(message);
      }
    }
  }
  return FALLBACK_REPLY;
}

/**
 * Get quick reply buttons for common questions
 */
export function getQuickReplies(): Array<{ label: string; text: string }> {
  return [
    { label: '📦 ትእዛዜ የት ነው?', text: 'የት ነው ትእዛዜ' },
    { label: '🔄 መመለስ', text: 'ምርት መመለስ እፈልጋለሁ' },
    { label: '🤝 ማህበር ግዢ', text: 'ማህበር ግዢ እንዴት ነው?' },
    { label: '💳 ክፍያ', text: 'ክፍያ እንዴት እከፍላለሁ?' },
    { label: '📦 ደንበኝነት', text: 'ደንበኝነት ማስገባት' },
    { label: '👤 ሻጭ', text: 'ሻጭ መሆን እፈልጋለሁ' },
  ];
}
