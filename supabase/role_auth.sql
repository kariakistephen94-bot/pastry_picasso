-- ============================================================
--  Role-based authentication
--  Run this once in the Supabase SQL editor, after setup_schema.sql.
--  Replaces the public.admins allow-list with a role column on
--  public.profiles. Every new signup defaults to 'customer'.
-- ============================================================

-- ── 1. Profiles ─────────────────────────────────────────────
-- One row per auth user, created automatically on signup.

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  phone text,
  address text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index if not exists idx_profiles_role on public.profiles(role);

-- ── 2. Auto-create a profile for every new auth user ────────
-- Runs as the definer so it can write to profiles before any
-- session exists. Role is hard-coded here: the client cannot
-- influence it, even by stuffing metadata into signUp().

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── 3. Backfill ─────────────────────────────────────────────
-- Profiles for auth users that predate the trigger...

insert into public.profiles (id, email, role)
select u.id, u.email, 'customer'
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- ...then promote everyone who was in the old admins allow-list.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'admins'
  ) then
    update public.profiles p
    set role = 'admin'
    from public.admins a
    where a.id = p.id;
  end if;
end
$$;

-- ── 4. Role helper ──────────────────────────────────────────
-- security definer so it reads profiles without tripping the
-- table's own RLS policies (which would recurse infinitely).

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ── 5. Nobody promotes themselves ───────────────────────────
-- RLS is per-row, not per-column, so a customer allowed to edit
-- their own name could otherwise also set role = 'admin'.
-- This trigger is the actual guard on the role column.

create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     -- auth.uid() is null for the SQL editor and the service-role key, which
     -- is how you bootstrap the first admin. Anonymous web requests never
     -- reach this trigger: the UPDATE policy below is 'to authenticated'.
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Only an administrator can change a user role.';
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_role_change on public.profiles;
create trigger on_profile_role_change
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- ── 6. Profiles RLS ─────────────────────────────────────────

alter table public.profiles enable row level security;

drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id or public.is_admin());

-- ── 7. Link orders to the account that placed them ──────────

alter table public.orders
  add column if not exists user_id uuid references auth.users on delete set null;

create index if not exists idx_orders_user_id on public.orders(user_id);

drop policy if exists "Customers read own orders" on public.orders;
create policy "Customers read own orders"
  on public.orders for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ── 8. Repoint every admin policy at the role ───────────────
-- These previously read public.admins.

drop policy if exists "Allow admins write of menu items" on public.menu_items;
create policy "Allow admins write of menu items"
  on public.menu_items for all to authenticated
  using (public.is_admin());

drop policy if exists "Allow public read of visible reviews" on public.reviews;
create policy "Allow public read of visible reviews"
  on public.reviews for select to public
  using (visible = true or public.is_admin());

drop policy if exists "Allow admins write of reviews" on public.reviews;
create policy "Allow admins write of reviews"
  on public.reviews for all to authenticated
  using (public.is_admin());

drop policy if exists "Allow admins update of business settings" on public.business_settings;
create policy "Allow admins update of business settings"
  on public.business_settings for update to authenticated
  using (public.is_admin());

drop policy if exists "Allow admins all actions on orders" on public.orders;
create policy "Allow admins all actions on orders"
  on public.orders for all to authenticated
  using (public.is_admin());

drop policy if exists "Allow admins all actions on order items" on public.order_items;
create policy "Allow admins all actions on order items"
  on public.order_items for all to authenticated
  using (public.is_admin());

-- ── 9. Sweep up anything still pointing at admins ───────────
-- Policies can be renamed or added by hand, so rather than guess
-- at names, drop every policy in the database whose expression
-- still mentions the admins table. Policies using is_admin() do
-- not match ('is_admin' has no trailing 's'), so the ones created
-- above survive. Anything dropped here is recreated below.

do $$
declare
  r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where coalesce(qual, '') || ' ' || coalesce(with_check, '') ~ '\madmins\M'
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      r.policyname, r.schemaname, r.tablename
    );
    raise notice 'Dropped stale policy "%" on %.%',
      r.policyname, r.schemaname, r.tablename;
  end loop;
end
$$;

-- ── 10. Storage policies ────────────────────────────────────
-- Menu image upload/delete were gated on the old admins table.

drop policy if exists "Allow admins to upload menu images" on storage.objects;
create policy "Allow admins to upload menu images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());

drop policy if exists "Allow admins to delete menu images" on storage.objects;
create policy "Allow admins to delete menu images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

-- ── 11. Retire the old allow-list ───────────────────────────
-- Section 9 removed every policy that referenced it, and the
-- rows were already copied into profiles back in section 3.

drop table if exists public.admins;

-- ============================================================
--  BOOTSTRAP YOUR FIRST ADMIN
--  Sign up through the site first, confirm the email, then run:
--
--    update public.profiles set role = 'admin'
--    where email = 'you@example.com';
--
--  After that, promote everyone else from the dashboard's
--  Customers page.
-- ============================================================
