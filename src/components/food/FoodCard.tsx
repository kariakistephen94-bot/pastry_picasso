"use client";

import { motion } from "framer-motion";
import { Plus, Sparkles, Star } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import type { MenuItem } from "@/lib/data";
import { useCart } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

interface FoodCardProps {
  item: MenuItem;
  variant?: "grid" | "row";
  index?: number;
}

export default function FoodCard({ item, variant = "grid", index = 0 }: FoodCardProps) {
  const add = useCart((s) => s.add);
  const openItem = useUI((s) => s.openItem);
  const openExtras = useUI((s) => s.openExtras);
  const showToast = useUI((s) => s.showToast);

  const soldOut = item.available === false;
  const hasExtras = (item.extras?.length ?? 0) > 0;
  const rating = item.rating ?? 5;

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soldOut) return;
    if (hasExtras) {
      openExtras(item);
      return;
    }
    add(item);
    showToast("Added to your order");
  };

  if (variant === "row") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.04, 0.2) }}
        onClick={() => openItem(item)}
        className={cn(
          "group flex cursor-pointer items-center gap-3.5 rounded-[22px] bg-white p-3 shadow-soft transition-all duration-300 hover:shadow-card active:scale-[0.985]",
          soldOut && "opacity-60"
        )}
      >
        <FoodImage
          src={item.image}
          alt={item.name}
          position={item.position}
          zoom={item.zoom}
          sizes="104px"
          className="h-[100px] w-[100px] shrink-0 rounded-2xl"
        />
        <div className="min-w-0 flex-1 py-0.5">
          <div className="flex items-start gap-1.5">
            <h3 className="line-clamp-2 text-[14.5px] font-bold leading-snug text-ink-900">
              {item.name}
            </h3>
            {item.chefSpecial && (
              <Sparkles className="mt-1 h-3.5 w-3.5 shrink-0 text-brand-500" />
            )}
          </div>
          {item.description && (
            <p className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-ink-500">
              {item.description}
            </p>
          )}
          <div className="mt-1.5 flex items-center justify-between">
            <div>
              <span className="text-[14px] font-extrabold text-ink-900">
                {naira(item.price)}
              </span>
              {hasExtras && (
                <p className="text-[10.5px] font-bold text-brand-600">
                  + extras available
                </p>
              )}
            </div>
            <button
              type="button"
              aria-label={`Add ${item.name} to cart`}
              onClick={quickAdd}
              disabled={soldOut}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full text-white shadow-pink transition-all active:scale-90",
                soldOut ? "bg-ink-300 shadow-none" : "bg-brand-600 hover:bg-brand-500"
              )}
            >
              <Plus className="h-4 w-4" strokeWidth={2.8} />
            </button>
          </div>
        </div>
      </motion.article>
    );
  }

  /* Grid card: full-bleed photo, rating badge, name, "See more", price,
     "+ extras available" and a round add button. */
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.25) }}
      onClick={() => openItem(item)}
      className={cn(
        "group flex cursor-pointer flex-col overflow-hidden rounded-[22px] bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card active:scale-[0.985]",
        soldOut && "opacity-60"
      )}
    >
      <div className="relative">
        <FoodImage
          src={item.image}
          alt={item.name}
          position={item.position}
          zoom={item.zoom}
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 40vw, 300px"
          className="aspect-[4/5] w-full"
        />
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-white/95 py-1 pl-1.5 pr-2 shadow-soft">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-[11.5px] font-bold text-ink-900">
            {rating % 1 === 0 ? rating : rating.toFixed(1)}
          </span>
        </span>
        {item.chefSpecial && (
          <span className="glass absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-brand-800">
            <Sparkles className="h-3 w-3" /> Special
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-2 left-2 rounded-full bg-ink-900/80 px-2 py-1 text-[10px] font-bold text-white backdrop-blur">
            Sold out today
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 pt-2.5">
        <h3 className="truncate text-[14px] font-bold tracking-tight text-ink-900 sm:text-[15px]">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-0.5 line-clamp-1 text-[11.5px] leading-snug text-ink-500 sm:text-[12px]">
            {item.description}
          </p>
        )}
        <span className="mt-0.5 text-[11.5px] font-bold text-brand-600">
          See more
        </span>

        <div className="mt-2.5 flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-[15.5px] font-extrabold tabular-nums text-ink-900 sm:text-[16.5px]">
              {naira(item.price)}
            </p>
            {hasExtras && (
              <p className="mt-0.5 truncate text-[10.5px] font-bold text-brand-600">
                + extras available
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label={`Add ${item.name} to cart`}
            onClick={quickAdd}
            disabled={soldOut}
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white shadow-pink transition-all hover:scale-105 active:scale-90 sm:h-11 sm:w-11",
              soldOut ? "bg-ink-300 shadow-none" : "bg-brand-600 hover:bg-brand-500"
            )}
          >
            <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} />
          </button>
        </div>
      </div>
    </motion.article>
  );
}
