/* ──────────────────────────────────────────────────────────────
   Shared mappers between Supabase rows and app-level types.

   Pure functions only. No "use client", no Supabase import, so this
   module is safe to use from both the browser store and the server
   API routes, keeping a single source of truth for the wire shape.
   ────────────────────────────────────────────────────────────── */

import type { MenuItem, ReviewSource } from "./data";

/* ── Menu ──────────────────────────────────────────────────── */

export function menuRowToItem(d: any): MenuItem {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    description: d.description || undefined,
    price: d.price,
    // A sale price at or above the list price is not a discount; drop it
    // here so no screen has to defend against it.
    salePrice:
      d.sale_price != null && d.sale_price > 0 && d.sale_price < d.price
        ? d.sale_price
        : undefined,
    image: d.image,
    position: d.position || undefined,
    zoom: d.zoom != null ? parseFloat(d.zoom) : undefined,
    serves: d.serves || undefined,
    includes: d.includes || undefined,
    extras: d.extras || undefined,
    rating: d.rating != null ? parseFloat(d.rating) : undefined,
    popular: d.popular ?? false,
    featured: d.featured ?? false,
    chefSpecial: d.chef_special ?? false,
    available: d.available !== false ? undefined : false,
  };
}

export function menuItemToRow(item: MenuItem) {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    description: item.description || null,
    price: item.price,
    sale_price:
      item.salePrice != null && item.salePrice > 0 && item.salePrice < item.price
        ? Math.round(item.salePrice)
        : null,
    image: item.image,
    position: item.position || null,
    zoom: item.zoom ?? null,
    serves: item.serves || null,
    includes: item.includes || null,
    extras: item.extras || null,
    rating: item.rating ?? null,
    popular: item.popular || false,
    featured: item.featured || false,
    chef_special: item.chefSpecial || false,
    available: item.available !== false,
  };
}

/* ── Orders ────────────────────────────────────────────────── */

export type OrderStatus =
  | "new"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface OrderLine {
  name: string;
  qty: number;
  /** What was actually charged per unit, sale price included. */
  price: number;
  /** Undiscounted per-unit price, only when the item was on sale. */
  listPrice?: number;
}

export interface Order {
  id: string;
  customerName: string;
  email?: string;
  phone?: string;
  method: "pickup" | "delivery";
  address?: string;
  note?: string;
  cancelNote?: string;
  lines: OrderLine[];
  /** Sum of the lines, before any order-level promotion. */
  subtotal: number;
  /** Naira taken off by the applied promotion. 0 when none was used. */
  discount: number;
  /** The code the customer typed, when the promotion needed one. */
  promoCode?: string;
  /** Human-readable name of the promotion, e.g. "Weekend Burger Deal". */
  promoLabel?: string;
  /** What is actually payable: subtotal − discount. */
  total: number;
  status: OrderStatus;
  createdAt: number;
  paymentConfirmed?: boolean;
  paymentVerified?: boolean;
  sample?: boolean;
}

/** Expects the row joined with `order_items(*)`. */
export function orderRowToOrder(o: any): Order {
  const total = Number(o.total) || 0;
  const discount = Number(o.discount) || 0;
  // Orders placed before discounts existed have no subtotal of their own;
  // for those the total IS the subtotal.
  const subtotal = Number(o.subtotal) > 0 ? Number(o.subtotal) : total + discount;

  return {
    id: o.id,
    customerName: o.customer_name,
    email: o.email || undefined,
    phone: o.phone || undefined,
    method: o.method,
    address: o.address || undefined,
    note: o.note || undefined,
    cancelNote: o.cancel_note || undefined,
    subtotal,
    discount,
    promoCode: o.promo_code || undefined,
    promoLabel: o.promo_label || undefined,
    total,
    status: o.status,
    createdAt: Number(o.created_at),
    paymentConfirmed: o.payment_confirmed ?? false,
    paymentVerified: o.payment_verified ?? false,
    sample: false,
    lines: (o.order_items ?? []).map((li: any) => ({
      name: li.name,
      qty: li.qty,
      price: li.price,
      listPrice:
        li.list_price != null && li.list_price > li.price
          ? li.list_price
          : undefined,
    })),
  };
}

/* ── Reviews ───────────────────────────────────────────────── */

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  source: ReviewSource;
  date: number;
  visible: boolean;
}

export function reviewRowToReview(d: any): Review {
  return {
    id: d.id,
    name: d.name,
    rating: d.rating != null ? parseFloat(d.rating) : 5,
    text: d.text,
    source: d.source,
    date: Number(d.date),
    visible: d.visible,
  };
}

/* ── Business settings ─────────────────────────────────────── */

export interface BusinessSettings {
  hoursText: string;
  prepTime: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
}

export function businessRowToSettings(d: any): BusinessSettings {
  return {
    hoursText: d.hours_text,
    prepTime: d.prep_time,
    phoneDisplay: d.phone_display,
    whatsappNumber: d.whatsapp_number,
    address: d.address,
  };
}

export function businessSettingsToRow(b: BusinessSettings) {
  return {
    hours_text: b.hoursText,
    prep_time: b.prepTime,
    phone_display: b.phoneDisplay,
    whatsapp_number: b.whatsappNumber,
    address: b.address,
  };
}
