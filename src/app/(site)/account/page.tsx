"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ChevronRight,
  Clock,
  LayoutDashboard,
  MapPin,
  Phone,
  ReceiptText,
  UserRound,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons";
import StatusChip from "@/components/StatusChip";
import PaymentBlock from "@/components/blocks/PaymentBlock";
import { BUSINESS } from "@/lib/data";
import { useOrders, useSettings } from "@/lib/store";
import { naira, orderRef, timeAgo } from "@/lib/format";
import { whatsappChatUrl } from "@/lib/whatsapp";

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

export default function AccountPage() {
  const profile = useSettings((s) => s.profile);
  const setProfile = useSettings((s) => s.setProfile);
  const business = useSettings((s) => s.business);
  const orders = useOrders((s) => s.orders);

  const myOrders = useMemo(
    () => orders.filter((o) => !o.sample).slice(0, 5),
    [orders]
  );

  const initial = profile.name.trim().charAt(0).toUpperCase() || "🧁";

  return (
    <div className="mx-auto max-w-[640px] px-4 sm:px-6">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Account
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          Your details make checkout one tap faster.
        </p>
      </header>

      {/* Profile */}
      <section className="mt-5 rounded-[26px] bg-white p-5 shadow-soft">
        <div className="flex items-center gap-3.5">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 font-display text-[20px] font-extrabold text-white shadow-pink">
            {initial}
          </span>
          <div>
            <p className="font-display text-[16px] font-extrabold text-ink-900">
              {profile.name.trim() || "Hey there 👋"}
            </p>
            <p className="text-[12.5px] font-medium text-ink-500">
              {profile.phone || "Add your details below"}
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-2.5">
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <UserRound className="mr-1 inline h-3 w-3" />
              Name
            </span>
            <input
              className={field}
              placeholder="Your name"
              value={profile.name}
              onChange={(e) => setProfile({ name: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <Phone className="mr-1 inline h-3 w-3" />
              Phone
            </span>
            <input
              className={field}
              placeholder="e.g. 0803 123 4567"
              inputMode="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ phone: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400">
              <MapPin className="mr-1 inline h-3 w-3" />
              Delivery address
            </span>
            <textarea
              className={`${field} min-h-[72px] resize-none`}
              placeholder="Where should we deliver?"
              value={profile.address}
              onChange={(e) => setProfile({ address: e.target.value })}
            />
          </label>
        </div>
      </section>

      {/* Order history */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[18px] font-extrabold tracking-tight text-ink-900">
            Order history
          </h2>
          {myOrders.length > 0 && (
            <Link
              href="/order"
              className="flex items-center text-[12.5px] font-bold text-brand-600"
            >
              View cart <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {myOrders.length === 0 ? (
          <div className="flex items-center gap-3.5 rounded-[22px] bg-white p-5 shadow-soft">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cream-200 text-ink-400">
              <ReceiptText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[13.5px] font-bold text-ink-900">
                No orders yet
              </p>
              <p className="text-[12px] font-medium text-ink-500">
                Your WhatsApp orders will appear here.
              </p>
            </div>
            <Link
              href="/menu"
              className="ml-auto shrink-0 rounded-2xl bg-brand-600 px-4 py-2.5 text-[12px] font-bold text-white shadow-pink"
            >
              Order
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {myOrders.map((o) => (
              <div key={o.id} className="rounded-[20px] bg-white p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-ink-900">
                    Order {orderRef(o.id)}
                  </span>
                  <StatusChip status={o.status} />
                </div>
                <p className="mt-1.5 line-clamp-1 text-[12.5px] font-medium text-ink-500">
                  {o.lines.map((l) => `${l.qty}× ${l.name}`).join(" · ")}
                </p>
                <div className="mt-1.5 flex items-center justify-between text-[12px] font-semibold text-ink-400">
                  <span>{timeAgo(o.createdAt)}</span>
                  <span className="text-[13px] font-extrabold text-ink-900">
                    {naira(o.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Hours + support */}
      <section className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-soft">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Open daily
            </p>
            <p className="text-[13.5px] font-bold text-ink-900">
              {business.hoursText}
            </p>
          </div>
        </div>
        <a
          href={whatsappChatUrl("Hello! I have a question about my order.")}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <WhatsAppIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Need help?
            </p>
            <p className="text-[13.5px] font-bold text-ink-900">Chat with us</p>
          </div>
        </a>
      </section>

      <div className="mt-6">
        <PaymentBlock />
      </div>

      <Link
        href="/admin"
        className="mt-6 flex items-center gap-3.5 rounded-[22px] bg-ink-900 p-4 text-white shadow-card transition-transform hover:scale-[1.01]"
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
          <LayoutDashboard className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[13.5px] font-bold">Business dashboard</p>
          <p className="text-[12px] font-medium text-white/60">
            Orders, menu and analytics for the team
          </p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 text-white/40" />
      </Link>

      <p className="mt-8 text-center text-[11.5px] font-medium text-ink-400">
        {BUSINESS.name} · Made fresh in Lagos with ❤️
      </p>
    </div>
  );
}
