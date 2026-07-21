"use client";

import { Clock } from "lucide-react";
import ContactBlock from "@/components/blocks/ContactBlock";
import PaymentBlock from "@/components/blocks/PaymentBlock";
import SiteFooter from "@/components/blocks/SiteFooter";
import { useSettings } from "@/lib/store";

export default function ContactPage() {
  const business = useSettings((s) => s.business);

  return (
    <div className="mx-auto max-w-[1020px] px-4 sm:px-6 lg:px-8">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          Contact
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          We&apos;d love to hear from you about orders, events and catering.
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-6 lg:gap-8">
        <ContactBlock />

        <div className="flex items-center gap-3.5 rounded-[24px] bg-white p-5 shadow-soft">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-400">
              Opening hours
            </p>
            <p className="text-[14px] font-bold text-ink-900">
              Every day · {business.hoursText}
            </p>
          </div>
          <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1.5 text-[11.5px] font-bold text-emerald-700">
            Preparing orders {business.prepTime}
          </span>
        </div>

        <PaymentBlock defaultOpen />

        <SiteFooter />
      </div>
    </div>
  );
}
