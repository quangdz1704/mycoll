import type { Store, StoreInput } from '../types';
import { demoStore } from '../lib/demo';
import { requireSupabase, supabase } from './supabase';

export async function getStore(): Promise<Store> {
  if (!supabase) return demoStore;
  let query = supabase.from('stores').select('id,name,bio,avatar_url,tiktok_url,facebook_url,instagram_url,created_at,updated_at');
  if (import.meta.env.VITE_STORE_ID) query = query.eq('id', import.meta.env.VITE_STORE_ID);
  const { data, error } = await query.single();
  if (error || !data) throw new Error('Không thể tải cửa hàng. Kiểm tra kết nối hoặc cấu hình store.');
  return data as Store;
}
export async function updateStore(id: string, values: StoreInput) {
  const { storeSchema } = await import('../lib/validation');
  const { error } = await requireSupabase().from('stores').update(storeSchema.parse(values)).eq('id', id).select('id').single();
  if (error) throw error;
}
