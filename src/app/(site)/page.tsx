"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { ChefHat, Clock, MapPin, Search } from "lucide-react";
import Hero from "@/components/home/Hero";
import TrustBadges from "@/components/home/TrustBadges";
import SectionHeader from "@/components/SectionHeader";
import CategoryCard from "@/components/food/CategoryCard";
import FeatureCard from "@/components/food/FeatureCard";
import FoodCard from "@/components/food/FoodCard";
import ContactBlock from "@/components/blocks/ContactBlock";
import PaymentBlock from "@/components/blocks/PaymentBlock";
import ReviewsBlock from "@/components/blocks/ReviewsBlock";
import SiteFooter from "@/components/blocks/SiteFooter";
import { BUSINESS, CATEGORIES, IMG } from "@/lib/data";
import { useMenu } from "@/lib/store";

export default function HomePage() {
  const items = useMenu((s) => s.items);

  /* Featured strip is capped at 5, no matter how many are flagged. */
  const FEATURED_LIMIT = 5;
  const HOME_MENU_LIMIT = 10;

  const featured = useMemo(
    () =>
      items
        .filter((i) => i.featured && i.available !== false)
        .slice(0, FEATURED_LIMIT),
    [items]
  );

  /* The home menu preview carries the rest of the menu across every
     category, minus whatever is already on show in the featured strip. */
  const homeMenu = useMemo(() => {
    const featuredIds = new Set(featured.map((i) => i.id));
    return items
      .filter((i) => i.available !== false && !featuredIds.has(i.id))
      .slice(0, HOME_MENU_LIMIT);
  }, [items, featured]);

  /* Only categories that actually have dishes show on the site. */
  const activeCategories = useMemo(
    () =>
      CATEGORIES.filter((c) =>
        items.some((i) => i.category === c.id && i.available !== false)
      ),
    [items]
  );

  return (
    <div className="mx-auto max-w-[1020px] px-4 pt-4 sm:px-6 lg:px-8 lg:pt-7">
      {/* ── Mobile app header ─────────────────────────────────── */}
      <header className="mb-4 flex items-center gap-3 lg:hidden">
        <div className="relative h-11 w-11 shrink-0 rounded-2xl bg-white p-1 shadow-soft">
          <Image
            src={IMG.logo}
            alt="The Pastry Picasso"
            fill
            sizes="44px"
            className="object-contain p-1"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold tracking-tight text-ink-900">
            Good food, made fresh <span aria-hidden>❤️</span>
          </p>
          <p className="flex items-center gap-1 text-[12px] font-semibold text-ink-500">
            <MapPin className="h-3 w-3 text-brand-600" />
            {BUSINESS.city}
          </p>
        </div>
        <Link
          href="/menu"
          aria-label="Search the menu"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-ink-700 shadow-soft transition-transform active:scale-90"
        >
          <Search className="h-[18px] w-[18px]" />
        </Link>
      </header>

      {/* ── Desktop dashboard header ──────────────────────────── */}
      <header className="mb-6 hidden items-end justify-between lg:flex">
        <div>
          <h1 className="font-display text-[30px] font-extrabold tracking-tight text-ink-900">
            Discover
          </h1>
          <p className="mt-0.5 text-[14px] font-medium text-ink-500">
            What are you craving today?
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold text-ink-700">
            <MapPin className="h-3.5 w-3.5 text-brand-600" />
            Egbeda, Lagos
          </span>
          <span className="glass flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-bold text-ink-700">
            <Clock className="h-3.5 w-3.5 text-brand-600" />
            {BUSINESS.hoursText}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-10 lg:gap-14">
        <div className="flex flex-col gap-4 lg:gap-5">
          <Hero />
          <TrustBadges />
        </div>

        {/* ── A note from us ──────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-30px" }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-[24px] bg-gradient-to-br from-brand-50 to-white p-4 shadow-soft ring-1 ring-brand-100 lg:p-6"
        >
          <h2 className="font-display text-[16px] font-extrabold tracking-tight text-ink-900 lg:text-[19px]">
            A Note From Us 💕
          </h2>
          <p className="mt-2.5 text-[13px] font-semibold text-ink-700 lg:text-[14px]">
            Dear Valued Customer,
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500 lg:text-[14px]">
            We&apos;re not your typical fast-food restaurant. We prepare every
            order fresh to ensure you get the best quality and taste every single
            time.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 shadow-soft">
              <Clock className="h-3.5 w-3.5 text-brand-600" />
              Open 9:00 AM &ndash; 9:00 PM
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[12px] font-bold text-ink-700 shadow-soft">
              <ChefHat className="h-3.5 w-3.5 text-brand-600" />
              Prep 20 &ndash; 60 mins
            </span>
          </div>

          <p className="mt-3 text-[13px] leading-relaxed text-ink-500 lg:text-[14px]">
            Kindly allow{" "}
            <strong className="font-bold text-ink-900">20 to 60 minutes</strong>{" "}
            for your order to be prepared. Preparation time may vary depending on
            the items ordered.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-500 lg:text-[14px]">
            Thank you for your patience and for choosing The Pastry Picasso. We
            truly appreciate your support! ❤️
          </p>
        </motion.section>

        {/* ── Categories ──────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Browse categories"
            sub="Party platters, burgers and fresh bakes"
            action={{ href: "/menu", label: "Full menu" }}
          />
          <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-3 lg:gap-4 lg:overflow-visible lg:px-0">
            {activeCategories.map((c, i) => (
              <CategoryCard key={c.id} category={c} index={i} size="sm" />
            ))}
          </div>
        </section>

        {/* ── Featured ────────────────────────────────────────── */}
        <section>
          <SectionHeader
            title="Featured this week"
            sub="The plates everyone is talking about"
            action={{ href: "/menu", label: "See all" }}
          />
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            {featured.map((item, i) => (
              <FeatureCard key={item.id} item={item} index={i} />
            ))}
          </div>
        </section>

        {/* ── From the menu ───────────────────────────────────── */}
        {homeMenu.length > 0 && (
          <section>
            <SectionHeader
              title="From the menu"
              sub="Fresh picks across every category"
              action={{ href: "/menu", label: "Full menu" }}
            />
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {homeMenu.map((item, i) => (
                <FoodCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </section>
        )}

        <ReviewsBlock />

        <section>
          <SectionHeader
            title="Get in touch"
            sub="Orders, events and everything else"
          />
          <ContactBlock />
        </section>

        <PaymentBlock />

        <SiteFooter />
      </div>
    </div>
  );
}
