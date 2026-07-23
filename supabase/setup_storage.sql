-- SQL Script to set up Supabase Storage for Pastry Picasso menu images.
-- Safe to run more than once: policies are dropped before being recreated.

-- 1. Create a public storage bucket for menu images
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

-- 2. Public select/read access to menu-images
drop policy if exists "Allow public read access to menu images" on storage.objects;
create policy "Allow public read access to menu images"
  on storage.objects for select to public
  using (bucket_id = 'menu-images');

-- 3. Authenticated admin insert/upload access
drop policy if exists "Allow admins to upload menu images" on storage.objects;
create policy "Allow admins to upload menu images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu-images'
    and public.is_admin()
  );

-- 4. Authenticated admin delete access
drop policy if exists "Allow admins to delete menu images" on storage.objects;
create policy "Allow admins to delete menu images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu-images'
    and public.is_admin()
  );
