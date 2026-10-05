import type { Store, Category, Product } from '../types';
const now = '2026-10-05T00:00:00Z';
const storeId = 'a0000000-0000-4000-8000-000000000001';
export const demoStore: Store = {
  id: storeId, name: 'Nhà Quang', bio: 'Đồ mình dùng, những điều mình yêu.\nGửi bạn một chút cảm hứng cho mỗi ngày ✨',
  avatar_url: '/images/avatar.webp', tiktok_url: null, instagram_url: null, facebook_url: null, created_at: now, updated_at: now,
};
const names = ['Nhà cửa', 'Đồ bếp', 'Công nghệ', 'Làm đẹp', 'Thời trang'];
export const demoCategories: Category[] = names.map((name, i) => ({ id: `b0000000-0000-4000-8000-00000000000${i + 1}`, store_id: storeId, name, slug: ['nha-cua', 'do-bep', 'cong-nghe', 'lam-dep', 'thoi-trang'][i], sort_order: i, is_active: true, created_at: now, updated_at: now }));
const samples: { name: string; image: string; category: number; price: number; original: number; tags: string[]; pinned?: boolean; platform?: Product['platform'] }[] = [
  { name: 'Bộ đĩa gốm cho bàn ăn thêm xinh', image: 'vase', category: 1, price: 189000, original: 250000, tags: ['bat dia', 'gom', 'ban an'], pinned: true },
  { name: 'Tai nghe không dây cho ngày tập trung', image: 'headphones', category: 2, price: 790000, original: 990000, tags: ['tai nghe', 'bluetooth'], pinned: true, platform: 'tiktok' },
  { name: 'Cà phê rang mộc cho buổi sáng chậm', image: 'coffee', category: 1, price: 245000, original: 290000, tags: ['ca phe', 'coffee', 'hat'], pinned: true },
  { name: 'Túi tote vải canvas đi đâu cũng tiện', image: 'tote', category: 4, price: 129000, original: 169000, tags: ['tui', 'canvas'], pinned: true },
  { name: 'Đèn bàn tối giản, ánh sáng ấm áp', image: 'lamp', category: 0, price: 349000, original: 450000, tags: ['den ngu', 'decor'] },
  { name: 'Cốc gốm cho ly cà phê yêu thích', image: 'mug', category: 1, price: 159000, original: 199000, tags: ['coc', 'ly', 'coffee'] },
  { name: 'Serum dưỡng da cho mỗi ngày', image: 'serum', category: 3, price: 285000, original: 350000, tags: ['duong da', 'skincare'], platform: 'lazada' },
  { name: 'Giày sneaker màu đất dễ phối đồ', image: 'sneakers', category: 4, price: 650000, original: 850000, tags: ['giay', 'sneaker'] },
];
export const demoProducts: Product[] = samples.map((p, i) => ({
  id: `c0000000-0000-4000-8000-00000000000${i + 1}`, store_id: storeId, category_id: demoCategories[p.category].id,
  name: p.name, image_url: `/images/${p.image}.webp`, affiliate_url: p.platform === 'tiktok' ? 'https://www.tiktok.com/shop' : p.platform === 'lazada' ? `https://www.lazada.vn/catalog/?q=${encodeURIComponent(p.name)}` : `https://shopee.vn/search?keyword=${encodeURIComponent(p.name)}`,
  platform: p.platform || 'shopee', price: p.price, original_price: p.original, tags: p.tags, is_pinned: !!p.pinned, is_active: true,
  sort_order: i, created_at: now, updated_at: now,
}));
