"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

/**
 * Positions the main content between the desktop sidebar (lg+) and the
 * cart panel (xl+, hidden on /order where the page shows the full cart).
 */
export default function SiteFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onOrder = pathname.startsWith("/order");

  return (
    <div
      className={cn(
        "relative min-h-dvh lg:pl-[280px]",
        !onOrder && "xl:pr-[376px]"
      )}
    >
      {children}
    </div>
  );
}
