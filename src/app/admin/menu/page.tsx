"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ImagePlus,
  Lightbulb,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import FoodImage from "@/components/FoodImage";
import { CATEGORIES, type MenuItem } from "@/lib/data";
import { useMenu } from "@/lib/store";
import { useUI } from "@/lib/ui-store";
import { useLockBody } from "@/lib/hooks";
import { fileToDataUrl, slugify } from "@/lib/image";
import { naira } from "@/lib/format";
import { cn } from "@/lib/cn";

const ALL_CATS = CATEGORIES.map((c) => ({ id: c.id as string, label: c.label }));

const field =
  "w-full rounded-2xl bg-cream-100 px-4 py-3 text-[13.5px] font-medium text-ink-900 placeholder:text-ink-300 outline-none ring-1 ring-transparent transition focus:bg-white focus:ring-2 focus:ring-brand-300";

export default function AdminMenu() {
  const items = useMenu((s) => s.items);
  const upsert = useMenu((s) => s.upsert);
  const remove = useMenu((s) => s.remove);
  const toggleAvailable = useMenu((s) => s.toggleAvailable);
  const resetMenu = useMenu((s) => s.resetMenu);
  const showToast = useUI((s) => s.showToast);

  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [editing, setEditing] = useState<MenuItem | "new" | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter(
      (i) =>
        (cat === "all" || i.category === cat) &&
        (!q || i.name.toLowerCase().includes(q))
    );
  }, [items, query, cat]);

  const placeholderPrices = items.some(
    (i) =>
      (i.id === "odogwu-platter" && i.price === 45000) ||
      (i.id === "all-in-one-platter" && i.price === 15000)
  );

  return (
    <div className="mx-auto max-w-[880px]">
      <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[24px] font-extrabold tracking-tight text-ink-900 lg:text-[28px]">
            Menu
          </h1>
          <p className="mt-0.5 text-[13px] font-medium text-ink-500">
            {items.length} items · changes go live in the app instantly.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (!confirmReset) {
                setConfirmReset(true);
                setTimeout(() => setConfirmReset(false), 3500);
                return;
              }
              resetMenu();
              setConfirmReset(false);
              showToast("Menu restored to defaults");
            }}
            className={cn(
              "flex h-10 items-center gap-1.5 rounded-2xl px-3.5 text-[12.5px] font-bold transition-colors",
              confirmReset
                ? "bg-red-500 text-white"
                : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {confirmReset ? "Confirm reset?" : "Reset"}
          </button>
          <button
            type="button"
            onClick={() => setEditing("new")}
            className="flex h-10 items-center gap-1.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 text-[12.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
          >
            <Plus className="h-4 w-4" strokeWidth={2.6} />
            Add item
          </button>
        </div>
      </header>

      {placeholderPrices && (
        <div className="mb-4 flex items-start gap-3 rounded-[20px] bg-amber-50 p-4">
          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <p className="text-[12.5px] font-semibold leading-relaxed text-amber-800">
            The Odogwu and All-In-One platter prices are placeholders. Tap the
            pencil to set your real prices.
          </p>
        </div>
      )}

      {/* Search + category filter */}
      <div className="mb-4 flex flex-col gap-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items…"
            className="h-11 w-full rounded-2xl bg-white pl-10 pr-4 text-[13.5px] font-medium shadow-soft outline-none ring-1 ring-transparent transition placeholder:text-ink-300 focus:ring-2 focus:ring-brand-300"
          />
        </div>
        <div className="no-scrollbar -mx-4 flex gap-1.5 overflow-x-auto px-4 lg:mx-0 lg:flex-wrap lg:px-0">
          {[{ id: "all", label: "All" }, ...ALL_CATS].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCat(c.id)}
              className={cn(
                "shrink-0 rounded-xl px-3 py-1.5 text-[12px] font-bold transition-colors",
                cat === c.id
                  ? "bg-ink-900 text-white"
                  : "bg-white text-ink-500 shadow-soft hover:text-ink-900"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <ul className="flex flex-col gap-2">
        <AnimatePresence initial={false}>
          {filtered.map((item) => (
            <MenuRow
              key={item.id}
              item={item}
              onEdit={() => setEditing(item)}
              onToggle={() => toggleAvailable(item.id)}
              onDelete={() => {
                remove(item.id);
                showToast(`${item.name} removed`);
              }}
            />
          ))}
        </AnimatePresence>
      </ul>
      {filtered.length === 0 && (
        <p className="py-12 text-center text-[13px] font-semibold text-ink-400">
          No items match your search.
        </p>
      )}

      <AnimatePresence>
        {editing && (
          <MenuEditor
            item={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSave={(item) => {
              upsert(item);
              setEditing(null);
              showToast(editing === "new" ? "Item added to menu" : "Item updated");
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────────────── */

function MenuRow({
  item,
  onEdit,
  onToggle,
  onDelete,
}: {
  item: MenuItem;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [confirm, setConfirm] = useState(false);
  const available = item.available !== false;
  const catLabel =
    ALL_CATS.find((c) => c.id === item.category)?.label ?? item.category;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className="flex items-center gap-3 rounded-[20px] bg-white p-3 shadow-soft"
    >
      <FoodImage
        src={item.image}
        alt={item.name}
        position={item.position}
        zoom={item.zoom}
        sizes="48px"
        className={cn("h-12 w-12 shrink-0 rounded-xl", !available && "opacity-50 grayscale")}
        hover={false}
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-[13.5px] font-bold",
            available ? "text-ink-900" : "text-ink-400 line-through"
          )}
        >
          {item.name}
        </p>
        <p className="text-[11.5px] font-semibold text-ink-400">
          {catLabel} · {naira(item.price)}
          {item.popular && " · ⭐ popular"}
        </p>
      </div>

      {/* availability switch */}
      <button
        type="button"
        role="switch"
        aria-checked={available}
        aria-label={`${item.name} availability`}
        onClick={onToggle}
        className={cn(
          "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300",
          available ? "bg-emerald-500" : "bg-ink-300"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-soft transition-all duration-300",
            available ? "left-[21px]" : "left-[3px]"
          )}
        />
      </button>

      <button
        type="button"
        aria-label={`Edit ${item.name}`}
        onClick={onEdit}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cream-100 text-ink-500 transition-colors hover:bg-brand-100 hover:text-brand-700"
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label={`Delete ${item.name}`}
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
    </motion.li>
  );
}

/* ── Editor modal ────────────────────────────────────────────── */

function MenuEditor({
  item,
  onClose,
  onSave,
}: {
  item: MenuItem | null;
  onClose: () => void;
  onSave: (item: MenuItem) => void;
}) {
  useLockBody(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(item ? String(item.price) : "");
  const [category, setCategory] = useState<string>(item?.category ?? "small-chops");
  const [description, setDescription] = useState(item?.description ?? "");
  const [serves, setServes] = useState(item?.serves ?? "");
  const [includes, setIncludes] = useState(item?.includes?.join("\n") ?? "");
  const [image, setImage] = useState(item?.image ?? "");
  const [popular, setPopular] = useState(item?.popular ?? false);
  const [featured, setFeatured] = useState(item?.featured ?? false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      setImage(await fileToDataUrl(file));
    } catch {
      setError("Could not read that image. Try a JPG or PNG.");
    } finally {
      setUploading(false);
    }
  };

  const save = () => {
    const p = Math.round(Number(price));
    if (!name.trim()) return setError("Give the item a name.");
    if (!Number.isFinite(p) || p <= 0) return setError("Enter a valid price in naira.");
    if (!image) return setError("Add a photo. Beautiful food sells itself.");

    onSave({
      ...(item ?? {}),
      id: item?.id ?? slugify(name),
      name: name.trim(),
      price: p,
      category: category as MenuItem["category"],
      description: description.trim() || undefined,
      serves: serves.trim() || undefined,
      includes: includes
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      image,
      position: item?.image === image ? item?.position : "50% 50%",
      zoom: item?.image === image ? item?.zoom : undefined,
      popular,
      featured,
    });
  };

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
        initial={{ y: "50%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "55%", opacity: 0 }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-cream-50 shadow-float sm:max-w-[520px] sm:rounded-[28px]"
      >
        <header className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-display text-[16.5px] font-extrabold text-ink-900">
            {item ? "Edit item" : "New menu item"}
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

        <div className="flex flex-col gap-3 overflow-y-auto px-5 py-4">
          {/* Image */}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="group relative h-44 w-full overflow-hidden rounded-[20px] bg-cream-200 transition-shadow hover:shadow-card"
          >
            {image ? (
              <FoodImage
                src={image}
                alt="Item photo"
                position={item?.image === image ? item?.position : undefined}
                zoom={item?.image === image ? item?.zoom : undefined}
                sizes="520px"
                className="absolute inset-0"
                hover={false}
              />
            ) : null}
            <span
              className={cn(
                "absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[12.5px] font-bold transition-colors",
                image
                  ? "bg-ink-950/0 text-transparent group-hover:bg-ink-950/40 group-hover:text-white"
                  : "text-ink-400"
              )}
            >
              <ImagePlus className="h-6 w-6" />
              {uploading ? "Processing…" : image ? "Change photo" : "Upload a photo"}
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pickImage(e.target.files?.[0])}
          />

          <input
            className={field}
            placeholder="Item name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              className={field}
              placeholder="Price (₦) *"
              inputMode="numeric"
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))}
            />
            <select
              className={cn(field, "appearance-none")}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ALL_CATS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            className={cn(field, "min-h-[76px] resize-none")}
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className={field}
            placeholder="Serves (e.g. Serves up to 20 guests)"
            value={serves}
            onChange={(e) => setServes(e.target.value)}
          />
          <textarea
            className={cn(field, "min-h-[76px] resize-none")}
            placeholder={"What's inside, one per line\ne.g. 15 Samosa"}
            value={includes}
            onChange={(e) => setIncludes(e.target.value)}
          />

          <div className="flex gap-2.5">
            {[
              { label: "⭐ Popular", value: popular, set: setPopular },
              { label: "✨ Featured", value: featured, set: setFeatured },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                onClick={() => f.set(!f.value)}
                className={cn(
                  "flex-1 rounded-2xl px-3 py-2.5 text-[12.5px] font-bold transition-colors",
                  f.value
                    ? "bg-brand-100 text-brand-800 ring-2 ring-brand-300"
                    : "bg-cream-100 text-ink-500"
                )}
              >
                {f.label}
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
            onClick={save}
            className="h-11 flex-1 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[13.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
          >
            {item ? "Save changes" : "Add to menu"}
          </button>
        </footer>
      </motion.div>
    </div>
  );
}
