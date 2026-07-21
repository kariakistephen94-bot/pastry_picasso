"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import type { MenuItem } from "@/lib/data";
import { useCart } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { naira } from "@/lib/format";

export default function FeatureCard({
  item,
  index = 0,
}: {
  item: MenuItem;
  index?: number;
}) {
  const add = useCart((s) => s.add);
  const openItem = useUI((s) => s.openItem);
  const showToast = useUI((s) => s.showToast);

  return (
    <motion.article
      initial={{ opacity: 0, x: 32 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.07, 0.3) }}
      onClick={() => openItem(item)}
      className="group relative w-[236px] shrink-0 cursor-pointer snap-start overflow-hidden rounded-[26px] shadow-card transition-transform duration-300 active:scale-[0.97] lg:w-[264px]"
    >
      <FoodImage
        src={item.image}
        alt={item.name}
        position={item.position}
        zoom={item.zoom}
        sizes="264px"
        className="aspect-[3/4] w-full"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-ink-950/15 to-transparent" />
      {item.chefSpecial && (
        <span className="glass absolute left-3 top-3 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-brand-800">
          Chef&apos;s Special
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold text-white">
            {item.name}
          </h3>
          <p className="mt-0.5 text-[13.5px] font-extrabold text-brand-300">
            {naira(item.price)}
          </p>
        </div>
        <button
          type="button"
          aria-label={`Add ${item.name} to cart`}
          onClick={(e) => {
            e.stopPropagation();
            add(item);
            showToast("Added to your order");
          }}
          className="glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white transition-transform hover:scale-105 active:scale-90"
        >
          <Plus className="h-[18px] w-[18px]" strokeWidth={2.6} />
        </button>
      </div>
    </motion.article>
  );
}
