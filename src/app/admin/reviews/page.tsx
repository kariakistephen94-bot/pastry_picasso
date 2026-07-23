"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Eye, EyeOff, Link2, Trash2 } from "lucide-react";
import { Stars } from "@/components/blocks/ReviewsBlock";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import type { Review } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

const FILTERS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "visible", label: "On website" },
  { id: "hidden", label: "Hidden" },
];

const SORTS: { id: string; label: string }[] = [
  { id: "recent", label: "Newest first" },
  { id: "oldest", label: "Oldest first" },
  { id: "rating_high", label: "Highest rated" },
  { id: "rating_low", label: "Lowest rated" },
];

const PAGE_SIZE = 10;

export default function AdminReviews() {
  const showToast = useUI((s) => s.showToast);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [counts, setCounts] = useState({ all: 0, visible: 0, hidden: 0 });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await api.get<{
          data: Review[];
          total: number;
          totalPages: number;
          counts: { all: number; visible: number; hidden: number };
        }>(
          `/api/admin/reviews?page=${page}&limit=${PAGE_SIZE}&filter=${filter}&sort=${sort}`,
          { auth: true }
        );
        setReviews(res.data);
        setTotal(res.total);
        setTotalPages(res.totalPages);
        setCounts(res.counts);
      } catch (err) {
        console.error("Failed to load reviews:", err);
      } finally {
        setLoading(false);
      }
    },
    [page, filter, sort]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  const toggleVisible = async (r: Review) => {
    const next = !r.visible;
    setReviews((prev) =>
      prev.map((x) => (x.id === r.id ? { ...x, visible: next } : x))
    );
    showToast(next ? "Now showing on the website" : "Hidden from the website");
    try {
      await api.patch(`/api/admin/reviews/${r.id}`, { visible: next }, { auth: true });
    } catch (err) {
      console.error("Failed to toggle review:", err);
    }
    load(true);
  };

  const removeReview = async (id: string) => {
    setReviews((prev) => prev.filter((x) => x.id !== id));
    setConfirmDelete(null);
    showToast("Review deleted");
    try {
      await api.del(`/api/admin/reviews/${id}`, { auth: true });
    } catch (err) {
      console.error("Failed to delete review:", err);
    }
    load(true);
  };

  const copyReviewLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/review`);
      showToast("Review link copied. Send it to your customer.");
    } catch {
      showToast("Could not copy on this browser");
    }
  };

  const copyReview = async (r: Review) => {
    try {
      await navigator.clipboard.writeText(
        `"${r.text}" - ${r.name}, via ${r.source} (${r.rating}/5)`
      );
      showToast("Review copied");
    } catch {
      showToast("Could not copy on this browser");
    }
  };

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
            Reviews
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-ink-500">
            {counts.visible} of {counts.all} showing on the website.
          </p>
        </div>
        <button
          type="button"
          onClick={copyReviewLink}
          className="flex h-11 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 text-[13px] font-bold text-white shadow-pink transition-all hover:shadow-pink-lg active:scale-95"
        >
          <Link2 className="h-4 w-4" />
          Copy review link
        </button>
      </header>

      <div className="mb-4 rounded-[20px] bg-brand-50 p-4 ring-1 ring-brand-100">
        <p className="text-[12.5px] font-semibold leading-relaxed text-brand-800">
          Send the review link to customers on WhatsApp after their order.
          They drop their review themselves, it lands here as Hidden, and you
          decide what shows on the website.
        </p>
      </div>

      {/* Filters + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="no-scrollbar -mx-4 flex flex-1 gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const n =
              f.id === "all" ? counts.all : f.id === "visible" ? counts.visible : counts.hidden;
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
                  {n}
                </span>
              </button>
            );
          })}
        </div>
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
      </div>

      {/* List */}
      {loading && reviews.length === 0 ? (
        <p className="animate-pulse py-12 text-center text-[13px] font-semibold text-ink-400">
          Loading reviews…
        </p>
      ) : reviews.length === 0 ? (
        <p className="py-12 text-center text-[13px] font-semibold text-ink-400">
          No reviews here yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {reviews.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className={cn(
                  "rounded-[24px] bg-white p-4 shadow-soft transition-opacity sm:p-5",
                  !r.visible && "opacity-60"
                )}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div className="mr-auto min-w-0">
                    <p className="truncate text-[13.5px] font-bold text-ink-900">
                      {r.name}
                    </p>
                    <p className="text-[11px] font-semibold text-ink-400">
                      via {r.source} · {timeAgo(r.date)}
                    </p>
                  </div>
                  <Stars rating={r.rating} size="sm" />
                </div>

                <p className="mt-3 text-[13px] leading-relaxed text-ink-700">
                  “{r.text}”
                </p>

                <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-cream-200 pt-3.5">
                  <button
                    type="button"
                    role="switch"
                    aria-checked={r.visible}
                    onClick={() => toggleVisible(r)}
                    className={cn(
                      "flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-[12px] font-bold transition-colors",
                      r.visible
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-cream-200 text-ink-500"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-6 w-10 items-center rounded-full p-0.5 transition-colors",
                        r.visible ? "bg-emerald-500" : "bg-ink-300"
                      )}
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 32 }}
                        className={cn(
                          "h-5 w-5 rounded-full bg-white shadow-soft",
                          r.visible && "ml-auto"
                        )}
                      />
                    </span>
                    {r.visible ? (
                      <span className="flex items-center gap-1">
                        <Eye className="h-3.5 w-3.5" /> On website
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <EyeOff className="h-3.5 w-3.5" /> Hidden
                      </span>
                    )}
                  </button>

                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyReview(r)}
                      className="flex h-9 items-center gap-1.5 rounded-xl bg-cream-100 px-3 text-[12px] font-bold text-ink-700 transition-colors hover:text-brand-600"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                    {confirmDelete === r.id ? (
                      <button
                        type="button"
                        onClick={() => removeReview(r.id)}
                        className="flex h-9 items-center gap-1.5 rounded-xl bg-red-600 px-3 text-[12px] font-bold text-white"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Confirm delete
                      </button>
                    ) : (
                      <button
                        type="button"
                        aria-label="Delete review"
                        onClick={() => {
                          setConfirmDelete(r.id);
                          setTimeout(
                            () => setConfirmDelete((c) => (c === r.id ? null : c)),
                            2500
                          );
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-cream-100 text-ink-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        limit={PAGE_SIZE}
        onPage={setPage}
      />

      <p className="mt-6 text-center text-[12px] font-medium text-ink-400">
        Visible reviews appear in the &quot;Sweet words from Lagos&quot; section
        on the home page.
      </p>
    </div>
  );
}
