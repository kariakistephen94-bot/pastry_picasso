"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgePercent,
  Check,
  Copy,
  Coins,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Ticket,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import Pagination from "@/components/Pagination";
import { api } from "@/lib/api";
import { CATEGORIES, type MenuItem } from "@/lib/data";
import { useUI } from "@/lib/ui-store";
import { useLockBody } from "@/lib/hooks";
import { naira, shortDate } from "@/lib/format";
import {
  PROMO_STATUS_LABEL,
  emptyPromotion,
  promoLabel,
  promoStatus,
  type PromoKind,
  type PromoScope,
  type PromoStatus,
  type Promotion,
} from "@/lib/promo";
import { cn } from "@/lib/cn";

interface PromotionWithStats extends Promotion {
  discountGiven: number;
  redemptions: number;
}

const PAGE_SIZE = 8;

const field =
  "w-full rounded-2xl bg-cream-100 px-4 py-3 text-[13.5px] font-medium text-ink-900 placeholder:text-ink-300 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-300";

const label =
  "pl-1 text-[11.5px] font-bold uppercase tracking-wide text-ink-400";

const STATUS_TINT: Record<PromoStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  scheduled: "bg-blue-100 text-blue-800",
  expired: "bg-cream-200 text-ink-500",
  exhausted: "bg-amber-100 text-amber-800",
  paused: "bg-ink-200 text-ink-600",
};

const FILTERS: { id: "all" | PromoStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Live" },
  { id: "scheduled", label: "Scheduled" },
  { id: "paused", label: "Paused" },
  { id: "expired", label: "Ended" },
];

/* ── Date helpers ────────────────────────────────────────────
   <input type="datetime-local"> speaks local wall-clock time with no
   zone. toISOString() would shift it to UTC, so the offset has to come
   off before slicing, or a Lagos owner picks 9am and stores 8am. */

