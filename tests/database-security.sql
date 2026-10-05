-- Real PostgreSQL behavior tests, run AFTER the application migration on a disposable DB.
\set ON_ERROR_STOP on
begin;
insert into auth.users values ('d0000000-0000-4000-8000-000000000001'), ('d0000000-0000-4000-8000-000000000002');
insert into private.admin_config(user_id, store_id) values ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001');
insert into public.stores(id,name) values ('a0000000-0000-4000-8000-000000000002','Other store');
insert into public.categories(id,store_id,name,slug,is_active) values
 ('b0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','Active','active',true),
 ('b0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','Hidden','hidden',false),
 ('b0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000002','Other','other',true);
insert into public.products(id,store_id,category_id,name,affiliate_url,is_active) values
 ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Visible','https://example.com/product',true),
 ('c0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Inactive','https://example.com/hidden',false),
 ('c0000000-0000-4000-8000-000000000003','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000002','Hidden category','https://example.com/hidden-category',true);
create function pg_temp.assert_true(ok boolean, label text) returns text language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %', label; end if; return 'PASS: ' || label; end; $$;

set local role anon;
select pg_temp.assert_true((select count(*) from public.products)=1,'anon sees only active products in active categories');
select pg_temp.assert_true((select count(*) from public.categories)=2,'anon cannot see inactive categories');
do $$ begin
  begin insert into public.products(store_id,category_id,name,affiliate_url) values ('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000001','Bad','https://example.com'); raise exception 'Anonymous product write was allowed'; exception when insufficient_privilege then null; end;
  begin update public.stores set name='Bad'; raise exception 'Anonymous store write was allowed'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects(bucket_id,name) values ('product-images','a0000000-0000-4000-8000-000000000001/a.webp'); raise exception 'Anonymous upload was allowed'; exception when insufficient_privilege then null; end;
  begin perform * from public.product_clicks; raise exception 'Anonymous analytics read was allowed'; exception when insufficient_privilege then null; end;
  begin insert into public.product_clicks(product_id,store_id) values ('c0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001'); raise exception 'Direct click insert was allowed'; exception when insufficient_privilege then null; end;
  begin perform public.get_analytics_summary('a0000000-0000-4000-8000-000000000001'); raise exception 'Anonymous summary was allowed'; exception when insufficient_privilege then null; end;
end $$;
select public.track_product_click('c0000000-0000-4000-8000-000000000001','tiktok.com');
select public.track_product_click('c0000000-0000-4000-8000-000000000002');
select public.track_product_click('c0000000-0000-4000-8000-000000000003');
select public.track_product_click('c0000000-0000-4000-8000-000000000009');
reset role;
select pg_temp.assert_true((select count(*) from public.product_clicks)=1,'RPC records valid clicks and ignores inactive or nonexistent products');
select pg_temp.assert_true((select referrer from public.product_clicks limit 1)='tiktok.com','referrer is saved');

set local role authenticated;
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000002',true);
select pg_temp.assert_true(not public.current_user_is_admin(),'authenticated stranger is not admin');
do $$ begin
  begin insert into public.categories(store_id,name,slug) values ('a0000000-0000-4000-8000-000000000001','Bad','bad'); raise exception 'Stranger category write was allowed'; exception when insufficient_privilege then null; end;
  begin insert into storage.objects(bucket_id,name) values ('product-images','a0000000-0000-4000-8000-000000000001/stranger.webp'); raise exception 'Stranger upload was allowed'; exception when insufficient_privilege then null; end;
  begin perform public.get_analytics_summary('a0000000-0000-4000-8000-000000000001'); raise exception 'Stranger analytics was allowed'; exception when insufficient_privilege then null; end;
end $$;
select pg_temp.assert_true((select count(*) from public.product_clicks)=0,'stranger cannot read raw clicks');
select set_config('request.jwt.claim.sub','d0000000-0000-4000-8000-000000000001',true);
select pg_temp.assert_true(public.current_user_is_admin(),'provisioned admin is recognized');
select pg_temp.assert_true((select count(*) from public.products)=3,'admin sees hidden products');
insert into public.categories(id,store_id,name,slug) values ('b0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','New category','new-category');
insert into public.products(id,store_id,category_id,name,affiliate_url,price) values ('c0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000004','New product','https://example.com/new',null);
update public.products set is_pinned=true,sort_order=2 where id='c0000000-0000-4000-8000-000000000004';
update public.stores set name='Updated store' where id='a0000000-0000-4000-8000-000000000001';
select pg_temp.assert_true((select is_pinned from public.products where id='c0000000-0000-4000-8000-000000000004'),'admin can create and pin products with optional price');
select pg_temp.assert_true((select name from public.stores where id='a0000000-0000-4000-8000-000000000001')='Updated store','admin can update settings');
insert into storage.objects(bucket_id,name) values ('product-images','a0000000-0000-4000-8000-000000000001/admin.webp');
update storage.objects set name='a0000000-0000-4000-8000-000000000001/renamed.webp';
select pg_temp.assert_true((select count(*) from storage.objects)=1,'admin can upload and update storage object');
select pg_temp.assert_true((public.get_analytics_summary('a0000000-0000-4000-8000-000000000001')->>'total_clicks')::int=1,'admin analytics summary matches stored click');
do $$ begin
  begin delete from public.categories where id='b0000000-0000-4000-8000-000000000004'; raise exception 'Nonempty category deletion was allowed'; exception when foreign_key_violation then null; end;
  begin insert into public.products(store_id,category_id,name,affiliate_url) values ('a0000000-0000-4000-8000-000000000001','b0000000-0000-4000-8000-000000000003','Cross store','https://example.com'); raise exception 'Cross-store category was allowed'; exception when foreign_key_violation then null; end;
  begin insert into storage.objects(bucket_id,name) values ('product-images','a0000000-0000-4000-8000-000000000002/wrong.webp'); raise exception 'Cross-store storage write was allowed'; exception when insufficient_privilege then null; end;
  begin perform public.get_analytics_summary('a0000000-0000-4000-8000-000000000002'); raise exception 'Cross-store analytics was allowed'; exception when insufficient_privilege then null; end;
end $$;
delete from public.products where id='c0000000-0000-4000-8000-000000000004';
delete from public.categories where id='b0000000-0000-4000-8000-000000000004';
delete from storage.objects;
select pg_temp.assert_true(not exists(select 1 from public.products where id='c0000000-0000-4000-8000-000000000004'),'admin can delete products and empty categories');
reset role;
rollback;
select 'ALL DATABASE SECURITY CHECKS PASSED' as result;
