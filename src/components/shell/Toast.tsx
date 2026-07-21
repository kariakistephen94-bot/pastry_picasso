"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useUI } from "@/lib/ui-store";

export default function Toast() {
  const toast = useUI((s) => s.toast);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[110px] z-[70] flex justify-center lg:bottom-8">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.92 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 12, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="flex items-center gap-2 rounded-full bg-ink-900/92 py-2.5 pl-3.5 pr-5 text-[13.5px] font-semibold text-white shadow-float backdrop-blur-xl"
          >
            <CheckCircle2 className="h-[18px] w-[18px] text-brand-300" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
