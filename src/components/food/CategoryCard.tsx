"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import FoodImage from "@/components/FoodImage";
import type { Category } from "@/lib/data";

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
        className="group block active:scale-95 transition-transform duration-200"
      >
        <div className="relative overflow-hidden rounded-[22px] shadow-soft">
          <FoodImage
            src={category.image}
            alt={category.label}
            position={category.position}
            zoom={category.zoom}
            sizes={size === "sm" ? "(max-width: 1024px) 112px, 260px" : "(max-width: 1024px) 45vw, 260px"}
            className={
              size === "sm"
                ? "aspect-square w-full lg:aspect-[5/4]"
                : "aspect-[5/4] w-full"
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 via-ink-950/10 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 p-3">
            <span className="truncate text-[12.5px] font-bold text-white drop-shadow-sm lg:text-[14px]">
              {category.label}
            </span>
            <span className="text-[13px] lg:text-[15px]" aria-hidden>
              {category.emoji}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
