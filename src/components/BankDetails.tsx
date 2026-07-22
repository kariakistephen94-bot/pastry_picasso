"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { BUSINESS } from "@/lib/data";
import { cn } from "@/lib/cn";

const ROWS = [
  { key: "bank", label: "Bank", value: BUSINESS.bank.bankName },
  { key: "name", label: "Account name", value: BUSINESS.bank.accountName },
  {
    key: "number",
    label: "Account number",
    value: BUSINESS.bank.accountNumber,
    mono: true,
  },
];

/** The store's transfer details, every field copyable. */
export default function BankDetails({ className }: { className?: string }) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1600);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={cn("rounded-2xl bg-cream-100 p-4", className)}>
      {ROWS.map((row, i) => (
        <div
          key={row.key}
          className={cn(
            "flex items-center justify-between gap-3 py-2",
            i > 0 && "border-t border-cream-300/60"
          )}
        >
          <span className="shrink-0 text-[12.5px] font-semibold text-ink-500">
            {row.label}
          </span>
          <span className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "truncate text-right text-[13px] font-bold text-ink-900",
                row.mono &&
                  "font-display text-[16px] tabular-nums tracking-wide"
              )}
            >
              {row.value}
            </span>
            <button
              type="button"
              onClick={() => copy(row.key, row.value)}
              aria-label={`Copy ${row.label.toLowerCase()}`}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all active:scale-90",
                copied === row.key
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-white text-ink-500 shadow-soft hover:text-brand-600"
              )}
            >
              {copied === row.key ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
            </button>
          </span>
        </div>
      ))}
    </div>
  );
}
