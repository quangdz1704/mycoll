# Nhà Quang — Affiliate Storefront V1

Storefront cá nhân mobile-first, lấy cảm hứng từ luồng tìm sản phẩm của creator store. Một storefront, một admin; không có giỏ hàng, checkout, đăng ký công khai hoặc trang chi tiết sản phẩm.

**Stack:** Vite, React, TypeScript, Tailwind CSS 4, React Router, Supabase, TanStack Query, Zod, Radix UI (dialog/confirmation), Lucide, Sonner. Frontend gọi Supabase trực tiếp qua service layer. Không cần backend riêng.

## Trạng thái hiện tại

- Source code, migration, RLS, Storage Policies và cấu hình Vercel có sẵn.
- Khi chưa cấu hình Supabase, `/` hiển thị 8 sản phẩm minh họa; admin không cho đăng nhập hay ghi dữ liệu. Dữ liệu mẫu không tự nhập vào database và các link mẫu không phải link affiliate thật.
- Bạn cần tạo Supabase project, chạy migration và cấp quyền cho một admin theo hướng dẫn dưới đây trước khi dùng cửa hàng thật.
- Kiểm thử PostgreSQL dùng schema `auth` và `storage` tối thiểu để kiểm tra SQL/RLS thực tế. Kiểm thử browser dùng API fixture riêng, **không thay thế** việc xác nhận Auth/Storage trên project Supabase thật.

## Chạy local

Yêu cầu Node.js **22.14+** (hoặc bản LTS mới hơn), npm, Supabase project.

```bash
npm ci
cp .env.example .env
# Điền cấu hình Supabase trong .env
npm run dev
```

Mở `http://127.0.0.1:5180`. Không điền cấu hình vẫn xem được giao diện mẫu.

```bash
npm run typecheck
npm test
npm run build
npm run preview
```

## Tạo Supabase từ đầu

