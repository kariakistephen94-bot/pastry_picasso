-- ============================================================
--  Discounts & promotions
--  Run this ONCE in the Supabase SQL editor, AFTER setup_schema.sql,
--  role_auth.sql and api_hardening.sql.
--
--  It is safe to run more than once: every statement is guarded with
--  "if not exists" / "or replace" / "drop policy if exists".
--
--  Two independent ways to give money off:
--
--   1. A SALE PRICE on a menu item (menu_items.sale_price). The item
--      shows its old price struck through next to the new one. No code,
--      no minimum, applies the moment you set it.
--
--   2. A PROMOTION (public.promotions). Either automatic (no code, every
--      qualifying cart gets it) or a promo code the customer types at
--      checkout. Percent or flat naira, whole order / a category / named
--      items, with a minimum spend, a cap, a date window, usage limits
--      and a first-order-only switch.
--
--  Orders now record what the customer would have paid (subtotal), what
--  came off (discount) and which promotion did it, so the dashboard can
--  always answer "what did this discount cost us?".
-- ============================================================

-- ── 1. Sale price on menu items ─────────────────────────────
-- NULL (or 0, or >= price) means "not on sale". Kept as a plain integer
-- of naira, matching menu_items.price.

alter table public.menu_items
  add column if not exists sale_price integer;

alter table public.menu_items
  drop constraint if exists menu_items_sale_price_check;
alter table public.menu_items
  add constraint menu_items_sale_price_check
  check (sale_price is null or sale_price >= 0);

-- ── 2. Promotions ───────────────────────────────────────────

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),

  -- NULL code = automatic promotion, applied to every qualifying cart.
  -- A code = the customer must type it at checkout.
  code text,

  name text not null,
  description text,

  -- 'percent' → value is 1–100. 'fixed' → value is naira off.
  kind text not null default 'percent' check (kind in ('percent', 'fixed')),
  value numeric not null check (value > 0),

  -- What the discount is calculated on.
  --   order    → the whole cart
  --   category → only lines in `categories`
  --   items    → only lines in `item_ids`
  scope text not null default 'order' check (scope in ('order', 'category', 'items')),
  categories text[] not null default '{}',
  item_ids text[] not null default '{}',

  -- Guardrails.
  min_order integer not null default 0 check (min_order >= 0),
  max_discount integer check (max_discount is null or max_discount > 0),

  -- Epoch milliseconds, to match orders.created_at. NULL = open ended.
  starts_at bigint,
  ends_at bigint,

  -- NULL = unlimited.
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  per_customer_limit integer check (per_customer_limit is null or per_customer_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),

  first_order_only boolean not null default false,
  -- Automatic promos and codes you want to advertise show in the site banner.
  show_publicly boolean not null default true,
  active boolean not null default true,

  created_at bigint not null
);

-- Codes are matched case-insensitively, so uniqueness has to be too.
-- Automatic promotions have no code, and NULLs never collide here.
create unique index if not exists idx_promotions_code_unique
  on public.promotions (upper(code))
  where code is not null;

create index if not exists idx_promotions_active on public.promotions (active);

-- ── 3. Redemptions ──────────────────────────────────────────
-- One row per order that used a promotion. `voided` is set when the
-- order is cancelled, which also hands the usage slot back.

create table if not exists public.promo_redemptions (
  id uuid primary key default gen_random_uuid(),
  promotion_id uuid not null references public.promotions(id) on delete cascade,
  order_id text not null references public.orders(id) on delete cascade,
  code text,
  email text,
  customer_id uuid,
  amount integer not null default 0,
  voided boolean not null default false,
  created_at bigint not null,
  unique (order_id)
);

create index if not exists idx_promo_redemptions_promotion
  on public.promo_redemptions (promotion_id);
create index if not exists idx_promo_redemptions_email
  on public.promo_redemptions (lower(email));

-- ── 3b. What each line would have cost ──────────────────────
-- Stored per line so a receipt printed months later still shows the
-- saving, even after the sale price on the menu item has changed back.

alter table public.order_items
  add column if not exists list_price integer;