function toLocalInput(ms: number | null): string {
  if (ms == null) return "";
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

function fromLocalInput(value: string): number | null {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : null;
}

/* ── Page ────────────────────────────────────────────────────── */

export default function AdminPromotions() {
  const showToast = useUI((s) => s.showToast);

  const [promotions, setPromotions] = useState<PromotionWithStats[]>([]);
  const [totals, setTotals] = useState({ discountGiven: 0, redemptions: 0 });
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | PromoStatus>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Promotion | "new" | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get<{
        promotions: PromotionWithStats[];
        totals: { discountGiven: number; redemptions: number };
      }>("/api/admin/promotions", { auth: true });
      setPromotions(res.promotions ?? []);
      setTotals(res.totals ?? { discountGiven: 0, redemptions: 0 });
      setError(null);
    } catch (err: any) {
      console.error("Failed to load promotions:", err);
      setError(err?.message || "Could not load promotions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /* The editor needs real item names for the "specific items" scope. */
  useEffect(() => {
    let active = true;
    api
      .get<{ items: MenuItem[] }>("/api/menu")
      .then(({ items }) => {
        if (active) setMenu(items ?? []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const save = async (promo: Promotion) => {
    const isNew = !promo.id;
    try {
      if (isNew) {
        await api.post("/api/admin/promotions", promo, { auth: true });
      } else {
        await api.patch(`/api/admin/promotions/${promo.id}`, promo, {
          auth: true,
        });
      }
      setEditing(null);
      showToast(isNew ? "Promotion created" : "Promotion updated");
      load(true);
    } catch (err: any) {
      // Kept open on failure: the owner's typing is still in the form.
      showToast(err?.message || "Could not save the promotion.");
      throw err;
    }
  };

  const toggleActive = async (promo: PromotionWithStats) => {
    const next = !promo.active;
    setPromotions((prev) =>
      prev.map((p) => (p.id === promo.id ? { ...p, active: next } : p))
    );
    try {
      await api.patch(
        `/api/admin/promotions/${promo.id}`,
        { active: next },
        { auth: true }
      );
      showToast(next ? "Promotion is live" : "Promotion paused");
    } catch (err: any) {
      showToast(err?.message || "Could not update the promotion.");
      load(true);
    }
  };

  const remove = async (promo: PromotionWithStats) => {
    setPromotions((prev) => prev.filter((p) => p.id !== promo.id));
    try {
      await api.del(`/api/admin/promotions/${promo.id}`, { auth: true });
      showToast(`${promo.name} deleted`);
      load(true);
    } catch (err: any) {
      showToast(err?.message || "Could not delete the promotion.");
      load(true);
    }
  };

  const now = Date.now();
  const filtered = useMemo(
    () =>
      filter === "all"
        ? promotions
        : promotions.filter((p) => promoStatus(p, now) === filter),
    // `now` is only a tiebreak for expiry; recomputing per render is fine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [promotions, filter]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [filter]);

  const liveCount = promotions.filter(
    (p) => promoStatus(p, now) === "active"
  ).length;

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
            Promotions
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-ink-500">
            Discounts and promo codes, live in the app the moment you save.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 text-[12.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          New promotion
        </button>
      </header>

      {/* Summary */}
      <div className="mb-4 grid grid-cols-3 gap-3">
        {[
          {
            icon: Sparkles,
            tint: "bg-emerald-50 text-emerald-600",
            label: "Live now",
            value: String(liveCount),
          },
          {
            icon: TrendingDown,
            tint: "bg-brand-100 text-brand-700",
            label: "Discounts given",
            hint: "cancelled orders excluded",
            value: naira(totals.discountGiven),
          },
          {
            icon: Ticket,
            tint: "bg-blue-50 text-blue-600",
            label: "Times used",
            value: String(totals.redemptions),
          },
        ].map(({ icon: Icon, tint, label: l, hint, value }) => (
          <div key={l} className="rounded-[22px] bg-white p-4 shadow-soft">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-2xl",
                tint
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wide text-ink-400">
              {l}
            </p>
            <p className="mt-0.5 font-display text-[18px] font-extrabold tabular-nums tracking-tight text-ink-900 lg:text-[21px]">
              {value}
            </p>
            {hint && (
              <p className="mt-0.5 text-[10.5px] font-semibold text-ink-300">
                {hint}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          const count =
            f.id === "all"
              ? promotions.length
              : promotions.filter((p) => promoStatus(p, now) === f.id).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-2xl px-3.5 py-2 text-[12.5px] font-bold transition-colors",
                active
                  ? "bg-ink-900 text-white shadow-card"
                  : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
              )}
            >
              {f.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active ? "bg-white/20" : "bg-cream-200 text-ink-500"
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {loading && promotions.length === 0 ? (
        <p className="animate-pulse py-12 text-center text-[13px] font-semibold text-ink-400">
          Loading promotions…
        </p>
      ) : error && promotions.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] bg-white px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-red-50 text-red-500">
            <BadgePercent className="h-7 w-7" />
          </span>
          <p className="mt-4 text-[14.5px] font-bold text-ink-900">
            Could not load promotions
          </p>
          <p className="mt-1 max-w-[340px] text-[12.5px] leading-relaxed text-ink-500">
            {error}
          </p>
          <p className="mt-2 max-w-[340px] text-[12px] leading-relaxed text-ink-400">
            If this is the first time you&apos;re opening this page, run{" "}
            <code className="rounded bg-cream-100 px-1 font-bold">
              supabase/discounts.sql
            </code>{" "}
            in the Supabase SQL editor to create the tables.
          </p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-4 flex h-10 items-center justify-center rounded-xl bg-ink-900 px-5 text-[12.5px] font-bold text-white transition-all hover:bg-ink-700 active:scale-95"
          >
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center rounded-[24px] bg-white px-6 py-16 text-center shadow-soft">
          <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-100 text-brand-600">
            <BadgePercent className="h-7 w-7" />
          </span>
          <p className="mt-4 text-[14.5px] font-bold text-ink-900">
            {promotions.length === 0
              ? "No promotions yet"
              : `No ${filter === "all" ? "" : FILTERS.find((f) => f.id === filter)?.label.toLowerCase()} promotions`}
          </p>
          <p className="mt-1 max-w-[320px] text-[12.5px] leading-relaxed text-ink-500">
            Create one to run a percentage off, a naira amount off, or a promo
            code your customers type at checkout.
          </p>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="mt-5 flex h-11 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 text-[13px] font-bold text-white shadow-pink"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            New promotion
          </button>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {paged.map((p) => (
              <PromoRow
                key={p.id}
                promo={p}
                menu={menu}
                onEdit={() => setEditing(p)}
                onToggle={() => toggleActive(p)}
                onDelete={() => remove(p)}
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        limit={PAGE_SIZE}
        onPage={setPage}
      />

      <p className="mt-6 text-center text-[11.5px] font-medium leading-relaxed text-ink-400">
        Only one order-level promotion applies per order: the one that saves
        the customer the most. Item sale prices, set on the Menu page, always
        apply on top.
      </p>

      <AnimatePresence>
        {editing && (
          <PromoEditor
            promo={editing === "new" ? null : editing}
            menu={menu}
            onClose={() => setEditing(null)}
            onSave={save}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────── */

function scopeSummary(p: Promotion, menu: MenuItem[]): string {
  if (p.scope === "order") return "Whole order";
  if (p.scope === "category") {
    const names = p.categories.map(
      (id) => CATEGORIES.find((c) => c.id === id)?.label ?? id
    );
    return names.length <= 2
      ? names.join(", ")
      : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }
  const names = p.itemIds.map(
    (id) => menu.find((m) => m.id === id)?.name ?? id
  );
  return names.length <= 1
    ? (names[0] ?? "Selected items")
    : `${names[0]} +${names.length - 1}`;
}

function PromoRow({
  promo: p,
  menu,
  onEdit,
  onToggle,
  onDelete,
}: {
  promo: PromotionWithStats;
  menu: MenuItem[];
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const [copied, setCopied] = useState(false);
  const status = promoStatus(p);

  const copyCode = async () => {
    if (!p.code) return;
    try {
      await navigator.clipboard.writeText(p.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked; the code is on screen anyway */
    }
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="rounded-[20px] bg-white p-3.5 shadow-soft"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl",
            p.code
              ? "bg-brand-100 text-brand-700"
              : "bg-amber-50 text-amber-600"
          )}
        >
          {p.code ? (
            <Ticket className="h-[18px] w-[18px]" />
          ) : (
            <Tag className="h-[18px] w-[18px]" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="truncate text-[14px] font-bold text-ink-900">
              {p.name}
            </p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-bold",
                STATUS_TINT[status]
              )}
            >
              {PROMO_STATUS_LABEL[status]}
            </span>
          </div>

          <p className="mt-0.5 text-[11.5px] font-semibold text-ink-400">
            <span className="text-brand-600">{promoLabel(p)}</span>
            {" · "}
            {scopeSummary(p, menu)}
            {p.minOrder > 0 && ` · min ${naira(p.minOrder)}`}
            {p.maxDiscount != null && ` · max ${naira(p.maxDiscount)}`}
            {p.firstOrderOnly && " · first order only"}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {p.code ? (
              <button
                type="button"
                onClick={copyCode}
                title="Copy code"
                className="flex items-center gap-1.5 rounded-lg bg-cream-100 px-2 py-1 font-display text-[11.5px] font-extrabold tracking-wide text-ink-900 transition-colors hover:bg-brand-100 hover:text-brand-700"
              >
                {p.code}
                {copied ? (
                  <Check className="h-3 w-3 text-emerald-600" strokeWidth={3} />
                ) : (
                  <Copy className="h-3 w-3 opacity-60" />
                )}
              </button>
            ) : (
              <span className="rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-bold text-ink-500">
                Automatic
              </span>
            )}

            <span className="flex items-center gap-1 rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-bold text-ink-500">
              <Coins className="h-3 w-3" />
              {naira(p.discountGiven)} given
            </span>

            <span className="rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-bold tabular-nums text-ink-500">
              Used {p.redemptions}
              {p.usageLimit != null && ` / ${p.usageLimit}`}
            </span>

            {(p.startsAt != null || p.endsAt != null) && (
              <span className="rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-bold text-ink-500">
                {p.startsAt != null ? shortDate(p.startsAt) : "Now"} →{" "}
                {p.endsAt != null ? shortDate(p.endsAt) : "Open"}
              </span>
            )}

            {!p.showPublicly && (
              <span className="rounded-lg bg-cream-100 px-2 py-1 text-[11px] font-bold text-ink-500">
                Hidden from banner
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-cream-200/70 pt-3">
        <button
          type="button"
          role="switch"
          aria-checked={p.active}
          aria-label={`${p.name} live`}
          onClick={onToggle}
          className={cn(
            "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300",
            p.active ? "bg-emerald-500" : "bg-ink-300"
          )}
        >
          <span
            className={cn(
              "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-soft transition-all duration-300",
              p.active ? "left-[21px]" : "left-[3px]"
            )}
          />
        </button>
        <span className="mr-auto text-[11.5px] font-bold text-ink-400">
          {p.active ? "Live" : "Paused"}
        </span>

        <button
          type="button"
          aria-label={`Edit ${p.name}`}
          onClick={onEdit}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-ink-500 transition-colors hover:bg-brand-100 hover:text-brand-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label={`Delete ${p.name}`}
          onClick={() => {
            if (!confirm) {
              setConfirm(true);
              setTimeout(() => setConfirm(false), 3000);
              return;
            }
            onDelete();
          }}
          className={cn(
            "flex h-9 shrink-0 items-center justify-center rounded-xl transition-all",
            confirm
              ? "w-auto bg-red-500 px-2.5 text-[11px] font-bold text-white"
              : "w-9 bg-cream-100 text-ink-400 hover:bg-red-50 hover:text-red-500"
          )}
        >
          {confirm ? "Sure?" : <Trash2 className="h-4 w-4" />}
        </button>
      </div>
    </motion.li>
  );
}

/* ── Editor ──────────────────────────────────────────────────── */

function PromoEditor({
  promo,
  menu,
  onClose,
  onSave,
}: {
  promo: Promotion | null;
  menu: MenuItem[];
  onClose: () => void;
  onSave: (p: Promotion) => Promise<void>;
}) {
  useLockBody(true);
  const base = promo ?? emptyPromotion();

  const [name, setName] = useState(base.name);
  const [description, setDescription] = useState(base.description ?? "");
  const [needsCode, setNeedsCode] = useState(!!base.code);
  const [code, setCode] = useState(base.code ?? "");
  const [kind, setKind] = useState<PromoKind>(base.kind);
  const [value, setValue] = useState(String(base.value));
  const [scope, setScope] = useState<PromoScope>(base.scope);
  const [categories, setCategories] = useState<string[]>(base.categories);
  const [itemIds, setItemIds] = useState<string[]>(base.itemIds);
  const [minOrder, setMinOrder] = useState(
    base.minOrder ? String(base.minOrder) : ""
  );
  const [maxDiscount, setMaxDiscount] = useState(
    base.maxDiscount != null ? String(base.maxDiscount) : ""
  );
  const [startsAt, setStartsAt] = useState(toLocalInput(base.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(base.endsAt));
  const [usageLimit, setUsageLimit] = useState(
    base.usageLimit != null ? String(base.usageLimit) : ""
  );
  const [perCustomerLimit, setPerCustomerLimit] = useState(
    base.perCustomerLimit != null ? String(base.perCustomerLimit) : ""
  );
  const [firstOrderOnly, setFirstOrderOnly] = useState(base.firstOrderOnly);
  const [showPublicly, setShowPublicly] = useState(base.showPublicly);
  const [active, setActive] = useState(base.active);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const menuItems = useMemo(
    () => menu.filter((m) => m.category !== "extras"),
    [menu]
  );

  const toggle = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const submit = async () => {
    if (saving) return;
    const n = Number(value);

    if (!name.trim()) return setError("Give the promotion a name.");
    if (!Number.isFinite(n) || n <= 0)
      return setError("Enter a discount greater than zero.");
    if (kind === "percent" && n > 100)
      return setError("A percentage discount can't be more than 100%.");
    if (needsCode && !code.trim())
      return setError("Enter the code your customers will type.");
    if (scope === "category" && categories.length === 0)
      return setError("Pick at least one category.");
    if (scope === "items" && itemIds.length === 0)
      return setError("Pick at least one item.");

    const start = fromLocalInput(startsAt);
    const end = fromLocalInput(endsAt);
    if (start != null && end != null && end <= start)
      return setError("The end date has to come after the start date.");

    setError(null);
    setSaving(true);
    try {
      await onSave({
        ...base,
        name: name.trim(),
        description: description.trim() || undefined,
        code: needsCode ? code.trim().toUpperCase() : null,
        kind,
        value: n,
        scope,
        categories,
        itemIds,
        minOrder: Math.max(0, Math.round(Number(minOrder) || 0)),
        maxDiscount: maxDiscount ? Math.round(Number(maxDiscount)) : null,
        startsAt: start,
        endsAt: end,
        usageLimit: usageLimit ? Math.round(Number(usageLimit)) : null,
        perCustomerLimit: perCustomerLimit
          ? Math.round(Number(perCustomerLimit))
          : null,
        firstOrderOnly,
        showPublicly,
        active,
      });
    } catch {
      /* onSave already surfaced the message via the toast */
      setSaving(false);
    }
  };

  const preview =
    kind === "percent"
      ? `${value || 0}% off`
      : `${naira(Number(value) || 0)} off`;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <motion.button
        aria-label="Close editor"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-ink-950/45 backdrop-blur-[3px]"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={promo ? "Edit promotion" : "New promotion"}
        initial={{ y: "50%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "55%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream-50 shadow-float sm:max-w-[540px] sm:rounded-[28px]"
      >
        <header className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-display text-[16.5px] font-extrabold text-ink-900">
            {promo ? "Edit promotion" : "New promotion"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-cream-200/80 text-ink-500 transition-transform active:scale-90"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </header>

        <div className="flex flex-col gap-3.5 overflow-y-auto px-5 py-4">
          {/* Name + blurb */}
          <label className="flex flex-col gap-1.5">
            <span className={label}>Name (customers see this)</span>
            <input
              className={field}
              placeholder="e.g. Weekend Small Chops Deal"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className={label}>Short description (optional)</span>
            <input
              className={field}
              placeholder="e.g. 15% off every platter this weekend"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {/* Automatic vs code */}
          <div className="rounded-2xl bg-cream-100 p-3.5">
            <p className="text-[12.5px] font-bold text-ink-900">
              How customers get it
            </p>
            <div className="mt-2.5 grid grid-cols-2 gap-2">
              {[
                {
                  on: !needsCode,
                  set: () => setNeedsCode(false),
                  icon: Tag,
                  title: "Automatic",
                  blurb: "Applied to every qualifying cart",
                },
                {
                  on: needsCode,
                  set: () => setNeedsCode(true),
                  icon: Ticket,
                  title: "Promo code",
                  blurb: "Customer types it at checkout",
                },
              ].map((o) => (
                <button
                  key={o.title}
                  type="button"
                  onClick={o.set}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-2xl p-3 text-left transition-all",
                    o.on
                      ? "bg-white shadow-soft ring-2 ring-brand-300"
                      : "bg-white/60 text-ink-500"
                  )}
                >
                  <o.icon
                    className={cn(
                      "h-4 w-4",
                      o.on ? "text-brand-600" : "text-ink-400"
                    )}
                  />
                  <span className="text-[12.5px] font-bold text-ink-900">
                    {o.title}
                  </span>
                  <span className="text-[10.5px] font-medium leading-snug text-ink-400">
                    {o.blurb}
                  </span>
                </button>
              ))}
            </div>

            {needsCode && (
              <input
                className={cn(
                  field,
                  "mt-2.5 bg-white font-display font-extrabold uppercase tracking-[0.12em]"
                )}
                placeholder="EGBEDA10"
                value={code}
                maxLength={24}
                onChange={(e) =>
                  setCode(
                    e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                  )
                }
              />
            )}
          </div>

          {/* Amount */}
          <div className="rounded-2xl bg-cream-100 p-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[12.5px] font-bold text-ink-900">
                How much off
              </p>
              <span className="rounded-lg bg-brand-100 px-2 py-1 text-[11px] font-bold text-brand-700">
                {preview}
              </span>
            </div>
            <div className="mt-2.5 flex gap-2">
              <div className="grid flex-1 grid-cols-2 gap-1.5">
                {(
                  [
                    { id: "percent", label: "Percent %" },
                    { id: "fixed", label: "Naira ₦" },
                  ] as const
                ).map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    onClick={() => setKind(k.id)}
                    className={cn(
                      "h-11 rounded-xl text-[12.5px] font-bold transition-colors",
                      kind === k.id
                        ? "bg-ink-900 text-white"
                        : "bg-white text-ink-500"
                    )}
                  >
                    {k.label}
                  </button>
                ))}
              </div>
              <input
                className="h-11 w-28 shrink-0 rounded-xl bg-white px-3 text-center text-[14px] font-bold text-ink-900 outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300"
                inputMode="numeric"
                value={value}
                onChange={(e) =>
                  setValue(e.target.value.replace(/[^\d.]/g, ""))
                }
              />
            </div>
          </div>

          {/* Scope */}
          <div className="rounded-2xl bg-cream-100 p-3.5">
            <p className="text-[12.5px] font-bold text-ink-900">
              What it applies to
            </p>
            <div className="mt-2.5 grid grid-cols-3 gap-1.5">
              {(
                [
                  { id: "order", label: "Whole order" },
                  { id: "category", label: "Categories" },
                  { id: "items", label: "Items" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setScope(s.id)}
                  className={cn(
                    "h-10 rounded-xl text-[12px] font-bold transition-colors",
                    scope === s.id
                      ? "bg-ink-900 text-white"
                      : "bg-white text-ink-500"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {scope === "category" && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => {
                  const on = categories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategories((l) => toggle(l, c.id))}
                      className={cn(
                        "rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors",
                        on
                          ? "bg-brand-100 text-brand-800 ring-2 ring-brand-300"
                          : "bg-white text-ink-500"
                      )}
                    >
                      {c.emoji} {c.label}
                    </button>
                  );
                })}
              </div>
            )}

            {scope === "items" && (
              <div className="mt-2.5 flex max-h-[168px] flex-col gap-1.5 overflow-y-auto">
                {menuItems.length === 0 ? (
                  <p className="text-[12px] font-semibold text-ink-400">
                    Loading menu…
                  </p>
                ) : (
                  menuItems.map((m) => {
                    const on = itemIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setItemIds((l) => toggle(l, m.id))}
                        className={cn(
                          "flex items-center gap-2.5 rounded-xl bg-white p-2.5 text-left transition-all",
                          on && "ring-2 ring-brand-300"
                        )}
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                            on
                              ? "border-brand-600 bg-brand-600 text-white"
                              : "border-ink-300 text-transparent"
                          )}
                        >
                          <Check className="h-3 w-3" strokeWidth={3.5} />
                        </span>
                        <span className="flex-1 truncate text-[12.5px] font-semibold text-ink-900">
                          {m.name}
                        </span>
                        <span className="text-[11.5px] font-bold text-ink-400">
                          {naira(m.price)}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Guardrails */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className={label}>Minimum order (₦)</span>
              <input
                className={field}
                placeholder="No minimum"
                inputMode="numeric"
                value={minOrder}
                onChange={(e) =>
                  setMinOrder(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Most it can take off (₦)</span>
              <input
                className={field}
                placeholder="No cap"
                inputMode="numeric"
                value={maxDiscount}
                onChange={(e) =>
                  setMaxDiscount(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Starts</span>
              <input
                type="datetime-local"
                className={field}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Ends</span>
              <input
                type="datetime-local"
                className={field}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Total uses allowed</span>
              <input
                className={field}
                placeholder="Unlimited"
                inputMode="numeric"
                value={usageLimit}
                onChange={(e) =>
                  setUsageLimit(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Uses per customer</span>
              <input
                className={field}
                placeholder="Unlimited"
                inputMode="numeric"
                value={perCustomerLimit}
                onChange={(e) =>
                  setPerCustomerLimit(e.target.value.replace(/[^\d]/g, ""))
                }
              />
            </label>
          </div>

          {/* Switches */}
          <div className="flex flex-col gap-2">
            {[
              {
                on: firstOrderOnly,
                set: setFirstOrderOnly,
                title: "First order only",
                blurb: "Only customers who have never ordered before",
              },
              {
                on: showPublicly,
                set: setShowPublicly,
                title: "Show on the site banner",
                blurb: "Advertises this offer on the home and menu pages",
              },
              {
                on: active,
                set: setActive,
                title: "Live",
                blurb: "Turn off to pause without deleting",
              },
            ].map((s) => (
              <button
                key={s.title}
                type="button"
                role="switch"
                aria-checked={s.on}
                onClick={() => s.set(!s.on)}
                className="flex items-center gap-3 rounded-2xl bg-cream-100 p-3.5 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-bold text-ink-900">
                    {s.title}
                  </p>
                  <p className="text-[11px] font-medium text-ink-400">
                    {s.blurb}
                  </p>
                </div>
                <span
                  className={cn(
                    "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300",
                    s.on ? "bg-emerald-500" : "bg-ink-300"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-soft transition-all duration-300",
                      s.on ? "left-[21px]" : "left-[3px]"
                    )}
                  />
                </span>
              </button>
            ))}
          </div>

          {error && (
            <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-[12.5px] font-semibold text-red-600">
              {error}
            </p>
          )}
        </div>

        <footer className="flex gap-2.5 border-t border-cream-200 bg-cream-50 px-5 py-4 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-2xl bg-cream-200/80 px-5 text-[13.5px] font-bold text-ink-700 transition-colors hover:bg-cream-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={cn(
              "h-11 flex-1 rounded-2xl text-[13.5px] font-bold text-white transition-all",
              saving
                ? "cursor-not-allowed bg-ink-300"
                : "bg-gradient-to-r from-brand-600 to-brand-500 shadow-pink hover:shadow-pink-lg active:scale-95"
            )}
          >
            {saving
              ? "Saving…"
              : promo
                ? "Save changes"
                : "Create promotion"}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
