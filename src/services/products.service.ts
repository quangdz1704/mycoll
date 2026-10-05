import type { Product, ProductInput } from '../types';
import { demoProducts } from '../lib/demo';
import { requireSupabase, supabase } from './supabase';
import { sortProducts } from '../utils/products';

const fields = 'id,store_id,category_id,name,image_url,affiliate_url,platform,price,original_price,tags,is_pinned,is_active,sort_order,created_at,updated_at';
export async function getProducts(storeId: string, admin = false): Promise<Product[]> {
  if (!supabase) return demoProducts;
  const products: Product[] = [];
  for (let page = 0; page < 100; page++) {
    let query = supabase.from('products').select(fields).eq('store_id', storeId)
      .order('is_pinned', { ascending: false }).order('sort_order').order('created_at', { ascending: false }).order('id');
    if (!admin) query = query.eq('is_active', true);
    const { data, error } = await query.range(page * 500, page * 500 + 499);
    if (error) throw error;
    products.push(...data as Product[]);
    if (data.length < 500) return sortProducts(products);
  }
  throw new Error('Danh sách quá lớn cho V1. Vui lòng bổ sung phân trang phía máy chủ.');
}
export async function saveProduct(input: ProductInput, id?: string) {
  const client = requireSupabase();
  const { productSchema } = await import('../lib/validation');
  const values = productSchema.parse(input);
  const query = id ? client.from('products').update(values).eq('id', id) : client.from('products').insert(values);
  const { error } = await query.select('id').single();
  if (error) throw error;
}
export async function patchProduct(id: string, values: Pick<Partial<Product>, 'is_pinned' | 'is_active'>) {
  const { error } = await requireSupabase().from('products').update(values).eq('id', id).select('id').single();
  if (error) throw error;
}
export async function deleteProduct(id: string) {
  const { error } = await requireSupabase().from('products').delete().eq('id', id).select('id').single();
  if (error) throw error;
}
