"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { ReceiptText } from "lucide-react";
import CartView from "@/components/cart/CartView";
import StatusChip from "@/components/StatusChip";
import { useOrders } from "@/lib/store";
import { naira, orderRef, timeAgo } from "@/lib/format";

export default function OrderPage() {
  const orders = useOrders((s) => s.orders);
  const myOrders = useMemo(
    () => orders.filter((o) => !o.sample).slice(0, 12),
    [orders]
  );

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Your Order
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Review your cart and checkout on WhatsApp.
        </p>
      </header>

      <div className="mt-5">
        <CartView variant="page" />
      </div>

      {myOrders.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3.5 font-display text-[18px] font-extrabold tracking-tight text-ink-900">
            Recent orders
          </h2>
          <div className="flex flex-col gap-2.5">
            {myOrders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: Math.min(i * 0.04, 0.2) }}
                className="rounded-[20px] bg-white p-4 shadow-soft"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      <ReceiptText className="h-4 w-4" />
                    </span>
                    Order {orderRef(o.id)}
                  </span>
                  <StatusChip status={o.status} />
                </div>
                <p className="mt-2.5 line-clamp-1 text-[12.5px] font-medium text-ink-500">
                  {o.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}
                </p>
                <div className="mt-2 flex items-center justify-between text-[12px] font-semibold text-ink-400">
                  <span className="capitalize">
                    {o.method} · {timeAgo(o.createdAt)}
                  </span>
                  <span className="text-[13.5px] font-extrabold text-ink-900">
                    {naira(o.total)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
