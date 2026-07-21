"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, UtensilsCrossed } from "lucide-react";
import { BUSINESS, IMG } from "@/lib/data";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-[28px] shadow-card">
      <div className="relative h-[480px] w-full sm:h-[520px] lg:h-[560px]">
        <Image
          src={IMG.hero}
          alt="The Pastry Picasso burgers, bubble tea, shawarma, waffles and milkshakes on a pink table"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 900px"
          className="object-cover"
          style={{ objectPosition: "50% 42%" }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/30 to-ink-950/5" />

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } },
            }}
            className="max-w-2xl"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.6, ease } } }}
              className="glass inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5"
            >
              <span className="relative h-6 w-6 overflow-hidden rounded-full bg-white/90">
                <Image
                  src={IMG.logo}
                  alt=""
                  fill
                  sizes="24px"
                  className="object-contain p-0.5"
                />
              </span>
              <span className="text-[11.5px] font-bold tracking-wide text-ink-900">
                The Pastry Picasso · Egbeda, Lagos
              </span>
            </motion.div>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 22 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
              className="mt-4 font-display text-[27px] font-extrabold leading-[1.12] tracking-tight text-white sm:text-[36px] lg:text-[42px]"
            >
              Lagos&apos; favorite destination for{" "}
              <span className="bg-gradient-to-r from-brand-300 to-brand-400 bg-clip-text text-transparent">
                irresistible treats
              </span>{" "}
              &amp; refreshing delights
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
              className="mt-3 hidden max-w-xl text-[13.5px] leading-relaxed text-white/75 sm:block lg:text-[14.5px]"
            >
              Burgers, creamy milkshakes, refreshing bubble teas, rich yoghurts,
              crispy waffles and tasty small chops, all freshly prepared with
              premium ingredients and made with passion.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } } }}
              className="mt-5 flex flex-wrap items-center gap-2.5 lg:mt-6"
            >
              <Link
                href="/menu"
                className="group flex h-12 items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-[14px] font-bold text-white shadow-pink transition-all hover:shadow-pink-lg lg:h-[52px] lg:px-7 lg:text-[15px]"
              >
                Order Now
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/menu#browse"
                className="glass flex h-12 items-center gap-2 rounded-2xl px-6 text-[14px] font-bold text-ink-900 transition-transform hover:scale-[1.02] lg:h-[52px] lg:px-7 lg:text-[15px]"
              >
                <UtensilsCrossed className="h-4 w-4" />
                Explore Menu
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
