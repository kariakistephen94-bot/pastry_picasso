"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Landmark } from "lucide-react";
import BankDetails from "@/components/BankDetails";

export default function PaymentBlock({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-[26px] bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3.5 p-5 text-left sm:p-6"
      >
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
          <Landmark className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-display text-[16px] font-extrabold tracking-tight text-ink-900">
            Payment Information
          </span>
          <span className="block text-[12.5px] font-medium text-ink-500">
            Bank transfer details for your order
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-cream-200/80 text-ink-500"
        >
          <ChevronDown className="h-4 w-4" strokeWidth={2.4} />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <BankDetails />
              <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-400">
                After payment, please share your receipt with us on WhatsApp so
                we can confirm your order right away.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
