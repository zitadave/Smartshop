/**
 * AI Shopping Assistant — Natural Language Product Search
 * Uses keyword matching + category inference (no API costs)
 */

import type { Product } from '@/types';

interface ParsedQuery {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  keywords: string[];
  color?: string;
  size?: string;
  intent?: 'search' | 'recommend' | 'gift';
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  electronics: ['phone', 'headphone', 'speaker', 'camera', 'tablet', 'laptop', 'charger', 'earphone', 'tech', 'gadget', 'computer', 'watch', 'smart'],
  fashion: ['dress', 'shirt', 'shoe', 'bag', 'belt', 'hat', 'scarf', 'clothes', 'wear', 'outfit', 'fabric', 'habesha', 'kemis', 'traditional'],
  home: ['blender', 'washing', 'furniture', 'lamp', 'kitchen', 'cook', 'clean', 'decor', 'appliance'],
  beauty: ['cream', 'lotion', 'oil', 'soap', 'shampoo', 'makeup', 'perfume', 'shea', 'hair', 'skin', 'cosmetic'],
  groceries: ['coffee', 'honey', 'food', 'tea', 'spice', 'oil', 'organic', 'ethiopian'],
  books: ['book', 'story', 'educational', 'learn', 'read', 'children'],
  sports: ['yoga', 'mat', 'sport', 'gym', 'exercise', 'fit', 'ball'],
  baby: ['baby', 'infant', 'kid', 'children', 'toy'],
};

const COLOR_KEYWORDS: Record<string, string[]> = {
  red: ['red', 'maroon', 'crimson', 'cherry'],
  blue: ['blue', 'navy', 'sky', 'azure'],
  green: ['green', 'emerald', 'olive'],
  black: ['black', 'dark', 'obsidian'],
  white: ['white', 'cream', 'ivory'],
  gold: ['gold', 'golden', 'yellow'],
};

const SIZE_KEYWORDS: Record<string, string[]> = {
  small: ['small', 's', 'xs'],
  medium: ['medium', 'm'],
  large: ['large', 'l', 'xl', 'xxl'],
};

function extractPrice(query: string): { min?: number; max?: number } {
  const words = query.toLowerCase().split(/\s+/);
  const result: { min?: number; max?: number } = {};
  
  // "under 2000" or "less than 2000" or "< 2000"
  const underMatch = query.match(/(?:under|less than|<|below|max)\s*(?:birr|br)?\s*(\d[\d,]*)/i);
  if (underMatch) result.max = parseInt(underMatch[1].replace(/,/g, ''));
  
  // "above 2000" or "over 2000" or "> 2000" or "more than 2000"
  const overMatch = query.match(/(?:above|over|>|more than|min)\s*(?:birr|br)?\s*(\d[\d,]*)/i);
  if (overMatch) result.min = parseInt(overMatch[1].replace(/,/g, ''));
  
  // "between 1000 and 2000"
  const betweenMatch = query.match(/between\s*(\d[\d,]*)\s*(?:and|-)\s*(\d[\d,]*)/i);
  if (betweenMatch) {
    result.min = parseInt(betweenMatch[1].replace(/,/g, ''));
    result.max = parseInt(betweenMatch[2].replace(/,/g, ''));
  }

  // Simple number extraction as price if nothing else matched
  if (!result.min && !result.max) {
    const numbers = words.filter(w => /^\d{3,5}$/.test(w)).map(Number);
    if (numbers.length === 1) result.max = numbers[0];
  }

  return result;
}

function inferCategory(query: string): string | undefined {
  const lower = query.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return cat;
  }
  return undefined;
}

function inferColor(query: string): string | undefined {
  const lower = query.toLowerCase();
  for (const [color, keywords] of Object.entries(COLOR_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return color;
  }
  return undefined;
}

function inferSize(query: string): string | undefined {
  const lower = query.toLowerCase();
  for (const [size, keywords] of Object.entries(SIZE_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return size;
  }
  return undefined;
}

function detectIntent(query: string): ParsedQuery['intent'] {
  const lower = query.toLowerCase();
  if (/gift|present|birthday|for (mom|dad|friend|wife|husband|girlfriend|boyfriend)/i.test(lower)) return 'gift';
  if (/recommend|suggest|what.*good|best|top/i.test(lower)) return 'recommend';
  return 'search';
}

export function parseQuery(query: string): ParsedQuery {
  const lower = query.toLowerCase();
  const words = lower.split(/\s+/).filter(w => w.length > 2);
  
  return {
    category: inferCategory(query),
    ...extractPrice(query),
    color: inferColor(query),
    size: inferSize(query),
    keywords: words.filter(w => !/^(the|a|an|in|on|at|to|for|of|with|and|or|is|are|was|were|this|that|i|we|you|he|she|it|they|me|my|your|his|her|its|our|their|under|over|above|below|between|less|more|than|birr|br|find|show|get|want|need|looking|buy)$/i.test(w)),
    intent: detectIntent(query),
  };
}

export function searchProducts(products: Product[], query: string): Product[] {
  const parsed = parseQuery(query);
  let results = [...products];

  if (parsed.category) {
    results = results.filter(p => p.category === parsed.category);
  }
  if (parsed.minPrice !== undefined) {
    results = results.filter(p => p.price >= parsed.minPrice!);
  }
  if (parsed.maxPrice !== undefined) {
    results = results.filter(p => p.price <= parsed.maxPrice!);
  }
  if (parsed.keywords.length > 0) {
    results = results.filter(p =>
      parsed.keywords.some(kw =>
        p.nameEn.toLowerCase().includes(kw) || p.name.toLowerCase().includes(kw) || p.descriptionEn.toLowerCase().includes(kw)
      )
    );
  }

  // Sort by relevance — exact matches first
  if (parsed.keywords.length > 0) {
    results.sort((a, b) => {
      const aScore = parsed.keywords.filter(kw => a.nameEn.toLowerCase().includes(kw)).length;
      const bScore = parsed.keywords.filter(kw => b.nameEn.toLowerCase().includes(kw)).length;
      return bScore - aScore;
    });
  }

  return results;
}

export function generateResponse(query: string, results: Product[], products: Product[]): string {
  const parsed = parseQuery(query);
  
  if (results.length === 0) {
    // Suggest alternatives
    const categoryProducts = parsed.category ? products.filter(p => p.category === parsed.category) : [];
    if (categoryProducts.length > 0) {
      const top = categoryProducts.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 3);
      return `I couldn't find exact matches, but here are popular ${parsed.category} products: ${top.map(p => p.nameEn).join(', ')}.`;
    }
    return `I couldn't find anything matching "${query}". Try browsing our categories instead!`;
  }

  if (parsed.intent === 'gift') {
    const recipient = query.match(/for\s+(.+)/i)?.[1] || 'someone special';
    return `🎁 Great gift idea for ${recipient}! I found ${results.length} perfect options starting from Br ${Math.min(...results.map(p => p.price))}.`;
  }

  const topResult = results[0];
  let response = `✨ I found **${results.length} products**`;
  
  if (parsed.category) response += ` in ${parsed.category}`;
  if (parsed.maxPrice || parsed.minPrice) {
    if (parsed.maxPrice) response += ` under Br ${parsed.maxPrice}`;
    if (parsed.minPrice) response += ` above Br ${parsed.minPrice}`;
  }
  response += `. **${topResult.nameEn}** at Br ${topResult.price.toLocaleString()} is the top match!`;

  return response;
}
