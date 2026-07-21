"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";

interface StepperProps {
  value: number;
  onInc: () => void;
  onDec: () => void;
  size?: "sm" | "md";
  min?: number;
}

export default function QuantityStepper({
  value,
  onInc,
  onDec,
  size = "md",
  min = 0,
}: StepperProps) {
  const sm = size === "sm";
  const btn = cn(
    "flex items-center justify-center rounded-full bg-white text-ink-700 shadow-soft transition-colors hover:text-brand-600 active:scale-90",
    sm ? "h-7 w-7" : "h-9 w-9"
  );
  const icon = sm ? "h-3.5 w-3.5" : "h-4 w-4";

  return (
    <div
      className={cn(
        "flex items-center rounded-full bg-cream-200/80 p-1",
        sm ? "gap-1.5" : "gap-2"
      )}
    >
      <button type="button" aria-label="Decrease quantity" onClick={onDec} className={btn}>
        {value <= min + 1 && min === 0 ? (
          <Trash2 className={cn(icon, "text-ink-400")} strokeWidth={2.2} />
        ) : (
          <Minus className={icon} strokeWidth={2.4} />
        )}
      </button>
      <span
        className={cn(
          "relative overflow-hidden text-center font-bold tabular-nums text-ink-900",
          sm ? "w-5 text-[13px]" : "w-6 text-[15px]"
        )}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="inline-block"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </span>
      <button type="button" aria-label="Increase quantity" onClick={onInc} className={btn}>
        <Plus className={icon} strokeWidth={2.4} />
      </button>
    </div>
  );
}
