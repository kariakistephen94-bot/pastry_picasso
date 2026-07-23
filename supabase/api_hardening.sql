-- ============================================================
--  API hardening
--  Run this ONCE in the Supabase SQL editor, AFTER setup_schema.sql
--  and role_auth.sql.
--
--  The app no longer talks to these tables from the browser. Every
--  read and write now goes through the Next.js /api routes, which use
--  the service-role key (and bypass RLS) after doing their own checks.
--
--  That lets us close the wide-open "anyone" policies that the direct-
--  from-browser design needed. Before this, the public anon key could:
--    • read EVERY order and order item (not just one by tracking id),
--    • read / insert / update ANY row in public.customers,
--    • insert reviews directly, skipping the server's validation and
--      the "hidden until approved" rule.
--
--  Removing them means the anon key can no longer touch these tables at
--  all; the service-role API routes are the only way in. Admin-only and
--  customer-own policies (used by authenticated sessions) are kept.
-- ============================================================

-- ── Orders ──────────────────────────────────────────────────
-- Public tracking now runs through GET /api/orders/[id] (service role),
-- so the blanket public read is no longer needed.
drop policy if exists "Allow anyone to read orders by id" on public.orders;
drop policy if exists "Allow anyone to insert orders"    on public.orders;

-- ── Order items ─────────────────────────────────────────────
drop policy if exists "Allow anyone to read order items"   on public.order_items;
drop policy if exists "Allow anyone to insert order items" on public.order_items;

-- ── Customers ───────────────────────────────────────────────
-- Guest profile caching now runs through /api/customers/[id].
drop policy if exists "Allow anyone to select customer by matching guest id" on public.customers;
drop policy if exists "Allow anyone to insert customer" on public.customers;
drop policy if exists "Allow anyone to update customer" on public.customers;

-- ── Reviews ─────────────────────────────────────────────────
-- Submissions now go through POST /api/reviews, which forces
-- visible = false and source = 'Website'. Dropping the public insert
-- stops anyone crafting a pre-approved review straight into the table.
drop policy if exists "Allow anyone to insert reviews" on public.reviews;

-- ── Sanity note ─────────────────────────────────────────────
-- Kept on purpose (authenticated sessions / public site still use them):
--   • public.menu_items         "Allow public read of menu items"
--   • public.reviews            "Allow public read of visible reviews"
--   • public.business_settings  "Allow public read of business settings"
--   • public.profiles           "Users read own profile" / "Users update own profile"
--   • every "is_admin()" admin policy from role_auth.sql
--
-- RLS stays ENABLED on all tables. With the anon policies above removed,
-- the anon key simply has no matching policy and is denied — which is
-- exactly what we want now that the API layer is the front door.
