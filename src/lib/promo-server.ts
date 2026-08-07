/* ──────────────────────────────────────────────────────────────
   Server-side pricing.

   The single place that turns "these cart ids and this promo code"
   into money. Both the checkout preview (/api/promo/quote) and the
   order that actually gets saved (/api/orders) call quoteCart, so the
   figure the customer agrees to and the figure we charge are produced
   by the same code path against the same live menu.

   Nothing here trusts a price sent by the browser.
   ────────────────────────────────────────────────────────────── */

import { admin } from "./api-server";
import {
  buildQuote,
  normalizeCode,
  promoRowToPromotion,
  type PromoKind,
  type PromoScope,
  type Promotion,
  type Quote,
  type QuoteLine,
} from "./promo";

export interface IncomingItem {
  id: string;
  qty: number;
}

/** A cart line resolved against the live menu. */
export interface PricedLine {
  /** The cart id, still carrying its `::extras` suffix. */
  id: string;
  /** The base menu item id. */
  itemId: string;
  name: string;
  category: string;
  qty: number;
  /** Charged per unit: sale price when on sale, plus any extras. */
  unitPrice: number;
  /** Undiscounted per unit, only when the item was on sale. */
  listPrice?: number;
}

export type PriceResult =
  | { ok: true; lines: PricedLine[] }
  | { ok: false; error: string };

/**
 * Rebuilds every cart line from the menu table.
 *
 * A cart id encodes its base item and chosen extras as
 * `base-id::extra1+extra2`, which is enough to reconstruct exactly the
 * line the customer saw — at today's prices, not the ones cached in
 * their browser since last week.
 */
export async function priceCart(items: IncomingItem[]): Promise<PriceResult> {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const baseIds = Array.from(
    new Set(items.map((i) => String(i.id).split("::")[0]))
  );

  const { data, error } = await admin()
    .from("menu_items")
    .select("id, name, category, price, sale_price, extras, available")
    .in("id", baseIds);
  if (error) throw error;

  const menu = new Map((data ?? []).map((m: any) => [m.id, m]));
  const lines: PricedLine[] = [];

  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.qty) || 0));
    const [baseId, extrasPart] = String(item.id).split("::");
    const base = menu.get(baseId);

    if (!base) return { ok: false, error: "An item in your cart is no longer available." };
    if (base.available === false)
      return { ok: false, error: `"${base.name}" is currently unavailable.` };

    const extraIds = extrasPart ? extrasPart.split("+") : [];
    const available = Array.isArray(base.extras) ? base.extras : [];
    const chosen = available.filter((e: any) => extraIds.includes(e.id));
    const addOn = chosen.reduce((n: number, c: any) => n + (Number(c.price) || 0), 0);

    const list = Number(base.price) || 0;
    const sale = Number(base.sale_price);
    const onSale = Number.isFinite(sale) && sale > 0 && sale < list;

    let name = base.name;
    if (chosen.length > 0) {
      name = `${base.name} (+ ${chosen.map((c: any) => c.name).join(", ")})`;
    }

    lines.push({
      id: String(item.id),
      itemId: baseId,
      name,
      category: base.category,
      qty,
      unitPrice: (onSale ? Math.round(sale) : list) + addOn,
      listPrice: onSale ? list + addOn : undefined,
    });
  }

  return { ok: true, lines };
}

/** Every promotion, including paused and expired ones. */
export async function loadPromotions(): Promise<Promotion[]> {
  const { data, error } = await admin().from("promotions").select("*");
  if (error) throw error;
  return (data ?? []).map(promoRowToPromotion);
}

export interface CustomerHistory {
  previousOrders: number;
  /** promotion id → live (non-voided) redemptions by this customer. */
  customerUses: Record<string, number>;
}

/**
 * How many orders this customer has placed and which promotions they
 * have already used, keyed on their email address.
 *
 * Email is the only identifier a guest reliably carries between orders.
 * It is not proof of identity — someone determined can use a second
 * address — but it stops the ordinary "paste the code again" repeat,
 * which is what first-order and per-customer limits are actually for.
 */
export async function customerHistory(
  email?: string | null
): Promise<CustomerHistory> {
  const key = (email || "").trim().toLowerCase();
  if (!key) return { previousOrders: 0, customerUses: {} };

  const db = admin();
  const [orders, redemptions] = await Promise.all([
    db
      .from("orders")
      .select("id", { count: "exact", head: true })
      .ilike("email", key)
      .neq("status", "cancelled"),
    db
      .from("promo_redemptions")
      .select("promotion_id")
      .ilike("email", key)
      .eq("voided", false),
  ]);

  const customerUses: Record<string, number> = {};
  for (const r of redemptions.data ?? []) {
    const id = (r as any).promotion_id;
    customerUses[id] = (customerUses[id] ?? 0) + 1;
  }

  return { previousOrders: orders.count ?? 0, customerUses };
}

