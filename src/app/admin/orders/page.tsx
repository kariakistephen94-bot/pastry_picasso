"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Bike,
  Ban,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Inbox,
  ReceiptText,
  StickyNote,
  Store,
  Timer,
  X,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import StatusChip, { STATUS_LABEL } from "@/components/StatusChip";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/store";
import { useLockBody } from "@/lib/hooks";
import { naira, orderRef, shortDate, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "new", label: "New" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancel" },
];

const SORTS: { id: string; label: string }[] = [
  { id: "recent", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "total_high", label: "Highest total" },
  { id: "total_low", label: "Lowest total" },
];

const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  new: { to: "preparing", label: "Start preparing" },
  preparing: { to: "ready", label: "Mark ready" },
  ready: { to: "completed", label: "Complete order" },
};

/* Statuses an order can be moved between. Cancelling is deliberately not
   here: it needs a note, so it goes through the details sheet. */
const WORKFLOW: OrderStatus[] = ["new", "preparing", "ready", "completed"];

const PAGE_SIZE = 10;

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [revenue, setRevenue] = useState(0);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [detailsId, setDetailsId] = useState<string | null>(null);
  /* Cancelling from the row opens the sheet straight onto its note form. */
  const [startCancel, setStartCancel] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.get<{
          data: Order[];
          total: number;
          totalPages: number;
          counts: Record<string, number>;
          revenue: number;
        }>(
          `/api/admin/orders?page=${page}&limit=${PAGE_SIZE}&status=${filter}&sort=${sort}`,
          { auth: true }
        );
        setOrders(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setCounts(res.counts);
        setRevenue(res.revenue ?? 0);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, filter, sort]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Reset to page 1 whenever the filter or sort changes.
  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  const advance = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await api.patch(`/api/admin/orders/${id}`, { status }, { auth: true });
    } catch (err) {
      console.error("Failed to update status:", err);
    }
    load(true);
  };

  const verify = async (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, paymentVerified: true } : o))
    );
    try {
      await api.patch(`/api/admin/orders/${id}`, { paymentVerified: true }, { auth: true });
    } catch (err) {
      console.error("Failed to verify payment:", err);
    }
    load(true);
  };

  const cancel = async (id: string, cancelNote: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "cancelled", cancelNote } : o))
    );
    try {
      await api.patch(
        `/api/admin/orders/${id}`,
        { status: "cancelled", cancelNote },
        { auth: true }
      );
    } catch (err) {
      console.error("Failed to cancel order:", err);
    }
    load(true);
  };

  const detailsOrder = useMemo(
    () => orders.find((o) => o.id === detailsId) ?? null,
    [orders, detailsId]
  );

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
            Orders
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-ink-500">
            Move each order along as the kitchen works.
          </p>
        </div>
        <label className="flex items-center gap-2 text-[12px] font-bold text-ink-500">
          Sort
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl bg-white px-3 py-2 text-[12.5px] font-bold text-ink-900 shadow-soft outline-none ring-1 ring-transparent focus:ring-2 focus:ring-brand-300"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </header>

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            icon: Banknote,
            tint: "bg-brand-100 text-brand-700",
            label: "Revenue",
            hint: "excludes cancelled",
            value: naira(revenue),
          },
          {
            icon: ReceiptText,
            tint: "bg-blue-50 text-blue-600",
            label: "Total orders",
            value: String(counts.all ?? 0),
          },
          {
            icon: Timer,
            tint: "bg-amber-50 text-amber-600",
            label: "Open",
            hint: "new + preparing",
            value: String((counts.new ?? 0) + (counts.preparing ?? 0)),
          },
          {
            icon: Ban,
            tint: "bg-red-50 text-red-600",
            label: "Cancelled",
            value: String(counts.cancelled ?? 0),
          },
        ].map(({ icon: Icon, tint, label, hint, value }) => (
          <div key={label} className="rounded-[22px] bg-white p-4 shadow-soft">
            <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tint)}>
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              {label}
            </p>
            <p className="mt-0.5 font-display text-[20px] font-extrabold tabular-nums tracking-tight text-ink-900 lg:text-[22px]">
              {value}
            </p>
            {hint && (
              <p className="mt-0.5 text-[10.5px] font-semibold text-ink-300">{hint}</p>
            )}
          </div>
        ))}
      </div>

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

      {loading && orders.length === 0 ? (
        <p className="animate-pulse py-12 text-center text-[13px] font-semibold text-ink-400">
          Loading orders…
        </p>
      ) : orders.length === 0 ? (
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
        <div className="overflow-x-auto rounded-[24px] bg-white shadow-soft">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-100/70 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-400">
                <th className="px-3 py-3 font-bold sm:px-4">Order</th>
                <th className="hidden px-2.5 py-3 font-bold md:table-cell">Placed</th>
                <th className="hidden px-2.5 py-3 font-bold lg:table-cell">Items</th>
                <th className="px-2.5 py-3 text-right font-bold">Total</th>
                <th className="hidden px-2.5 py-3 font-bold sm:table-cell">Payment</th>
                <th className="hidden px-2.5 py-3 font-bold sm:table-cell">Status</th>
                <th className="px-3 py-3 text-right font-bold sm:px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {orders.map((o) => (
                  <OrderRow
                    key={o.id}
                    order={o}
                    onAdvance={advance}
                    onVerify={verify}
                    onDetails={() => setDetailsId(o.id)}
                    onCancelRequest={() => {
                      setStartCancel(true);
                      setDetailsId(o.id);
                    }}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onPage={setPage}
      />

      <OrderDetailsModal
        order={detailsOrder}
        initialCancel={startCancel}
        onClose={() => {
          setDetailsId(null);
          setStartCancel(false);
        }}
        onAdvance={advance}
        onVerify={verify}
        onCancel={cancel}
      />
    </div>
  );
}

