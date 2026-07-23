"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface Props {
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
  /** Optional summary like "showing 1–10 of 42". */
  total?: number;
  limit?: number;
  className?: string;
}

/** Compact window of page numbers around the current page. */
function windowed(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set<number>([1, totalPages, page, page - 1, page + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}

export default function Pagination({
  page,
  totalPages,
  onPage,
  total,
  limit,
  className,
}: Props) {
  if (totalPages <= 1) return null;

  const items = windowed(page, totalPages);
  const btn =
    "flex h-9 min-w-9 items-center justify-center rounded-xl px-2 text-[12.5px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer";

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "mt-5 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-between",
        className
      )}
    >
      {total != null && limit != null && (
        <p className="order-2 text-[12px] font-semibold text-ink-400 sm:order-1">
          {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
        </p>
      )}

      <div className="order-1 flex items-center gap-1.5 sm:order-2">
        <button
          type="button"
          aria-label="Previous page"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className={cn(btn, "bg-white text-ink-500 shadow-soft hover:text-ink-900")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {items.map((it, i) =>
          it === "…" ? (
            <span
              key={`gap-${i}`}
              className="flex h-9 min-w-6 items-center justify-center text-[12.5px] font-bold text-ink-300"
            >
              …
            </span>
          ) : (
            <button
              key={it}
              type="button"
              aria-label={`Page ${it}`}
              aria-current={it === page ? "page" : undefined}
              onClick={() => onPage(it)}
              className={cn(
                btn,
                it === page
                  ? "bg-ink-900 text-white shadow-card"
                  : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
              )}
            >
              {it}
            </button>
          )
        )}

        <button
          type="button"
          aria-label="Next page"
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className={cn(btn, "bg-white text-ink-500 shadow-soft hover:text-ink-900")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