1. Tạo project tại [Supabase Dashboard](https://supabase.com/dashboard), chọn region gần người dùng. Lưu mật khẩu database ở nơi an toàn.
2. Trong **Authentication → Sign In / Providers**, tắt **Allow new users to sign up**. App không có UI đăng ký, nhưng phải tắt cả API signup.
3. Mở **SQL Editor**, chạy toàn bộ [migration](supabase/migrations/202610050001_storefront.sql) một lần trên project mới. Migration tạo bảng, index, RPC, bucket, policy và store mặc định. Không chạy `tests/database-bootstrap.sql` trên Supabase.
4. Trong **Authentication → Users → Add user**, tạo admin bằng email và mật khẩu; xác nhận email bằng Dashboard nếu cần. Không đưa mật khẩu vào source hay biến môi trường frontend.
5. Cấp quyền admin bằng SQL bên dưới. Thay email mẫu bằng email vừa tạo. Nếu câu SQL không trả về một dòng, kiểm tra email và user trong Dashboard.

```sql
insert into private.admin_config (user_id, store_id)
select id, 'a0000000-0000-4000-8000-000000000001'::uuid
from auth.users
where lower(email) = lower('admin@example.com')
returning user_id, store_id;
```

Bảng `private.admin_config` chỉ có một dòng, không public qua REST, không cho frontend sửa. Tài khoản authenticated khác không thể quản trị dữ liệu hay upload ảnh. Nếu cần thay admin, cập nhật dòng này bằng SQL Dashboard; không mở quyền cho mọi user.

6. Trong **Project Settings → API / API Keys**, lấy **Project URL** và **publishable key** hoặc legacy **anon key**. Điền `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
VITE_STORE_ID=a0000000-0000-4000-8000-000000000001
```

`VITE_STORE_ID` có thể để trống khi database chỉ có một store. Với nhiều store trong database sau này, đặt rõ ID. App V1 không có UI nhiều store.

**Không dùng `service_role` hoặc secret key trong bất kỳ `VITE_*` nào.** Publishable/anon key là key frontend; quyền thực sự được quyết định bởi RLS và JWT.

7. Khởi động lại Vite. Mở `/admin/login`, đăng nhập, tạo danh mục, thêm sản phẩm và tải ảnh. Cửa hàng mới bắt đầu trống, không mang sản phẩm demo vào production.
8. Đặt Site URL của Supabase Auth thành URL triển khai. V1 dùng email/password, không dùng OAuth hay magic link; không cần callback route.

## Các trang

| Route | Nội dung |
| --- | --- |
| `/` | Profile, social links đã cấu hình, search tên/tags có hoặc không dấu, category scroll, product grid |
| `/admin/login` | Supabase email/password, không có signup |
| `/admin` | Tổng sản phẩm, sản phẩm hiển thị, danh mục, click và top 5 |
| `/admin/products` | Search/filter, thêm/sửa/xóa, ghim, bật/tắt, thứ tự |
| `/admin/categories` | CRUD, slug tự tạo, thứ tự, bật/tắt; chặn xóa danh mục còn sản phẩm |
| `/admin/settings` | Tên, bio, avatar, TikTok, Facebook, Instagram |

Mọi route admin ngoài login kiểm tra session **và** RPC xác nhận admin. Refresh giữ session; unauthenticated chuyển về login. Admin đăng nhập mở login được chuyển về dashboard.

## Database và bảo mật

- `stores`: thông tin cửa hàng.
- `categories`: danh mục có `store_id`, slug unique theo store.
- `products`: có `store_id` và FK ghép `(category_id, store_id)` để không tham chiếu nhầm cửa hàng; giá nullable.
- `product_clicks`: có FK ghép `(product_id, store_id)`, referrer và thời gian.
- `private.admin_config`: ánh xạ admin duy nhất đến store được cấp quyền.
- Khách đọc store, danh mục active, sản phẩm active trong danh mục active; không CRUD dữ liệu hoặc upload. Storefront vẫn lọc category active khi admin đang đăng nhập.
- Khách chỉ ghi click qua `track_product_click(product_id, referrer)`. RPC không ghi sản phẩm không tồn tại, bị tắt hoặc thuộc danh mục bị tắt; không cho đọc analytics công khai.
- `get_analytics_summary(store_uuid)` kiểm tra admin trước khi trả tổng và top 5. Không tải analytics trên storefront.
- Mọi hàm `security definer` đặt `search_path = ''` và tham chiếu schema rõ ràng. Chỉ grant đúng hàm và quyền cần dùng.
- `product-images`, `store-assets` public read; write chỉ admin, path bắt đầu bằng store UUID. JPG/PNG/WebP, giới hạn 2 MB sau nén.
- Client resize cạnh dài tối đa 1200px, nén WebP trước upload; từ chối file đầu vào trên 15 MB.
- Link chỉ cho `http:`/`https:`; native anchor mở tab mới với `sponsored noopener noreferrer`. Tracking lỗi không chặn navigation. Referrer chỉ lưu hostname, không lưu query string.

Click là số lần mở link thô, không phải người dùng duy nhất hay đơn hàng; chưa chống bot ở V1. Xóa sản phẩm xóa các click liên quan theo FK cascade, UI cảnh báo trước.

Ảnh thay thế/xóa sản phẩm không tự xóa ảnh cũ để tránh làm hỏng URL còn được tham chiếu. Nếu save bị lỗi mạng mà chưa biết DB đã commit hay chưa, giữ ảnh mới. Chỉ dọn ảnh khi chắc chắn DB từ chối write. Có thể dọn ảnh không còn tham chiếu thủ công trong Storage Dashboard; so sánh với `products.image_url` và `stores.avatar_url` trước khi xóa.

## Deploy Vercel

1. Push repository lên Git provider của bạn, import project vào Vercel.
2. Framework **Vite**; build `npm run build`; output `dist`; Node 22.x.
3. Thêm `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_STORE_ID` vào Environment Variables cho môi trường cần dùng.
4. Deploy. `vercel.json` cấu hình SPA fallback cho các route, kể cả refresh `/admin/products`.
5. Sau khi thay biến `VITE_*`, **redeploy** vì Vite nhúng giá trị vào bundle lúc build.

Hoặc dùng CLI đã đăng nhập:

```bash
npx vercel
# Sau khi xác nhận preview và Supabase thật:
npx vercel --prod
```

Bản preview triển khai khi chưa có env sẽ hiển thị dữ liệu mẫu và admin bị khóa. Chỉ đưa URL vào TikTok bio sau khi kết nối Supabase, thay sản phẩm/link thật và hoàn tất checklist bên dưới.

## Kiểm thử và xác nhận trước khi dùng thật

`npm test` kiểm tra search tiếng Việt, tag/category, sort ghim, giá nullable/zero/âm, URL không an toàn, slug và xử lý lỗi upload không rõ trạng thái commit.

Kiểm thử SQL bằng PostgreSQL 14+ trên **database dùng riêng cho test** (không phải production):

```bash
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f tests/database-bootstrap.sql \
  -f supabase/migrations/202610050001_storefront.sql \
  -f tests/database-security.sql
```

Test tạo role `anon` và `authenticated`, chạy migration và thử quyền thật, gồm cross-store FK, chặn upload anonymous/non-admin, RPC hợp lệ, admin CRUD và analytics. Hãy dùng cluster/database mới; bootstrap không idempotent.

API fixture cho kiểm thử browser chỉ chạy local, dùng tài khoản giả `admin@example.test` / `test-password-only`:

```bash
# Terminal 1
node tests/fixtures/mock-supabase.mjs

# Tạo .env.e2e.local (được gitignore)
# VITE_SUPABASE_URL=http://127.0.0.1:5181
# VITE_SUPABASE_ANON_KEY=fixture-anon-key-only

# Terminal 2
npx vite --mode e2e --host 127.0.0.1 --port 5182
```

Mở `http://127.0.0.1:5182/admin/login`, tạo danh mục/sản phẩm. `/tests/fixtures/upload.html` kiểm tra nén, upload và lưu ảnh mẫu vào sản phẩm có tên chứa “kiểm thử”, hữu ích nếu công cụ tự động không được chọn file. Fixture không phải Supabase thật, không có production trong `dist`, không được deploy làm backend. Dữ liệu fixture chỉ nằm trong bộ nhớ và mất khi dừng.

Trên **Supabase project thật**, xác nhận toàn bộ luồng:

- Login admin → tạo category → tạo product → chọn file thật → lưu → thấy ảnh/product trên `/`.
- Search không dấu → filter category → click → đúng affiliate URL mở → summary có click.
- Sửa giá/bio/ảnh, ghim, bật/tắt; khi tắt category, sản phẩm biến mất kể cả admin đang login.
- Xóa category còn sản phẩm được cảnh báo; xóa category rỗng thành công.
- Logout → refresh `/admin/products` → về login; mở route trực tiếp không 404.
- Thử request ghi/Storage bằng anon key và tài khoản chưa được cấp quyền → bị từ chối; không chỉ kiểm tra UI.
- Kiểm tra mobile 375/390/430px và desktop, console, loading/empty/error, rồi `npm run build`.

## Cấu trúc

```text
src/components/{storefront,admin,shared}/
src/pages/{storefront,admin}/
src/hooks/       # Auth, TanStack Query, metadata
src/services/    # Tất cả thao tác Supabase
src/lib/         # Schema validation, read-only sample data
src/types/
src/utils/       # Search, sort, URL, money
src/routes/      # Protected admin route
supabase/migrations/
tests/
```

Ảnh minh họa tải từ Unsplash, xem [nguồn ảnh](public/images/SOURCES.md). Ảnh không đại diện cho sản phẩm được bán; thay bằng ảnh sản phẩm thực và link affiliate của bạn trong admin. Font Be Vietnam Pro được phục vụ local, không phụ thuộc Google Fonts.

Tài liệu chính thức: [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Auth](https://supabase.com/docs/reference/javascript/auth-signinwithpassword), [Vite deployment](https://vite.dev/guide/static-deploy.html), [TanStack Query invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations).
