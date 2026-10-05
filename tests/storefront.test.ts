import { describe, it, expect } from 'vitest';
import { normalizeVietnamese, slugify, httpUrl } from '../src/utils/format';
import { filterProducts, sortProducts } from '../src/utils/products';
import { productSchema, categorySchema, storeSchema } from '../src/lib/validation';
import { demoProducts } from '../src/lib/demo';

describe('Visitors find products in Vietnamese', () => {
  it('matches accented names with unaccented queries, including đ', () => {
    expect(normalizeVietnamese('Đồ BẾP')).toBe('do bep');
    expect(filterProducts(demoProducts, 'dia gom', 'all').map(p => p.name)).toEqual(['Bộ đĩa gốm cho bàn ăn thêm xinh']);
  });
  it('matches tags, multiple search terms, and categories together', () => {
    const result = filterProducts(demoProducts, 'coffee hat', demoProducts[2].category_id);
    expect(result.map(p => p.id)).toEqual([demoProducts[2].id]);
    expect(filterProducts(demoProducts, 'coffee', demoProducts[1].category_id)).toEqual([]);
    expect(filterProducts(demoProducts, 'khong-ton-tai', 'all')).toEqual([]);
  });
  it('orders pinned products first, then sort order, then latest creation', () => {
    const input = [
      { ...demoProducts[0], id: 'old', is_pinned: false, sort_order: 2, created_at: '2026-01-01' },
      { ...demoProducts[0], id: 'new', is_pinned: false, sort_order: 2, created_at: '2026-09-01' },
      { ...demoProducts[0], id: 'pinned', is_pinned: true, sort_order: 99 },
      { ...demoProducts[0], id: 'first', is_pinned: false, sort_order: 1 },
    ];
    expect(sortProducts(input).map(p => p.id)).toEqual(['pinned', 'first', 'new', 'old']);
    expect(input[0].id).toBe('old');
  });
});
describe('Admin input validation', () => {
  const product = { ...demoProducts[0], image_url: null };
  it('accepts optional prices and zero, rejects negative and inconsistent prices', () => {
    expect(productSchema.safeParse({ ...product, price: null, original_price: null }).success).toBe(true);
    expect(productSchema.safeParse({ ...product, price: 0 }).success).toBe(true);
    expect(productSchema.safeParse({ ...product, price: -1 }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, price: 300000, original_price: 200000 }).success).toBe(false);
  });
  it('rejects script/data URLs and invalid category IDs', () => {
    for (const affiliate_url of ['javascript:alert(1)', 'data:text/html,test', 'not-a-url']) {
      expect(productSchema.safeParse({ ...product, affiliate_url }).success).toBe(false);
      expect(httpUrl(affiliate_url)).toBe(null);
    }
    expect(productSchema.safeParse({ ...product, category_id: '' }).success).toBe(false);
  });
  it('validates tags and display order', () => {
    expect(productSchema.safeParse({ ...product, tags: Array(31).fill('test') }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, sort_order: 1.5 }).success).toBe(false);
  });
  it('generates Vietnamese slugs and rejects unsafe slugs', () => {
    expect(slugify('  Đồ bếp & Nhà cửa! ')).toBe('do-bep-nha-cua');
    expect(categorySchema.safeParse({ store_id: product.store_id, name: 'Đồ bếp', slug: 'do-bep', sort_order: 0, is_active: true }).success).toBe(true);
    expect(categorySchema.safeParse({ store_id: product.store_id, name: 'Đồ bếp', slug: '../admin', sort_order: 0, is_active: true }).success).toBe(false);
  });
  it('validates social URLs and allows blank optional links', () => {
    expect(storeSchema.parse({ name: 'Nhà Quang', bio: '', avatar_url: '', tiktok_url: '', facebook_url: '', instagram_url: '' }).tiktok_url).toBe(null);
    expect(storeSchema.safeParse({ name: ' ', bio: null, avatar_url: null, tiktok_url: null, facebook_url: null, instagram_url: null }).success).toBe(false);
  });
});
