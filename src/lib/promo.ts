/* ──────────────────────────────────────────────────────────────
   Discounts: types, row mappers and the pricing engine.

   Pure functions only, exactly like mappers.ts — no "use client",
   no Supabase import — so the cart preview in the browser and the
   authoritative calculation on the server run the same code and can
   never disagree about what a customer owes.

   Money is whole naira everywhere. Discounts round to the naira.
   ────────────────────────────────────────────────────────────── */

import type { MenuItem } from "./data";

/* ── Types ─────────────────────────────────────────────────── */

export type PromoKind = "percent" | "fixed";
export type PromoScope = "order" | "category" | "items";

export interface Promotion {
  id: string;
  /** null = automatic (applies itself); a string = the customer types it. */
  code: string | null;
  name: string;
  description?: string;
  kind: PromoKind;
  /** Percent: 1–100. Fixed: naira off. */
  value: number;
  scope: PromoScope;
  categories: string[];
  itemIds: string[];
  minOrder: number;
  maxDiscount: number | null;
  startsAt: number | null;
  endsAt: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  firstOrderOnly: boolean;
  showPublicly: boolean;
  active: boolean;
  createdAt: number;
}

/** One cart line, already priced (extras and any item sale included). */
export interface QuoteLine {
  /** Base menu id, without the `::extras` suffix. */
  itemId: string;
  category: string;
  qty: number;
  /** What the customer pays per unit. */
  unitPrice: number;
  /** Undiscounted per-unit price, when the item is on sale. */
  listPrice?: number;
}

export interface PromoContext {
  lines: QuoteLine[];
  subtotal: number;
  now: number;
  /** Non-cancelled orders this customer has placed before. */
  previousOrders?: number;
  /** Times this customer has already redeemed this promotion. */
  customerUses?: number;
}

export type PromoCheck =
  | { ok: true; discount: number; eligible: number }
  | { ok: false; reason: string };

/** What the customer is charged, and why. */
export interface Quote {
  subtotal: number;
  discount: number;
  total: number;
  applied: AppliedPromo | null;
  /** Set when a code was typed but could not be used. */
  codeError?: string;
  /** Set when the code was valid but an automatic deal saved more. */
  notice?: string;
}

export interface AppliedPromo {
  id: string;
  code: string | null;
  name: string;
  kind: PromoKind;
  value: number;
  /** "10% off" / "₦1,000 off" — safe to show anywhere. */
  label: string;
}

/* ── Row mappers ───────────────────────────────────────────── */

const num = (v: unknown, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

const nullableInt = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Math.round(num(v));

export function promoRowToPromotion(d: any): Promotion {
  return {
    id: d.id,
    code: d.code || null,
    name: d.name,
    description: d.description || undefined,
    kind: d.kind === "fixed" ? "fixed" : "percent",
    value: num(d.value),
    scope:
      d.scope === "category" || d.scope === "items" ? d.scope : "order",
    categories: Array.isArray(d.categories) ? d.categories : [],
    itemIds: Array.isArray(d.item_ids) ? d.item_ids : [],
    minOrder: Math.round(num(d.min_order)),
    maxDiscount: nullableInt(d.max_discount),
    startsAt: d.starts_at != null ? num(d.starts_at) : null,
    endsAt: d.ends_at != null ? num(d.ends_at) : null,
    usageLimit: nullableInt(d.usage_limit),
    perCustomerLimit: nullableInt(d.per_customer_limit),
    usedCount: Math.round(num(d.used_count)),
    firstOrderOnly: d.first_order_only === true,
    showPublicly: d.show_publicly !== false,
    active: d.active !== false,
    createdAt: num(d.created_at),
  };
}

export function promotionToRow(p: Promotion) {
  return {
    id: p.id,
    code: p.code ? normalizeCode(p.code) : null,
    name: p.name,
    description: p.description || null,
    kind: p.kind,
    value: p.value,
    scope: p.scope,
    categories: p.scope === "category" ? p.categories : [],
    item_ids: p.scope === "items" ? p.itemIds : [],
    min_order: p.minOrder,
    max_discount: p.maxDiscount,
    starts_at: p.startsAt,
    ends_at: p.endsAt,
    usage_limit: p.usageLimit,
    per_customer_limit: p.perCustomerLimit,
    first_order_only: p.firstOrderOnly,
    show_publicly: p.showPublicly,
    active: p.active,
    created_at: p.createdAt,
  };
}

/** Codes are stored and compared uppercase, with no stray spacing. */
export function normalizeCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, "");
}

