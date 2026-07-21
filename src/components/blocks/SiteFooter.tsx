import Link from "next/link";
import Image from "next/image";
import { Clock, MapPin, Phone } from "lucide-react";
import { InstagramIcon, TikTokIcon, WhatsAppIcon } from "@/components/icons";
import { BUSINESS, IMG } from "@/lib/data";
import { whatsappChatUrl } from "@/lib/whatsapp";

const EXPLORE = [
  { href: "/menu", label: "Menu" },
  { href: "/order", label: "Order" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function SiteFooter() {
  return (
    <footer className="overflow-hidden rounded-[28px] bg-ink-900 text-white shadow-card">
      <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.3fr_1fr_1.2fr] lg:p-10">
        <div>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-2xl bg-white p-1">
              <Image
                src={IMG.logo}
                alt="The Pastry Picasso logo"
                fill
                sizes="48px"
                className="object-contain p-1"
              />
            </div>
            <div>
              <p className="font-display text-[16px] font-extrabold tracking-tight">
                The Pastry Picasso
              </p>
              <p className="text-[12px] font-medium text-white/50">
                Treats, made with passion
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-[13px] leading-relaxed text-white/60">
            {BUSINESS.tagline}. Freshly prepared and beautifully presented, so
            every bite and every sip leaves you craving more.
          </p>
          <div className="mt-5 flex gap-2.5">
            <a
              href={BUSINESS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-brand-600"
            >
              <InstagramIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href={BUSINESS.tiktokUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-brand-600"
            >
              <TikTokIcon className="h-[18px] w-[18px]" />
            </a>
            <a
              href={whatsappChatUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 transition-colors hover:bg-[#25D366]"
            >
              <WhatsAppIcon className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/40">
            Explore
          </h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {EXPLORE.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-[13.5px] font-semibold text-white/70 transition-colors hover:text-brand-300"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-white/40">
            Visit us
          </h3>
          <ul className="mt-4 flex flex-col gap-3.5 text-[13px] text-white/70">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>
                {BUSINESS.addressLines[0]}, {BUSINESS.addressLines[1]},{" "}
                {BUSINESS.addressLines[2]}
              </span>
            </li>
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <a href={`tel:${BUSINESS.phoneTel}`} className="hover:text-white">
                {BUSINESS.phoneDisplay}
              </a>
            </li>
            <li className="flex gap-2.5">
              <WhatsAppIcon className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <a
                href={whatsappChatUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white"
              >
                {BUSINESS.whatsappDisplay} (WhatsApp orders)
              </a>
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
              <span>Open daily · {BUSINESS.hoursText}</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-6 py-4 text-center text-[11.5px] font-medium text-white/40 sm:px-8 lg:px-10">
        © {new Date().getFullYear()} {BUSINESS.legalName}. Made fresh in Lagos
        with <span className="text-brand-400">♥</span>
      </div>
    </footer>
  );
}
