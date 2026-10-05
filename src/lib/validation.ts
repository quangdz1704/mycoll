import { z } from "zod";
import { httpUrl } from "../utils/format";

const url = z
  .string()
  .max(2048, "URL quá dài")
  .refine(
    (value) => !!httpUrl(value),
    "Nhập URL hợp lệ bắt đầu bằng https:// hoặc http://",
  );
const optionalUrl = z
  .union([url, z.literal(""), z.null()])
  .transform((value) => value || null);
const price = z.number().finite().nonnegative("Giá không được âm").nullable();
export const productSchema = z
  .object({
    store_id: z.uuid(),
    category_id: z.uuid("Vui lòng chọn danh mục"),
    name: z.string().trim().min(1, "Nhập tên sản phẩm").max(200),
    affiliate_url: url,
    image_url: optionalUrl,
    platform: z.enum(["shopee", "tiktok", "lazada", "other"]),
    price,
    original_price: price,
    tags: z.array(z.string().trim().min(1).max(50)).max(30),
    is_pinned: z.boolean(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0).max(1000000),
  })
  .refine(
    (value) =>
      value.price === null ||
      value.original_price === null ||
      value.original_price >= value.price,
    {
      message: "Giá gốc phải lớn hơn hoặc bằng giá hiện tại",
      path: ["original_price"],
    },
  );
export const categorySchema = z.object({
  store_id: z.uuid(),
  name: z.string().trim().min(1, "Nhập tên danh mục").max(80),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug chỉ gồm chữ thường không dấu, số và dấu gạch nối",
    ),
  sort_order: z.number().int().min(0).max(1000000),
  is_active: z.boolean(),
});
export const storeSchema = z.object({
  name: z.string().trim().min(1, "Nhập tên cửa hàng").max(100),
  bio: z.string().max(300).nullable(),
  avatar_url: optionalUrl,
  tiktok_url: optionalUrl,
  facebook_url: optionalUrl,
  instagram_url: optionalUrl,
});
