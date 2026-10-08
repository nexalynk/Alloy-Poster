-- Run in the Supabase SQL editor. Safe to run more than once: it creates what is missing and upgrades older setups.
create sequence if not exists order_seq start 100001;
create table if not exists profiles(id uuid primary key references auth.users on delete cascade, role text not null default 'customer');
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id) values(new.id); return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();
create or replace function is_admin() returns boolean language sql stable security definer set search_path=public as $$
 select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

create table if not exists products(id uuid primary key default gen_random_uuid(), slug text unique not null, name text not null, description text, category text, badge text, gradient text, image text, active boolean default true, sort int default 0);
create table if not exists product_sizes(id uuid primary key default gen_random_uuid(), width numeric not null, height numeric not null, active boolean default true, sort int default 0);
create table if not exists product_options(id uuid primary key default gen_random_uuid(), type text not null check (type in ('finish','mount','enhance','shape')), name text not null, multiplier numeric not null default 1, addon numeric not null default 0, active boolean default true, sort int default 0);
create table if not exists pricing_rules(key text primary key, value numeric not null, note text);
create table if not exists discount_rules(id uuid primary key default gen_random_uuid(), min_qty int not null, rate numeric not null check (rate>=0 and rate<1), active boolean default true);
create table if not exists site_settings(key text primary key, value text);
create table if not exists orders(id uuid primary key default gen_random_uuid(),
 order_number text unique not null default ('AP-'||nextval('order_seq')), customer_email text not null, customer_name text, shipping_address jsonb, items jsonb not null,
 subtotal numeric, shipping numeric, tax numeric, total numeric, shipping_method text, status text not null default 'Pending Payment',
 tracking_number text, stripe_session_id text, stripe_payment_intent text, created_at timestamptz default now(), paid_at timestamptz);
create table if not exists rate_limits(key text, bucket timestamptz, n int default 0, primary key(key,bucket));
create table if not exists email_log(order_id uuid references orders on delete cascade, kind text, sent_at timestamptz default now(), primary key(order_id,kind));
create table if not exists designs(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade, name text, data jsonb, created_at timestamptz default now());

-- Upgrades for projects created with an older version of this file (safe to run repeatedly)
alter table products add column if not exists image text;
alter table product_options drop constraint if exists product_options_type_check;
alter table product_options add constraint product_options_type_check check (type in ('finish','mount','enhance','shape'));
alter table orders alter column order_number set default ('AP-'||nextval('order_seq'));
delete from product_sizes a using product_sizes b where a.ctid>b.ctid and a.width=b.width and a.height=b.height;
delete from product_options a using product_options b where a.ctid>b.ctid and a.type=b.type and a.name=b.name;
delete from discount_rules a using discount_rules b where a.ctid>b.ctid and a.min_qty=b.min_qty;
create unique index if not exists product_sizes_wh on product_sizes(width,height);
create unique index if not exists product_options_tn on product_options(type,name);
create unique index if not exists discount_rules_q on discount_rules(min_qty);
insert into profiles(id) select id from auth.users on conflict do nothing;
drop policy if exists upload_designs on storage.objects;

alter table profiles enable row level security; alter table products enable row level security; alter table product_sizes enable row level security;
alter table product_options enable row level security; alter table pricing_rules enable row level security; alter table discount_rules enable row level security;
alter table site_settings enable row level security; alter table orders enable row level security; alter table designs enable row level security; alter table email_log enable row level security; alter table rate_limits enable row level security;
drop policy if exists own_profile on profiles;
create policy own_profile on profiles for select using (id=auth.uid());
do $$ declare t text; begin foreach t in array array['products','product_sizes','product_options','pricing_rules','discount_rules','site_settings','orders'] loop
 execute format('drop policy if exists admin_all on %I',t); execute format('create policy admin_all on %I for all using (is_admin()) with check (is_admin())',t); end loop; end $$;
drop policy if exists own_orders on orders;
create policy own_orders on orders for select to authenticated using (lower(customer_email)=lower(auth.jwt()->>'email'));
drop policy if exists own_designs on designs;
create policy own_designs on designs for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
-- orders are created only by the create-checkout function (service role); anon has no table access.

create or replace function get_catalog() returns jsonb language sql stable security definer set search_path=public as $$
 select jsonb_build_object(
  'sizes',(select coalesce(jsonb_agg(jsonb_build_array(width,height) order by sort),'[]'::jsonb) from product_sizes where active),
  'finish',(select coalesce(jsonb_object_agg(name,multiplier),'{}'::jsonb) from product_options where type='finish' and active),
  'mount',(select coalesce(jsonb_object_agg(name,addon),'{}'::jsonb) from product_options where type='mount' and active),
  'enhance',(select coalesce(jsonb_object_agg(name,addon),'{}'::jsonb) from product_options where type='enhance' and active),
  'shape',(select coalesce(jsonb_object_agg(name,addon),'{}'::jsonb) from product_options where type='shape' and active),
  'rules',(select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from pricing_rules),
  'discounts',(select coalesce(jsonb_agg(jsonb_build_array(min_qty,rate) order by min_qty),'[]'::jsonb) from discount_rules where active),
  'site',(select coalesce(jsonb_object_agg(key,value),'{}'::jsonb) from site_settings),
  'promo',(select value from site_settings where key='promo_text'),
  'products',(select coalesce(jsonb_agg(jsonb_build_array(name,description,gradient,category,coalesce(badge,''),coalesce(image,'')) order by sort),'[]'::jsonb) from products where active)) $$;
