"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BASE_MENU,
  RETIRED_ITEM_IDS,
  REVIEW_SEED,
  type MenuItem,
  type ReviewSource,
  BUSINESS,
} from "./data";

/* ──────────────────────────────────────────────────────────────
   Cart
   ────────────────────────────────────────────────────────────── */

export interface CartLine {
  id: string;
  name: string;
  price: number;
  image: string;
  position?: string;
  zoom?: number;
  category?: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (item: MenuItem, qty?: number) => void;
  inc: (id: string) => void;
  dec: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.id === item.id);
          if (existing) {
            return {
              lines: s.lines.map((l) =>
                l.id === item.id ? { ...l, qty: l.qty + qty } : l
              ),
            };
          }
          return {
            lines: [
              ...s.lines,
              {
                id: item.id,
                name: item.name,
                price: item.price,
                image: item.image,
                position: item.position,
                zoom: item.zoom,
                category: item.category,
                qty,
              },
            ],
          };
        }),
      inc: (id) =>
        set((s) => ({
          lines: s.lines.map((l) => (l.id === id ? { ...l, qty: l.qty + 1 } : l)),
        })),
      dec: (id) =>
        set((s) => ({
          lines: s.lines
            .map((l) => (l.id === id ? { ...l, qty: l.qty - 1 } : l))
            .filter((l) => l.qty > 0),
        })),
      remove: (id) => set((s) => ({ lines: s.lines.filter((l) => l.id !== id) })),
      clear: () => set({ lines: [] }),
    }),
    { name: "tpp-cart", skipHydration: true }
  )
);

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.qty, 0);
export const cartTotal = (lines: CartLine[]) =>
  lines.reduce((n, l) => n + l.price * l.qty, 0);

/* ──────────────────────────────────────────────────────────────
   Reviews (curated by the owner from the dashboard)
   ────────────────────────────────────────────────────────────── */

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  source: ReviewSource;
  date: number;
  visible: boolean;
}

interface ReviewsState {
  reviews: Review[];
  toggleVisible: (id: string) => void;
  addReview: (r: Omit<Review, "id" | "date">) => void;
  removeReview: (id: string) => void;
}

const DAY_MS = 86_400_000;

export const useReviews = create<ReviewsState>()(
  persist(
    (set) => ({
      reviews: REVIEW_SEED.map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        source: r.source,
        visible: r.visible,
        date: Date.now() - r.daysAgo * DAY_MS,
      })),
      toggleVisible: (id) =>
        set((s) => ({
          reviews: s.reviews.map((r) =>
            r.id === id ? { ...r, visible: !r.visible } : r
          ),
        })),
      addReview: (r) =>
        set((s) => ({
          reviews: [{ ...r, id: uid(), date: Date.now() }, ...s.reviews],
        })),
      removeReview: (id) =>
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) })),
    }),
    {
      name: "tpp-reviews",
      version: 1,
      skipHydration: true,
      /* v1: seeded review copy now references only dishes on the menu. */
      migrate: (persisted) => {
        const state = persisted as { reviews?: Review[] } | undefined;
        if (state?.reviews) {
          state.reviews = state.reviews.map((r) => {
            const seed = REVIEW_SEED.find((s) => s.id === r.id);
            return seed
              ? { ...r, text: seed.text, name: seed.name, rating: seed.rating }
              : r;
          });
        }
        return persisted;
      },
    }
  )
);

/* ──────────────────────────────────────────────────────────────
   Orders (local record, the source for the dashboard)
   ────────────────────────────────────────────────────────────── */

export type OrderStatus = "new" | "preparing" | "ready" | "completed";

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
  /** Customer tapped "I have made the payment" after a bank transfer. */
  paymentConfirmed?: boolean;
  /** The store confirmed the transfer arrived (set from the dashboard). */
  paymentVerified?: boolean;
  sample?: boolean;
}

interface OrdersState {
  orders: Order[];
  seeded: boolean;
  place: (
    order: Omit<Order, "id" | "status" | "createdAt" | "sample">
  ) => string;
  setStatus: (id: string, status: OrderStatus) => void;
  verifyPayment: (id: string) => void;
  seedSamples: () => void;
  clearSamples: () => void;
  clearAll: () => void;
}

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const SAMPLE_NAMES = [
  "Chiamaka O.", "Tunde A.", "Ngozi E.", "Emeka U.", "Fatima B.",
  "Seyi K.", "Amara N.", "Ibrahim S.", "Bisi L.", "Kelechi M.",
];

