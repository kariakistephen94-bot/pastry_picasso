"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ClipboardList,
  LayoutDashboard,
  Users,
  Settings,
  Star,
  UtensilsCrossed,
  LogOut,
} from "lucide-react";
import { useOrders } from "@/lib/store";
import { IMG } from "@/lib/data";
import { cn } from "@/lib/cn";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const orders = useOrders((s) => s.orders);
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Auth monitoring effect
  useEffect(() => {
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      setAuthorized(true);
      return;
    }

    let active = true;

    async function checkUser() {
      if (!active) return;
      setCheckingAuth(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (active) {
            setAuthorized(false);
            setCheckingAuth(false);
            router.push("/admin/login");
          }
          return;
        }

        // Authorization comes from the role, not from having a session
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || profile?.role !== "admin") {
          if (active) {
            await supabase.auth.signOut();
            setAuthorized(false);
            setCheckingAuth(false);
            router.push("/admin/login");
          }
          return;
        }

        if (active) {
          setAuthorized(true);
          setCheckingAuth(false);
        }
      } catch (err) {
        if (active) {
          setAuthorized(false);
          setCheckingAuth(false);
          router.push("/admin/login");
        }
      }
    }

    checkUser();

    // Listen to changes in auth state (e.g. if password/user deleted or signout from console)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_OUT") {
          if (active) {
            setAuthorized(false);
            router.push("/admin/login");
          }
        } else if (event === "SIGNED_IN" && session) {
          checkUser();
        }
      }
    );

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const openCount = orders.filter(
    (o) => o.status === "new" || o.status === "preparing"
  ).length;

  // Render bypass if we are on the login page
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // Auth checking skeleton / state loader
  if (checkingAuth) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center p-4">
        <div className="ambient" />
        <div className="relative h-12 w-12 animate-bounce rounded-full flex items-center justify-center bg-brand-100 text-brand-600 shadow-soft">
          <Image
            src={IMG.logo}
            alt=""
            width={32}
            height={32}
            className="object-contain"
          />
        </div>
        <p className="mt-4 text-[12px] font-bold text-ink-500 uppercase tracking-widest animate-pulse">
          Verifying Dashboard Access...
        </p>
      </div>
    );
  }

  // Not authorized (fallback if check failed and redirect is still running)
  if (!authorized) {
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* ── Desktop sidebar ─────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] p-4 lg:block">
        <div className="glass-strong flex h-full flex-col rounded-[26px] p-4 shadow-soft">
          <Link href="/admin" className="flex items-center gap-2.5 px-2 pt-1">
            <div className="relative h-10 w-10 shrink-0">
              <Image
                src={IMG.logo}
                alt="The Pastry Picasso"
                fill
                sizes="40px"
                className="object-contain"
              />
            </div>
            <div>
              <p className="font-display text-[13.5px] font-extrabold leading-tight text-ink-900">
                Pastry Picasso
              </p>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-600">
                Dashboard
              </p>
            </div>
          </Link>

          <nav className="mt-7 flex flex-col gap-1">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[13.5px] font-semibold transition-colors",
                    active ? "text-white" : "text-ink-700 hover:bg-white/70"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="admin-active"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-ink-900 to-ink-700 shadow-card"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon className="relative z-10 h-[17px] w-[17px]" strokeWidth={2.2} />
                  <span className="relative z-10">{label}</span>
                  {href === "/admin/orders" && openCount > 0 && (
                    <span
                      className={cn(
                        "relative z-10 ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10.5px] font-bold",
                        active ? "bg-white/20 text-white" : "bg-brand-600 text-white"
                      )}
                    >
                      {openCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-1.5">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold text-ink-500 transition-colors hover:bg-white/70 hover:text-ink-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to app
            </Link>

            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-2xl px-3.5 py-2.5 text-[13px] font-bold text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 text-left cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* ── Mobile header + tabs ────────────────────────────── */}
      <header className="sticky top-0 z-40 px-4 pt-3 lg:hidden">
        <div className="glass-strong rounded-[22px] p-3 shadow-soft">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5">
              <Link
                href="/"
                aria-label="Back to app"
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 text-ink-700 shadow-soft"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="relative h-8 w-8">
                <Image
                  src={IMG.logo}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <p className="font-display text-[14px] font-extrabold text-ink-900">
                Dashboard
              </p>
            </div>

            <button
              onClick={handleSignOut}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 shadow-soft cursor-pointer"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <div className="no-scrollbar mt-2.5 flex gap-1.5 overflow-x-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active =
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-bold transition-colors",
                    active
                      ? "bg-ink-900 text-white shadow-card"
                      : "bg-white/70 text-ink-500"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {href === "/admin/orders" && openCount > 0 && (
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[9.5px] text-white">
                      {openCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      <main className="px-4 pb-16 pt-5 lg:px-8 lg:pt-7">{children}</main>
    </div>
  );
}
