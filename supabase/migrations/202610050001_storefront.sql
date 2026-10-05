-- Apply once in a fresh Supabase project. No service key is needed in the app.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 100),
  bio text check (length(bio) <= 300), avatar_url text,
  tiktok_url text, facebook_url text, instagram_url text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
-- One explicitly provisioned admin; a random authenticated account is NOT an admin.
create table private.admin_config (
  singleton boolean primary key default true check (singleton),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  store_id uuid not null unique references public.stores(id) on delete cascade
);
revoke all on private.admin_config from public, anon, authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null check (length(name) between 1 and 80),
  slug text not null check (length(slug) <= 100 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sort_order integer not null default 0 check (sort_order between 0 and 1000000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(store_id, slug), unique(id, store_id)
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid not null,
  name text not null check (length(name) between 1 and 200), image_url text,
  affiliate_url text not null check (affiliate_url ~ '^https?://[^[:space:]]+$'),
  platform text not null default 'other' check (platform in ('shopee', 'tiktok', 'lazada', 'other')),
  price numeric(14,2) check (price >= 0), original_price numeric(14,2) check (original_price >= 0),
  tags text[] not null default '{}' check (cardinality(tags) <= 30),
  is_pinned boolean not null default false, is_active boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 1000000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint product_category_same_store foreign key(category_id, store_id) references public.categories(id, store_id) on delete restrict,
  constraint valid_original_price check (price is null or original_price is null or original_price >= price),
  unique(id, store_id)
);
create table public.product_clicks (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null, store_id uuid not null references public.stores(id) on delete cascade,
  referrer text check (length(referrer) <= 255), created_at timestamptz not null default now(),
  foreign key(product_id, store_id) references public.products(id, store_id) on delete cascade
);
create index categories_store_order_idx on public.categories(store_id, is_active, sort_order);
create index products_store_order_idx on public.products(store_id, is_active, is_pinned desc, sort_order, created_at desc);
create index products_category_idx on public.products(category_id, store_id);
create index clicks_store_date_idx on public.product_clicks(store_id, created_at desc);
create index clicks_product_date_idx on public.product_clicks(product_id, created_at desc);

create function public.is_store_admin(store_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_config a where a.user_id = (select auth.uid()) and a.store_id = store_uuid);
$$;
create function public.current_user_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_config a where a.user_id = (select auth.uid()));
$$;
create function public.admin_owns_storage_path(object_name text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from private.admin_config a where a.user_id = (select auth.uid()) and a.store_id::text = split_part(object_name, '/', 1));
$$;
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger stores_updated before update on public.stores for each row execute function public.set_updated_at();
create trigger categories_updated before update on public.categories for each row execute function public.set_updated_at();
create trigger products_updated before update on public.products for each row execute function public.set_updated_at();

alter table public.stores enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_clicks enable row level security;
create policy store_public_read on public.stores for select to anon, authenticated using (true);
create policy store_admin_update on public.stores for update to authenticated using (public.is_store_admin(id)) with check (public.is_store_admin(id));
create policy category_public_read on public.categories for select to anon, authenticated using (is_active);
create policy category_admin_all on public.categories for all to authenticated using (public.is_store_admin(store_id)) with check (public.is_store_admin(store_id));
create policy product_public_read on public.products for select to anon, authenticated using (
  is_active and exists(select 1 from public.categories c where c.id = category_id and c.store_id = products.store_id and c.is_active)
);
create policy product_admin_all on public.products for all to authenticated using (public.is_store_admin(store_id)) with check (public.is_store_admin(store_id));
create policy clicks_admin_read on public.product_clicks for select to authenticated using (public.is_store_admin(store_id));

revoke all on public.stores, public.categories, public.products, public.product_clicks from anon, authenticated;
grant select on public.stores, public.categories, public.products to anon, authenticated;
grant update on public.stores to authenticated;
grant insert, update, delete on public.categories, public.products to authenticated;
grant select on public.product_clicks to authenticated;

-- Navigation never waits for this RPC. Raw inserts are denied even to admins.
create function public.track_product_click(product_id uuid, referrer text default null) returns void
language plpgsql security definer set search_path = '' as $$
declare target_store uuid;
begin
  select p.store_id into target_store from public.products p join public.categories c on c.id = p.category_id and c.store_id = p.store_id
  where p.id = track_product_click.product_id and p.is_active and c.is_active;
  if target_store is null then return; end if;
  insert into public.product_clicks(product_id, store_id, referrer)
  values (track_product_click.product_id, target_store, left(nullif(track_product_click.referrer, ''), 255));
end; $$;
create function public.get_analytics_summary(store_uuid uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_store_admin(store_uuid) then raise exception 'Not authorized' using errcode = '42501'; end if;
  return jsonb_build_object(
    'total_clicks', (select count(*) from public.product_clicks where store_id = store_uuid),
    'top_products', coalesce((select jsonb_agg(row_to_json(top)) from (
      select p.id, p.name, p.image_url, count(c.id)::integer as clicks
      from public.products p join public.product_clicks c on c.product_id = p.id and c.store_id = p.store_id
      where p.store_id = store_uuid group by p.id order by count(c.id) desc, p.name limit 5
    ) top), '[]'::jsonb)
  );
end; $$;
revoke all on function public.is_store_admin(uuid), public.current_user_is_admin(), public.admin_owns_storage_path(text), public.set_updated_at(), public.track_product_click(uuid,text), public.get_analytics_summary(uuid) from public;
grant execute on function public.is_store_admin(uuid) to anon, authenticated;
grant execute on function public.current_user_is_admin(), public.admin_owns_storage_path(text), public.get_analytics_summary(uuid) to authenticated;
grant execute on function public.track_product_click(uuid,text) to anon, authenticated;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types) values
  ('product-images', 'product-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('store-assets', 'store-assets', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']);
create policy storefront_images_read on storage.objects for select to anon, authenticated using (bucket_id in ('product-images', 'store-assets'));
create policy storefront_images_insert on storage.objects for insert to authenticated with check (bucket_id in ('product-images', 'store-assets') and public.admin_owns_storage_path(name));
create policy storefront_images_update on storage.objects for update to authenticated using (bucket_id in ('product-images', 'store-assets') and public.admin_owns_storage_path(name)) with check (bucket_id in ('product-images', 'store-assets') and public.admin_owns_storage_path(name));
create policy storefront_images_delete on storage.objects for delete to authenticated using (bucket_id in ('product-images', 'store-assets') and public.admin_owns_storage_path(name));

insert into public.stores(id, name, bio) values ('a0000000-0000-4000-8000-000000000001', 'Nhà Quang', 'Đồ mình dùng, những điều mình yêu. Gửi bạn một chút cảm hứng cho mỗi ngày ✨');
commit;
