import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  sub?: string;
  action?: { href: string; label: string };
}

export default function SectionHeader({ title, sub, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4 lg:mb-5">
      <div>
        <h2 className="font-display text-[20px] font-extrabold tracking-tight text-ink-900 lg:text-[24px]">
          {title}
        </h2>
        {sub && (
          <p className="mt-0.5 text-[12.5px] font-medium text-ink-500 lg:text-[13.5px]">
            {sub}
          </p>
        )}
      </div>
      {action && (
        <Link
          href={action.href}
          className="group flex shrink-0 items-center gap-0.5 rounded-full py-1 pl-3 pr-2 text-[12.5px] font-bold text-brand-600 transition-colors hover:bg-brand-100/70 lg:text-[13px]"
        >
          {action.label}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
