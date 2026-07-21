"use client";

import { motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import { TRUST_BADGES } from "@/lib/data";

export default function TrustBadges() {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:gap-3 lg:overflow-visible lg:px-0">
      {TRUST_BADGES.map((badge, i) => (
        <motion.div
          key={badge}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="glass flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 shadow-soft lg:justify-center"
        >
          <BadgeCheck className="h-[18px] w-[18px] shrink-0 text-brand-600" />
          <span className="whitespace-nowrap text-[12.5px] font-bold text-ink-900 lg:text-[13px]">
            {badge}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
