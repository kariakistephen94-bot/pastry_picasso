-- Enable uuid-ossp extension if not enabled
create extension if not exists "uuid-ossp";

-- 1. Admins Table
create table public.admins (
  id uuid references auth.users on delete cascade primary key,
  email text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Customers Table (for caching customer info across guest purchases)
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  address text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Menu Items Table
create table public.menu_items (
  id text primary key,
  name text not null,
  category text not null,
  description text,
  price integer not null,
  image text not null,
  position text,
  zoom numeric,
  serves text,
  includes text[],
  extras jsonb,
  rating numeric,
  popular boolean default false,
  featured boolean default false,
  chef_special boolean default false,
  available boolean default true
);

-- 4. Reviews Table
create table public.reviews (
  id text primary key,
  name text not null,
  rating numeric not null,
  text text not null,
  source text not null,
  date bigint not null,
  visible boolean default true
);

-- 5. Orders Table
create table public.orders (
  id text primary key, -- client-generated uid()
  customer_name text not null,
  phone text,
  method text not null,
  address text,
  note text,
  total integer not null,
  status text not null default 'new',
  payment_confirmed boolean default false,
  payment_verified boolean default false,
  created_at bigint not null,
  customer_id uuid references public.customers(id) on delete set null
);

-- 6. Order Items Table
create table public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id text references public.orders(id) on delete cascade not null,
  name text not null,
  qty integer not null,
  price integer not null
);

-- 7. Business Settings Table
create table public.business_settings (
  id integer primary key default 1 check (id = 1),
  hours_text text not null,
  prep_time text not null,
  phone_display text not null,
  whatsapp_number text not null,
  address text not null
);

-- Indexing for lookup performance
create index idx_orders_customer_id on public.orders(customer_id);
create index idx_order_items_order_id on public.order_items(order_id);

-- Enable RLS for all tables
alter table public.admins enable row level security;
alter table public.customers enable row level security;
alter table public.menu_items enable row level security;
alter table public.reviews enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.business_settings enable row level security;

-- 8. RLS Policies

-- Admins Table Policies
create policy "Allow admins to read their own record"
  on public.admins for select to authenticated
  using (auth.uid() = id);

-- Menu Items Policies
create policy "Allow public read of menu items"
  on public.menu_items for select to public
  using (true);

create policy "Allow admins write of menu items"
  on public.menu_items for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- Reviews Policies
create policy "Allow public read of visible reviews"
  on public.reviews for select to public
  using (visible = true or exists (select 1 from public.admins where id = auth.uid()));

create policy "Allow anyone to insert reviews"
  on public.reviews for insert to public
  with check (true);

create policy "Allow admins write of reviews"
  on public.reviews for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- Business Settings Policies
create policy "Allow public read of business settings"
  on public.business_settings for select to public
  using (true);

create policy "Allow admins update of business settings"
  on public.business_settings for update to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- Customers Policies
create policy "Allow anyone to select customer by matching guest id"
  on public.customers for select to public
  using (true); -- Clients can look up profiles directly using their guest customer_id

create policy "Allow anyone to insert customer"
  on public.customers for insert to public
  with check (true);

create policy "Allow anyone to update customer"
  on public.customers for update to public
  using (true);

-- Orders Policies
create policy "Allow anyone to insert orders"
  on public.orders for insert to public
  with check (true);

create policy "Allow anyone to read orders by id"
  on public.orders for select to public
  using (true); -- Essential to allow tracking orders by id/reference suffix without auth

create policy "Allow admins all actions on orders"
  on public.orders for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));

-- Order Items Policies
create policy "Allow anyone to insert order items"
  on public.order_items for insert to public
  with check (true);

create policy "Allow anyone to read order items"
  on public.order_items for select to public
  using (true);

create policy "Allow admins all actions on order items"
  on public.order_items for all to authenticated
  using (exists (select 1 from public.admins where id = auth.uid()));


-- 9. Seed Default Seeding Data

