"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Crown,
  Mail,
  Phone,
  Repeat,
  Search,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useUI } from "@/lib/ui-store";
import { naira, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";
import {
  SEGMENT_LABEL,
  segmentFor,
  type Role,
  type Segment,
} from "@/lib/auth";

interface CustomerRow {
  key: string;
  /** Present only for registered accounts; guests have no auth user. */
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  role: Role | null;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: number | null;
  segment: Segment;
}

/** Last 10 digits, so 0803..., +234803... and 234803... group together. */
function phoneKey(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

const SEGMENT_STYLE: Record<Segment, string> = {
  new: "bg-sky-50 text-sky-700",
  returning: "bg-amber-50 text-amber-700",
  vip: "bg-brand-100 text-brand-700",
};

const SEGMENT_ICON: Record<Segment, typeof Sparkles> = {
  new: Sparkles,
  returning: Repeat,
  vip: Crown,
};

type Filter = "all" | Segment | "admins";

export default function AdminCustomers() {
  const showToast = useUI((s) => s.showToast);

  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: profiles }, { data: orders }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, email, full_name, phone, role")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("user_id, customer_name, phone, total, created_at"),
      ]);

      const orderList = orders ?? [];

      // Registered accounts. An order counts as theirs if it carries their
      // user_id, or if it was placed as a guest from the same phone number.
      const registered: CustomerRow[] = (profiles ?? []).map((p: any) => {
        const pKey = phoneKey(p.phone);
        const mine = orderList.filter(
          (o: any) =>
            o.user_id === p.id || (pKey !== "" && phoneKey(o.phone) === pKey)
        );
        const orderCount = mine.length;
        return {
          key: `user:${p.id}`,
          userId: p.id,
          name: p.full_name || p.email || "Unnamed",
          email: p.email || "",
          phone: p.phone || "",
          role: p.role === "admin" ? "admin" : "customer",
          orderCount,
          totalSpend: mine.reduce((n: number, o: any) => n + (o.total || 0), 0),
          lastOrderAt: mine.length
            ? Math.max(...mine.map((o: any) => Number(o.created_at)))
            : null,
          segment: segmentFor(orderCount),
        };
      });

      const claimedPhones = new Set(
        registered.map((r) => phoneKey(r.phone)).filter(Boolean)
      );

      // Guests: no account, grouped by phone (or by name when there is none).
      const guests = new Map<string, CustomerRow>();
      for (const o of orderList as any[]) {
        if (o.user_id) continue;
        const pKey = phoneKey(o.phone);
        if (pKey && claimedPhones.has(pKey)) continue;

        const key = pKey ? `phone:${pKey}` : `name:${o.customer_name || "?"}`;
        const at = Number(o.created_at);
        const existing = guests.get(key);

        if (existing) {
          existing.orderCount += 1;
          existing.totalSpend += o.total || 0;
          existing.segment = segmentFor(existing.orderCount);
          if (!existing.lastOrderAt || at > existing.lastOrderAt) {
            existing.lastOrderAt = at;
            existing.name = o.customer_name || existing.name;
          }
        } else {
          guests.set(key, {
            key,
            userId: null,
            name: o.customer_name || "Guest",
            email: "",
            phone: o.phone || "",
            role: null,
            orderCount: 1,
            totalSpend: o.total || 0,
            lastOrderAt: at,
            segment: segmentFor(1),
          });
        }
      }

      const all = [...registered, ...guests.values()].sort((a, b) => {
        if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
        return (b.lastOrderAt ?? 0) - (a.lastOrderAt ?? 0);
      });

      setRows(all);
    } catch (err) {
      console.error("Failed to load customers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id ?? null);
    });
  }, [load]);

  // The database is the real gate here: RLS plus a trigger reject this update
  // unless the caller is already an admin. The UI just makes it convenient.
  const setRole = async (row: CustomerRow, role: Role) => {
    if (!row.userId || busyId) return;
    if (row.userId === currentUserId && role === "customer") {
      showToast("You cannot remove your own administrator access.");
      return;
    }

    setBusyId(row.userId);
    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", row.userId);
    setBusyId(null);

    if (error) {
      showToast(error.message);
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.userId === row.userId ? { ...r, role } : r))
    );
    showToast(
      role === "admin"
        ? `${row.name} is now an administrator.`
        : `${row.name} is back to a customer account.`
    );
  };

  const counts = useMemo(
    () => ({
      all: rows.length,
      new: rows.filter((r) => r.segment === "new").length,
      returning: rows.filter((r) => r.segment === "returning").length,
      vip: rows.filter((r) => r.segment === "vip").length,
      admins: rows.filter((r) => r.role === "admin").length,
    }),
    [rows]
  );

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter === "admins" && r.role !== "admin") return false;
      if (filter !== "all" && filter !== "admins" && r.segment !== filter)
        return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.phone.includes(q)
      );
    });
  }, [rows, filter, query]);

  const TABS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "new", label: "New" },
    { id: "returning", label: "Returning" },
    { id: "vip", label: "VIP" },
    { id: "admins", label: "Admins" },
  ];

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
          Customers
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500">
          {counts.all} total · {counts.vip} VIP · {counts.admins} with dashboard
          access.
        </p>
      </header>

      {/* Segment summary */}
      <div className="mb-4 grid grid-cols-3 gap-2.5">
        {(["new", "returning", "vip"] as Segment[]).map((seg) => {
          const Icon = SEGMENT_ICON[seg];
          return (
            <button
              key={seg}
              onClick={() => setFilter(filter === seg ? "all" : seg)}
              className={cn(
                "rounded-[22px] bg-white p-4 text-left shadow-soft transition-shadow hover:shadow-card cursor-pointer",
                filter === seg && "ring-2 ring-brand-300"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl",
                  SEGMENT_STYLE[seg]
                )}
              >
                <Icon className="h-[17px] w-[17px]" />
              </span>
              <p className="mt-2.5 font-display text-[22px] font-extrabold leading-none text-ink-900">
                {counts[seg]}
              </p>
              <p className="mt-1 text-[12px] font-bold text-ink-500">
                {SEGMENT_LABEL[seg]}
              </p>
            </button>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-3 h-[17px] w-[17px] text-ink-300" />
          <input
            placeholder="Search name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-2xl bg-white py-2.5 pl-11 pr-4 text-[13.5px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-[12px] font-bold transition-colors cursor-pointer",
                filter === t.id
                  ? "bg-ink-900 text-white shadow-card"
                  : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p className="animate-pulse pl-1 text-[13px] font-semibold text-ink-400">
          Loading customers...
        </p>
      ) : shown.length === 0 ? (
        <div className="rounded-[24px] bg-white p-8 text-center shadow-soft">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-200 text-ink-400">
            <UserRound className="h-5 w-5" />
          </span>
          <p className="mt-3 text-[14px] font-bold text-ink-900">
            No customers here yet
          </p>
          <p className="mt-1 text-[12.5px] font-medium text-ink-500">
            {query
              ? "Nothing matches that search."
              : "Customers appear once they sign up or place an order."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          <AnimatePresence initial={false}>
            {shown.map((r) => {
              const Icon = SEGMENT_ICON[r.segment];
              const isSelf = r.userId != null && r.userId === currentUserId;
              return (
                <motion.div
                  key={r.key}
                  layout
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-[22px] bg-white p-4 shadow-soft"
                >
                  <div className="flex items-start gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-[16px] font-extrabold text-white">
                      {r.name.trim().charAt(0).toUpperCase() || "?"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-display text-[14.5px] font-extrabold text-ink-900">
                          {r.name}
                        </p>
                        <span
                          className={cn(
                            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                            SEGMENT_STYLE[r.segment]
                          )}
                        >
                          <Icon className="h-3 w-3" />
                          {SEGMENT_LABEL[r.segment]}
                        </span>
                        {r.role === "admin" && (
                          <span className="rounded-full bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                            Admin
                          </span>
                        )}
                        {r.userId === null && (
                          <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-500">
                            Guest
                          </span>
                        )}
                      </div>

                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] font-medium text-ink-500">
                        {r.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {r.email}
                          </span>
                        )}
                        {r.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {r.phone}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[12px] font-semibold text-ink-400">
                        <span>
                          {r.orderCount}{" "}
                          {r.orderCount === 1 ? "order" : "orders"}
                        </span>
                        <span className="text-ink-900">
                          {naira(r.totalSpend)}
                        </span>
                        {r.lastOrderAt && (
                          <span>last {timeAgo(r.lastOrderAt)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role controls only exist for real accounts */}
                  {r.userId && (
                    <div className="mt-3 flex justify-end border-t border-cream-200 pt-3">
                      {r.role === "admin" ? (
                        <button
                          onClick={() => setRole(r, "customer")}
                          disabled={busyId === r.userId || isSelf}
                          title={
                            isSelf
                              ? "You cannot remove your own access"
                              : undefined
                          }
                          className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2 text-[12px] font-bold text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
                        >
                          <ShieldOff className="h-3.5 w-3.5" />
                          {busyId === r.userId ? "Saving..." : "Revoke admin"}
                        </button>
                      ) : (
                        <button
                          onClick={() => setRole(r, "admin")}
                          disabled={busyId === r.userId}
                          className="flex items-center gap-1.5 rounded-xl bg-ink-900 px-3.5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          {busyId === r.userId ? "Saving..." : "Make admin"}
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
