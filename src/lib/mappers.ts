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
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  phone?: string;
  method: "pickup" | "delivery";
  address?: string;
  note?: string;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  createdAt: number;
  paymentConfirmed?: boolean;
  paymentVerified?: boolean;
  sample?: boolean;
}

/** Expects the row joined with `order_items(*)`. */
export function orderRowToOrder(o: any): Order {
  return {
    id: o.id,
    customerName: o.customer_name,
    phone: o.phone || undefined,
    method: o.method,
    address: o.address || undefined,
    note: o.note || undefined,
    total: o.total,
    status: o.status,
    createdAt: Number(o.created_at),
    paymentConfirmed: o.payment_confirmed ?? false,
    paymentVerified: o.payment_verified ?? false,
    sample: false,
    lines: (o.order_items ?? []).map((li: any) => ({
      name: li.name,
      qty: li.qty,
      price: li.price,
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