function makeSamples(): Order[] {
  const pool = BASE_MENU.filter((m) => m.price > 0);
  const out: Order[] = [];
  const now = Date.now();
  for (let i = 0; i < 14; i++) {
    const daysBack = Math.floor(Math.random() * 7);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const second = Math.random() > 0.55
      ? pool[Math.floor(Math.random() * pool.length)]
      : null;
    const lines: OrderLine[] = [
      { name: item.name, qty: 1 + Math.floor(Math.random() * 2), price: item.price },
    ];
    if (second && second.id !== item.id) {
      lines.push({ name: second.name, qty: 1, price: second.price });
    }
    const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const claimed = Math.random() > 0.35;
    const status: OrderStatus =
      daysBack === 0
        ? (["new", "preparing", "ready"] as OrderStatus[])[i % 3]
        : "completed";
    out.push({
      id: uid() + i,
      customerName: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
      method: Math.random() > 0.5 ? "delivery" : "pickup",
      lines,
      total,
      paymentConfirmed: claimed,
      paymentVerified: claimed && (status !== "new" || Math.random() > 0.5),
      status,
      createdAt:
        now - daysBack * 86400000 - Math.floor(Math.random() * 10) * 3600000,
      sample: true,
    });
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      seeded: false,
      place: (order) => {
        const id = uid();
        set((s) => ({
          orders: [
            { ...order, id, status: "new" as OrderStatus, createdAt: Date.now() },
            ...s.orders,
          ],
        }));
        return id;
      },
      setStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        })),
      verifyPayment: (id) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, paymentVerified: true } : o
          ),
        })),
      seedSamples: () =>
        set((s) => {
          if (s.seeded) return s;
          return { seeded: true, orders: [...s.orders, ...makeSamples()] };
        }),
      clearSamples: () =>
        set((s) => ({ orders: s.orders.filter((o) => !o.sample) })),
      clearAll: () => set({ orders: [] }),
    }),
    { name: "tpp-orders", skipHydration: true }
  )
);

/* ──────────────────────────────────────────────────────────────
   Menu (base data + owner edits from the dashboard)
   ────────────────────────────────────────────────────────────── */

interface MenuState {
  items: MenuItem[];
  upsert: (item: MenuItem) => void;
  remove: (id: string) => void;
  toggleAvailable: (id: string) => void;
  resetMenu: () => void;
}

export const useMenu = create<MenuState>()(
  persist(
    (set) => ({
      items: [...BASE_MENU],
      upsert: (item) =>
        set((s) => {
          const exists = s.items.some((i) => i.id === item.id);
          return {
            items: exists
              ? s.items.map((i) => (i.id === item.id ? item : i))
              : [...s.items, item],
          };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      toggleAvailable: (id) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, available: i.available === false ? undefined : false } : i
          ),
        })),
      resetMenu: () => set({ items: [...BASE_MENU] }),
    }),
    {
      name: "tpp-menu",
      version: 3,
      skipHydration: true,
      /* v2: standalone extras became per-item options.
         v3: default items without their own photo were retired; only
         the owner's photographed dishes ship by default. Owner-created
         items always survive migration. */
      migrate: (persisted) => {
        const state = persisted as { items?: MenuItem[] } | undefined;
        if (state?.items) {
          state.items = state.items
            .filter(
              (i) =>
                i.category !== "extras" && !RETIRED_ITEM_IDS.includes(i.id)
            )
            .map((i) => {
              const base = BASE_MENU.find((b) => b.id === i.id);
              return base
                ? { ...i, extras: base.extras, rating: base.rating }
                : i;
            });
        }
        return persisted;
      },
    }
  )
);

/* ──────────────────────────────────────────────────────────────
   Settings (customer profile + owner-editable business info)
   ────────────────────────────────────────────────────────────── */

export interface BusinessSettings {
  hoursText: string;
  prepTime: string;
  phoneDisplay: string;
  whatsappNumber: string;
  address: string;
}

interface SettingsState {
  profile: { name: string; phone: string; address: string };
  business: BusinessSettings;
  setProfile: (p: Partial<SettingsState["profile"]>) => void;
  setBusiness: (b: Partial<BusinessSettings>) => void;
  resetBusiness: () => void;
}

const DEFAULT_BUSINESS: BusinessSettings = {
  hoursText: BUSINESS.hoursText,
  prepTime: BUSINESS.prepTime,
  phoneDisplay: BUSINESS.phoneDisplay,
  whatsappNumber: BUSINESS.whatsappNumber,
  address: BUSINESS.address,
};

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      profile: { name: "", phone: "", address: "" },
      business: DEFAULT_BUSINESS,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      setBusiness: (b) => set((s) => ({ business: { ...s.business, ...b } })),
      resetBusiness: () => set({ business: DEFAULT_BUSINESS }),
    }),
    { name: "tpp-settings", skipHydration: true }
  )
);

/* ──────────────────────────────────────────────────────────────
   Favorites (local user list)
   ────────────────────────────────────────────────────────────── */

interface FavoritesState {
  ids: string[];
  toggle: (id: string) => void;
}

export const useFavorites = create<FavoritesState>()(
  persist(
    (set) => ({
      ids: [],
      toggle: (id) =>
        set((s) => ({
          ids: s.ids.includes(id)
            ? s.ids.filter((x) => x !== id)
            : [...s.ids, id],
        })),
    }),
    { name: "tpp-favorites", skipHydration: true }
  )
);

/* Rehydrate all persisted stores on the client (hydration-safe). */
export function rehydrateStores() {
  useCart.persist.rehydrate();
  useReviews.persist.rehydrate();
  useOrders.persist.rehydrate();
  useMenu.persist.rehydrate();
  useSettings.persist.rehydrate();
  useFavorites.persist.rehydrate();
}

