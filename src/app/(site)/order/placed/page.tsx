"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Check,
  FileDown,
  MailCheck,
  PackageSearch,
  UtensilsCrossed,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import { downloadReceipt } from "@/lib/receipt";
import { whatsappOrderUrlFromOrder } from "@/lib/whatsapp";
import { normalizeTrackingInput, orderRef } from "@/lib/format";
import { api } from "@/lib/api";
import { Order } from "@/lib/store";

export default function OrderPlacedPage() {
  const [refParam, setRefParam] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("id");
    if (p) {
      setRefParam(p);
      const suffix = normalizeTrackingInput(p);
      if (!suffix) {
        setLoading(false);
        return;
      }

      const fetchOrder = async () => {
        try {
          const { order } = await api.get<{ order: Order }>(
            `/api/orders/${suffix}`
          );
          setOrder(order);
        } catch (err) {
          console.error("Error fetching order:", err);
        } finally {
          setLoading(false);
        }
      };

      fetchOrder();
    } else {
      setLoading(false);
    }
  }, []);

  const handleDownload = async () => {
    if (!order || downloading) return;
    setDownloading(true);
    try {
      await downloadReceipt(order);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center px-6 py-20 text-center">
        <span className="flex h-10 w-10 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-[13px] font-semibold text-ink-500">
          Loading order details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto flex max-w-[480px] flex-col items-center px-6 py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-200 text-ink-400">
          <PackageSearch className="h-7 w-7" />
        </span>
        <h1 className="mt-4 font-display text-[20px] font-extrabold text-ink-900">
          Order not found
        </h1>
        <p className="mt-1.5 max-w-[300px] text-[13px] leading-relaxed text-ink-500">
          We couldn&apos;t find that order on this device. Check your tracking
          ID on the Track page.
        </p>
        <div className="mt-6 flex gap-2.5">
          <Link
            href="/track"
            className="flex h-11 items-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-[13.5px] font-bold text-white shadow-pink"
          >
            Track an order
          </Link>
          <Link
            href="/menu"
            className="flex h-11 items-center rounded-2xl bg-white px-6 text-[13.5px] font-bold text-ink-700 shadow-soft"
          >
            Menu
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] px-4 sm:px-6">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="mt-8 flex flex-col items-center rounded-[28px] bg-white px-6 py-10 text-center shadow-card"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.12 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pink-lg"
        >
          <Check className="h-9 w-9" strokeWidth={3} />
        </motion.span>

        <h1 className="mt-5 font-display text-[24px] font-extrabold tracking-tight text-ink-900">
          Order placed!
        </h1>

        <div className="mt-3 rounded-2xl bg-brand-100 px-5 py-2.5">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.1em] text-brand-700">
            Your tracking ID
          </p>
          <p className="font-display text-[22px] font-extrabold tracking-wide text-brand-800">
            {orderRef(order.id)}
          </p>
        </div>

        <p className="mt-3.5 flex items-center gap-1.5 text-[12px] font-semibold text-emerald-700">
          <MailCheck className="h-4 w-4" />
          The store has been notified of your order.
        </p>
        <p className="mt-2 max-w-[320px] text-[13px] leading-relaxed text-ink-500">
          Your receipt shows <span className="font-bold text-amber-600">Pending</span>{" "}
          until your transfer is confirmed, then it updates to{" "}
          <span className="font-bold text-emerald-600">Paid</span>. Track your
          order anytime with the ID above.
        </p>

        <div className="mt-6 grid w-full max-w-[340px] grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[13px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg active:scale-[0.98] disabled:opacity-60"
          >
            <FileDown className="h-4 w-4" />
            {downloading ? "Preparing…" : "Receipt"}
          </button>
          <Link
            href={`/track?id=${orderRef(order.id)}`}
            className="flex h-12 items-center justify-center gap-1.5 rounded-2xl bg-white text-[13px] font-bold text-ink-900 shadow-soft ring-1 ring-cream-300/70 transition-all hover:-translate-y-0.5 hover:shadow-card"
          >
            <PackageSearch className="h-4 w-4 text-brand-600" />
            Track order
          </Link>
          <a
            href={whatsappOrderUrlFromOrder(order)}
            target="_blank"
            rel="noopener noreferrer"
            className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[13.5px] font-bold text-white shadow-float transition-transform hover:scale-[1.01] active:scale-[0.98]"
          >
            <WhatsAppIcon className="h-5 w-5" />
            Notify us on WhatsApp
          </a>
        </div>

        <Link
          href="/menu"
          className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-600"
        >
          <UtensilsCrossed className="h-4 w-4" />
          Continue shopping
        </Link>
      </motion.div>
    </div>
  );
}
