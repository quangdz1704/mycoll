export type Platform = "shopee" | "tiktok" | "lazada" | "other";
export interface Store {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  created_at: string;
  updated_at: string;
}
export interface Category {
  id: string;
  store_id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface Product {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  image_url: string | null;
  affiliate_url: string;
  platform: Platform;
  price: number | null;
  original_price: number | null;
  tags: string[];
  is_pinned: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}
export type ProductInput = Omit<Product, "id" | "created_at" | "updated_at">;
export type CategoryInput = Omit<Category, "id" | "created_at" | "updated_at">;
export type StoreInput = Omit<Store, "id" | "created_at" | "updated_at">;
export interface Analytics {
  total_clicks: number;
  top_products: {
    id: string;
    name: string;
    image_url: string | null;
    clicks: number;
  }[];
}
