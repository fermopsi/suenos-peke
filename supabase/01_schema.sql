-- =====================================================================
-- SUEÑOSPEKE · SCRIPT 1: crea toda la base de datos
-- Pégalo completo en Supabase > SQL Editor > New query > Run (una sola vez).
-- Es seguro volver a ejecutarlo: no borra tus datos.
-- =====================================================================

-- ---------- TABLAS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'employee' check (role in ('admin','employee')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text default '✚',
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  description text,
  price numeric(12,2) not null default 0,
  stock int not null default 0,
  image_url text,
  featured boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  notes text,
  total numeric(12,2) not null default 0,
  status text not null default 'nuevo' check (status in ('nuevo','atendido','cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  name text not null,
  price numeric(12,2) not null default 0,
  qty int not null default 1
);

create table if not exists public.settings (
  key text primary key,
  value text
);

-- ---------- FUNCIONES DE PERMISOS ----------
create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and active and role in ('admin','employee'));
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles
                 where id = auth.uid() and active and role = 'admin');
$$;

-- ---------- PERFIL AUTOMÁTICO CUANDO SE CREA UN USUARIO ----------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- SEGURIDAD (quién puede ver y cambiar qué) ----------
alter table public.profiles    enable row level security;
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;
alter table public.settings    enable row level security;

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- categories: todos ven, solo admin cambia
drop policy if exists categories_select on public.categories;
create policy categories_select on public.categories for select to anon, authenticated using (true);
drop policy if exists categories_write on public.categories;
create policy categories_write on public.categories for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- products: el público ve los activos; el equipo ve y cambia todo
drop policy if exists products_select_public on public.products;
create policy products_select_public on public.products for select to anon, authenticated
  using (active or public.is_staff());
drop policy if exists products_write on public.products;
create policy products_write on public.products for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- orders: cualquiera puede crear un pedido; solo el equipo lo ve y lo gestiona
drop policy if exists orders_insert on public.orders;
create policy orders_insert on public.orders for insert to anon, authenticated with check (true);
drop policy if exists orders_select on public.orders;
create policy orders_select on public.orders for select to authenticated using (public.is_staff());
drop policy if exists orders_update on public.orders;
create policy orders_update on public.orders for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists orders_delete on public.orders;
create policy orders_delete on public.orders for delete to authenticated using (public.is_admin());

drop policy if exists order_items_insert on public.order_items;
create policy order_items_insert on public.order_items for insert to anon, authenticated with check (true);
drop policy if exists order_items_select on public.order_items;
create policy order_items_select on public.order_items for select to authenticated using (public.is_staff());
drop policy if exists order_items_delete on public.order_items;
create policy order_items_delete on public.order_items for delete to authenticated using (public.is_admin());

-- settings: todos leen, solo admin cambia
drop policy if exists settings_select on public.settings;
create policy settings_select on public.settings for select to anon, authenticated using (true);
drop policy if exists settings_write on public.settings;
create policy settings_write on public.settings for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- ALMACÉN DE IMÁGENES (bucket "productos", público) ----------
insert into storage.buckets (id, name, public)
values ('productos', 'productos', true)
on conflict (id) do update set public = true;

drop policy if exists productos_read on storage.objects;
create policy productos_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'productos');
drop policy if exists productos_insert on storage.objects;
create policy productos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.is_staff());
drop policy if exists productos_update on storage.objects;
create policy productos_update on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.is_staff());
drop policy if exists productos_delete on storage.objects;
create policy productos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.is_staff());

-- ---------- DATOS INICIALES (puedes editarlos o borrarlos desde el panel) ----------
insert into public.settings (key, value) values
  ('whatsapp', ''),
  ('announcement', 'ATENCIÓN ESPECIALIZADA · PRODUCTOS MÉDICOS SELECCIONADOS')
on conflict (key) do nothing;

insert into public.categories (name, icon, description, sort_order)
select * from (values
  ('Anestesiología', '🫁', 'Equipos e insumos especializados', 1),
  ('Vía aérea',      '🩺', 'Soluciones para manejo respiratorio', 2),
  ('Equipos médicos','⚕️', 'Instrumental y accesorios', 3),
  ('Insumos médicos','＋', 'Material para uso profesional', 4)
) as v(name, icon, description, sort_order)
where not exists (select 1 from public.categories);

insert into public.products (category_id, name, description, price, stock, featured)
select c.id, v.name, 'Producto de ejemplo: edítalo o elimínalo desde el panel.', 100, 10, v.featured
from (values
  ('Anestesiología',  'Accesorio médico especializado', true),
  ('Vía aérea',       'Insumo para manejo de vía aérea', false),
  ('Equipos médicos', 'Kit de accesorios profesionales', false),
  ('Insumos médicos', 'Material de uso clínico', false)
) as v(cat, name, featured)
join public.categories c on c.name = v.cat
where not exists (select 1 from public.products);
