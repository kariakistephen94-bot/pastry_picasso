"use client";

import { usePathname } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import CartView from "./CartView";
import { useCart, cartCount } from "@/lib/store";

/** Right-hand floating cart column, the macOS "inspector" panel (xl+). */
export default function CartPanel() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);

  // The /order page renders the full cart itself.
  if (pathname === "/order") return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 hidden w-[376px] p-4 pl-0 xl:block">
      <div className="glass-strong flex h-full flex-col rounded-[26px] shadow-soft">
        <header className="flex items-center justify-between px-5 pb-3 pt-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <ShoppingBag className="h-4 w-4" strokeWidth={2.4} />
            </span>
            <h2 className="font-display text-[16px] font-extrabold tracking-tight text-ink-900">
              Your Order
            </h2>
          </div>
          {count > 0 && (
            <span className="rounded-full bg-brand-600 px-2.5 py-0.5 text-[11.5px] font-bold text-white">
              {count} {count === 1 ? "item" : "items"}
            </span>
          )}
        </header>
        <div className="flex-1 overflow-y-auto px-4 pb-5">
          <CartView variant="panel" />
        </div>
      </div>
    </aside>
  );
}
