"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BadgePercent, Check, Copy } from "lucide-react";
import { api } from "@/lib/api";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

interface PublicPromo {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  label: string;
  minOrder: number;
  endsAt: number | null;
}

/**
 * Advertises whatever offers are running right now.
 *
 * Renders nothing at all when there are none, so the page keeps its
 * normal shape on an ordinary day rather than reserving a gap for a
 * banner that never arrives.
 */
export default function PromoBanner({ className }: { className?: string }) {
  const [promos, setPromos] = useState<PublicPromo[]>([]);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ promotions: PublicPromo[] }>("/api/promotions")
      .then(({ promotions }) => {
        if (active) setPromos(promotions ?? []);
      })
      // No offers running, or the promotions table isn't set up yet.
      // Either way the storefront carries on without a banner.
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (promos.length === 0) return null;

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* clipboard blocked; the code is readable on screen */
    }
  };

  return (
    <section
      aria-label="Current offers"
      className={cn("no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 sm:mx-0 sm:px-0", className)}
    >
      {promos.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
            delay: Math.min(i * 0.06, 0.24),
          }}
          className={cn(
            "flex min-w-[264px] flex-1 items-center gap-3 rounded-[22px] p-3.5 shadow-soft",
            "bg-gradient-to-r from-brand-600 to-brand-500 text-white"
          )}
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/20">
            <BadgePercent className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-extrabold">
              {p.label} · {p.name}
            </p>
            <p className="truncate text-[11.5px] font-medium text-white/80">
              {p.description ??
                (p.minOrder > 0
                  ? `On orders from ${naira(p.minOrder)}`
                  : "Applied automatically at checkout")}
            </p>
          </div>

          {p.code && (
            <button
              type="button"
              onClick={() => copy(p.code as string)}
              aria-label={`Copy promo code ${p.code}`}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/20 px-2.5 py-1.5 font-display text-[12px] font-extrabold tracking-wide transition-colors hover:bg-white/30"
            >
              {p.code}
              {copied === p.code ? (
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              ) : (
                <Copy className="h-3.5 w-3.5 opacity-70" />
              )}
            </button>
          )}
        </motion.div>
      ))}
    </section>
  );
}
