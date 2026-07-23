"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  BASE_MENU,
  RETIRED_ITEM_IDS,
  REVIEW_SEED,
  type MenuItem,
  BUSINESS,
} from "./data";
import { api } from "./api";
import type {
  Order,
  OrderLine,
  OrderStatus,
  Review,
  BusinessSettings,
} from "./mappers";

/* Re-export the shared types so existing `@/lib/store` imports keep working. */
export type { Order, OrderLine, OrderStatus, Review, BusinessSettings };

/* ──────────────────────────────────────────────────────────────
   Cart (local only — never leaves the browser until checkout)
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
   Reviews
   ────────────────────────────────────────────────────────────── */

interface ReviewsState {
  reviews: Review[];
  /** Pass admin=true (from the dashboard) to include hidden reviews. */
  fetchReviews: (admin?: boolean) => Promise<void>;
  toggleVisible: (id: string) => Promise<void>;
  addReview: (r: Pick<Review, "name" | "rating" | "text">) => Promise<void>;
  removeReview: (id: string) => Promise<void>;
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
      fetchReviews: async (admin = false) => {
        try {
          const { reviews } = await api.get<{ reviews: Review[] }>(
            admin ? "/api/admin/reviews" : "/api/reviews",
            { auth: admin }
          );
          set({ reviews });
        } catch (err) {
          console.error("Failed to fetch reviews:", err);
        }
      },
      toggleVisible: async (id) => {
        let next = true;
        set((s) => ({
          reviews: s.reviews.map((r) => {
            if (r.id !== id) return r;
            next = !r.visible;
            return { ...r, visible: next };
          }),
        }));
        try {
          await api.patch(`/api/admin/reviews/${id}`, { visible: next }, { auth: true });
        } catch (err) {
          console.error("Failed to toggle review visibility:", err);
        }
      },
      addReview: async (r) => {
        try {
          const { review } = await api.post<{ review: Review }>("/api/reviews", {
            name: r.name,
            rating: r.rating,
            text: r.text,
          });
          set((s) => ({ reviews: [review, ...s.reviews] }));
        } catch (err) {
          console.error("Failed to add review:", err);
        }
      },
      removeReview: async (id) => {
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) }));
        try {
          await api.del(`/api/admin/reviews/${id}`, { auth: true });
        } catch (err) {
          console.error("Failed to remove review:", err);
        }
      },
    }),
    {
      name: "tpp-reviews",
      version: 1,
      skipHydration: true,
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
   Orders
   ────────────────────────────────────────────────────────────── */

export interface PlaceOrderInput {
  customerName: string;
  phone?: string;
  method: "pickup" | "delivery";
  address?: string;
  note?: string;
  /** Cart lines: the id encodes base item + chosen extras. */
  items: { id: string; name: string; qty: number }[];
  paymentConfirmed?: boolean;
  customerId?: string;
}

interface OrdersState {
  orders: Order[];
  seeded: boolean;
  fetchOrders: () => Promise<void>;
  place: (input: PlaceOrderInput) => Promise<Order>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  verifyPayment: (id: string) => Promise<void>;
  seedSamples: () => Promise<void>;
  clearSamples: () => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: [],
      seeded: false,
      fetchOrders: async () => {
        try {
          const { orders } = await api.get<{ orders: Order[] }>(
            "/api/admin/orders",
            { auth: true }
          );
          set({ orders });
        } catch (err) {
          console.error("Failed to fetch orders:", err);
        }
      },
      place: async (input) => {
        const { order } = await api.post<{ order: Order }>("/api/orders", {
          customerName: input.customerName,
          phone: input.phone,
          method: input.method,
          address: input.address,
          note: input.note,
          items: input.items.map((i) => ({ id: i.id, qty: i.qty })),
          paymentConfirmed: input.paymentConfirmed ?? false,
          customerId: input.customerId,
        });
        set((s) => ({ orders: [order, ...s.orders] }));
        return order;
      },
      setStatus: async (id, status) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));
        try {
          await api.patch(`/api/admin/orders/${id}`, { status }, { auth: true });
        } catch (err) {
          console.error("Failed to set order status:", err);
        }
      },
      verifyPayment: async (id) => {
        set((s) => ({
          orders: s.orders.map((o) =>
            o.id === id ? { ...o, paymentVerified: true } : o
          ),
        }));
        try {
          await api.patch(
            `/api/admin/orders/${id}`,
            { paymentVerified: true },
            { auth: true }
          );
        } catch (err) {
          console.error("Failed to verify payment:", err);
        }
      },
      seedSamples: async () => {
        try {
          const { orders, seeded } = await api.post<{
            orders: Order[];
            seeded: boolean;
          }>("/api/admin/orders/seed", {}, { auth: true });
          set({ orders, seeded });
        } catch (err) {
          console.error("Failed to seed samples:", err);
        }
      },
      clearSamples: async () => {
        // Sample orders live in the database once seeded; here we only drop any
        // that are still flagged locally.
        set((s) => ({ orders: s.orders.filter((o) => !o.sample) }));
      },
      clearAll: async () => {
        set({ orders: [] });
        try {
          await api.del("/api/admin/orders", { auth: true });
        } catch (err) {
          console.error("Failed to clear all orders:", err);
        }
      },
    }),
    { name: "tpp-orders", skipHydration: true }
  )
);

