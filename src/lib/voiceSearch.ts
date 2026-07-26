// ============================================
// Smart Shop — Amharic Voice Shopping
// Free: Web Speech API (Chrome built-in)
// ============================================

// Amharic → English keyword map (80+ words)
const AMHARIC_MAP: Record<string, string> = {
  // Foods & Groceries
  'ቡና': 'coffee', 'ሻይ': 'tea', 'ማር': 'honey', 'ዳቦ': 'bread',
  'ወተት': 'milk', 'እንቁላል': 'egg', 'ውሃ': 'water', 'አይብ': 'cheese',
  'ቅቤ': 'butter', 'በርበሬ': 'pepper', 'ሩዝ': 'rice', 'ፓስታ': 'pasta',
  'ምስር': 'lentil', 'ሽንብራ': 'chickpea', 'ጤፍ': 'teff',

  // Clothes & Fashion
  'ልብስ': 'clothes', 'ጫማ': 'shoes', 'ቦርሳ': 'bag',
  'ሱሪ': 'pants', 'ቀሚስ': 'dress', 'ኬሚስ': 'kemis',
  'ሻል': 'scarf', 'ኮፍያ': 'hat', 'ጃኬት': 'jacket',
  'ካልሲ': 'socks', 'ማርኬት': 'uniform',

  // Electronics
  'ስልክ': 'phone', 'ኮምፒውተር': 'computer', 'ቴሌቪዥን': 'tv',
  'ራዲዮ': 'radio', 'ቻርጀር': 'charger', 'ካሜራ': 'camera',
  'ሄድፎን': 'headphone', 'ስፒከር': 'speaker', 'ሰዓት': 'watch',

  // Home & Furniture
  'ሶፋ': 'sofa', 'ጠረጴዛ': 'table', 'ወንበር': 'chair',
  'አልጋ': 'bed', 'መጋረጃ': 'curtain', 'ምንጣፍ': 'carpet',
  'መብራት': 'lamp', 'መደርደሪያ': 'shelf', 'ኩሽና': 'kitchen',

  // Beauty & Health
  'ክሬም': 'cream', 'ሎሽን': 'lotion', 'ሳሙና': 'soap',
  'ሽቶ': 'perfume', 'ዘይት': 'oil', 'ሻምፖ': 'shampoo',
  'ሜካፕ': 'makeup', 'ኔይል': 'nail', 'ፀጉር': 'hair',

  // Baby & Kids
  'ሕፃን': 'baby', 'ልጅ': 'child', 'አሻንጉሊት': 'toy',
  'ዳይፐር': 'diaper', 'መጻፊያ': 'stationery',

  // Sports
  'ስፖርት': 'sports', 'ኳስ': 'ball', 'ጂም': 'gym',
  'ዮጋ': 'yoga', 'ሩጫ': 'running',

  // Actions / Intents
  'አሳይ': 'show', 'ፈልግ': 'search', 'ግዛ': 'buy',
  'አስቀምጥ': 'save', 'ተመልከት': 'view', 'ንገረኝ': 'tell',
  'ርካሽ': 'cheap', 'ውድ': 'expensive', 'አዲስ': 'new',
  'ምርጥ': 'best', 'ሙሉ': 'full',
};

// Category inference map
const CATEGORY_MAP: Record<string, string> = {
  coffee: 'groceries', honey: 'groceries', milk: 'groceries',
  bread: 'groceries', tea: 'groceries', rice: 'groceries',
  phone: 'electronics', computer: 'electronics', tv: 'electronics',
  headphone: 'electronics', speaker: 'electronics', camera: 'electronics',
  shoes: 'fashion', dress: 'fashion', kemis: 'fashion',
  bag: 'fashion', pants: 'fashion', jacket: 'fashion',
  sofa: 'home', bed: 'home', table: 'home',
  cream: 'beauty', perfume: 'beauty', soap: 'beauty',
  baby: 'baby', toy: 'baby', diaper: 'baby',
  book: 'books', sport: 'sports', yoga: 'sports',
};

export interface VoiceSearchResult {
  originalText: string;
  keywords: string[];
  category?: string;
  intent?: 'search' | 'buy' | 'show';
  confidence: number; // 0-1
}

/**
 * Check if Amharic voice recognition is supported by this browser
 */
export function isAmharicVoiceSupported(): boolean {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return false;
  try {
    const test = new SR();
    test.lang = 'am-ET';
    return true;
  } catch {
    return false;
  }
}

/**
 * 🎤 Start listening for Amharic voice input
 * Uses browser's built-in Web Speech API (Chrome on Android)
 */
export async function listenAmharic(): Promise<string> {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) throw new Error('ድምጽ ማዳመጥ አይደገፍም');

  const recognition = new SR();
  recognition.lang = 'am-ET';
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      recognition.stop();
      reject(new Error('ሰዓቱ አለቀ - እንደገና ይሞክሩ'));
    }, 10000); // 10s timeout

    recognition.onresult = (event: any) => {
      clearTimeout(timeout);
      // Take the best result (highest confidence)
      const result = event.results[0][0].transcript;
      resolve(result);
    };

    recognition.onerror = (event: any) => {
      clearTimeout(timeout);
      const errors: Record<string, string> = {
        'no-speech': 'ምንም ድምጽ አልተሰማም',
        'aborted': 'ድምጽ ማዳመጥ ተቋረጠ',
        'audio-capture': 'ማይክሮፎን አልተገኘም',
        'not-allowed': 'ማይክሮፎን ፈቃድ አልተሰጠም',
      };
      reject(new Error(errors[event.error] || 'ድምጹ አልተረዳም'));
    };

    recognition.start();
  });
}

/**
 * Translate Amharic voice text into a structured search query
 *
 * Example:
 *   "የአማርኛ ቡና አሳይኝ"
 *   → { keywords: ["coffee"], category: "groceries", intent: "show" }
 */
export function translateAmharicToSearch(amharicText: string): VoiceSearchResult {
  const words = amharicText.trim().split(/\s+/);
  const keywords: string[] = [];
  let category: string | undefined;
  let intent: 'search' | 'buy' | 'show' = 'search';

  for (const word of words) {
    const english = AMHARIC_MAP[word];
    if (english) {
      keywords.push(english);
      // Infer intent from action words
      if (word === 'ግዛ') intent = 'buy';
      else if (word === 'አሳይ' || word === 'ተመልከት') intent = 'show';
    }
  }

  // Infer category from first matching keyword
  for (const kw of keywords) {
    if (CATEGORY_MAP[kw]) {
      category = CATEGORY_MAP[kw];
      break;
    }
  }

  // If no Amharic keywords found, use raw text
  if (keywords.length === 0) {
    keywords.push(amharicText);
  }

  return {
    originalText: amharicText,
    keywords: [...new Set(keywords)], // Remove duplicates
    category,
    intent,
    confidence: keywords.length > 0 ? 0.85 : 0.3,
  };
}

/**
 * Build an API search URL from voice input
 */
export function voiceSearchToUrl(result: VoiceSearchResult): string {
  const params = new URLSearchParams();
  if (result.keywords.length > 0) params.set('q', result.keywords.join(','));
  if (result.category) params.set('category', result.category);
  return `/api/products?${params.toString()}`;
}
