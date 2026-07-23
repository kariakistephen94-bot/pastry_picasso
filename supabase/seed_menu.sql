-- ============================================================
--  Seed / re-seed the menu
--  Run in the Supabase SQL editor if public.menu_items is empty.
--
--  Your reviews and business_settings seeded fine, but menu_items
--  came back empty from /api/menu — so the storefront had nothing to
--  show. This re-inserts the five default items. It is idempotent
--  (on conflict do nothing), so it is safe to run more than once and
--  will not overwrite any items you have since edited.
--
--  Prices for the Odogwu (₦45,000) and All-In-One (₦15,000) platters
--  are placeholders — edit them from Dashboard → Menu once live.
-- ============================================================

insert into public.menu_items
  (id, name, category, description, price, image, position, zoom, serves, includes, extras, rating, popular, featured, chef_special, available)
values
  ('odogwu-platter', 'Odogwu Small Chops Platter', 'small-chops', 'Our flagship party platter, loaded edge to edge with golden small chops and peppered proteins. Built to feed the whole crew.', 45000, '/images/odogwu-platter.jpg', '50% 55%', 1.0, 'Serves up to 20 guests', array['15 Samosa', '15 Spring Rolls', '10 Prawn in Mayo', '10 Corn Dogs', '30 Puff Puff', '6 Diced Turkey', '5 Chicken', '10 Beef / Gizzard'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, 5.0, true, true, true, true),
  ('fried-platter', 'Fried Small Chops Platter', 'small-chops', 'A crowd-pleasing classic: crisp samosas, golden spring rolls and pillowy puff puff, fried fresh to order.', 28000, '/images/fried-platter.jpg', '50% 55%', 1.0, 'Serves up to 20 guests', array['20 Samosa', '20 Spring Rolls', '60 Puff Puff'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, null, true, true, false, true),
  ('all-in-one-platter', 'All-In-One Small Chops Platter', 'small-chops', 'Every favourite in one beautiful box, perfect for movie nights, date nights and small hangouts.', 15000, '/images/allinone-platter.jpg', '50% 50%', 1.0, null, array['5 Samosa', '5 Spring Rolls', '5 Money Bags', '5 Prawn in Mayo Rolls', '20 Puff Puff', '10 Beef / Gizzard'], '[{"id": "samosa", "name": "Samosa", "price": 400}, {"id": "spring-roll", "name": "Spring Roll", "price": 400}, {"id": "chicken", "name": "Chicken", "price": 2000}, {"id": "prawn-mayo", "name": "Prawn in Mayo", "price": 1500}, {"id": "puff-puff", "name": "Puff Puff", "price": 150}, {"id": "money-bag", "name": "Money Bag", "price": 1500}, {"id": "corn-dog", "name": "Corn Dog", "price": 500}, {"id": "turkey", "name": "Turkey", "price": 6000}, {"id": "beef", "name": "Beef", "price": 500}, {"id": "gizzard", "name": "Gizzard", "price": 500}]'::jsonb, null, true, true, false, true),
  ('waffle-burger', 'Waffle Burger', 'burgers', 'Waffle bun, crunchy chicken, tomatoes, cucumber, lettuce and cheese.', 11000, '/images/waffle-burger.jpg', '52% 42%', 1.0, null, null, '[{"id": "extra-chicken", "name": "Extra chicken", "price": 1500}, {"id": "extra-cheese", "name": "Extra cheese", "price": 500}, {"id": "extra-sausage", "name": "Extra sausage", "price": 500}]'::jsonb, 5.0, true, true, true, true),
  ('sausage-bread-rolls', 'Sausage Bread Rolls', 'pastries', 'Butter-soft bread rolled around juicy sausages, baked golden fresh every morning.', 6000, '/images/sausage-rolls.jpg', '40% 60%', 1.0, null, null, null, null, true, true, false, true)
on conflict (id) do nothing;