/* ── Status select ───────────────────────────────────────────
   Rendered into document.body: the table scrolls horizontally, and an
   overflow container clips a dropdown on both axes. */

function StatusMenu({
  order: o,
  onAdvance,
  onVerify,
  onCancelRequest,
}: {
  order: Order;
  onAdvance: (id: string, s: OrderStatus) => void;
  onVerify: (id: string) => void;
  onCancelRequest: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const verified = !!o.paymentVerified;
  const completed = o.status === "completed";

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    // The menu is anchored to a rect captured at open time, so close it
    // rather than let it drift away from its row.
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom + 6, right: window.innerWidth - r.right });
    setOpen((v) => !v);
  };

  const item =
    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Change status for order ${orderRef(o.id)}`}
        className="flex h-9 shrink-0 items-center gap-1 rounded-xl bg-ink-900 px-2.5 text-[12px] font-bold text-white transition-all hover:bg-ink-700 active:scale-95 sm:px-3"
      >
        <span className="hidden sm:inline">{STATUS_LABEL[o.status]}</span>
        <ChevronDown className="h-4 w-4 shrink-0" />
      </button>

      {open &&
        pos &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[80]"
              onClick={() => setOpen(false)}
            />
            <div
              role="menu"
              style={{ top: pos.top, right: pos.right }}
              className="fixed z-[81] w-[216px] overflow-hidden rounded-2xl bg-white py-1 shadow-float ring-1 ring-cream-200"
            >
              {!verified && (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onVerify(o.id);
                    }}
                    className={cn(item, "text-emerald-700 hover:bg-emerald-50")}
                  >
                    <Check className="h-4 w-4 shrink-0" strokeWidth={3} />
                    Confirm payment
                  </button>
                  <p className="border-y border-cream-200 bg-cream-50 px-3 py-2 text-[11px] font-semibold leading-snug text-ink-400">
                    Confirm the transfer before moving this order along.
                  </p>
                </>
              )}

              {WORKFLOW.map((s) => {
                const current = s === o.status;
                return (
                  <button
                    key={s}
                    type="button"
                    role="menuitem"
                    disabled={!verified || current}
                    onClick={() => {
                      setOpen(false);
                      onAdvance(o.id, s);
                    }}
                    className={cn(
                      item,
                      current
                        ? "text-ink-900"
                        : "text-ink-600 hover:bg-cream-100 disabled:text-ink-300 disabled:hover:bg-transparent"
                    )}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0",
                        current ? "text-brand-600" : "opacity-0"
                      )}
                      strokeWidth={3}
                    />
                    {STATUS_LABEL[s]}
                  </button>
                );
              })}

              {!completed && (
                <>
                  <div className="my-1 border-t border-cream-200" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      onCancelRequest();
                    }}
                    className={cn(item, "text-red-600 hover:bg-red-50")}
                  >
                    <Ban className="h-4 w-4 shrink-0" />
                    Cancel order…
                  </button>
                </>
              )}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

/* ── Full order details (review before confirming payment) ──── */

function PaymentChip({ order: o, short }: { order: Order; short?: boolean }) {
  const [tint, label] = o.paymentVerified
    ? ["bg-emerald-100 text-emerald-800", "Paid"]
    : o.paymentConfirmed
      ? ["bg-amber-100 text-amber-800", short ? "Claimed" : "Transfer claimed"]
      : ["bg-cream-200 text-ink-500", "Unpaid"];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold",
        tint
      )}
    >
      <Banknote className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}

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
  initialCancel,
  onClose,
  onAdvance,
  onVerify,
  onCancel,
}: {
  order: Order | null;
  /** Open straight onto the cancellation note, e.g. from the row menu. */
  initialCancel?: boolean;
  onClose: () => void;
  onAdvance: (id: string, s: OrderStatus) => void;
  onVerify: (id: string) => void;
  onCancel: (id: string, reason: string) => void;
}) {
  useLockBody(!!o);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  /* Keyed on the id, not the object: a background refresh swaps in a new
     order object, and that must not wipe a half-typed cancellation note. */
  const orderId = o?.id ?? null;
  useEffect(() => {
    if (orderId) {
      setConfirmCancel(!!initialCancel);
    } else {
      setConfirmCancel(false);
      setCancelReason("");
    }
  }, [orderId, initialCancel]);

  const next = o ? NEXT[o.status] : undefined;
  const verified = !!o?.paymentVerified;
  const cancelled = o?.status === "cancelled";
  const closed = cancelled || o?.status === "completed";

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
              <PaymentChip order={o} />
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
              {cancelled ? (
                <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-200/70">
                  <p className="text-[12.5px] font-semibold leading-relaxed text-red-800">
                    This order was cancelled. It is not counted in revenue or
                    analytics.
                  </p>
                  {o.cancelNote && (
                    <p className="mt-2.5 text-[12px] font-medium leading-relaxed text-red-700 bg-white p-2.5 rounded-xl border border-red-100">
                      <strong>Cancellation Note:</strong> &quot;{o.cancelNote}&quot;
                    </p>
                  )}
                </div>
              ) : (
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
                      onClick={() => onVerify(o.id)}
                      className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-[12.5px] font-bold text-white transition-all hover:bg-emerald-500 active:scale-[0.98]"
                    >
                      <Check className="h-4 w-4" strokeWidth={3} />
                      I have confirmed payment
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex flex-col gap-3 border-t border-cream-200 bg-cream-50/95 px-5 py-3.5 pb-safe backdrop-blur">
              {confirmCancel && !closed ? (
                <div className="flex flex-col gap-2 w-full">
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-bold text-red-700">Cancel Reason (sent to customer)</p>
                    <button
                      type="button"
                      onClick={() => {
                        setConfirmCancel(false);
                        setCancelReason("");
                      }}
                      className="text-[11px] font-bold text-ink-400 hover:text-ink-600"
                    >
                      Dismiss
                    </button>
                  </div>
                  <textarea
                    placeholder="Provide a cancellation note for the customer..."
                    className="w-full min-h-[64px] rounded-xl bg-white p-2.5 text-[12.5px] font-medium text-ink-900 border border-cream-300 outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={!cancelReason.trim()}
                    onClick={() => {
                      onCancel(o.id, cancelReason.trim());
                      onClose();
                    }}
                    className={cn(
                      "flex h-10 w-full items-center justify-center gap-1.5 rounded-xl text-[12.5px] font-bold text-white transition-all",
                      cancelReason.trim()
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-ink-300 cursor-not-allowed"
                    )}
                  >
                    <Ban className="h-4 w-4" />
                    Confirm Cancellation
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  {o.phone && (
                    <a
                      href={`https://wa.me/${o.phone.replace(/\D/g, "").replace(/^0/, "234")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Chat with ${o.customerName} on WhatsApp`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-transform hover:scale-105 active:scale-95"
                    >
                      <WhatsAppIcon className="h-5 w-5" />
                    </a>
                  )}

                  {!closed && (
                    <button
                      type="button"
                      onClick={() => setConfirmCancel(true)}
                      className="flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-2xl bg-red-50 px-4 text-[12.5px] font-bold text-red-600 hover:bg-red-100"
                    >
                      <Ban className="h-4 w-4" />
                      Cancel
                    </button>
                  )}

                  {cancelled ? (
                    <span className="flex h-11 flex-1 items-center justify-center rounded-2xl bg-red-50 text-[12.5px] font-bold text-red-600">
                      Order cancelled
                    </span>
                  ) : next ? (
                    verified ? (
                      <button
                        type="button"
                        onClick={() => onAdvance(o.id, next.to)}
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
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

/**
 * One order per row. Secondary columns drop away as the viewport narrows;
 * everything they carried stays reachable through the details sheet, which
 * is also where cancelling (and its reason) lives.
 */
function OrderRow({
  order: o,
  onAdvance,
  onVerify,
  onDetails,
  onCancelRequest,
}: {
  order: Order;
  onAdvance: (id: string, s: OrderStatus) => void;
  onVerify: (id: string) => void;
  onDetails: () => void;
  onCancelRequest: () => void;
}) {
  const itemCount = o.lines.reduce((n, l) => n + l.qty, 0);
  // Past a week timeAgo() gives an absolute date, which would just repeat
  // the line above it in the Placed column.
  const relative = timeAgo(o.createdAt);
  const isRelative = /ago|just now|yesterday/.test(relative);

  const cell = "px-2.5 py-3 align-middle";

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="border-b border-cream-200/70 last:border-0 hover:bg-cream-50/60"
    >
      <td className={cn(cell, "px-3 sm:px-4")}>
        <button
          type="button"
          onClick={onDetails}
          className="block max-w-[136px] text-left sm:max-w-none"
        >
          <span className="flex items-center gap-1.5">
            <span className="truncate text-[13.5px] font-bold text-ink-900">
              {o.customerName}
            </span>
            {o.note && (
              <StickyNote
                aria-label="Has a kitchen note"
                className="h-3.5 w-3.5 shrink-0 text-amber-500"
              />
            )}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] font-semibold text-ink-400">
            <span className="font-display tracking-wide text-brand-600">
              {orderRef(o.id)}
            </span>
            <span className="flex items-center gap-1 capitalize">
              {o.method === "delivery" ? (
                <Bike className="h-3 w-3" />
              ) : (
                <Store className="h-3 w-3" />
              )}
              {o.method}
            </span>
            {/* Stand-ins for the columns hidden at this width */}
            <span className="md:hidden">{relative}</span>
            <span className="lg:hidden">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5 sm:hidden">
            <PaymentChip order={o} short />
            <StatusChip status={o.status} />
          </span>
        </button>
      </td>

      <td className={cn(cell, "hidden whitespace-nowrap md:table-cell")}>
        <span className="text-[12px] font-semibold text-ink-700">
          {shortDate(o.createdAt)}
        </span>
        {isRelative && (
          <span className="block text-[11px] font-medium text-ink-400">
            {relative}
          </span>
        )}
      </td>

      <td className={cn(cell, "hidden max-w-[210px] lg:table-cell")}>
        <span className="text-[12px] font-semibold text-ink-700">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
        <span className="block truncate text-[11px] font-medium text-ink-400">
          {o.lines.map((l) => `${l.qty}× ${l.name}`).join(", ")}
        </span>
      </td>

      <td className={cn(cell, "whitespace-nowrap text-right")}>
        <span className="font-display text-[14px] font-extrabold tabular-nums text-ink-900">
          {naira(o.total)}
        </span>
      </td>

      <td className={cn(cell, "hidden sm:table-cell")}>
        <PaymentChip order={o} short />
      </td>

      <td className={cn(cell, "hidden sm:table-cell")}>
        <StatusChip status={o.status} />
      </td>

      <td className={cn(cell, "px-3 sm:px-4")}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            aria-label={`View details for order ${orderRef(o.id)}`}
            onClick={onDetails}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-ink-500 transition-colors hover:text-brand-600"
          >
            <Eye className="h-4 w-4" />
          </button>

          {/* A cancelled order is terminal: the customer has been emailed. */}
          {o.status !== "cancelled" && (
            <StatusMenu
              order={o}
              onAdvance={onAdvance}
              onVerify={onVerify}
              onCancelRequest={onCancelRequest}
            />
          )}
        </div>
      </td>
    </motion.tr>
  );
}
