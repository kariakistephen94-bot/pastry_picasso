"use client";

import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { WhatsAppIcon } from "@/components/icons";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/cn";

export default function FloatingWhatsApp() {
  const pathname = usePathname();
  const onOrder = pathname.startsWith("/order");

  return (
    <motion.a
      href={whatsappChatUrl("Hello The Pastry Picasso! 🧁 I'd like to place an order.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Order on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 22, delay: 0.6 }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "fixed z-40 flex items-center gap-2.5 rounded-full bg-[#25D366] text-white shadow-float animate-pulse-ring",
        "bottom-[104px] right-4 h-14 w-14 justify-center",
        "lg:bottom-6 lg:h-[52px] lg:w-auto lg:px-5",
        onOrder ? "lg:right-6" : "lg:right-6 xl:right-[392px]"
      )}
    >
      <WhatsAppIcon className="h-6 w-6 lg:h-5 lg:w-5" />
      <span className="hidden text-[13.5px] font-bold lg:inline">
        Order on WhatsApp
      </span>
    </motion.a>
  );
}
