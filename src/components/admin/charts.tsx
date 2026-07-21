"use client";

import { motion } from "framer-motion";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

/* Single-series brand hue per the palette validation: solid #d6187c marks,
   darker emphasis for "today", labels always in ink tokens. */

export interface DayPoint {
  label: string;
  value: number;
  isToday?: boolean;
}

export function RevenueBars({ days }: { days: DayPoint[] }) {
  const max = Math.max(...days.map((d) => d.value), 1);
  const maxIdx = days.findIndex((d) => d.value === max);
  const empty = days.every((d) => d.value === 0);

  return (
    <div
      role="img"
      aria-label={`Revenue for the last 7 days: ${days
        .map((d) => `${d.label} ${naira(d.value)}`)
        .join(", ")}`}
    >
      <div className="relative h-40">
        {/* recessive grid */}
        <div aria-hidden className="absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-t border-ink-900/[0.05]" />
          ))}
          <div className="border-t border-ink-900/10" />
        </div>

        {empty ? (
          <div className="absolute inset-0 flex items-center justify-center text-[12.5px] font-semibold text-ink-400">
            No sales recorded this week yet
          </div>
        ) : (
          <div className="absolute inset-0 flex items-end gap-2 sm:gap-3">
            {days.map((d, i) => {
              const h = Math.max((d.value / max) * 100, d.value > 0 ? 4 : 1.5);
              const showLabel = (i === maxIdx && d.value > 0) || d.isToday;
              return (
                <div
                  key={d.label + i}
                  className="group relative flex h-full flex-1 items-end justify-center"
                >
                  {/* hover tooltip */}
                  <span className="pointer-events-none absolute -top-1 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink-900 px-2 py-1 text-[10.5px] font-bold text-white shadow-card group-hover:block">
                    {d.label} · {naira(d.value)}
                  </span>
                  {/* persistent selective label */}
                  {showLabel && d.value > 0 && (
                    <span
                      className="pointer-events-none absolute z-[5] whitespace-nowrap text-[10px] font-bold tabular-nums text-ink-700 group-hover:opacity-0"
                      style={{ bottom: `calc(${h}% + 5px)` }}
                    >
                      {naira(d.value)}
                    </span>
                  )}
                  <motion.div
                    initial={{ height: 0 }}
                    whileInView={{ height: `${h}%` }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.7,
                      delay: i * 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={cn(
                      "w-full max-w-9 rounded-t-[4px] transition-colors",
                      d.isToday
                        ? "bg-[#b80f66]"
                        : "bg-[#d6187c] group-hover:bg-[#b80f66]"
                    )}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div aria-hidden className="mt-2 flex gap-2 sm:gap-3">
        {days.map((d, i) => (
          <span
            key={d.label + i}
            className={cn(
              "flex-1 text-center text-[10.5px] font-semibold",
              d.isToday ? "text-ink-900" : "text-ink-400"
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export interface ItemStat {
  name: string;
  qty: number;
}

export function TopItemsBars({ items }: { items: ItemStat[] }) {
  const max = Math.max(...items.map((i) => i.qty), 1);

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-[12.5px] font-semibold text-ink-400">
        No items sold this week yet
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3.5">
      {items.map((item, i) => (
        <li key={item.name}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <span className="truncate text-[12.5px] font-semibold text-ink-900">
              {item.name}
            </span>
            <span className="shrink-0 text-[11.5px] font-bold tabular-nums text-ink-500">
              {item.qty} sold
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-cream-200">
            <motion.div
              initial={{ width: 0 }}
              whileInView={{ width: `${(item.qty / max) * 100}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="h-full rounded-full bg-[#d6187c]"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
