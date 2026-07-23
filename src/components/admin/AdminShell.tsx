"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Session } from "@supabase/supabase-js";
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
import { api } from "@/lib/api";
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
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [openCount, setOpenCount] = useState(0);

  // Auth monitoring effect.
  //
  // Important: never call a Supabase method (getSession, or a PostgREST query —
  // which itself calls getSession under the hood) *inside* the
  // onAuthStateChange callback. supabase-js holds an auth lock for the duration
  // of that callback, so doing so deadlocks and leaves this screen stuck on
  // "Verifying Dashboard Access…" forever. We defer all such work with
  // setTimeout(…, 0) so the lock is released first, and drive the initial
  // check off the INITIAL_SESSION event rather than a racing getSession().
  useEffect(() => {
    if (pathname === "/admin/login") {
      setCheckingAuth(false);
      setAuthorized(true);
      return;
    }

    let active = true;
    let resolved = false;

    const finish = (ok: boolean) => {
      if (!active) return;
      resolved = true;
      setAuthorized(ok);
      setCheckingAuth(false);
      if (!ok) router.push("/admin/login");
    };

    async function verify(session: Session | null) {
      if (!active) return;
      if (!session) return finish(false);
      try {
        // Authorization comes from the role, not merely from having a session.
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();
        if (!active) return;
        if (profile?.role === "admin") {
          finish(true);
        } else {
          await supabase.auth.signOut();
          finish(false);
        }
      } catch {
        finish(false);
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        finish(false);
      } else {
        // INITIAL_SESSION (initial check), SIGNED_IN, TOKEN_REFRESHED, etc.
        // Deferred so we don't query Supabase while the auth lock is held.
        setTimeout(() => verify(session), 0);
      }
    });

    // Safety net: if anything stalls, don't leave the admin staring at the
    // spinner. After 10s, bail to the login screen.
    const watchdog = setTimeout(() => {
      if (active && !resolved) finish(false);
    }, 10_000);

    return () => {
      active = false;
      clearTimeout(watchdog);
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  // Pending-orders badge. Refetched whenever the admin changes pages, so it
  // stays roughly in step as orders move through the kitchen.
  useEffect(() => {
    if (!authorized || pathname === "/admin/login") return;
    let active = true;
    api
      .get<{ counts: Record<string, number> }>(
        "/api/admin/orders?countsOnly=1",
        { auth: true }
      )
      .then(({ counts }) => {
        if (active) setOpenCount((counts.new ?? 0) + (counts.preparing ?? 0));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [authorized, pathname]);

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
