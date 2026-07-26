-- 1. Add email column to public.orders and public.customers
alter table public.orders add column if not exists email text;
alter table public.customers add column if not exists email text;

-- 2. Add cancel_note column to public.orders for cancellation reasons
alter table public.orders add column if not exists cancel_note text;
