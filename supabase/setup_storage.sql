-- SQL Script to set up Supabase Storage for Pastry Picasso menu images

-- 1. Create a public storage bucket for menu images
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;


-- 3. Create policy to allow public select/read access to menu-images
create policy "Allow public read access to menu images"
  on storage.objects for select to public
  using (bucket_id = 'menu-images');

-- 4. Create policy to allow authenticated admin insert/upload access
create policy "Allow admins to upload menu images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'menu-images' 
    and public.is_admin()
  );

-- 5. Create policy to allow authenticated admin delete access
create policy "Allow admins to delete menu images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'menu-images' 
    and public.is_admin()
  );
