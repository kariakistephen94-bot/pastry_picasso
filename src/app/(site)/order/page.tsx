"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ReceiptText } from "lucide-react";
import CartView from "@/components/cart/CartView";
import StatusChip from "@/components/StatusChip";
import Pagination from "@/components/Pagination";
import { useOrders } from "@/lib/store";
import { naira, orderRef, timeAgo } from "@/lib/format";

const PER_PAGE = 6;

export default function OrderPage() {
  const orders = useOrders((s) => s.orders);
  const [page, setPage] = useState(1);

  const mine = useMemo(() => orders.filter((o) => !o.sample), [orders]);
  const totalPages = Math.max(1, Math.ceil(mine.length / PER_PAGE));
  const myOrders = useMemo(
    () => mine.slice((page - 1) * PER_PAGE, page * PER_PAGE),
    [mine, page]
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

      {mine.length > 0 && (
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
                className="rounded-[20px] bg-white shadow-soft transition-shadow hover:shadow-card"
              >
                <Link href={`/track?id=${orderRef(o.id)}`} className="block p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-ink-900">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                        <ReceiptText className="h-4 w-4" />
                      </span>
                      {orderRef(o.id)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <StatusChip status={o.status} />
                      <ChevronRight className="h-4 w-4 text-ink-300" />
                    </span>
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
                </Link>
              </motion.div>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        </section>
      )}
    </div>
  );
}
