"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Category } from "@/lib/data";
import { cn } from "@/lib/cn";

/* Soft brand tints rotated across tiles so the rail feels alive
   without reusing any food photography. */
const TINTS = [
  "from-brand-100 to-brand-50",
  "from-amber-100 to-cream-100",
  "from-rose-100 to-brand-50",
  "from-orange-100 to-cream-100",
];

export default function CategoryCard({
  category,
  index = 0,
  size = "md",
}: {
  category: Category;
  index?: number;
  size?: "sm" | "md";
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.3) }}
      className={size === "sm" ? "w-[124px] shrink-0 snap-start lg:w-auto" : ""}
    >
      <Link
        href={`/menu#${category.id}`}
        className="group block transition-transform duration-200 active:scale-95"
      >
        <div
          className={cn(
            "relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-[22px] bg-gradient-to-br shadow-soft ring-1 ring-white/60 transition-shadow duration-300 group-hover:shadow-card",
            TINTS[index % TINTS.length],
            size === "sm"
              ? "aspect-square w-full lg:aspect-[5/4]"
              : "aspect-[5/4] w-full"
          )}
        >
          <span
            aria-hidden
            className="text-[34px] transition-transform duration-300 group-hover:scale-110 lg:text-[40px]"
          >
            {category.emoji}
          </span>
          <span className="px-2 text-center text-[12px] font-bold tracking-tight text-ink-900 lg:text-[13.5px]">
            {category.label}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
