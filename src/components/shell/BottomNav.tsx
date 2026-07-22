"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  PackageSearch,
  CircleUserRound,
} from "lucide-react";
import { useCart, cartCount } from "@/lib/store";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/order", label: "Order", icon: ShoppingBag },
  { href: "/track", label: "Track", icon: PackageSearch },
  { href: "/account", label: "Account", icon: CircleUserRound },
];

export default function BottomNav() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 px-3 pb-safe lg:hidden"
    >
      <div className="mx-auto mb-2.5 max-w-md">
        <div className="glass-strong grid h-[68px] grid-cols-5 items-stretch rounded-[26px] px-1.5 shadow-float">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className="relative flex flex-col items-center justify-center gap-1"
              >
                {active && (
                  <motion.span
                    layoutId="tab-active"
                    className="absolute inset-x-1 inset-y-2 rounded-[18px] bg-brand-100/90"
                    transition={{ type: "spring", stiffness: 480, damping: 36 }}
                  />
                )}
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-colors duration-200",
                      active ? "text-brand-600" : "text-ink-400"
                    )}
                    strokeWidth={active ? 2.4 : 2}
                  />
                  {href === "/order" && count > 0 && (
                    <motion.span
                      key={count}
                      initial={{ scale: 0.4 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 18 }}
                      className="absolute -right-2 -top-1.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-pink"
                    >
                      {count}
                    </motion.span>
                  )}
                </span>
                <span
                  className={cn(
                    "relative text-[10px] font-semibold tracking-tight transition-colors duration-200",
                    active ? "text-brand-700" : "text-ink-400"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
