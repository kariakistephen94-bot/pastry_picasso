"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home,
  UtensilsCrossed,
  ShoppingBag,
  PackageSearch,
  Images,
  Info,
  Phone,
  Clock,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { BUSINESS } from "@/lib/data";
import { useCart, cartCount } from "@/lib/store";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/", label: "Home", icon: Home },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/order", label: "Orders", icon: ShoppingBag },
  { href: "/track", label: "Track Order", icon: PackageSearch },
  { href: "/gallery", label: "Gallery", icon: Images },
  { href: "/about", label: "About", icon: Info },
  { href: "/contact", label: "Contact", icon: Phone },
];

export default function Sidebar() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[280px] p-4 lg:block">
      <div className="glass-strong flex h-full flex-col rounded-[26px] p-5 shadow-soft">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 px-2 pt-1">
          <div className="relative h-12 w-12 shrink-0">
            <Image
              src="/images/logo.png"
              alt="The Pastry Picasso logo"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="font-display text-[15px] font-extrabold leading-tight tracking-tight text-ink-900">
              The Pastry Picasso
            </p>
            <p className="text-xs font-medium text-ink-500">Egbeda · Lagos</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-[14px] font-semibold transition-colors duration-200",
                  active
                    ? "text-white"
                    : "text-ink-700 hover:bg-white/70 hover:text-ink-900"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="sidebar-active"
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 shadow-pink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-[18px] w-[18px]",
                    active ? "text-white" : "text-ink-500 group-hover:text-brand-600"
                  )}
                  strokeWidth={2.2}
                />
                <span className="relative z-10">{label}</span>
                {href === "/order" && count > 0 && (
                  <span
                    className={cn(
                      "relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold",
                      active ? "bg-white/25 text-white" : "bg-brand-600 text-white"
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          {/* Hours */}
          <div className="flex items-center gap-3 rounded-2xl bg-white/60 px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Clock className="h-4 w-4" strokeWidth={2.2} />
            </span>
            <div>
              <p className="text-[12.5px] font-semibold text-ink-900">
                Open daily
              </p>
              <p className="text-xs font-medium text-ink-500">
                {BUSINESS.hoursText}
              </p>
            </div>
          </div>

          {/* Order Now */}
          <Link
            href="/menu"
            className="group relative flex items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 via-brand-500 to-brand-600 bg-[length:200%_100%] bg-left px-4 py-3.5 text-[14.5px] font-bold text-white shadow-pink transition-all duration-500 hover:bg-right hover:shadow-pink-lg"
          >
            Order Now
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/admin"
            className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-1.5 text-[11.5px] font-semibold text-ink-400 transition-colors hover:text-brand-600"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Business dashboard
          </Link>
        </div>
      </div>
    </aside>
  );
}
