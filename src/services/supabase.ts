import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const isConfigured = Boolean(url && key);
export const supabase = isConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  : null;
export function requireSupabase() {
  if (!supabase)
    throw new Error(
      "Chưa kết nối Supabase. Hãy cấu hình Project URL và anon key trong .env.",
    );
  return supabase;
}
