"use client";

import { motion } from "framer-motion";
import { ChefHat, Clock, Flame, Timer } from "lucide-react";
import FoodImage from "@/components/FoodImage";
import { BUSINESS, IMG } from "@/lib/data";
import { useSettings } from "@/lib/store";

export default function AboutBlock() {
  const business = useSettings((s) => s.business);

  const stats = [
    { icon: Clock, label: "Opening hours", value: business.hoursText },
    { icon: Timer, label: "Preparation time", value: business.prepTime },
    { icon: Flame, label: "Made to order", value: "Never pre-cooked" },
    { icon: ChefHat, label: "Prepared by", value: "Our in-house chefs" },
  ];

  return (
    <section className="overflow-hidden rounded-[28px] bg-white shadow-soft">
      <div className="grid gap-0 lg:grid-cols-[1.15fr_1fr]">
        <div className="p-6 sm:p-8 lg:p-10">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-3 py-1.5 text-[11.5px] font-bold uppercase tracking-[0.08em] text-brand-700"
          >
            <Flame className="h-3.5 w-3.5" />
            Our promise
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.05 }}
            className="mt-3.5 font-display text-[24px] font-extrabold leading-tight tracking-tight text-ink-900 lg:text-[30px]"
          >
            Freshly Prepared,
            <br />
            Every Time
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="mt-3 max-w-md text-[13.5px] leading-relaxed text-ink-500 lg:text-[14.5px]"
          >
            We&apos;re not your typical fast-food restaurant. We prepare every
            order fresh to ensure you get the best quality and taste every
            single time. Depending on your order, preparation takes{" "}
            <span className="font-semibold text-ink-700">{business.prepTime}</span>
            , and it&apos;s worth every minute.
          </motion.p>

          <div className="mt-6 grid grid-cols-2 gap-2.5">
            {stats.map(({ icon: Icon, label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: 0.1 + i * 0.05 }}
                className="rounded-2xl bg-cream-100 p-3.5"
              >
                <Icon className="h-[18px] w-[18px] text-brand-600" />
                <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                  {label}
                </p>
                <p className="mt-0.5 text-[13px] font-bold text-ink-900">
                  {value}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative hidden min-h-[420px] lg:block">
          <FoodImage
            src={IMG.odogwu}
            alt="Fresh small chops platter being prepared at The Pastry Picasso"
            position="50% 55%"
            sizes="480px"
            className="absolute inset-0"
            hover={false}
          />
          <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white to-transparent" />
        </div>
      </div>
    </section>
  );
}
