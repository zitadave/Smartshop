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
      result = result.filter(
        p => p.name.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q)
      );
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
