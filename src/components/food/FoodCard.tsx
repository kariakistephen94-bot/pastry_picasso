"use client";

import { motion } from "framer-motion";
import { Heart, Plus, Sparkles } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import type { MenuItem } from "@/lib/data";
import { useCart, useFavorites } from "@/lib/store";
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
  const favIds = useFavorites((s) => s.ids);
  const toggleFav = useFavorites((s) => s.toggle);
  const openItem = useUI((s) => s.openItem);
  const showToast = useUI((s) => s.showToast);

  const isFav = favIds.includes(item.id);
  const soldOut = item.available === false;

  const quickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (soldOut) return;
    add(item);
    showToast("Added to your order");
  };

  const fav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFav(item.id);
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
            <span className="text-[14px] font-extrabold text-brand-600">
              {naira(item.price)}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Toggle favorite"
                onClick={fav}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-300 transition-colors hover:bg-brand-50 hover:text-brand-500"
              >
                <Heart className={cn("h-4 w-4", isFav && "fill-brand-600 text-brand-600")} />
              </button>
              <button
                type="button"
                aria-label={`Add ${item.name} to cart`}
                onClick={quickAdd}
                disabled={soldOut}
                className={cn(
                  "flex h-8 items-center gap-1 rounded-full px-3 text-[12px] font-bold text-white shadow-pink transition-all active:scale-90",
                  soldOut ? "bg-ink-300 shadow-none" : "bg-brand-600 hover:bg-brand-500"
                )}
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={3} />
                Add
              </button>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.05, 0.25) }}
      onClick={() => openItem(item)}
      className={cn(
        "group cursor-pointer rounded-[24px] bg-white p-3 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card active:scale-[0.985]",
        soldOut && "opacity-60"
      )}
    >
      <div className="relative">
        <FoodImage
          src={item.image}
          alt={item.name}
          position={item.position}
          zoom={item.zoom}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 360px"
          className="aspect-[4/3] w-full rounded-[18px]"
        />
        <button
          type="button"
          aria-label="Toggle favorite"
          onClick={fav}
          className="glass absolute right-2.5 top-2.5 flex h-8.5 w-8.5 items-center justify-center rounded-full p-2 transition-transform active:scale-90"
        >
          <Heart
            className={cn(
              "h-[17px] w-[17px]",
              isFav ? "fill-brand-600 text-brand-600" : "text-ink-700"
            )}
          />
        </button>
        {item.chefSpecial && (
          <span className="glass absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-brand-800">
            <Sparkles className="h-3 w-3" /> Special
          </span>
        )}
        {soldOut && (
          <span className="absolute bottom-2.5 left-2.5 rounded-full bg-ink-900/80 px-2.5 py-1 text-[10.5px] font-bold text-white backdrop-blur">
            Sold out today
          </span>
        )}
      </div>
      <div className="px-1.5 pb-1 pt-3">
        <h3 className="truncate text-[14.5px] font-bold tracking-tight text-ink-900">
          {item.name}
        </h3>
        {item.description && (
          <p className="mt-1 line-clamp-2 min-h-[32px] text-[12px] leading-snug text-ink-500">
            {item.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center justify-between">
          <span className="font-display text-[15.5px] font-extrabold text-ink-900">
            {naira(item.price)}
          </span>
          <button
            type="button"
            aria-label={`Add ${item.name} to cart`}
            onClick={quickAdd}
            disabled={soldOut}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full text-white shadow-pink transition-all hover:scale-105 active:scale-90",
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
