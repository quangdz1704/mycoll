import type { Category, CategoryInput } from "../types";
import { demoCategories } from "../lib/demo";
import { requireSupabase, supabase } from "./supabase";
export async function getCategories(
  storeId: string,
  admin = false,
): Promise<Category[]> {
  if (!supabase) return demoCategories;
  let query = supabase
    .from("categories")
    .select("id,store_id,name,slug,sort_order,is_active,created_at,updated_at")
    .eq("store_id", storeId)
    .order("sort_order")
    .order("name");
  if (!admin) query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Category[];
}
export async function saveCategory(input: CategoryInput, id?: string) {
  const client = requireSupabase();
  const { categorySchema } = await import("../lib/validation");
  const values = categorySchema.parse(input);
  const query = id
    ? client.from("categories").update(values).eq("id", id)
    : client.from("categories").insert(values);
  const { error } = await query.select("id").single();
  if (error) throw error;
}
export async function deleteCategory(id: string) {
  const { error } = await requireSupabase()
    .from("categories")
    .delete()
    .eq("id", id)
    .select("id")
    .single();
  if (error?.code === "23503")
    throw new Error(
      "Danh mục còn sản phẩm. Hãy chuyển hoặc xóa sản phẩm trước khi xóa danh mục.",
    );
  if (error) throw error;
}
