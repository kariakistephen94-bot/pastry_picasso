"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Bike,
  ChevronRight,
  Inbox,
  StickyNote,
  Store,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import StatusChip from "@/components/StatusChip";
import { useOrders, type Order, type OrderStatus } from "@/lib/store";
import { naira, orderRef, shortDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
];

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "completed", label: "Complete order" },
};

export default function AdminOrders() {
  const orders = useOrders((s) => s.orders);
  const setStatus = useOrders((s) => s.setStatus);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
          Orders
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500">
          Move each order along as the kitchen works.
        </p>
      </header>

      {/* Filters */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-bold transition-colors",
                active
                  ? "bg-ink-900 text-white shadow-card"
                  : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20" : "bg-cream-200 text-ink-500"
                )}
              >
                {counts[f.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] bg-white px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-200 text-ink-400">
            <Inbox className="h-7 w-7" />
          </span>
          <p className="mt-4 text-[14.5px] font-bold text-ink-900">
            No {filter === "all" ? "" : `${filter} `}orders
          </p>
          <p className="mt-1 text-[12.5px] text-ink-500">
            New WhatsApp orders placed in the app land here automatically.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {filtered.map((o) => (
              <OrderCard key={o.id} order={o} onAdvance={setStatus} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  onAdvance,
}: {
  order: Order;
  onAdvance: (id: string, s: OrderStatus) => void;
}) {
  const next = NEXT[o.status];

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="rounded-[24px] bg-white p-4 shadow-soft sm:p-5"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="flex items-center gap-2 text-[14px] font-bold text-ink-900">
          {o.customerName}
          <span className="text-[12px] font-semibold text-ink-400">
            {orderRef(o.id)}
          </span>
          {o.sample && (
            <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-500">
              Sample
            </span>
          )}
        </p>
        <span className="ml-auto flex items-center gap-2">
          {o.paymentConfirmed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <Banknote className="h-3 w-3" />
              Paid
            </span>
          )}
          <StatusChip status={o.status} />
        </span>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] font-semibold text-ink-400">
        <span className="flex items-center gap-1 capitalize">
          {o.method === "delivery" ? (
            <Bike className="h-3.5 w-3.5" />
          ) : (
            <Store className="h-3.5 w-3.5" />
          )}
          {o.method}
        </span>
        <span>
          {shortDate(o.createdAt)} · {timeAgo(o.createdAt)}
        </span>
        {o.phone && <span>{o.phone}</span>}
      </div>

      <ul className="mt-3 flex flex-col gap-1 rounded-2xl bg-cream-100 p-3">
        {o.lines.map((l, i) => (
          <li
            key={i}
            className="flex items-baseline justify-between gap-3 text-[12.5px]"
          >
            <span className="font-semibold text-ink-700">
              <span className="mr-1.5 font-bold text-brand-600">{l.qty}×</span>
              {l.name}
            </span>
            <span className="font-bold tabular-nums text-ink-500">
              {naira(l.price * l.qty)}
            </span>
          </li>
        ))}
        {o.address && (
          <li className="mt-1.5 border-t border-cream-300/70 pt-2 text-[12px] font-medium text-ink-500">
            📍 {o.address}
          </li>
        )}
        {o.note && (
          <li className="flex items-start gap-1.5 pt-1 text-[12px] font-medium text-ink-500">
            <StickyNote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
            {o.note}
          </li>
        )}
      </ul>

      <div className="mt-3.5 flex items-center gap-2">
        <span className="font-display text-[16px] font-extrabold tabular-nums text-ink-900">
          {naira(o.total)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {o.phone && (
            <a
              href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Chat with ${o.customerName} on WhatsApp`}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-transform hover:scale-105 active:scale-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
            </a>
          )}
          {next && (
            <button
              type="button"
              onClick={() => onAdvance(o.id, next.to)}
              className="flex h-9 items-center gap-1 rounded-xl bg-ink-900 px-3.5 text-[12px] font-bold text-white transition-all hover:bg-ink-700 active:scale-95"
            >
              {next.label}
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </motion.li>
  );
}
