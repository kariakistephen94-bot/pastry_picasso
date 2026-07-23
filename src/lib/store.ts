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
import { supabase } from "./supabase";

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
  fetchReviews: () => Promise<void>;
  toggleVisible: (id: string) => Promise<void>;
  addReview: (r: Omit<Review, "id" | "date">) => Promise<void>;
  removeReview: (id: string) => Promise<void>;
}

const DAY_MS = 86_400_000;

export const useReviews = create<ReviewsState>()(
  persist(
    (set, get) => ({
      reviews: REVIEW_SEED.map((r) => ({
        id: r.id,
        name: r.name,
        rating: r.rating,
        text: r.text,
        source: r.source,
        visible: r.visible,
        date: Date.now() - r.daysAgo * DAY_MS,
      })),
      fetchReviews: async () => {
        try {
          const { data, error } = await supabase
            .from("reviews")
            .select("*")
            .order("date", { ascending: false });
          if (data) {
            set({
              reviews: data.map((d: any) => ({
                id: d.id,
                name: d.name,
                rating: d.rating ? parseFloat(d.rating) : 5,
                text: d.text,
                source: d.source,
                date: parseInt(d.date),
                visible: d.visible,
              })),
            });
          }
        } catch (err) {
          console.error("Failed to fetch reviews:", err);
        }
      },
      toggleVisible: async (id) => {
        let newVisible = true;
        set((s) => {
          const reviews = s.reviews.map((r) => {
            if (r.id === id) {
              newVisible = !r.visible;
              return { ...r, visible: newVisible };
            }
            return r;
          });
          return { reviews };
        });

        try {
          await supabase.from("reviews").update({ visible: newVisible }).eq("id", id);
        } catch (err) {
          console.error("Failed to toggle review visibility:", err);
        }
      },
      addReview: async (r) => {
        const id = uid();
        const date = Date.now();
        const review: Review = { ...r, id, date };

        set((s) => ({ reviews: [review, ...s.reviews] }));

        try {
          await supabase.from("reviews").insert({
            id,
            name: review.name,
            rating: review.rating,
            text: review.text,
            source: review.source,
            date,
            visible: review.visible,
          });
        } catch (err) {
          console.error("Failed to add review:", err);
        }
      },
      removeReview: async (id) => {
        set((s) => ({ reviews: s.reviews.filter((r) => r.id !== id) }));

        try {
          await supabase.from("reviews").delete().eq("id", id);
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
  paymentConfirmed?: boolean;
  paymentVerified?: boolean;
  sample?: boolean;
}

interface OrdersState {
  orders: Order[];
  seeded: boolean;
  fetchOrders: () => Promise<void>;
  place: (
    order: Omit<Order, "id" | "status" | "createdAt" | "sample">,
    customerId?: string
  ) => Promise<string>;
  setStatus: (id: string, status: OrderStatus) => Promise<void>;
  verifyPayment: (id: string) => Promise<void>;
  seedSamples: () => Promise<void>;
  clearSamples: () => Promise<void>;
  clearAll: () => Promise<void>;
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
    (set, get) => ({
      orders: [],
      seeded: false,
      fetchOrders: async () => {
        try {
          const { data: ordersData, error: ordersError } = await supabase
            .from("orders")
            .select("*, order_items(*)")
            .order("created_at", { ascending: false });

          if (ordersData) {
            const orders: Order[] = ordersData.map((o: any) => ({
              id: o.id,
              customerName: o.customer_name,
              phone: o.phone || undefined,
              method: o.method,
              address: o.address || undefined,
              note: o.note || undefined,
              total: o.total,
              status: o.status,
              createdAt: parseInt(o.created_at),
              paymentConfirmed: o.payment_confirmed,
              paymentVerified: o.payment_verified,
              sample: false,
              lines: o.order_items.map((li: any) => ({
                name: li.name,
                qty: li.qty,
                price: li.price,
              })),
            }));
            set({ orders });
          }
        } catch (err) {
          console.error("Failed to fetch orders:", err);
        }
      },
      place: async (order, customerId) => {
        const id = uid();
        const createdAt = Date.now();

        // Update local state optimistically
        set((s) => ({
          orders: [
            {
              ...order,
              id,
              status: "new" as OrderStatus,
              createdAt,
              paymentVerified: false,
            },
            ...s.orders,
          ],
        }));

        try {
          // Attribute the order to the signed-in account, if there is one.
          // Guests simply leave this null and keep tracking by reference.
          const {
            data: { session },
          } = await supabase.auth.getSession();

          // 1. Insert order to Supabase
          const { error: orderError } = await supabase.from("orders").insert({
            id,
            customer_name: order.customerName,
            phone: order.phone || null,
            method: order.method,
            address: order.address || null,
            note: order.note || null,
            total: order.total,
            status: "new",
            payment_confirmed: order.paymentConfirmed || false,
            payment_verified: false,
            created_at: createdAt,
            customer_id: customerId || null,
            user_id: session?.user.id || null,
          });

          if (orderError) throw orderError;

          // 2. Insert items to Supabase
          const orderItems = order.lines.map((l) => ({
            order_id: id,
            name: l.name,
            qty: l.qty,
            price: l.price,
          }));

          const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
          if (itemsError) throw itemsError;
        } catch (err) {
          console.error("Failed to place order in Supabase:", err);
        }

        return id;
      },
      setStatus: async (id, status) => {
        set((s) => ({
          orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)),
        }));

        try {
          await supabase.from("orders").update({ status }).eq("id", id);
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
          await supabase.from("orders").update({ payment_verified: true }).eq("id", id);
        } catch (err) {
          console.error("Failed to verify payment:", err);
        }
      },
      seedSamples: async () => {
        try {
          const { data: countData } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true });

          if (countData && countData.length > 0) {
            // Data already exists in database; pull that live rather than seeding samples
            await get().fetchOrders();
            return;
          }

          const samples = makeSamples();
          for (const order of samples) {
            await supabase.from("orders").insert({
              id: order.id,
              customer_name: order.customerName,
              phone: order.phone || null,
              method: order.method,
              address: order.address || null,
              note: order.note || null,
              total: order.total,
              status: order.status,
              payment_confirmed: order.paymentConfirmed || false,
              payment_verified: order.paymentVerified || false,
              created_at: order.createdAt,
              customer_id: null,
            });

            const items = order.lines.map((l) => ({
              order_id: order.id,
              name: l.name,
              qty: l.qty,
              price: l.price,
            }));
            await supabase.from("order_items").insert(items);
          }

          set({ seeded: true });
          await get().fetchOrders();
        } catch (err) {
          console.error("Failed to seed samples:", err);
        }
      },
      clearSamples: async () => {
        // Clear all mock samples from local and database if marked as sample
        set((s) => ({ orders: s.orders.filter((o) => !o.sample) }));
        // Note: For database, we delete orders with dummy pattern or keep it local
      },
      clearAll: async () => {
        set({ orders: [] });
        try {
          await supabase.from("orders").delete().neq("id", "dummy");
        } catch (err) {
          console.error("Failed to clear all orders:", err);
        }
      },
    }),
    { name: "tpp-orders", skipHydration: true }
  )
);

