// ============================================
// Smart Shop — Amharic Voice Shopping
// Stack: Web Speech API (browser built-in, FREE)
// ============================================

// ── Amharic → English Keyword Map ─────────────────────────────
const AMHARIC_MAP: Record<string, string> = {
  // Foods & Groceries
  'ቡና': 'coffee', 'ሻይ': 'tea', 'ማር': 'honey', 'ዳቦ': 'bread',
  'ወተት': 'milk', 'እንቁላል': 'egg', 'ውሃ': 'water', 'አይብ': 'cheese',
  'ቅቤ': 'butter', 'በርበሬ': 'pepper', 'ሩዝ': 'rice', 'ስኳር': 'sugar',
  'ምግብ': 'food', 'ኮመጠጠ': 'spice',

  // Clothes & Fashion
  'ልብስ': 'clothes', 'ጫማ': 'shoes', 'ቦርሳ': 'bag',
  'ሱሪ': 'pants', 'ቀሚስ': 'dress', 'ኬሚስ': 'kemis',
  'ሻል': 'scarf', 'ኮፍያ': 'hat', 'ጃኬት': 'jacket',

  // Electronics
  'ስልክ': 'phone', 'ኮምፒውተር': 'computer', 'ቴሌቪዥን': 'tv',
  'ራዲዮ': 'radio', 'ቻርጀር': 'charger', 'ካሜራ': 'camera',

  // Home
  'ሶፋ': 'sofa', 'ጠረጴዛ': 'table', 'ወንበር': 'chair',
  'አልጋ': 'bed', 'መጋረጃ': 'curtain', 'ምንጣፍ': 'carpet',
  'ማቀዝቀዣ': 'refrigerator', 'ማጠቢያ': 'washing',

  // Beauty
  'ክሬም': 'cream', 'ሎሽን': 'lotion', 'ሳሙና': 'soap',
  'ሽቶ': 'perfume', 'ዘይት': 'oil', 'ቀለም': 'lipstick',
  'ፀጉር': 'hair', 'ቆዳ': 'skin',

  // Actions
  'አሳይ': 'show', 'ፈልግ': 'search', 'ግዛ': 'buy',
  'አስቀምጥ': 'save', 'ተመልከት': 'view',
  'ርካሽ': 'cheap', 'ውድ': 'expensive', 'አዲስ': 'new',
};

// ── Category inference from keywords ──────────────────────────
const CATEGORY_MAP: Record<string, string> = {
  coffee: 'groceries', honey: 'groceries', milk: 'groceries',
  bread: 'groceries', rice: 'groceries', tea: 'groceries',
  phone: 'electronics', computer: 'electronics', tv: 'electronics',
  camera: 'electronics', charger: 'electronics',
  shoes: 'fashion', dress: 'fashion', kemis: 'fashion',
  bag: 'fashion', jacket: 'fashion', scarf: 'fashion',
  sofa: 'home', bed: 'home', table: 'home',
  refrigerator: 'home', washing: 'home',
  cream: 'beauty', perfume: 'beauty', soap: 'beauty',
  oil: 'beauty', hair: 'beauty',
};

// ── Check if browser supports Amharic voice ───────────────────
export function isAmharicVoiceSupported(): boolean {
  if (typeof window === 'undefined') return false;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) return false;
  // Quick test: most Chrome Android builds support am-ET
  return true;
}

// ── Start Amharic voice recognition ────────────────────────────
export async function listenAmharic(options?: {
  timeout?: number;
  onInterim?: (text: string) => void;
}): Promise<string> {
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!SR) throw new Error('የድምጽ ማወቂያ አይደገፍም');

  const recognition = new SR();
  recognition.lang = 'am-ET';
  recognition.continuous = false;
  recognition.interimResults = !!options?.onInterim;
  recognition.maxAlternatives = 3;

  return new Promise((resolve, reject) => {
    const timeoutId = options?.timeout
      ? setTimeout(() => { recognition.stop(); reject(new Error('ድምጹ አልተሰማም')); }, options.timeout)
      : null;

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else if (options?.onInterim) {
          interimText += event.results[i][0].transcript;
        }
      }

      if (options?.onInterim && interimText) options.onInterim(interimText);

      if (finalText) {
        if (timeoutId) clearTimeout(timeoutId);
        resolve(finalText.trim());
      }
    };

    recognition.onerror = (event: any) => {
      if (timeoutId) clearTimeout(timeoutId);
      const errors: Record<string, string> = {
        'no-speech': 'ምንም ድምጽ አልተሰማም። እንደገና ይሞክሩ',
        'audio-capture': 'ማይክሮፎን አልተገኘም',
        'not-allowed': 'እባክዎ ማይክሮፎን ይፍቀዱ',
        'language-not-supported': 'የአማርኛ ድምጽ በዚህ መሳሪያ አይደገፍም',
      };
      reject(new Error(errors[event.error] || 'ድምጹ አልተረዳም'));
    };

    recognition.onend = () => {
      if (timeoutId) clearTimeout(timeoutId);
    };

    recognition.start();
  });
}

// ── Translate Amharic voice text to search query ──────────────
export interface VoiceSearchQuery {
  originalText: string;
  keywords: string[];
  category?: string;
  isAmharic: boolean;
}

export function parseVoiceQuery(amharicText: string): VoiceSearchQuery {
  const words = amharicText.split(/\s+/);
  const keywords: string[] = [];
  let category: string | undefined;

  for (const word of words) {
    const english = AMHARIC_MAP[word];
    if (english) {
      keywords.push(english);
      // Infer category
      if (CATEGORY_MAP[english]) {
        category = CATEGORY_MAP[english];
      }
    }
  }

  // If no Amharic keywords matched, use raw text as English fallback
  if (keywords.length === 0) {
    keywords.push(amharicText);
  }

  return {
    originalText: amharicText,
    keywords: [...new Set(keywords)], // Deduplicate
    category,
    isAmharic: keywords.length > 0,
  };
}

// ── Generate search URL from voice query ──────────────────────
export function buildSearchUrl(query: VoiceSearchQuery): string {
  const params = new URLSearchParams();
  params.set('q', query.keywords.join(' '));
  if (query.category) params.set('category', query.category);
  return `/shop?${params.toString()}`;
}

// ── Voice Search Button Hook ────────────────────────────────
export function useVoiceSearch() {
  const isSupported = isAmharicVoiceSupported();
  return { isSupported, listenAmharic, parseVoiceQuery, buildSearchUrl };
}
