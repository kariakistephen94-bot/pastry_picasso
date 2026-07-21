"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  ChevronRight,
  Flame,
  ReceiptText,
  Timer,
} from "lucide-react";
import StatusChip from "@/components/StatusChip";
import { RevenueBars, TopItemsBars, type DayPoint } from "@/components/admin/charts";
import { useOrders } from "@/lib/store";
import { naira, orderRef, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

const DAY = 86_400_000;

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export default function AdminOverview() {
  const orders = useOrders((s) => s.orders);

  const stats = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * DAY;
    const twoWeeksAgo = now - 14 * DAY;

    const last7 = orders.filter((o) => o.createdAt >= weekAgo);
    const prev7 = orders.filter(
      (o) => o.createdAt >= twoWeeksAgo && o.createdAt < weekAgo
    );

    const revenue = last7.reduce((n, o) => n + o.total, 0);
    const prevRevenue = prev7.reduce((n, o) => n + o.total, 0);
    const avg = last7.length ? Math.round(revenue / last7.length) : 0;
    const pending = orders.filter(
      (o) => o.status === "new" || o.status === "preparing"
    ).length;

    const days: DayPoint[] = Array.from({ length: 7 }, (_, i) => {
      const dayStart = startOfDay(now - (6 - i) * DAY);
      const value = orders
        .filter((o) => o.createdAt >= dayStart && o.createdAt < dayStart + DAY)
        .reduce((n, o) => n + o.total, 0);
      return {
        label: new Date(dayStart).toLocaleDateString("en-NG", { weekday: "short" }),
        value,
        isToday: i === 6,
      };
    });

    const itemMap = new Map<string, number>();
    for (const o of last7) {
      for (const l of o.lines) {
        itemMap.set(l.name, (itemMap.get(l.name) ?? 0) + l.qty);
      }
    }
    const topItems = [...itemMap.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const revDelta =
      prevRevenue > 0
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
        : null;
    const orderDelta =
      prev7.length > 0
        ? Math.round(((last7.length - prev7.length) / prev7.length) * 100)
        : null;

    return {
      revenue,
      revDelta,
      orders7: last7.length,
      orderDelta,
      avg,
      pending,
      days,
      topItems,
    };
  }, [orders]);

  const cards = [
    {
      icon: Banknote,
      tint: "bg-brand-100 text-brand-700",
      label: "Revenue · 7 days",
      value: naira(stats.revenue),
      delta: stats.revDelta,
    },
    {
      icon: ReceiptText,
      tint: "bg-blue-50 text-blue-600",
      label: "Orders · 7 days",
      value: String(stats.orders7),
      delta: stats.orderDelta,
    },
    {
      icon: Flame,
      tint: "bg-amber-50 text-amber-600",
      label: "Avg order value",
      value: naira(stats.avg),
      delta: null,
    },
    {
      icon: Timer,
      tint: "bg-emerald-50 text-emerald-600",
      label: "Open orders",
      value: String(stats.pending),
      delta: null,
    },
  ];

  const recent = orders.slice(0, 6);

  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="mb-5 lg:mb-7">
        <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
          Overview
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500">
          {new Date().toLocaleDateString("en-NG", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}{" "}
          · here&apos;s how the kitchen is doing.
        </p>
      </header>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {cards.map(({ icon: Icon, tint, label, value, delta }) => (
          <div key={label} className="rounded-[22px] bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", tint)}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              {delta !== null && (
                <span
                  className={cn(
                    "flex items-center gap-0.5 rounded-full px-2 py-1 text-[10.5px] font-bold",
                    delta >= 0
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  )}
                >
                  {delta >= 0 ? (
                    <ArrowUpRight className="h-3 w-3" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3" />
                  )}
                  {Math.abs(delta)}%
                </span>
              )}
            </div>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              {label}
            </p>
            <p className="mt-0.5 font-display text-[20px] font-extrabold tabular-nums tracking-tight text-ink-900 lg:text-[22px]">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[24px] bg-white p-5 shadow-soft">
          <div className="mb-5 flex items-baseline justify-between">
            <h2 className="font-display text-[15.5px] font-extrabold text-ink-900">
              Revenue · last 7 days
            </h2>
            <span className="text-[11.5px] font-bold text-ink-400">
              incl. open orders
            </span>
          </div>
          <RevenueBars days={stats.days} />
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-soft">
          <h2 className="mb-5 font-display text-[15.5px] font-extrabold text-ink-900">
            Top sellers · 7 days
          </h2>
          <TopItemsBars items={stats.topItems} />
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-4 rounded-[24px] bg-white p-5 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-[15.5px] font-extrabold text-ink-900">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-0.5 text-[12.5px] font-bold text-brand-600 hover:text-brand-700"
          >
            All orders <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] font-semibold text-ink-400">
            Orders placed in the app will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {recent.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-bold text-ink-900">
                    {o.customerName}
                    <span className="font-semibold text-ink-400">
                      {orderRef(o.id)}
                    </span>
                    {o.sample && (
                      <span className="rounded-full bg-cream-200 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-500">
                        Sample
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-[12px] font-medium text-ink-500">
                    {o.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <StatusChip status={o.status} />
                  <span className="text-[11px] font-semibold text-ink-400">
                    {timeAgo(o.createdAt)} · {naira(o.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