/* ── Item sale prices ──────────────────────────────────────── */

/**
 * A sale price only counts when it is set, positive and actually below
 * the list price — a "sale" that costs more is a data-entry slip, not a
 * discount, and must never reach the customer.
 */
export function isOnSale(item: Pick<MenuItem, "price" | "salePrice">): boolean {
  const sale = Number(item.salePrice);
  return Number.isFinite(sale) && sale > 0 && sale < Number(item.price);
}

/** What the customer actually pays for one of these, before extras. */
export function effectivePrice(
  item: Pick<MenuItem, "price" | "salePrice">
): number {
  return isOnSale(item) ? Math.round(Number(item.salePrice)) : Number(item.price);
}

/** Whole-number percent off, for the "-20%" badge. 0 when not on sale. */
export function salePercent(
  item: Pick<MenuItem, "price" | "salePrice">
): number {
  if (!isOnSale(item)) return 0;
  const off = (1 - Number(item.salePrice) / Number(item.price)) * 100;
  return Math.max(1, Math.round(off));
}

/* ── Eligibility ───────────────────────────────────────────── */

/** The part of the cart this promotion is allowed to discount. */
function eligibleAmount(p: Promotion, ctx: PromoContext): number {
  if (p.scope === "order") return ctx.subtotal;

  const match =
    p.scope === "category"
      ? (l: QuoteLine) => p.categories.includes(l.category)
      : (l: QuoteLine) => p.itemIds.includes(l.itemId);

  return ctx.lines
    .filter(match)
    .reduce((n, l) => n + l.unitPrice * l.qty, 0);
}

/**
 * Decides whether a promotion applies to this cart, and for how much.
 * Every rejection carries a reason the customer can act on, because a
 * code that silently does nothing reads as a broken checkout.
 */
export function checkPromotion(p: Promotion, ctx: PromoContext): PromoCheck {
  if (!p.active) {
    return { ok: false, reason: "That offer is no longer running." };
  }
  if (p.startsAt != null && ctx.now < p.startsAt) {
    return { ok: false, reason: "That offer hasn't started yet." };
  }
  if (p.endsAt != null && ctx.now > p.endsAt) {
    return { ok: false, reason: "That offer has expired." };
  }
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) {
    return { ok: false, reason: "That offer has been fully claimed." };
  }
  if (
    p.perCustomerLimit != null &&
    (ctx.customerUses ?? 0) >= p.perCustomerLimit
  ) {
    return {
      ok: false,
      reason:
        p.perCustomerLimit === 1
          ? "You have already used that offer."
          : `That offer is limited to ${p.perCustomerLimit} uses per customer.`,
    };
  }
  if (p.firstOrderOnly && (ctx.previousOrders ?? 0) > 0) {
    return { ok: false, reason: "That offer is for first orders only." };
  }
  if (ctx.subtotal < p.minOrder) {
    const short = p.minOrder - ctx.subtotal;
    return {
      ok: false,
      reason: `Add ₦${short.toLocaleString("en-NG")} more to use that offer (minimum ₦${p.minOrder.toLocaleString("en-NG")}).`,
    };
  }

  const eligible = eligibleAmount(p, ctx);
  if (eligible <= 0) {
    return {
      ok: false,
      reason: "Nothing in your cart qualifies for that offer.",
    };
  }

  const raw =
    p.kind === "percent"
      ? Math.round((eligible * p.value) / 100)
      : Math.min(Math.round(p.value), eligible);

  const capped = p.maxDiscount != null ? Math.min(raw, p.maxDiscount) : raw;
  // Never hand back more than the cart is worth: a ₦5,000 code on a
  // ₦3,000 cart is ₦3,000 off, not a ₦2,000 refund.
  const discount = Math.max(0, Math.min(capped, ctx.subtotal));

  if (discount <= 0) {
    return { ok: false, reason: "That offer is worth nothing on this cart." };
  }

  return { ok: true, discount, eligible };
}

/* ── Labels ────────────────────────────────────────────────── */

export function promoLabel(p: Pick<Promotion, "kind" | "value">): string {
  return p.kind === "percent"
    ? `${p.value % 1 === 0 ? p.value : p.value.toFixed(1)}% off`
    : `₦${Math.round(p.value).toLocaleString("en-NG")} off`;
}

function toApplied(p: Promotion): AppliedPromo {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    kind: p.kind,
    value: p.value,
    label: promoLabel(p),
  };
}

