"use client";

import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Mail,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { BUSINESS } from "@/lib/data";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { useSettings } from "@/lib/store";

export default function ContactBlock() {
  const business = useSettings((s) => s.business);

  const cards = [
    {
      icon: <Phone className="h-[18px] w-[18px]" />,
      label: "Call us",
      value: business.phoneDisplay,
      href: BUSINESS.phoneTel ? `tel:${BUSINESS.phoneTel}` : undefined,
      tint: "bg-blue-50 text-blue-600",
    },
    {
      icon: <WhatsAppIcon className="h-[18px] w-[18px]" />,
      label: "WhatsApp orders",
      value: BUSINESS.whatsappDisplay,
      href: whatsappChatUrl(),
      tint: "bg-emerald-50 text-emerald-600",
    },
    {
      icon: <Mail className="h-[18px] w-[18px]" />,
      label: "Email",
      value: BUSINESS.email,
      href: `mailto:${BUSINESS.email}`,
      tint: "bg-amber-50 text-amber-600",
    },
    {
      icon: <InstagramIcon className="h-[18px] w-[18px]" />,
      label: "Instagram",
      value: BUSINESS.instagramHandle,
      href: BUSINESS.instagramUrl,
      tint: "bg-brand-100 text-brand-600",
    },
    {
      icon: <TikTokIcon className="h-[18px] w-[18px]" />,
      label: "TikTok",
      value: BUSINESS.tiktokHandle,
      href: BUSINESS.tiktokUrl,
      tint: "bg-ink-900/5 text-ink-900",
    },
    {
      icon: <MapPin className="h-[18px] w-[18px]" />,
      label: "Visit us",
      value: business.address,
      href: BUSINESS.mapsUrl,
      tint: "bg-violet-50 text-violet-600",
    },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.05fr]">
      {/* Map placeholder */}
      <motion.a
        href={BUSINESS.mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="group relative flex min-h-[260px] flex-col justify-between overflow-hidden rounded-[26px] bg-gradient-to-br from-brand-100 via-cream-100 to-brand-50 p-6 shadow-soft lg:min-h-[320px]"
      >
        {/* dotted "map" texture */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(rgb(184 15 102 / 0.25) 1.2px, transparent 1.2px)",
            backgroundSize: "22px 22px",
          }}
        />
        <div aria-hidden className="absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-200/50 blur-2xl" />

        <div className="relative">
          <span className="glass inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-800">
            <Navigation className="h-3 w-3" /> Find us
          </span>
        </div>

        <div className="relative">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pink animate-float-slow">
            <MapPin className="h-6 w-6" />
          </span>
          <h3 className="mt-3 font-display text-[19px] font-extrabold tracking-tight text-ink-900">
            {BUSINESS.addressLines[0]}
          </h3>
          <p className="text-[13.5px] font-medium text-ink-500">
            {BUSINESS.addressLines[1]} · {BUSINESS.addressLines[2]}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-2xl bg-ink-900 px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform group-hover:scale-[1.03]">
            Open in Google Maps
            <ArrowUpRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </motion.a>

      {/* Contact cards */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {cards.map((c, i) => (
          <motion.a
            key={c.label}
            href={c.href}
            target={c.href?.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.05 }}
            className="group flex items-center gap-3.5 rounded-[22px] bg-white p-4 shadow-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${c.tint}`}
            >
              {c.icon}
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                {c.label}
              </span>
              <span className="block truncate text-[13.5px] font-bold text-ink-900">
                {c.value}
              </span>
            </span>
            <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition-all group-hover:text-brand-600" />
          </motion.a>
        ))}
      </div>
    </div>
  );
}
