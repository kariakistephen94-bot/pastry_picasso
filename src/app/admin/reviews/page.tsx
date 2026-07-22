"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, Eye, EyeOff, Link2, Trash2 } from "lucide-react";
import { Stars } from "@/components/blocks/ReviewsBlock";
import { useReviews } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function AdminReviews() {
  const reviews = useReviews((s) => s.reviews);
  const toggleVisible = useReviews((s) => s.toggleVisible);
  const removeReview = useReviews((s) => s.removeReview);
  const showToast = useUI((s) => s.showToast);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const visibleCount = useMemo(
    () => reviews.filter((r) => r.visible).length,
    [reviews]
  );

  const copyReviewLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/review`);
      showToast("Review link copied. Send it to your customer.");
    } catch {
      showToast("Could not copy on this browser");
    }
  };

  const copyReview = async (id: string) => {
    const r = reviews.find((x) => x.id === id);
    if (!r) return;
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
            {visibleCount} of {reviews.length} showing on the website.
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

      {/* List */}
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
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[13px] font-extrabold text-white">
                  {r.name.charAt(0).toUpperCase()}
                </span>
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
                {/* Visibility toggle */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={r.visible}
                  onClick={() => {
                    toggleVisible(r.id);
                    showToast(
                      r.visible ? "Hidden from the website" : "Now showing on the website"
                    );
                  }}
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
                    onClick={() => copyReview(r.id)}
                    className="flex h-9 items-center gap-1.5 rounded-xl bg-cream-100 px-3 text-[12px] font-bold text-ink-700 transition-colors hover:text-brand-600"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                  {confirmDelete === r.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        removeReview(r.id);
                        setConfirmDelete(null);
                        showToast("Review deleted");
                      }}
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

      <p className="mt-6 text-center text-[12px] font-medium text-ink-400">
        Visible reviews appear in the &quot;Sweet words from Lagos&quot; section
        on the home page.
      </p>
    </div>
  );
}
