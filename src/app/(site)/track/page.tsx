"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  FileDown,
  PackageSearch,
  Search,
} from "lucide-react";
import StatusChip from "@/components/StatusChip";
import { WhatsAppIcon } from "@/components/icons";
import { useOrders, type Order } from "@/lib/store";
import { downloadReceipt } from "@/lib/receipt";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { naira, normalizeTrackingInput, orderRef, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

function buildSteps(order: Order) {
  const s = order.status;
  const verified = !!order.paymentVerified;
  return [
    {
      key: "placed",
      label: "Order placed",
      desc: `Submitted ${timeAgo(order.createdAt)}`,
      done: true,
    },
    {
      key: "payment",
      label: verified ? "Payment confirmed" : "Payment pending",
      desc: verified
        ? "Your transfer has been confirmed"
        : "We're confirming your transfer",
      done: verified,
    },
    {
      key: "preparing",
      label: "Preparing your order",
      desc: "Made fresh in our kitchen",
      done: ["preparing", "ready", "completed"].includes(s),
    },
    {
      key: "ready",
      label: order.method === "delivery" ? "Out for delivery" : "Ready for pickup",
      desc:
        order.method === "delivery"
          ? "On its way to you"
          : "Waiting for you in Egbeda",
      done: ["ready", "completed"].includes(s),
    },
    {
      key: "completed",
      label: "Completed",
      desc: "Enjoy! Tag us @the_pastrypicasso",
      done: s === "completed",
    },
  ];
}

export default function TrackPage() {
  const orders = useOrders((s) => s.orders);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const myOrders = useMemo(
    () => orders.filter((o) => !o.sample).slice(0, 8),
    [orders]
  );

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === activeId) ?? null,
    [orders, activeId]
  );

  /* Deep link: /track?id=TPP-XXXXX */
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("id");
    if (param) setQuery(param.toUpperCase());
  }, []);

  /* Auto-select the most recent order when nothing is searched. */
  useEffect(() => {
    if (!activeId && !query && myOrders.length > 0) setActiveId(myOrders[0].id);
  }, [activeId, query, myOrders]);

  const lookup = (raw?: string) => {
    const suffix = normalizeTrackingInput(raw ?? query);
    if (!suffix) return;
    const found = orders.find(
      (o) => !o.sample && o.id.toUpperCase().endsWith(suffix)
    );
    if (found) {
      setActiveId(found.id);
      setNotFound(false);
    } else {
      setActiveId(null);
      setNotFound(true);
    }
  };

  /* Run lookup automatically once orders hydrate and a deep link exists. */
  useEffect(() => {
    if (query && !activeId) lookup(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.length]);

  const handleDownload = async () => {
    if (!activeOrder || downloading) return;
    setDownloading(true);
    try {
      await downloadReceipt(activeOrder);
    } finally {
      setDownloading(false);
    }
  };

  const steps = activeOrder ? buildSteps(activeOrder) : [];
  const currentIdx = steps.findIndex((st) => !st.done);

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Track your order
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Enter your tracking ID from checkout or WhatsApp.
        </p>
      </header>

      {/* Search */}
      <div className="mt-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value.toUpperCase());
              setNotFound(false);
            }}
            onKeyDown={(e) => e.key === "Enter" && lookup()}
            placeholder="e.g. TPP-K3F9A"
            className="h-12 w-full rounded-2xl bg-white pl-11 pr-4 font-display text-[14px] font-bold tracking-wide text-ink-900 shadow-soft outline-none ring-1 ring-transparent transition placeholder:font-sans placeholder:font-medium placeholder:text-ink-300 focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <button
          type="button"
          onClick={() => lookup()}
          className="h-12 shrink-0 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-[13.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-95"
        >
          Track
        </button>
      </div>

      {notFound && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-[20px] bg-white p-5 text-center shadow-soft"
        >
          <p className="text-[14px] font-bold text-ink-900">
            We couldn&apos;t find that order here
          </p>
          <p className="mx-auto mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-ink-500">
            Tracking works on the device the order was placed on. Check the ID,
            or message us on WhatsApp and we&apos;ll look it up.
          </p>
          <a
            href={whatsappChatUrl(`Hello! I'd like to check on my order ${query}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-2xl bg-[#25D366] px-5 text-[13px] font-bold text-white"
          >
            <WhatsAppIcon className="h-4 w-4" />
            Ask on WhatsApp
          </a>
        </motion.div>
      )}

      {/* ── Active order card ─────────────────────────────────── */}
      {activeOrder && (
        <motion.section
          key={activeOrder.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 overflow-hidden rounded-[26px] bg-white shadow-soft"
        >
          <div className="flex flex-wrap items-center gap-2 border-b border-cream-200 px-5 py-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <PackageSearch className="h-5 w-5" />
            </span>
            <div className="mr-auto">
              <p className="font-display text-[16px] font-extrabold tracking-wide text-ink-900">
                {orderRef(activeOrder.id)}
              </p>
              <p className="text-[11.5px] font-semibold capitalize text-ink-500">
                {activeOrder.method} · {timeAgo(activeOrder.createdAt)}
              </p>
            </div>
            <StatusChip status={activeOrder.status} />
          </div>

          {/* Timeline */}
          <div className="px-5 py-5">
            <ol className="relative">
              {steps.map((st, i) => {
                const isCurrent = i === currentIdx;
                const isLast = i === steps.length - 1;
                return (
                  <motion.li
                    key={st.key}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative flex gap-3.5 pb-6 last:pb-0"
                  >
                    {!isLast && (
                      <span
                        className={cn(
                          "absolute left-[13px] top-7 h-[calc(100%-24px)] w-0.5 rounded-full",
                          st.done ? "bg-brand-400" : "bg-cream-200"
                        )}
                      />
                    )}
                    <span
                      className={cn(
                        "relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        st.done
                          ? "bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pink"
                          : isCurrent
                            ? "bg-white text-brand-600 ring-2 ring-brand-400"
                            : "bg-cream-200 text-ink-300"
                      )}
                    >
                      {st.done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      ) : (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            isCurrent ? "animate-pulse bg-brand-500" : "bg-ink-300"
                          )}
                        />
                      )}
                    </span>
                    <div className="pt-0.5">
                      <p
                        className={cn(
                          "text-[13.5px] font-bold",
                          st.done || isCurrent ? "text-ink-900" : "text-ink-400"
                        )}
                      >
                        {st.label}
                      </p>
                      <p className="text-[12px] font-medium text-ink-400">
                        {st.desc}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {/* Items */}
          <div className="mx-5 rounded-2xl bg-cream-100 px-4 py-3">
            {activeOrder.lines.map((l) => (
              <div
                key={l.name}
                className="flex items-center justify-between py-1 text-[12.5px] font-semibold text-ink-700"
              >
                <span className="line-clamp-1">
                  {l.qty}× {l.name}
                </span>
                <span className="tabular-nums text-ink-500">
                  {naira(l.price * l.qty)}
                </span>
              </div>
            ))}
            <div className="mt-1.5 flex items-center justify-between border-t border-cream-300/60 pt-2">
              <span className="text-[13px] font-bold text-ink-900">Total</span>
              <span className="font-display text-[15px] font-extrabold tabular-nums text-ink-900">
                {naira(activeOrder.total)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 p-5">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[13.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-[0.98] disabled:opacity-60"
            >
              <FileDown className="h-[18px] w-[18px]" />
              {downloading
                ? "Preparing receipt…"
                : `Receipt (${activeOrder.paymentVerified ? "Paid" : "Pending"})`}
            </button>
            <a
              href={whatsappChatUrl(
                `Hello! I'm checking on my order ${orderRef(activeOrder.id)}.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ask about this order on WhatsApp"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-float transition-transform hover:scale-105 active:scale-95"
            >
              <WhatsAppIcon className="h-5 w-5" />
            </a>
          </div>
        </motion.section>
      )}

      {/* ── Recent orders on this device ──────────────────────── */}
      {myOrders.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 font-display text-[17px] font-extrabold tracking-tight text-ink-900">
            Orders on this device
          </h2>
          <div className="flex flex-col gap-2">
            {myOrders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => {
                  setActiveId(o.id);
                  setNotFound(false);
                  setQuery(orderRef(o.id));
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "flex items-center gap-3 rounded-[18px] bg-white p-3.5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card",
                  o.id === activeId && "ring-2 ring-brand-400"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[13.5px] font-extrabold tracking-wide text-ink-900">
                    {orderRef(o.id)}
                  </p>
                  <p className="line-clamp-1 text-[11.5px] font-medium text-ink-500">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}
                  </p>
                </div>
                <span className="text-[12px] font-bold tabular-nums text-ink-500">
                  {naira(o.total)}
                </span>
                <StatusChip status={o.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-ink-300" />
              </button>
            ))}
          </div>
        </section>
      ) : (
        !activeOrder &&
        !notFound && (
          <div className="mt-8 flex flex-col items-center px-6 py-10 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-100 text-brand-600">
              <PackageSearch className="h-7 w-7" />
            </span>
            <h2 className="mt-4 font-display text-[17px] font-extrabold text-ink-900">
              No orders to track yet
            </h2>
            <p className="mt-1 max-w-[260px] text-[13px] leading-relaxed text-ink-500">
              Place an order and your tracking ID will appear here
              automatically.
            </p>
            <Link
              href="/menu"
              className="mt-5 flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-[13.5px] font-bold text-white shadow-pink"
            >
              Explore Menu
            </Link>
          </div>
        )
      )}
    </div>
  );
}
