"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { RevenueBars, TopItemsBars, type DayPoint, type ItemStat } from "@/components/admin/charts";
import { api } from "@/lib/api";
import type { Order } from "@/lib/store";
import { naira, orderRef, timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

type Range = "7d" | "30d" | "3m" | "1y";

const RANGES: { id: Range; label: string; short: string }[] = [
  { id: "7d", label: "7 days", short: "7 days" },
  { id: "30d", label: "30 days", short: "30 days" },
  { id: "3m", label: "3 months", short: "3 months" },
  { id: "1y", label: "1 year", short: "12 months" },
];

interface Stats {
  rangeLabel: string;
  kpis: {
    revenue: number;
    revDelta: number | null;
    orders: number;
    orderDelta: number | null;
    avg: number;
    pending: number;
  };
  series: DayPoint[];
  topItems: ItemStat[];
  recent: Order[];
}

export default function AdminOverview() {
  const [range, setRange] = useState<Range>("7d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: Range) => {
    setLoading(true);
    try {
      const data = await api.get<Stats>(`/api/admin/stats?range=${r}`, { auth: true });
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(range);
  }, [range, load]);

  const short = RANGES.find((r) => r.id === range)?.short ?? "";
  const k = stats?.kpis;

  const cards = [
    {
      icon: Banknote,
      tint: "bg-brand-100 text-brand-700",
      label: `Revenue · ${short}`,
      value: naira(k?.revenue ?? 0),
      delta: k?.revDelta ?? null,
    },
    {
      icon: ReceiptText,
      tint: "bg-blue-50 text-blue-600",
      label: `Orders · ${short}`,
      value: String(k?.orders ?? 0),
      delta: k?.orderDelta ?? null,
    },
    {
      icon: Flame,
      tint: "bg-amber-50 text-amber-600",
      label: "Avg order value",
      value: naira(k?.avg ?? 0),
      delta: null,
    },
    {
      icon: Timer,
      tint: "bg-emerald-50 text-emerald-600",
      label: "Open orders",
      value: String(k?.pending ?? 0),
      delta: null,
    },
  ];

  return (
    <div className="mx-auto max-w-[1080px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3 lg:mb-7">
        <div>
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
        </div>

        {/* Range selector */}
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-2xl bg-white p-1 shadow-soft">
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRange(r.id)}
              className={cn(
                "shrink-0 rounded-xl px-3.5 py-2 text-[12.5px] font-bold transition-colors cursor-pointer",
                range === r.id
                  ? "bg-ink-900 text-white shadow-card"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stat cards */}
      <div className={cn("grid grid-cols-2 gap-3 xl:grid-cols-4", loading && "opacity-60")}>
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
              Revenue · {stats?.rangeLabel ?? short}
            </h2>
            <span className="text-[11.5px] font-bold text-ink-400">
              incl. open orders
            </span>
          </div>
          <RevenueBars days={stats?.series ?? []} />
        </div>

        <div className="rounded-[24px] bg-white p-5 shadow-soft">
          <h2 className="mb-5 font-display text-[15.5px] font-extrabold text-ink-900">
            Top sellers · {short}
          </h2>
          <TopItemsBars items={stats?.topItems ?? []} />
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
        {!stats?.recent.length ? (
          <p className="py-8 text-center text-[12.5px] font-semibold text-ink-400">
            {loading ? "Loading…" : "Orders placed in the app will appear here."}
          </p>
        ) : (
          <ul className="divide-y divide-cream-200">
            {stats.recent.map((o) => (
              <li key={o.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-x-2 text-[13px] font-bold text-ink-900">
                    {o.customerName}
                    <span className="font-semibold text-ink-400">
                      {orderRef(o.id)}
                    </span>
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
