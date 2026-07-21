import type { OrderStatus } from "@/lib/store";
import { cn } from "@/lib/cn";

const STYLES: Record<OrderStatus, { label: string; cls: string; dot: string }> = {
  new: { label: "New", cls: "bg-brand-100 text-brand-800", dot: "bg-brand-600" },
  preparing: { label: "Preparing", cls: "bg-amber-100 text-amber-800", dot: "bg-amber-500" },
  ready: { label: "Ready", cls: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-500" },
  completed: { label: "Completed", cls: "bg-cream-200 text-ink-500", dot: "bg-ink-400" },
};

export default function StatusChip({ status }: { status: OrderStatus }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
        s.cls
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {s.label}
    </span>
  );
}