/* ──────────────────────────────────────────────────────────────
   Menu
   ────────────────────────────────────────────────────────────── */

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  fetchItems: () => Promise<void>;
  upsert: (item: MenuItem) => Promise<void>;
  remove: (id: string) => Promise<void>;
  toggleAvailable: (id: string) => Promise<void>;
  resetMenu: () => Promise<void>;
}

export const useMenu = create<MenuState>()(
  persist(
    (set) => ({
      items: [...BASE_MENU],
      loading: false,
      fetchItems: async () => {
        set({ loading: true });
        try {
          const { items } = await api.get<{ items: MenuItem[] }>("/api/menu");
          // Never blank the storefront: if the menu table is empty, keep the
          // built-in defaults so the site still shows something to order.
          if (items.length > 0) set({ items });
          else console.warn("Menu is empty in the database; keeping defaults.");
          set({ loading: false });
        } catch (err) {
          console.error("Failed to fetch menu items:", err);
          set({ loading: false });
        }
      },
      upsert: async (item) => {
        set((s) => {
          const exists = s.items.some((i) => i.id === item.id);
          return {
            items: exists
              ? s.items.map((i) => (i.id === item.id ? item : i))
              : [...s.items, item],
          };
        });
        try {
          await api.post("/api/admin/menu", item, { auth: true });
        } catch (err) {
          console.error("Failed to upsert menu item:", err);
        }
      },
      remove: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));
        try {
          await api.del(`/api/admin/menu/${id}`, { auth: true });
        } catch (err) {
          console.error("Failed to delete menu item:", err);
        }
      },
      toggleAvailable: async (id) => {
        let next = true;
        set((s) => ({
          items: s.items.map((i) => {
            if (i.id !== id) return i;
            next = i.available === false; // was hidden → now available
            return { ...i, available: next ? undefined : false };
          }),
        }));
        try {
          await api.patch(`/api/admin/menu/${id}`, { available: next }, { auth: true });
        } catch (err) {
          console.error("Failed to toggle menu item availability:", err);
        }
      },
      resetMenu: async () => {
        set({ items: [...BASE_MENU] });
        try {
          const { items } = await api.post<{ items: MenuItem[] }>(
            "/api/admin/menu/reset",
            {},
            { auth: true }
          );
          set({ items });
        } catch (err) {
          console.error("Failed to reset menu:", err);
        }
      },
    }),
    {
      name: "tpp-menu",
      version: 3,
      skipHydration: true,
      migrate: (persisted) => {
        const state = persisted as { items?: MenuItem[] } | undefined;
        if (state?.items) {
          state.items = state.items
            .filter(
              (i) => i.category !== "extras" && !RETIRED_ITEM_IDS.includes(i.id)
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
   Settings (guest profile + owner-editable business info)
   ────────────────────────────────────────────────────────────── */

interface SettingsState {
  profile: { id: string; name: string; phone: string; address: string };
  business: BusinessSettings;
  setProfile: (p: Partial<SettingsState["profile"]>) => void;
  fetchProfile: (id: string) => Promise<void>;
  saveProfile: (p: Partial<SettingsState["profile"]>) => Promise<void>;
  fetchBusiness: () => Promise<void>;
  setBusiness: (b: Partial<BusinessSettings>) => Promise<void>;
  resetBusiness: () => Promise<void>;
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
    (set, get) => ({
      profile: { id: "", name: "", phone: "", address: "" },
      business: DEFAULT_BUSINESS,
      setProfile: (p) => set((s) => ({ profile: { ...s.profile, ...p } })),
      fetchProfile: async (id) => {
        try {
          const { profile } = await api.get<{
            profile: { id: string; name: string; phone: string; address: string } | null;
          }>(`/api/customers/${id}`);
          if (profile) set({ profile });
        } catch (err) {
          console.error("Failed to fetch customer profile:", err);
        }
      },
      saveProfile: async (p) => {
        const updated = { ...get().profile, ...p };
        set({ profile: updated });
        if (!updated.id) return;
        try {
          await api.put(`/api/customers/${updated.id}`, {
            name: updated.name,
            phone: updated.phone,
            address: updated.address,
          });
        } catch (err) {
          console.error("Failed to save customer profile:", err);
        }
      },
      fetchBusiness: async () => {
        try {
          const { business } = await api.get<{ business: BusinessSettings | null }>(
            "/api/settings"
          );
          if (business) set({ business });
        } catch (err) {
          console.error("Failed to fetch business settings:", err);
        }
      },
      setBusiness: async (b) => {
        const updated = { ...get().business, ...b };
        set({ business: updated });
        try {
          await api.patch("/api/admin/settings", updated, { auth: true });
        } catch (err) {
          console.error("Failed to update business settings:", err);
        }
      },
      resetBusiness: async () => {
        set({ business: DEFAULT_BUSINESS });
        try {
          await api.patch("/api/admin/settings", DEFAULT_BUSINESS, { auth: true });
        } catch (err) {
          console.error("Failed to reset business settings:", err);
        }
      },
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
