"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, SearchX, X } from "lucide-react";
import FoodCard from "@/components/food/FoodCard";
import SiteFooter from "@/components/blocks/SiteFooter";
import Pagination from "@/components/Pagination";
import PromoBanner from "@/components/PromoBanner";
import { CATEGORIES } from "@/lib/data";
import { useMenu } from "@/lib/store";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 12;
const CATEGORY_IDS = new Set<string>(CATEGORIES.map((c) => c.id));

export default function MenuPage() {
  const items = useMenu((s) => s.items);

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  /* Extras are add-ons picked inside a dish, never sold on their own. */
  const menuItems = useMemo(
    () => items.filter((i) => CATEGORY_IDS.has(i.category)),
    [items]
  );

  /* An empty category gets no filter to select. */
  const activeCategories = useMemo(
    () => CATEGORIES.filter((c) => menuItems.some((i) => i.category === c.id)),
    [menuItems]
  );

  const searching = query.trim().length > 0;

  /* Searching looks across the whole menu; otherwise the pills narrow it. */
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q) {
      return menuItems.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      );
    }
    return filter === "all"
      ? menuItems
      : menuItems.filter((i) => i.category === filter);
  }, [query, filter, menuItems]);

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const paged = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  /* A shorter list would otherwise leave the reader on a page that no
     longer exists. */
  useEffect(() => {
    setPage(1);
  }, [query, filter]);

  /* Don't strand the filter on a category that has emptied out. */
  useEffect(() => {
    if (activeCategories.length === 0) return;
    if (filter !== "all" && !activeCategories.some((c) => c.id === filter)) {
      setFilter("all");
    }
  }, [activeCategories, filter]);

  /* Deep links from the home page, e.g. /menu#burgers, pick the filter.
     A hash-only change never remounts, so listen for it as well. */
  useEffect(() => {
    const apply = () => {
      const hash = window.location.hash.slice(1);
      if (hash && CATEGORY_IDS.has(hash)) setFilter(hash);
    };
    apply();
    window.addEventListener("hashchange", apply);
    return () => window.removeEventListener("hashchange", apply);
  }, []);

  const goToPage = (next: number) => {
    setPage(next);
    document
      .getElementById("browse")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pill =
    "relative shrink-0 grow rounded-2xl px-3.5 py-2 text-[12.5px] font-bold transition-colors duration-200";

  return (
    <div className="mx-auto max-w-[1020px] px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Menu
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Everything is made fresh when you order.
        </p>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search small chops, boba, burgers…"
            className="h-12 w-full rounded-2xl bg-white pl-11 pr-11 text-[14px] font-medium text-ink-900 shadow-soft outline-none ring-1 ring-transparent transition placeholder:text-ink-300 focus:ring-2 focus:ring-brand-300"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-cream-200 text-ink-500 transition-transform active:scale-90"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.6} />
            </button>
          )}
        </div>

        <PromoBanner className="mt-3" />
      </header>

      {/* ── Category filters ──────────────────────────────────── */}
      {!searching && (
        <div
          id="browse"
          className="sticky top-0 z-30 -mx-4 mt-4 px-4 pb-2 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
        >
          <div className="glass-strong no-scrollbar flex gap-1.5 overflow-x-auto rounded-[22px] p-1.5 shadow-soft">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={cn(
                pill,
                filter === "all"
                  ? "text-white"
                  : "text-ink-500 hover:text-ink-900"
              )}
            >
              {filter === "all" && (
                <motion.span
                  layoutId="menu-pill"
                  className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-pink"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <span className="relative z-10">All</span>
            </button>

            {activeCategories.map((c) => {
              const isActive = filter === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFilter(c.id)}
                  className={cn(
                    pill,
                    isActive ? "text-white" : "text-ink-500 hover:text-ink-900"
                  )}
                >
                  {isActive && (
                    <motion.span
                      layoutId="menu-pill"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-pink"
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}
                  <span className="relative z-10">
                    <span aria-hidden className="mr-1">
                      {c.emoji}
                    </span>
                    {c.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Items ─────────────────────────────────────────────── */}
      <section className={cn("pb-4", searching ? "mt-6" : "mt-4")}>
        {list.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-200 text-ink-400">
              <SearchX className="h-7 w-7" />
            </span>
            <p className="mt-4 text-[15px] font-bold text-ink-900">
              {searching ? `Nothing found for “${query}”` : "Nothing on the menu yet"}
            </p>
            <p className="mt-1 text-[13px] text-ink-500">
              {searching
                ? "Try “samosa”, “burger” or “milk tea”."
                : "Check back shortly, the kitchen is restocking."}
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-[13px] font-semibold text-ink-500">
              {list.length} item{list.length === 1 ? "" : "s"}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {paged.map((item, i) => (
                <FoodCard key={item.id} item={item} index={i} />
              ))}
            </div>
            <Pagination
              page={page}
              totalPages={totalPages}
              total={list.length}
              limit={PAGE_SIZE}
              onPage={goToPage}
            />
          </>
        )}
      </section>

      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}