export interface CartQuote {
  quote: Quote;
  lines: PricedLine[];
  /** The promotion object behind quote.applied, for redemption bookkeeping. */
  promotion: Promotion | null;
}

export type QuoteResult =
  | { ok: true; result: CartQuote }
  | { ok: false; error: string };

/** Prices a whole cart: line prices from the menu, then the best offer. */
export async function quoteCart({
  items,
  code,
  email,
}: {
  items: IncomingItem[];
  code?: string | null;
  email?: string | null;
}): Promise<QuoteResult> {
  const priced = await priceCart(items);
  if (!priced.ok) return { ok: false, error: priced.error };

  const [promotions, history] = await Promise.all([
    loadPromotions(),
    customerHistory(email),
  ]);

  const quoteLines: QuoteLine[] = priced.lines.map((l) => ({
    itemId: l.itemId,
    category: l.category,
    qty: l.qty,
    unitPrice: l.unitPrice,
    listPrice: l.listPrice,
  }));

  const quote = buildQuote({
    promotions,
    lines: quoteLines,
    code,
    now: Date.now(),
    previousOrders: history.previousOrders,
    customerUses: history.customerUses,
  });

  const promotion = quote.applied
    ? (promotions.find((p) => p.id === quote.applied!.id) ?? null)
    : null;

  return { ok: true, result: { quote, lines: priced.lines, promotion } };
}

/* ── Admin input validation ────────────────────────────────── */

const KINDS: PromoKind[] = ["percent", "fixed"];
const SCOPES: PromoScope[] = ["order", "category", "items"];

const int = (v: unknown): number | null => {
  if (v === null || v === undefined || v === "") return null;
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : null;
};

const strings = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((s) => String(s).trim()).filter(Boolean) : [];

export type PromotionRowResult =
  | { row: Record<string, unknown> }
  | { error: string };

/**
 * Validates one promotion coming off the dashboard form and turns it
 * into a database row. Returns a message instead when something is off,
 * so a typo becomes a sentence the owner can act on rather than a 500.
 */
export function buildPromotionRow(body: any): PromotionRowResult {
  const name = String(body?.name ?? "").trim();
  if (!name) return { error: "Give the promotion a name." };

  const kind: PromoKind = KINDS.includes(body?.kind) ? body.kind : "percent";
  const scope: PromoScope = SCOPES.includes(body?.scope) ? body.scope : "order";

  const value = Number(body?.value);
  if (!Number.isFinite(value) || value <= 0)
    return { error: "Enter a discount greater than zero." };
  if (kind === "percent" && value > 100)
    return { error: "A percentage discount can't be more than 100%." };

  const categories = scope === "category" ? strings(body?.categories) : [];
  const itemIds = scope === "items" ? strings(body?.itemIds) : [];
  if (scope === "category" && categories.length === 0)
    return { error: "Pick at least one category for this promotion." };
  if (scope === "items" && itemIds.length === 0)
    return { error: "Pick at least one item for this promotion." };

  const rawCode = String(body?.code ?? "").trim();
  const code = rawCode ? normalizeCode(rawCode) : null;
  if (code && !/^[A-Z0-9-]{3,24}$/.test(code))
    return {
      error:
        "A promo code must be 3–24 characters, using letters, numbers or dashes.",
    };

  const minOrder = Math.max(0, int(body?.minOrder) ?? 0);
  const maxDiscount = int(body?.maxDiscount);
  if (maxDiscount !== null && maxDiscount <= 0)
    return { error: "A maximum discount must be greater than zero." };

  const startsAt = int(body?.startsAt);
  const endsAt = int(body?.endsAt);
  if (startsAt !== null && endsAt !== null && endsAt <= startsAt)
    return { error: "The end date has to come after the start date." };

  const usageLimit = int(body?.usageLimit);
  if (usageLimit !== null && usageLimit <= 0)
    return { error: "A total usage limit must be at least 1." };

  const perCustomerLimit = int(body?.perCustomerLimit);
  if (perCustomerLimit !== null && perCustomerLimit <= 0)
    return { error: "A per-customer limit must be at least 1." };

  return {
    row: {
      code,
      name,
      description: String(body?.description ?? "").trim() || null,
      kind,
      value,
      scope,
      categories,
      item_ids: itemIds,
      min_order: minOrder,
      max_discount: maxDiscount,
      starts_at: startsAt,
      ends_at: endsAt,
      usage_limit: usageLimit,
      per_customer_limit: perCustomerLimit,
      first_order_only: body?.firstOrderOnly === true,
      show_publicly: body?.showPublicly !== false,
      active: body?.active !== false,
    },
  };
}

/** Postgres unique-violation on the case-insensitive promo code index. */
export function isDuplicateCodeError(err: any): boolean {
  return err?.code === "23505" || /duplicate key/i.test(err?.message ?? "");
}

export interface PromotionWithStats extends Promotion {
  /** Naira actually given away by this promotion, cancellations excluded. */
  discountGiven: number;
  /** Live redemptions, i.e. not voided by a cancellation. */
  redemptions: number;
}
