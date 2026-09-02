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
      {/* Live map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55 }}
        className="group relative min-h-[340px] overflow-hidden rounded-[26px] bg-cream-100 shadow-soft lg:min-h-[360px]"
      >
        {/* Pointer events are off so the card scrolls normally on mobile and a
            tap anywhere opens the full map. Google's attribution strip stays
            visible along the bottom edge. */}
        <iframe
          title={`Map showing ${BUSINESS.name}, ${BUSINESS.address}`}
          src={BUSINESS.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
        />

        <a
          href={BUSINESS.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 flex items-start p-4 sm:p-5"
        >
          <span className="glass-strong max-w-[92%] rounded-[22px] p-4 shadow-card sm:max-w-[80%]">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-brand-700">
              <Navigation className="h-3 w-3" /> Find us
            </span>

            <span className="mt-2.5 flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-pink">
                <MapPin className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-[18px] font-extrabold leading-tight tracking-tight text-ink-900">
                  {BUSINESS.addressLines[0]}
                </span>
                <span className="block text-[13px] font-medium text-ink-500">
                  {BUSINESS.addressLines[1]} · {BUSINESS.addressLines[2]}
                </span>
              </span>
            </span>

            <span className="mt-3 inline-flex items-center gap-1.5 rounded-2xl bg-ink-900 px-4 py-2.5 text-[12.5px] font-bold text-white transition-transform group-hover:scale-[1.03]">
              Open in Google Maps
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </span>
        </a>
      </motion.div>

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
