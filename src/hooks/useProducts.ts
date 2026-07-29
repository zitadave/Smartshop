import { useMemo, useCallback, useState } from 'react';
import { useStore } from '@/stores/AppStore';
import type { CategoryId, SortMode } from '@/types';

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
      const q = search.toLowerCase().trim();
      const rawTokens = q.split(/\s+/).filter(token => token.length > 1);
      
      // Bilingual bidirectional translation dictionary
      const translationMap: Record<string, string> = {
        'ወተት': 'milk', 'milk': 'ወተት',
        'እንቁላል': 'egg', 'egg': 'እንቁላል', 'eggs': 'እንቁላል',
        'ዳቦ': 'bread', 'bread': 'ዳቦ',
        'ውሃ': 'water', 'water': 'ውሃ',
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
        const nameAm = (p.name || '').toLowerCase();
        const nameEn = (p.nameEn || p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const descEn = (p.descriptionEn || '').toLowerCase();
        
        // If the complete original query matches, keep it
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
