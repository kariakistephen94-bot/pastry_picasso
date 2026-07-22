"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { useReviews } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/cn";

export function Stars({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < rating ? "fill-brand-500 text-brand-500" : "fill-cream-200 text-cream-200"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsBlock() {
  const reviews = useReviews((s) => s.reviews);
  const visible = useMemo(
    () => reviews.filter((r) => r.visible).slice(0, 8),
    [reviews]
  );

  if (visible.length === 0) return null;

  return (
    <section>
      <SectionHeader
        title="Sweet words from Lagos"
        sub="Real reviews from our customers"
      />
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-2 lg:gap-4 lg:overflow-visible lg:px-0">
        {visible.map((r, i) => (
          <motion.figure
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(i * 0.05, 0.25) }}
            className="flex w-[290px] shrink-0 snap-start flex-col rounded-[24px] bg-white p-5 shadow-soft lg:w-auto"
          >
            <Stars rating={r.rating} />
            <blockquote className="mt-3 flex-1 text-[13px] leading-relaxed text-ink-700">
              “{r.text}”
            </blockquote>
            <figcaption className="mt-4 flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-[13px] font-extrabold text-white">
                {r.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-bold text-ink-900">
                  {r.name}
                </span>
                <span className="block text-[11px] font-semibold text-ink-400">
                  via {r.source} · {timeAgo(r.date)}
                </span>
              </span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
