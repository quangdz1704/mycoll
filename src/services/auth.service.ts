import { requireSupabase } from './supabase';
export async function isAdmin() {
  const { data, error } = await requireSupabase().rpc('current_user_is_admin');
  if (error) throw error;
  return data === true;
}
export async function signIn(email: string, password: string) {
  const client = requireSupabase();
  const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error('Email hoặc mật khẩu chưa đúng. Vui lòng thử lại.');
  try {
    if (!await isAdmin()) throw new Error('Tài khoản này chưa được cấp quyền quản trị cửa hàng.');
  } catch (error) { await client.auth.signOut(); throw error; }
}
export async function signOut() {
  const { error } = await requireSupabase().auth.signOut();
  if (error) throw error;
}
