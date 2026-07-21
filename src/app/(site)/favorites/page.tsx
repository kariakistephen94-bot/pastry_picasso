"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Heart } from "lucide-react";
import FoodCard from "@/components/food/FoodCard";
import { useFavorites, useMenu } from "@/lib/store";

export default function FavoritesPage() {
  const ids = useFavorites((s) => s.ids);
  const items = useMenu((s) => s.items);

  const favs = useMemo(
    () => items.filter((i) => ids.includes(i.id)),
    [items, ids]
  );

  return (
    <div className="mx-auto max-w-[1020px] px-4 sm:px-6 lg:px-8">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Favorites
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          The treats you keep coming back to.
        </p>
      </header>

      {favs.length === 0 ? (
        <div className="flex flex-col items-center px-6 py-20 text-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-[26px] bg-brand-100 text-brand-500">
            <Heart className="h-9 w-9" />
          </span>
          <h2 className="mt-5 font-display text-[18px] font-extrabold text-ink-900">
            No favorites yet
          </h2>
          <p className="mt-1.5 max-w-[260px] text-[13px] leading-relaxed text-ink-500">
            Tap the <Heart className="inline h-3.5 w-3.5 fill-brand-600 text-brand-600" />{" "}
            on any dish and it will live here for quick reordering.
          </p>
          <Link
            href="/menu"
            className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-7 text-[14px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
          >
            Browse the menu
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-2.5 sm:hidden">
            {favs.map((item, i) => (
              <FoodCard key={item.id} item={item} variant="row" index={i} />
            ))}
          </div>
          <div className="mt-5 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((item, i) => (
              <FoodCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