-- Seed Business Settings
insert into public.business_settings (id, hours_text, prep_time, phone_display, whatsapp_number, address)
values (1, '9:00 AM – 9:00 PM', '20–60 minutes', '0904 490 2139', '2348144363688', '4 Olugbede Street, Egbeda, Alimosho, Lagos, Nigeria')
on conflict (id) do nothing;

-- Seed default menu items
insert into public.menu_items (id, name, category, description, price, image, position, zoom, serves, includes, extras, rating, popular, featured, chef_special, available)
values 
  ('odogwu-platter', 'Odogwu Small Chops Platter', 'small-chops', 'Our flagship party platter, loaded edge to edge with golden small chops and peppered proteins. Built to feed the whole crew.', 45000, '/images/odogwu-platter.jpg', '50% 55%', 1.0, 'Serves up to 20 guests', array['15 Samosa', '15 Spring Rolls', '10 Prawn in Mayo', '10 Corn Dogs', '30 Puff Puff', '6 Diced Turkey', '5 Chicken', '10 Beef / Gizzard'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, 5.0, true, true, true, true),
  ('fried-platter', 'Fried Small Chops Platter', 'small-chops', 'A crowd-pleasing classic: crisp samosas, golden spring rolls and pillowy puff puff, fried fresh to order.', 28000, '/images/fried-platter.jpg', '50% 55%', 1.0, 'Serves up to 20 guests', array['20 Samosa', '20 Spring Rolls', '60 Puff Puff'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, null, true, true, false, true),
  ('all-in-one-platter', 'All-In-One Small Chops Platter', 'small-chops', 'Every favourite in one beautiful box, perfect for movie nights, date nights and small hangouts.', 15000, '/images/allinone-platter.jpg', '50% 50%', 1.0, null, array['5 Samosa', '5 Spring Rolls', '5 Money Bags', '5 Prawn in Mayo Rolls', '20 Puff Puff', '10 Beef / Gizzard'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, null, true, true, false, true),
  ('waffle-burger', 'Waffle Burger', 'burgers', 'Waffle bun, crunchy chicken, tomatoes, cucumber, lettuce and cheese.', 11000, '/images/waffle-burger.jpg', '52% 42%', 1.0, null, null, '[{"id": "extra-chicken", "name": "Extra chicken", "price": 1500}, {"id": "extra-cheese", "name": "Extra cheese", "price": 500}, {"id": "extra-sausage", "name": "Extra sausage", "price": 500}]'::jsonb, 5.0, true, true, true, true),
  ('sausage-bread-rolls', 'Sausage Bread Rolls', 'pastries', 'Butter-soft bread rolled around juicy sausages, baked golden fresh every morning.', 6000, '/images/sausage-rolls.jpg', '40% 60%', 1.0, null, null, null, null, true, true, false, true)
on conflict (id) do nothing;

-- Seed default reviews
insert into public.reviews (id, name, rating, text, source, date, visible)
values
  ('rev-adaeze', 'Adaeze N.', 5, 'The Odogwu platter fed my whole family at my mum''s 60th. Everything was still crunchy by evening. 10/10!', 'Instagram', 1790000000000, true),
  ('rev-tolu', 'Tolu A.', 5, 'That waffle burger is not normal 😭 I have ordered three times this month. The chicken is so crispy.', 'WhatsApp', 1790000000000, true),
  ('rev-chidinma', 'Chidinma O.', 4, 'Ordered the fried platter for a house party. Delivery to Akowonjo took less than an hour and everything was still hot.', 'Instagram', 1790000000000, true),
  ('rev-bello', 'Mr Bello', 5, 'Ordered small chops for our office party. Beautiful presentation, and the samosa was the star. They even called to confirm my order.', 'In store', 1790000000000, true),
  ('rev-sandra', 'Sandra E.', 5, 'Their sausage rolls are elite. Baked fresh, butter soft. My kids finish a box in one sitting.', 'TikTok', 1790000000000, true),
  ('rev-ifeanyi', 'Ifeanyi K.', 4, 'The all-in-one box is perfect for two. The puff puff is soft and the gizzard has proper pepper. Taste is 100.', 'WhatsApp', 1790000000000, false)
on conflict (id) do nothing;
