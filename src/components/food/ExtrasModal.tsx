"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Plus, X } from "lucide-react";
import { composeWithExtras } from "@/lib/data";
import { useCart } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { useLockBody } from "@/lib/hooks";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Quick-add dialog for items with extras: pick add-ons, see the live
 * total, add everything to the cart as one line.
 */
export default function ExtrasModal() {
  const item = useUI((s) => s.extrasItem);
  const closeExtras = useUI((s) => s.closeExtras);
  const showToast = useUI((s) => s.showToast);
  const add = useCart((s) => s.add);

  const [selected, setSelected] = useState<string[]>([]);

  useLockBody(!!item);

  useEffect(() => {
    setSelected([]);
  }, [item?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeExtras();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeExtras]);

  const total = useMemo(() => {
    if (!item) return 0;
    const extraSum = (item.extras ?? [])
      .filter((e) => selected.includes(e.id))
      .reduce((n, e) => n + e.price, 0);
    return item.price + extraSum;
  }, [item, selected]);

  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
    );

  const addToCart = () => {
    if (!item) return;
    add(composeWithExtras(item, selected));
    showToast("Added to your order");
    closeExtras();
  };

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.button
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={closeExtras}
            className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px]"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Extras for ${item.name}`}
            initial={{ opacity: 0, scale: 0.92, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="relative flex max-h-[86dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-[26px] bg-cream-50 shadow-float"
          >
            <div className="relative px-5 pb-1 pt-5 text-center sm:px-6">
              <h2 className="pr-8 font-display text-[18px] font-extrabold leading-snug tracking-tight text-ink-900 sm:pr-0">
                {item.name}
              </h2>
              <p className="mt-1 text-[12.5px] font-medium text-ink-500">
                Add any extras you&apos;d like. Base price{" "}
                <span className="font-bold text-ink-700">{naira(item.price)}</span>.
              </p>
              <button
                type="button"
                aria-label="Close"
                onClick={closeExtras}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-cream-200/80 text-ink-500 transition-transform active:scale-90"
              >
                <X className="h-4 w-4" strokeWidth={2.4} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
              <div className="flex flex-col gap-2">
                {(item.extras ?? []).map((ex) => {
                  const on = selected.includes(ex.id);
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggle(ex.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl bg-white p-3.5 text-left shadow-soft transition-all active:scale-[0.99]",
                        on && "ring-2 ring-brand-400"
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                          on
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-brand-300 bg-white text-transparent"
                        )}
                      >
                        <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
                      </span>
                      <span className="flex-1 text-[14px] font-semibold text-ink-900">
                        {ex.name}
                      </span>
                      <span className="text-[14px] font-extrabold text-brand-600">
                        +{naira(ex.price)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-cream-200 bg-cream-50/95 px-5 py-4 pb-safe backdrop-blur sm:px-6">
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={addToCart}
                className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 text-[15px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
              >
                <Plus className="h-5 w-5" strokeWidth={2.8} />
                Add to cart
              </motion.button>
              <p className="mt-3 text-[15px] font-medium text-ink-500">
                Total:{" "}
                <span className="font-display text-[19px] font-extrabold tabular-nums text-ink-900">
                  {naira(total)}
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