create or replace function track_order(p_number text,p_email text) returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(x) from (select order_number,status,tracking_number,created_at from orders where order_number=upper(trim(p_number)) and lower(customer_email)=lower(trim(p_email)) and status<>'Pending Payment') x $$;
create or replace function order_by_session(p_session text) returns jsonb language sql stable security definer set search_path=public as $$
 select to_jsonb(x) from (select order_number,status,items,total,shipping_address,created_at from orders where stripe_session_id=p_session) x $$;
grant execute on function get_catalog(), track_order(text,text), order_by_session(text) to anon, authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('designs','designs',false,41943040,array['image/jpeg','image/png','image/webp']) on conflict do nothing;
-- uploads go through the upload-url function (rate limited); no direct anonymous uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('site-assets','site-assets',true,2097152,array['image/png','image/jpeg','image/webp']) on conflict do nothing;
drop policy if exists admin_write_assets on storage.objects;
create policy admin_write_assets on storage.objects for all to authenticated using (bucket_id='site-assets' and is_admin()) with check (bucket_id='site-assets' and is_admin());
drop policy if exists admin_read_designs on storage.objects;
create policy admin_read_designs on storage.objects for select to authenticated using (bucket_id='designs' and is_admin());

create or replace function check_rate(p_key text,p_max int,p_window int) returns boolean language plpgsql security definer set search_path=public as $$
declare b timestamptz := to_timestamp(floor(extract(epoch from now())/p_window)*p_window); c int;
begin
 delete from rate_limits where bucket < now() - interval '1 day';
 insert into rate_limits(key,bucket,n) values(p_key,b,1) on conflict (key,bucket) do update set n=rate_limits.n+1 returning n into c;
 return c <= p_max;
end $$;
revoke all on function check_rate(text,int,int) from public, anon, authenticated;
grant execute on function check_rate(text,int,int) to service_role;

-- Optional housekeeping: remove unpaid checkouts older than 7 days (run manually or schedule with pg_cron)
-- delete from orders where status='Pending Payment' and created_at < now() - interval '7 days';

-- seed (edit in the admin panel afterwards)
insert into product_sizes(width,height,sort) values (8,10,1),(12,12,2),(12,18,3),(16,20,4),(20,30,5),(24,36,6) on conflict do nothing;
insert into product_options(type,name,multiplier,addon,sort) values ('finish','Gloss',1,0,1),('finish','Matte',1.05,0,2),('mount','Standard',1,0,1),('mount','Floating',1,24,2),('mount','Magnetic',1,18,3),('enhance','None',1,0,1),('enhance','Auto-enhance',1,9,2),('shape','Rectangle',1,0,1),('shape','Hexagon',1,15,2),('shape','Star',1,20,3),('shape','Circle',1,12,4),('shape','Diamond',1,15,5),('shape','Octagon',1,15,6) on conflict do nothing;
insert into pricing_rules(key,value,note) values ('price_per_sq_in',0.115,'Base price per square inch'),('min_price',39,'Minimum base price'),('tax_rate',0.13,'Estimated sales tax'),('free_shipping_over',150,'Free shipping threshold'),('shipping_flat',14.95,'Standard shipping'),('shipping_express',25,'Express surcharge') on conflict do nothing;
insert into discount_rules(min_qty,rate) values (2,0.10),(3,0.15) on conflict do nothing;
insert into site_settings values ('promo_text','Free shipping over $150 · 10% off 2+ prints · Satisfaction guarantee') on conflict do nothing;
insert into products(slug,name,description,category,badge,gradient,sort) values
 ('classic','Classic Metal Prints','Gallery-grade photo art.','Prints','Bestseller','#8d99ae,#2b2d42',1),('custom-photo','Custom Photo Metal Prints','Your photo on premium aluminum.','Prints','Bestseller','#f4a261,#e76f51',2),
 ('star-map','Star Map Prints','The night sky from your moment.','Maps','New','#0b132b,#3a506b',3),('street-map','Street Map Prints','Your city, framed in metal.','Maps','','#d8e2dc,#6d6875',4),
 ('hexagon','Hexagon Prints','Modular wall-art shapes.','Shapes','New','#52796f,#cad2c5',5),('tabletop','Tabletop Prints','Small-format desk art.','Prints','','#b08968,#ede0d4',6) on conflict do nothing;

-- After creating your admin user in Authentication > Users, make them admin:
-- update profiles set role='admin' where id=(select id from auth.users where email='you@example.com');
