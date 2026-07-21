"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Search, SearchX, X } from "lucide-react";
import FoodCard from "@/components/food/FoodCard";
import FoodImage from "@/components/FoodImage";
import SiteFooter from "@/components/blocks/SiteFooter";
import { CATEGORIES, type MenuItem } from "@/lib/data";
import { useMenu, useCart } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function MenuPage() {
  const items = useMenu((s) => s.items);
  const add = useCart((s) => s.add);
  const cartLines = useCart((s) => s.lines);
  const showToast = useUI((s) => s.showToast);

  const hasMainInCart = cartLines.some((l) => l.category !== "extras");

  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>(CATEGORIES[0].id);
  const pillRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const observing = useRef(true);

  const byCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const cat of CATEGORIES) {
      map.set(
        cat.id,
        items.filter((i) => i.category === cat.id)
      );
    }
    return map;
  }, [items]);

  const extras = useMemo(
    () => items.filter((i) => i.category === "extras"),
    [items]
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.description?.toLowerCase().includes(q)
    );
  }, [query, items]);

  /* Deep-link (#category) support */
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (el) {
      setTimeout(() => el.scrollIntoView({ behavior: "smooth" }), 150);
    }
  }, []);

  /* Scroll-spy for the sticky pills */
  useEffect(() => {
    if (results) return;
    const sections = [...CATEGORIES.map((c) => c.id), "extras"]
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    const io = new IntersectionObserver(
      (entries) => {
        if (!observing.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          const id = visible[0].target.id;
          setActive(id);
          pillRefs.current[id]?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      },
      { rootMargin: "-25% 0px -60% 0px" }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [results]);

  const jumpTo = (id: string) => {
    setActive(id);
    observing.current = false;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => (observing.current = true), 900);
  };

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
      </header>

      {/* ── Search results ────────────────────────────────────── */}
      {results ? (
        <section className="mt-6 pb-10">
          {results.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-cream-200 text-ink-400">
                <SearchX className="h-7 w-7" />
              </span>
              <p className="mt-4 text-[15px] font-bold text-ink-900">
                Nothing found for “{query}”
              </p>
              <p className="mt-1 text-[13px] text-ink-500">
                Try “samosa”, “burger” or “milk tea”.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-[13px] font-semibold text-ink-500">
                {results.length} result{results.length === 1 ? "" : "s"}
              </p>
              <div className="flex flex-col gap-2.5 sm:hidden">
                {results.map((item, i) => (
                  <FoodCard key={item.id} item={item} variant="row" index={i} />
                ))}
              </div>
              <div className="hidden gap-4 sm:grid sm:grid-cols-2">
                {results.map((item, i) => (
                  <FoodCard key={item.id} item={item} index={i} />
                ))}
              </div>
            </>
          )}
        </section>
      ) : (
        <>
          {/* ── Sticky category pills ─────────────────────────── */}
          <div
            id="browse"
            className="sticky top-0 z-30 -mx-4 mt-4 px-4 pb-2 pt-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
          >
            <div className="glass-strong no-scrollbar flex gap-1.5 overflow-x-auto rounded-[22px] p-1.5 shadow-soft">
              {[...CATEGORIES, { id: "extras", label: "Extras", emoji: "➕" }].map(
                (c) => {
                  const isActive = active === c.id;
                  return (
                    <button
                      key={c.id}
                      ref={(el) => {
                        pillRefs.current[c.id] = el;
                      }}
                      type="button"
                      onClick={() => jumpTo(c.id)}
                      className={cn(
                        "relative shrink-0 rounded-2xl px-3.5 py-2 text-[12.5px] font-bold transition-colors duration-200",
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
                        <span aria-hidden className="mr-1">{c.emoji}</span>
                        {c.label}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* ── Category sections ─────────────────────────────── */}
          <div className="mt-4 flex flex-col gap-10 pb-4">
            {CATEGORIES.map((cat) => {
              const catItems = byCategory.get(cat.id) ?? [];
              if (catItems.length === 0) return null;
              return (
                <section key={cat.id} id={cat.id} className="scroll-mt-24">
                  <div className="mb-3.5 flex items-baseline gap-2">
                    <h2 className="font-display text-[19px] font-extrabold tracking-tight text-ink-900 lg:text-[22px]">
                      <span aria-hidden className="mr-1.5">{cat.emoji}</span>
                      {cat.label}
                    </h2>
                    <span className="text-[12px] font-bold text-ink-400">
                      {catItems.length} item{catItems.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2.5 sm:hidden">
                    {catItems.map((item, i) => (
                      <FoodCard key={item.id} item={item} variant="row" index={i} />
                    ))}
                  </div>
                  <div className="hidden gap-4 sm:grid sm:grid-cols-2">
                    {catItems.map((item, i) => (
                      <FoodCard key={item.id} item={item} index={i} />
                    ))}
                  </div>
                </section>
              );
            })}

            {/* ── Extras ──────────────────────────────────────── */}
            <section id="extras" className="scroll-mt-24">
              <div className="mb-1 flex items-baseline gap-2">
                <h2 className="font-display text-[19px] font-extrabold tracking-tight text-ink-900 lg:text-[22px]">
                  <span aria-hidden className="mr-1.5">➕</span>
                  Add Extras
                </h2>
              </div>
              <p className="mb-4 text-[12.5px] font-medium text-ink-500">
                {hasMainInCart
                  ? "Top up your order with your favourites."
                  : "Extras join a main order. Add a dish first, then top it up."}
              </p>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {extras.map((ex, i) => (
                  <motion.div
                    key={ex.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.2) }}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[20px] bg-white p-2.5 shadow-soft",
                      ex.available === false && "opacity-60"
                    )}
                  >
                    <FoodImage
                      src={ex.image}
                      alt={ex.name}
                      position={ex.position}
                      zoom={ex.zoom}
                      sizes="48px"
                      className="h-12 w-12 shrink-0 rounded-xl"
                      hover={false}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-bold text-ink-900">
                        {ex.name}
                      </p>
                      <p className="text-[12px] font-bold text-brand-600">
                        {naira(ex.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Add ${ex.name}`}
                      disabled={ex.available === false}
                      onClick={() => {
                        if (!hasMainInCart) {
                          showToast("Add a main dish first, then add extras");
                          return;
                        }
                        add(ex);
                        showToast(`${ex.name} added to your order`);
                      }}
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-transform active:scale-90",
                        ex.available === false
                          ? "bg-ink-300"
                          : hasMainInCart
                            ? "bg-brand-600 shadow-pink hover:bg-brand-500"
                            : "bg-ink-300"
                      )}
                    >
                      <Plus className="h-4 w-4" strokeWidth={2.8} />
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>
        </>
      )}

      <div className="mt-10">
        <SiteFooter />
      </div>
    </div>
  );
}
