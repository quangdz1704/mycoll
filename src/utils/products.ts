import type { Product } from '../types';
import { normalizeVietnamese } from './format';

export function filterProducts(products: Product[], search: string, categoryId: string) {
  const terms = normalizeVietnamese(search).split(/\s+/).filter(Boolean);
  return products.filter(product => {
    const text = normalizeVietnamese(`${product.name} ${product.tags.join(' ')}`);
    return (categoryId === 'all' || product.category_id === categoryId) && terms.every(term => text.includes(term));
  });
}
export function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || a.sort_order - b.sort_order || Date.parse(b.created_at) - Date.parse(a.created_at));
}
