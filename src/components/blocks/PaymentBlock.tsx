"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Copy, Landmark } from "lucide-react";
import { BUSINESS } from "@/lib/data";
import { cn } from "@/lib/cn";

export default function PaymentBlock({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [copied, setCopied] = useState(false);

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BUSINESS.bank.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const rows = [
    { label: "Bank", value: BUSINESS.bank.bankName },
    { label: "Account name", value: BUSINESS.bank.accountName },
    { label: "Account number", value: BUSINESS.bank.accountNumber, copy: true },
  ];

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
              <div className="rounded-[20px] bg-cream-100 p-4">
                {rows.map((row, i) => (
                  <div
                    key={row.label}
                    className={cn(
                      "flex items-center justify-between gap-3 py-2.5",
                      i > 0 && "border-t border-cream-300/60"
                    )}
                  >
                    <span className="text-[12.5px] font-semibold text-ink-500">
                      {row.label}
                    </span>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "text-[13.5px] font-bold text-ink-900",
                          row.copy && "font-display text-[16px] tracking-wide tabular-nums"
                        )}
                      >
                        {row.value}
                      </span>
                      {row.copy && (
                        <button
                          type="button"
                          onClick={copyAccount}
                          aria-label="Copy account number"
                          className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90",
                            copied
                              ? "bg-emerald-100 text-emerald-600"
                              : "bg-white text-ink-500 shadow-soft hover:text-brand-600"
                          )}
                        >
                          {copied ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
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
