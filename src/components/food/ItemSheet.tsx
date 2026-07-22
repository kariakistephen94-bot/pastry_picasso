"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Sparkles, Users, X } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import QuantityStepper from "@/components/QuantityStepper";
import { useUI } from "@/lib/ui-store";
import { useCart } from "@/lib/store";
import { useLockBody } from "@/lib/hooks";
import { naira } from "@/lib/format";
import { BUSINESS, composeWithExtras } from "@/lib/data";
import { cn } from "@/lib/cn";

export default function ItemSheet() {
  const item = useUI((s) => s.sheetItem);
  const closeItem = useUI((s) => s.closeItem);
  const showToast = useUI((s) => s.showToast);
  const add = useCart((s) => s.add);

  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  useLockBody(!!item);

  useEffect(() => {
    setQty(1);
    setSelected([]);
  }, [item?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeItem();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeItem]);

  const extras = useMemo(() => item?.extras ?? [], [item]);

  const extrasSum = useMemo(
    () =>
      extras
        .filter((e) => selected.includes(e.id))
        .reduce((sum, e) => sum + e.price, 0),
    [extras, selected]
  );

  const total = item ? (item.price + extrasSum) * qty : 0;
  const soldOut = item?.available === false;

  const toggleExtra = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const handleAdd = () => {
    if (!item || soldOut) return;
    add(composeWithExtras(item, selected), qty);
    showToast("Added to your order");
    closeItem();
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6">
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeItem}
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={item.name}
            initial={{ y: "62%", opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "70%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 34 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.55 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 130 || info.velocity.y > 800) closeItem();
            }}
            className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream-50 shadow-float sm:max-w-[540px] sm:rounded-[28px]"
          >
            {/* Grabber (mobile) */}
            <div className="absolute left-1/2 top-2.5 z-20 h-1.5 w-10 -translate-x-1/2 rounded-full bg-white/70 backdrop-blur sm:hidden" />

            <div className="overflow-y-auto overscroll-contain">
              {/* Image */}
              <div className="relative">
                <FoodImage
                  src={item.image}
                  alt={item.name}
                  position={item.position}
                  zoom={item.zoom}
                  sizes="(max-width: 640px) 100vw, 540px"
                  className="h-60 w-full sm:h-64"
                  hover={false}
                />
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />

                <div className="absolute right-3.5 top-3.5 flex gap-2">
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={closeItem}
                    className="glass flex h-9 w-9 items-center justify-center rounded-full text-ink-900 transition-transform active:scale-90"
                  >
                    <X className="h-[18px] w-[18px]" />
                  </button>
                </div>

                <div className="absolute bottom-3.5 left-4 flex flex-wrap gap-1.5">
                  {item.chefSpecial && (
                    <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-brand-800">
                      <Sparkles className="h-3 w-3" /> Chef&apos;s Special
                    </span>
                  )}
                  {item.serves && (
                    <span className="glass flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-ink-900">
                      <Users className="h-3 w-3" /> {item.serves}
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="px-5 pb-5 pt-4 sm:px-6">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="font-display text-[21px] font-extrabold leading-snug tracking-tight text-ink-900">
                    {item.name}
                  </h2>
                  <p className="whitespace-nowrap font-display text-[19px] font-extrabold text-brand-600">
                    {naira(item.price)}
                  </p>
                </div>

                {item.description && (
                  <p className="mt-2 text-[13.5px] leading-relaxed text-ink-500">
                    {item.description}
                  </p>
                )}

                <p className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold text-ink-500">
                  <Clock className="h-3.5 w-3.5 text-brand-600" />
                  Freshly prepared · {BUSINESS.prepTime}
                </p>

                {item.includes && item.includes.length > 0 && (
                  <div className="mt-5">
                    <h3 className="text-[12px] font-bold uppercase tracking-[0.08em] text-ink-400">
                      What&apos;s inside
                    </h3>
                    <ul className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2">
                      {item.includes.map((inc) => (
                        <li
                          key={inc}
                          className="flex items-center gap-2 text-[13px] font-medium text-ink-700"
                        >
                          <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                            <Check className="h-3 w-3" strokeWidth={3} />
                          </span>
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {extras.length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-baseline justify-between">
                      <h3 className="font-display text-[15px] font-extrabold text-ink-900">
                        Add Extras
                      </h3>
                      <span className="text-[11.5px] font-semibold text-ink-400">
                        Applies to each item
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2">
                      {extras.map((ex) => {
                        const on = selected.includes(ex.id);
                        return (
                          <button
                            key={ex.id}
                            type="button"
                            role="checkbox"
                            aria-checked={on}
                            onClick={() => toggleExtra(ex.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-soft transition-all active:scale-[0.99]",
                              on && "ring-2 ring-brand-400"
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                on
                                  ? "border-brand-600 bg-brand-600 text-white"
                                  : "border-brand-300 bg-white text-transparent"
                              )}
                            >
                              <Check className="h-3 w-3" strokeWidth={4} />
                            </span>
                            <span className="flex-1 text-[13.5px] font-semibold text-ink-900">
                              {ex.name}
                            </span>
                            <span className="text-[13px] font-extrabold text-brand-600">
                              +{naira(ex.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-cream-200 bg-cream-50/95 px-5 py-3.5 pb-safe backdrop-blur sm:px-6">
              <QuantityStepper
                value={qty}
                min={1}
                onInc={() => setQty((q) => q + 1)}
                onDec={() => setQty((q) => Math.max(1, q - 1))}
              />
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={handleAdd}
                disabled={soldOut}
                className={cn(
                  "flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[14.5px] font-bold text-white transition-shadow",
                  soldOut
                    ? "cursor-not-allowed bg-ink-300"
                    : "bg-gradient-to-r from-brand-600 to-brand-500 shadow-pink hover:shadow-pink-lg"
                )}
              >
                {soldOut ? "Sold out today" : `Add to cart · ${naira(total)}`}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
