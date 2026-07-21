"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HandHeart, Leaf, Sparkles } from "lucide-react";
import AboutBlock from "@/components/blocks/AboutBlock";
import TrustBadges from "@/components/home/TrustBadges";
import SiteFooter from "@/components/blocks/SiteFooter";
import FoodImage from "@/components/FoodImage";
import { GALLERY } from "@/lib/data";

const VALUES = [
  {
    icon: Leaf,
    title: "Fresh, always",
    text: "Nothing sits under a heat lamp. Every order is prepared when you place it.",
  },
  {
    icon: Sparkles,
    title: "Premium ingredients",
    text: "Real chicken, real cream, real chocolate. Quality you can taste in every bite.",
  },
  {
    icon: HandHeart,
    title: "Made with passion",
    text: "We plate every box like art. It's called Picasso for a reason.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-[1020px] px-4 sm:px-6 lg:px-8">
      <header className="pt-5 lg:pt-7">
        <h1 className="font-display text-[26px] font-extrabold tracking-tight text-ink-900 lg:text-[30px]">
          About us
        </h1>
        <p className="mt-0.5 text-[13px] font-medium text-ink-500 lg:text-[14px]">
          The story behind the pink boxes.
        </p>
      </header>

      <div className="mt-5 flex flex-col gap-10 lg:gap-12">
        <AboutBlock />

        <section>
          <div className="grid gap-3 sm:grid-cols-3">
            {VALUES.map(({ icon: Icon, title, text }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-[24px] bg-white p-5 shadow-soft"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-3.5 font-display text-[15.5px] font-extrabold text-ink-900">
                  {title}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
                  {text}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <TrustBadges />

        {/* Photo strip */}
        <section className="grid grid-cols-3 gap-2.5 lg:gap-3.5">
          {GALLERY.slice(0, 3).map((g) => (
            <Link
              key={g.src}
              href="/gallery"
              className="group block overflow-hidden rounded-[20px] shadow-soft"
            >
              <FoodImage
                src={g.src}
                alt={g.alt}
                sizes="(max-width: 1024px) 33vw, 320px"
                className="aspect-[4/5] w-full"
              />
            </Link>
          ))}
        </section>

        {/* CTA */}
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 p-7 text-white shadow-pink-lg sm:p-10"
        >
          <div
            aria-hidden
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl"
          />
          <h2 className="max-w-md font-display text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px]">
            Craving something delicious right now?
          </h2>
          <p className="mt-2 max-w-sm text-[13.5px] font-medium text-white/85">
            Order in the app and pick up in Egbeda, or get it delivered to
            your door.
          </p>
          <Link
            href="/menu"
            className="group mt-5 inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-[14px] font-bold text-brand-700 shadow-float transition-transform hover:scale-[1.03]"
          >
            Explore the menu
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.section>

        <SiteFooter />
      </div>
    </div>
  );
}
