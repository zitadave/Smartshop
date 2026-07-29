import { useMemo, useCallback, useState } from 'react';
import { useStore } from '@/stores/AppStore';
import type { CategoryId, SortMode } from '@/types';

export function normalizeAmharicPhonetics(text: string): string {
  let result = text.toLowerCase();
  
  const homophones: Record<string, string> = {
    'ሐ': 'ሀ', 'ኀ': 'ሀ', 'ኃ': 'ሀ', 'ኅ': 'ሀ', 'ሃ': 'ሀ', 'ሓ': 'ሀ',
    'ሑ': 'ሁ', 'ኁ': 'ሁ',
    'ሒ': 'ሂ', 'ኂ': 'ሂ',
    'ሔ': 'ሄ', 'ኄ': 'ሄ',
    'ሕ': 'ህ', 'ኅ': 'ህ',
    'ሖ': 'ሆ', 'ኆ': 'ሆ',
    'ሠ': 'ሰ', 'ሡ': 'ሱ', 'ሢ': 'ሲ', 'ሣ': 'ሳ', 'ሤ': 'ሴ', 'ሥ': 'ስ', 'ሦ': 'ሶ',
    'ዓ': 'አ', 'ዑ': 'ኡ', 'ዒ': 'ኢ', 'ዔ': 'ኤ', 'ዕ': 'እ', 'ዖ': 'ኦ',
    'ፀ': 'ጸ', 'ፁ': 'ጹ', 'ፂ': 'ጺ', 'ፃ': 'ጻ', 'ፄ': 'ጼ', 'ፅ': 'ጽ', 'ፆ': 'ጾ'
  };

  for (const [key, value] of Object.entries(homophones)) {
    result = result.replace(new RegExp(key, 'g'), value);
  }

  return result;
}

export function stripStopWords(text: string): string {
  const amharicStopWords = [
    'እባክህ', 'እባክሽ', 'እባካችሁ', 'እባካችው',
    'እፈልጋለሁ', 'እፈልጋታለሁ', 'እፈልገዋለሁ', 'እፈልጋለኹ',
    'እፈልጋለን', 'ፈልጌ', 'ፈልጌ ነበር', 'ነበር',
    'የለህም', 'የለሽም', 'የለም', 'የላችሁም',
    'አለ', 'አለሽ', 'አላቸው', 'አለው',
    'እባክዎን', 'እባክዎትን', 'እባኮትን',
    'እስኪ', 'እስቲ', 'የሆነ', 'የሆኑ', 'ጋር', 'ውስጥ'
  ];
  
  const englishStopWords = [
    'please', 'want', 'i want', 'looking for', 'look for',
    'i need', 'need', 'would like', 'do you have', 'is there',
    'any', 'some', 'for', 'with', 'in', 'have', 'has', 'get',
    'give', 'me', 'the', 'a', 'an', 'about', 'around'
  ];

  let cleaned = text.toLowerCase().trim();

  amharicStopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b|${word}`, 'g');
    cleaned = cleaned.replace(regex, '');
  });

  englishStopWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'g');
    cleaned = cleaned.replace(regex, '');
  });

  return cleaned.replace(/\s+/g, ' ').trim();
}

export function useProducts() {
  const { products } = useStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CategoryId>('all');
  const [sort, setSort] = useState<SortMode>('');

  const filtered = useMemo(() => {
    let result = [...products];

    if (category !== 'all') {
      result = result.filter(p => p.category === category);
    }

    if (search.trim()) {
      const originalQuery = search.toLowerCase().trim();
      // 1. Strip stop words
      const queryCleaned = stripStopWords(originalQuery);
      // 2. Normalize phonetics for Amharic spelling resilience!
      const q = normalizeAmharicPhonetics(queryCleaned || originalQuery);
      
      const rawTokens = q.split(/\s+/).filter(token => token.length > 1);
      
      // Bilingual bidirectional translation dictionary
      const translationMap: Record<string, string> = {
        'ወተት': 'milk', 'milk': 'ወተት',
        'እንቁላል': 'egg', 'egg': 'እንቁላል', 'eggs': 'እንቁላል',
        'ዳቦ': 'bread', 'bread': 'ዳቦ',
        'ውሃ': 'water', 'water': 'ውሃ', 'ውኃ': 'water',
        'ቡና': 'coffee', 'coffee': 'ቡና',
        'ማር': 'honey', 'honey': 'ማር',
        'ስኳር': 'sugar', 'sugar': 'ስኳር',
        'ዘይት': 'oil', 'oil': 'ዘይት',
        'እንጀራ': 'injera', 'injera': 'እንጀራ',
        'ቲማቲም': 'tomato', 'tomato': 'ቲማቲም',
        'ሳሙና': 'soap', 'soap': 'ሳሙና',
        'ጆሮ': 'headphone', 'headphone': 'ጆሮ', 'headphones': 'ጆሮ',
        'ስልክ': 'phone', 'phone': 'ስልክ',
        'ኮምፒውተር': 'computer', 'computer': 'ኮምፒውተር',
        'ልብስ': 'clothes', 'clothing': 'ልብስ', 'clothes': 'ልብስ',
        'ጫማ': 'shoes', 'shoes': 'ጫማ', 'shoe': 'ጫማ'
      };

      // Bidirectional Translation Expansion
      const searchTokens = [...rawTokens];
      rawTokens.forEach(token => {
        const trans = translationMap[token];
        if (trans && !searchTokens.includes(trans)) {
          searchTokens.push(trans);
        }
      });
      
      result = result.filter(p => {
        const nameAm = normalizeAmharicPhonetics(p.name || '');
        const nameEn = normalizeAmharicPhonetics(p.nameEn || p.name || '');
        const desc = normalizeAmharicPhonetics(p.description || '');
        const descEn = normalizeAmharicPhonetics(p.descriptionEn || '');
        
        if (nameAm.includes(q) || nameEn.includes(q)) return true;
        
        const matchToken = (token: string) => {
          return nameAm.includes(token) || 
                 nameEn.includes(token) || 
                 desc.includes(token) || 
                 descEn.includes(token);
        };
        return searchTokens.some(matchToken);
      });
    }

    switch (sort) {
      case 'price_low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        break;
      default:
        result.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0));
    }

    return result;
  }, [products, search, category, sort]);

  const topProducts = useMemo(
    () => [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 8),
    [products]
  );

  const specialOffers = useMemo(
    () => products.filter(p => p.originalPrice != null && p.originalPrice > p.price).slice(0, 6),
    [products]
  );

  return {
    filtered,
    topProducts,
    specialOffers,
    search,
    setSearch,
    category,
    setCategory,
    sort,
    setSort,
    totalCount: products.length,
  };
}