-- ── 4. Discount columns on orders ───────────────────────────
-- total stays the amount actually payable, so every existing revenue
-- figure keeps working untouched. subtotal is what it would have been.

alter table public.orders
  add column if not exists subtotal integer not null default 0,
  add column if not exists discount integer not null default 0,
  add column if not exists promo_code text,
  add column if not exists promo_label text,
  add column if not exists promotion_id uuid references public.promotions(id) on delete set null;

-- Backfill pre-discount orders: they were never discounted, so the
-- subtotal is simply what was charged.
update public.orders
   set subtotal = total
 where subtotal = 0 and total > 0;

-- ── 5. Atomic usage accounting ──────────────────────────────
-- Two customers can check out at the same instant with the last
-- remaining use of a limited code. Claiming has to be a single
-- conditional UPDATE, not read-then-write, or the limit leaks.

create or replace function public.claim_promotion(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
begin
  update public.promotions
     set used_count = used_count + 1
   where id = p_id
     and active = true
     and (usage_limit is null or used_count < usage_limit);

  get diagnostics claimed = row_count;
  return claimed > 0;
end;
$$;

-- Hands a usage slot back, e.g. when the order that claimed it fails
-- to save. Never drops below zero.
create or replace function public.release_promotion(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.promotions
     set used_count = greatest(0, used_count - 1)
   where id = p_id;
$$;

-- Cancelling an order gives the customer their use of the promo back.
create or replace function public.void_order_promotion(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r
    from public.promo_redemptions
   where order_id = p_order_id and voided = false;

  if not found then
    return;
  end if;

  update public.promo_redemptions set voided = true where id = r.id;
  perform public.release_promotion(r.promotion_id);
end;
$$;

-- Revoking a cancellation re-consumes it. Deliberately skips the usage
-- limit: the store already promised this customer the discount, and an
-- admin reinstating an order should never be blocked by a full code.
create or replace function public.restore_order_promotion(p_order_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  select * into r
    from public.promo_redemptions
   where order_id = p_order_id and voided = true;

  if not found then
    return;
  end if;

  update public.promo_redemptions set voided = false where id = r.id;
  update public.promotions
     set used_count = used_count + 1
   where id = r.promotion_id;
end;
$$;

-- ── 6. RLS ──────────────────────────────────────────────────
-- The storefront reads promotions through /api/promotions and prices
-- carts through /api/promo/quote, both service-role. So, exactly like
-- orders, the anon key needs no access at all here: an unredeemed code
-- list is not something to hand out. Admin sessions keep full access.

alter table public.promotions enable row level security;
alter table public.promo_redemptions enable row level security;

drop policy if exists "Allow admins all actions on promotions" on public.promotions;
create policy "Allow admins all actions on promotions"
  on public.promotions for all to authenticated
  using (public.is_admin());

drop policy if exists "Allow admins all actions on promo redemptions" on public.promo_redemptions;
create policy "Allow admins all actions on promo redemptions"
  on public.promo_redemptions for all to authenticated
  using (public.is_admin());

-- ── 7. Example promotions (optional) ────────────────────────
-- Uncomment, edit and run to start with something live. Or skip this
-- and create them from Dashboard → Promotions, which is easier.
--
-- insert into public.promotions
--   (code, name, description, kind, value, scope, min_order, active, show_publicly, created_at)
-- values
--   -- Automatic: 10% off any order of ₦30,000 or more.
--   (null, 'Big Order Bonus', '10% off orders from ₦30,000',
--    'percent', 10, 'order', 30000, true, true, (extract(epoch from now()) * 1000)::bigint),
--   -- Code: ₦1,000 off a first order.
--   ('WELCOME1000', 'Welcome offer', '₦1,000 off your first order',
--    'fixed', 1000, 'order', 5000, true, true, (extract(epoch from now()) * 1000)::bigint);
--
-- update public.promotions set first_order_only = true where code = 'WELCOME1000';

-- ============================================================
--  Done. Nothing else to configure: the dashboard picks these
--  tables up as soon as they exist.
-- ============================================================