/* ──────────────────────────────────────────────────────────────
   Menu (base data + owner edits from the dashboard)
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
    (set, get) => ({
      items: [...BASE_MENU],
      loading: false,
      fetchItems: async () => {
        set({ loading: true });
        try {
          const { data, error } = await supabase
            .from("menu_items")
            .select("*")
            .order("name", { ascending: true });
          if (data) {
            const items: MenuItem[] = data.map((d: any) => ({
              id: d.id,
              name: d.name,
              category: d.category,
              description: d.description || undefined,
              price: d.price,
              image: d.image,
              position: d.position || undefined,
              zoom: d.zoom ? parseFloat(d.zoom) : undefined,
              serves: d.serves || undefined,
              includes: d.includes || undefined,
              extras: d.extras || undefined,
              rating: d.rating ? parseFloat(d.rating) : undefined,
              popular: d.popular,
              featured: d.featured,
              chefSpecial: d.chef_special,
              available: d.available !== false ? undefined : false,
            }));
            set({ items, loading: false });
          } else {
            set({ loading: false });
          }
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
          await supabase.from("menu_items").upsert({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description || null,
            price: item.price,
            image: item.image,
            position: item.position || null,
            zoom: item.zoom || null,
            serves: item.serves || null,
            includes: item.includes || null,
            extras: item.extras || null,
            rating: item.rating || null,
            popular: item.popular || false,
            featured: item.featured || false,
            chef_special: item.chefSpecial || false,
            available: item.available !== false,
          });
        } catch (err) {
          console.error("Failed to upsert menu item:", err);
        }
      },
      remove: async (id) => {
        set((s) => ({ items: s.items.filter((i) => i.id !== id) }));

        try {
          await supabase.from("menu_items").delete().eq("id", id);
        } catch (err) {
          console.error("Failed to delete menu item:", err);
        }
      },
      toggleAvailable: async (id) => {
        let newAvailable = true;
        set((s) => {
          const items = s.items.map((i) => {
            if (i.id === id) {
              newAvailable = i.available === false;
              return { ...i, available: newAvailable ? undefined : false };
            }
            return i;
          });
          return { items };
        });

        try {
          await supabase.from("menu_items").update({ available: newAvailable }).eq("id", id);
        } catch (err) {
          console.error("Failed to toggle menu item availability:", err);
        }
      },
      resetMenu: async () => {
        set({ items: [...BASE_MENU] });

        try {
          // Delete all current records
          await supabase.from("menu_items").delete().neq("id", "dummy");

          // Insert default BASE_MENU
          const records = BASE_MENU.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            description: item.description || null,
            price: item.price,
            image: item.image,
            position: item.position || null,
            zoom: item.zoom || null,
            serves: item.serves || null,
            includes: item.includes || null,
            extras: item.extras || null,
            rating: item.rating || null,
            popular: item.popular || false,
            featured: item.featured || false,
            chef_special: item.chefSpecial || false,
            available: item.available !== false,
          }));

          await supabase.from("menu_items").insert(records);
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
          const { data, error } = await supabase
            .from("customers")
            .select("*")
            .eq("id", id)
            .single();
          if (data) {
            set({
              profile: {
                id: data.id,
                name: data.name,
                phone: data.phone || "",
                address: data.address || "",
              },
            });
          }
        } catch (err) {
          console.error("Failed to fetch customer profile:", err);
        }
      },
      saveProfile: async (p) => {
        const current = get().profile;
        const updated = { ...current, ...p };
        set({ profile: updated });

        if (updated.id) {
          try {
            await supabase.from("customers").upsert({
              id: updated.id,
              name: updated.name,
              phone: updated.phone || null,
              address: updated.address || null,
              updated_at: new Date().toISOString(),
            });
          } catch (err) {
            console.error("Failed to save customer profile:", err);
          }
        }
      },
      fetchBusiness: async () => {
        try {
          const { data, error } = await supabase
            .from("business_settings")
            .select("*")
            .eq("id", 1)
            .single();
          if (data) {
            set({
              business: {
                hoursText: data.hours_text,
                prepTime: data.prep_time,
                phoneDisplay: data.phone_display,
                whatsappNumber: data.whatsapp_number,
                address: data.address,
              },
            });
          }
        } catch (err) {
          console.error("Failed to fetch business settings:", err);
        }
      },
      setBusiness: async (b) => {
        const current = get().business;
        const updated = { ...current, ...b };
        set({ business: updated });

        try {
          await supabase
            .from("business_settings")
            .update({
              hours_text: updated.hoursText,
              prep_time: updated.prepTime,
              phone_display: updated.phoneDisplay,
              whatsapp_number: updated.whatsappNumber,
              address: updated.address,
            })
            .eq("id", 1);
        } catch (err) {
          console.error("Failed to update business settings:", err);
        }
      },
      resetBusiness: async () => {
        set({ business: DEFAULT_BUSINESS });

        try {
          await supabase
            .from("business_settings")
            .update({
              hours_text: DEFAULT_BUSINESS.hoursText,
              prep_time: DEFAULT_BUSINESS.prepTime,
              phone_display: DEFAULT_BUSINESS.phoneDisplay,
              whatsapp_number: DEFAULT_BUSINESS.whatsappNumber,
              address: DEFAULT_BUSINESS.address,
            })
            .eq("id", 1);
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
