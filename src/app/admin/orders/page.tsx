"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Bike,
  Check,
  ChevronRight,
  Eye,
  Inbox,
  StickyNote,
  Store,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import StatusChip from "@/components/StatusChip";
import { useOrders, type Order, type OrderStatus } from "@/lib/store";
import { useLockBody } from "@/lib/hooks";
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
  const fetchOrders = useOrders((s) => s.fetchOrders);
  const setStatus = useOrders((s) => s.setStatus);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const detailsOrder = useMemo(
    () => orders.find((o) => o.id === detailsId) ?? null,
    [orders, detailsId]
  );

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
              <OrderCard
                key={o.id}
                order={o}
                onAdvance={setStatus}
                onDetails={() => setDetailsId(o.id)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <OrderDetailsModal
        order={detailsOrder}
        onClose={() => setDetailsId(null)}
      />
    </div>
  );
}

/* ── Full order details (review before confirming payment) ──── */

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 first:pt-0 last:pb-0 [&+&]:border-t [&+&]:border-cream-300/60">
      <span className="shrink-0 text-[12px] font-semibold text-ink-400">
        {label}
      </span>
      <span className="text-right text-[13px] font-bold text-ink-900">
        {value}
      </span>
    </div>
  );
}

function OrderDetailsModal({
  order: o,
  onClose,
}: {
  order: Order | null;
  onClose: () => void;
}) {
  const verifyPayment = useOrders((s) => s.verifyPayment);
  const setStatus = useOrders((s) => s.setStatus);
  useLockBody(!!o);

  const next = o ? NEXT[o.status] : undefined;
  const verified = !!o?.paymentVerified;

  return (
    <AnimatePresence>
      {o && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${orderRef(o.id)} details`}
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 360, damping: 32 }}
            className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[26px] bg-cream-50 shadow-float sm:max-w-[540px] sm:rounded-[26px]"
          >
            {/* Header */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-cream-200 px-5 py-4">
              <div className="mr-auto">
                <p className="text-[15px] font-bold text-ink-900">
                  {o.customerName}
                </p>
                <p className="font-display text-[12.5px] font-extrabold tracking-wide text-brand-600">
                  {orderRef(o.id)}
                </p>
              </div>
              {verified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
                  <Banknote className="h-3 w-3" /> Paid
                </span>
              ) : o.paymentConfirmed ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
                  <Banknote className="h-3 w-3" /> Transfer claimed
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 text-[11px] font-bold text-ink-500">
                  <Banknote className="h-3 w-3" /> Unpaid
                </span>
              )}
              <StatusChip status={o.status} />
              <button
                type="button"
                aria-label="Close details"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200/80 text-ink-500 transition-transform active:scale-90"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
              {/* Customer */}
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                Customer
              </p>
              <div className="rounded-2xl bg-white p-4 shadow-soft">
                <DetailRow label="Name" value={o.customerName} />
                <DetailRow
                  label="Phone"
                  value={
                    o.phone ? (
                      <a
                        href={`tel:${o.phone}`}
                        className="text-brand-600 underline-offset-2 hover:underline"
                      >
                        {o.phone}
                      </a>
                    ) : (
                      <span className="text-ink-400">Not provided</span>
                    )
                  }
                />
                <DetailRow
                  label="Method"
                  value={<span className="capitalize">{o.method}</span>}
                />
                {o.address && <DetailRow label="Address" value={o.address} />}
                {o.note && <DetailRow label="Note" value={o.note} />}
                <DetailRow
                  label="Placed"
                  value={new Date(o.createdAt).toLocaleString("en-NG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                />
              </div>

              {/* Items */}
              <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                Order
              </p>
              <div className="rounded-2xl bg-white p-4 shadow-soft">
                {o.lines.map((l, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-baseline justify-between gap-3 py-1.5 text-[13px]",
                      i > 0 && "border-t border-cream-300/60"
                    )}
                  >
                    <span className="font-semibold text-ink-700">
                      <span className="mr-1.5 font-bold text-brand-600">
                        {l.qty}×
                      </span>
                      {l.name}
                    </span>
                    <span className="shrink-0 font-bold tabular-nums text-ink-500">
                      {naira(l.price * l.qty)}
                    </span>
                  </div>
                ))}
                <div className="mt-2 flex items-center justify-between border-t border-cream-300/60 pt-2.5">
                  <span className="text-[13.5px] font-bold text-ink-900">
                    Total
                  </span>
                  <span className="font-display text-[17px] font-extrabold tabular-nums text-ink-900">
                    {naira(o.total)}
                  </span>
                </div>
              </div>

              {/* Payment */}
              <p className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
                Payment
              </p>
              <div
                className={cn(
                  "rounded-2xl p-4",
                  verified
                    ? "bg-emerald-50 ring-1 ring-emerald-200/70"
                    : "bg-amber-50 ring-1 ring-amber-200/70"
                )}
              >
                <p
                  className={cn(
                    "text-[12.5px] font-semibold leading-relaxed",
                    verified ? "text-emerald-900" : "text-amber-900"
                  )}
                >
                  {verified
                    ? "Transfer confirmed. The customer's receipt now shows Paid."
                    : o.paymentConfirmed
                      ? `Customer says they transferred ${naira(o.total)} to your Moniepoint account. Check the account, then confirm below.`
                      : "No transfer claimed yet. Confirm only when you have received payment."}
                </p>
                {!verified && o.status !== "completed" && (
                  <button
                    type="button"
                    onClick={() => verifyPayment(o.id)}
                    className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[12.5px] font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
                  >
                    <Check className="h-4 w-4" strokeWidth={3} />
                    I have confirmed payment
                  </button>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-2 border-t border-cream-200 bg-cream-50/95 px-5 py-3.5 pb-safe backdrop-blur">
              {o.phone && (
                <a
                  href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Chat with ${o.customerName} on WhatsApp`}
                  className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform hover:scale-105 active:scale-95"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                </a>
              )}
              {next ? (
                verified ? (
                  <button
                    type="button"
                    onClick={() => setStatus(o.id, next.to)}
                    className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-ink-900 text-[13.5px] font-bold text-white transition-all hover:bg-ink-700 active:scale-[0.98]"
                  >
                    {next.label}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-cream-200 text-[12.5px] font-bold text-ink-400">
                    Confirm payment to continue
                  </span>
                )
              ) : (
                <span className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-cream-200 text-[12.5px] font-bold text-ink-400">
                  Order completed
                </span>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function OrderCard({
  order: o,
  onAdvance,
  onDetails,
}: {
  order: Order;
  onAdvance: (id: string, s: OrderStatus) => void;
  onDetails: () => void;
}) {
  const verifyPayment = useOrders((s) => s.verifyPayment);
  const next = NEXT[o.status];
  const verified = !!o.paymentVerified;

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
          {verified ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <Banknote className="h-3 w-3" />
              Paid
            </span>
          ) : o.paymentConfirmed ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-800">
              <Banknote className="h-3 w-3" />
              Transfer claimed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-2.5 py-1 text-[11px] font-bold text-ink-500">
              <Banknote className="h-3 w-3" />
              Unpaid
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

      {/* Payment gate: verify the transfer before working the order */}
      {!verified && o.status !== "completed" && (
        <div className="mt-3 rounded-2xl bg-amber-50 p-3.5 ring-1 ring-amber-200/70">
          <p className="text-[12px] font-semibold leading-relaxed text-amber-900">
            {o.paymentConfirmed
              ? `Customer says they transferred ${naira(o.total)}. View the details, check your Moniepoint account, then confirm.`
              : "No transfer claimed yet. Confirm you have received payment before preparing."}
          </p>
          <div className="mt-2.5 flex gap-2">
            <button
              type="button"
              onClick={onDetails}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-white text-[12.5px] font-bold text-ink-700 shadow-soft transition-all hover:text-brand-600 active:scale-[0.98]"
            >
              <Eye className="h-4 w-4" />
              View details
            </button>
            <button
              type="button"
              onClick={() => verifyPayment(o.id)}
              className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[12.5px] font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
            >
              <Check className="h-4 w-4" strokeWidth={3} />
              Confirm payment
            </button>
          </div>
        </div>
      )}

      <div className="mt-3.5 flex items-center gap-2">
        <span className="font-display text-[16px] font-extrabold tabular-nums text-ink-900">
          {naira(o.total)}
        </span>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            aria-label="View order details"
            onClick={onDetails}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-100 text-ink-500 transition-colors hover:text-brand-600"
          >
            <Eye className="h-4 w-4" />
          </button>
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
          {next &&
            (verified ? (
              <button
                type="button"
                onClick={() => onAdvance(o.id, next.to)}
                className="flex h-9 items-center gap-1 rounded-xl bg-ink-900 px-3.5 text-[12px] font-bold text-white transition-all hover:bg-ink-700 active:scale-95"
              >
                {next.label}
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <span className="rounded-xl bg-cream-200 px-3.5 py-2 text-[11.5px] font-bold text-ink-400">
                Confirm payment to continue
              </span>
            ))}
        </div>
      </div>
    </motion.li>
  );
}