/* ── The quote ─────────────────────────────────────────────── */

export function subtotalOf(lines: QuoteLine[]): number {
  return lines.reduce((n, l) => n + l.unitPrice * l.qty, 0);
}

export interface QuoteInput {
  /** Every promotion worth considering (the caller may pre-filter). */
  promotions: Promotion[];
  lines: QuoteLine[];
  /** Raw text the customer typed, if any. */
  code?: string | null;
  now: number;
  previousOrders?: number;
  /** promotion id → how many times this customer has redeemed it. */
  customerUses?: Record<string, number>;
}

/**
 * Prices a cart.
 *
 * Automatic promotions never stack with each other: the single best one
 * wins, so an owner running two overlapping deals can't accidentally
 * give both away. A typed code competes with the best automatic deal and
 * the larger discount wins, which keeps the customer's promise ("this
 * code saves me money") true without ever costing the store more than
 * the deal it was already advertising.
 *
 * Item sale prices are a separate mechanism: they are already baked into
 * `unitPrice`, so they always combine with whichever promotion applies.
 */
export function buildQuote(input: QuoteInput): Quote {
  const lines = input.lines;
  const subtotal = subtotalOf(lines);
  const empty: Quote = { subtotal, discount: 0, total: subtotal, applied: null };
  if (subtotal <= 0) return empty;

  const ctxFor = (p: Promotion): PromoContext => ({
    lines,
    subtotal,
    now: input.now,
    previousOrders: input.previousOrders,
    customerUses: input.customerUses?.[p.id] ?? 0,
  });

  /* Best automatic deal. */
  let bestAuto: { promo: Promotion; discount: number } | null = null;
  for (const p of input.promotions) {
    if (p.code) continue;
    const check = checkPromotion(p, ctxFor(p));
    if (!check.ok) continue;
    if (!bestAuto || check.discount > bestAuto.discount) {
      bestAuto = { promo: p, discount: check.discount };
    }
  }

  /* The typed code, if there is one. */
  const typed = input.code ? normalizeCode(input.code) : "";
  let coded: { promo: Promotion; discount: number } | null = null;
  let codeError: string | undefined;

  if (typed) {
    const promo = input.promotions.find(
      (p) => p.code && normalizeCode(p.code) === typed
    );
    if (!promo) {
      codeError = "That promo code isn't valid.";
    } else {
      const check = checkPromotion(promo, ctxFor(promo));
      if (check.ok) coded = { promo, discount: check.discount };
      else codeError = check.reason;
    }
  }

  const winner =
    coded && bestAuto
      ? coded.discount >= bestAuto.discount
        ? coded
        : bestAuto
      : (coded ?? bestAuto);

  if (!winner) return { ...empty, codeError };

  const notice =
    coded && winner !== coded
      ? `Your code saves ₦${coded.discount.toLocaleString("en-NG")}, but "${winner.promo.name}" saves you more, so we applied that instead.`
      : undefined;

  const discount = Math.min(winner.discount, subtotal);

  return {
    subtotal,
    discount,
    total: subtotal - discount,
    applied: toApplied(winner.promo),
    codeError,
    notice,
  };
}

/* ── Admin-facing status ───────────────────────────────────── */

export type PromoStatus =
  | "active"
  | "scheduled"
  | "expired"
  | "exhausted"
  | "paused";

export function promoStatus(p: Promotion, now = Date.now()): PromoStatus {
  if (!p.active) return "paused";
  if (p.startsAt != null && now < p.startsAt) return "scheduled";
  if (p.endsAt != null && now > p.endsAt) return "expired";
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return "exhausted";
  return "active";
}

export const PROMO_STATUS_LABEL: Record<PromoStatus, string> = {
  active: "Live",
  scheduled: "Scheduled",
  expired: "Ended",
  exhausted: "Fully claimed",
  paused: "Paused",
};

/** A blank promotion for the "new promotion" form. */
export function emptyPromotion(now = Date.now()): Promotion {
  return {
    id: "",
    code: null,
    name: "",
    description: undefined,
    kind: "percent",
    value: 10,
    scope: "order",
    categories: [],
    itemIds: [],
    minOrder: 0,
    maxDiscount: null,
    startsAt: null,
    endsAt: null,
    usageLimit: null,
    perCustomerLimit: null,
    usedCount: 0,
    firstOrderOnly: false,
    showPublicly: true,
    active: true,
    createdAt: now,
  };
}
