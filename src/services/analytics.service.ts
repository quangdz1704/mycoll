import type { Analytics } from '../types';
import { requireSupabase, supabase } from './supabase';
export async function getAnalytics(storeId: string): Promise<Analytics> {
  const { data, error } = await requireSupabase().rpc('get_analytics_summary', { store_uuid: storeId });
  if (error) throw error;
  return data as Analytics;
}
export async function trackClick(productId: string) {
  if (!supabase) return;
  let referrer: string | null = null;
  try { referrer = document.referrer ? new URL(document.referrer).hostname : null; } catch { /* No referrer is valid. */ }
  const { error } = await supabase.rpc('track_product_click', { product_id: productId, referrer });
  if (error) throw error;
}
