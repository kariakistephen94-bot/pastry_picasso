"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Copy,
  Landmark,
  MessageCircle,
  ShoppingBag,
  Store,
} from "lucide-react";
import FoodImage from "@/components/FoodImage";
import QuantityStepper from "@/components/QuantityStepper";
import { WhatsAppIcon } from "@/components/icons";
import { useCart, useOrders, useSettings, cartTotal } from "@/lib/store";
import { whatsappOrderUrl } from "@/lib/whatsapp";
import { BUSINESS } from "@/lib/data";
import { naira, orderRef } from "@/lib/format";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

export default function CartView({ variant }: { variant: "panel" | "page" }) {
  const lines = useCart((s) => s.lines);
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);
  const clear = useCart((s) => s.clear);
  const placeOrder = useOrders((s) => s.place);
  const profile = useSettings((s) => s.profile);
  const setProfile = useSettings((s) => s.setProfile);

  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [method, setMethod] = useState<"pickup" | "delivery">("delivery");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [placed, setPlaced] = useState<{ ref: string; waUrl: string } | null>(
    null
  );

  const total = cartTotal(lines);
  const hasMain = lines.some((l) => l.category !== "extras");

  /* If the cart empties, always land back on the order step. */
  useEffect(() => {
    if (lines.length === 0) setStep("cart");
  }, [lines.length]);

  const goToPayment = () => {
    if (!profile.name.trim()) {
      setError("Please add your name so we know who's ordering.");
      return;
    }
    if (method === "delivery" && !profile.address.trim()) {
      setError("Please add a delivery address.");
      return;
    }
    if (!hasMain) {
      setError(
        "Extras go with a main order. Add a dish from the menu first."
      );
      return;
    }
    setError(null);
    setStep("payment");
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText(BUSINESS.bank.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const confirmPayment = () => {
    const orderLines = lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      price: l.price,
    }));
    const input = {
      customerName: profile.name.trim(),
      phone: profile.phone.trim() || undefined,
      method,
      address: method === "delivery" ? profile.address.trim() : undefined,
      note: note.trim() || undefined,
      lines: orderLines,
      total,
      paymentConfirmed: true,
    };
    const id = placeOrder(input);
    const waUrl = whatsappOrderUrl(input);
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setPlaced({ ref: orderRef(id), waUrl });
    clear();
    setNote("");
    setStep("cart");
  };

  /* ── Success state ─────────────────────────────────────────── */
  if (placed) {
    return (
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        className="flex flex-col items-center px-6 py-10 text-center"
      >
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-pink-lg"
        >
          <Check className="h-9 w-9" strokeWidth={3} />
        </motion.span>
        <h3 className="mt-5 font-display text-[22px] font-extrabold tracking-tight text-ink-900">
          Order submitted!
        </h3>
        <p className="mt-1 rounded-full bg-brand-100 px-3 py-1 text-[12px] font-bold text-brand-700">
          Order {placed.ref}
        </p>
        <p className="mt-3 max-w-[300px] text-[13.5px] leading-relaxed text-ink-500">
          Your order and payment note are in the dashboard. We&apos;ve also
          opened WhatsApp. Tap send so we can verify your transfer and start
          preparing.
        </p>
        <a
          href={placed.waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex h-12 w-full max-w-[300px] items-center justify-center gap-2 rounded-2xl bg-[#25D366] text-[14.5px] font-bold text-white shadow-float transition-transform hover:scale-[1.02] active:scale-95"
        >
          <WhatsAppIcon className="h-5 w-5" />
          Open WhatsApp again
        </a>
        <button
          type="button"
          onClick={() => setPlaced(null)}
          className="mt-3 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-600"
        >
          Done
        </button>
      </motion.div>
    );
  }

  /* ── Empty state ───────────────────────────────────────────── */
  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center px-6 py-12 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-brand-100 text-brand-600">
          <ShoppingBag className="h-7 w-7" strokeWidth={2} />
        </span>
        <h3 className="mt-4 font-display text-[17px] font-extrabold text-ink-900">
          Your cart is empty
        </h3>
        <p className="mt-1 max-w-[240px] text-[13px] leading-relaxed text-ink-500">
          Good food is waiting: small chops, burgers, boba and more.
        </p>
        <Link
          href="/menu"
          className="mt-5 flex h-11 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-6 text-[13.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
        >
          Explore Menu
        </Link>
      </div>
    );
  }

  /* ── Step 2: transfer + confirm payment ────────────────────── */
  if (step === "payment") {
    return (
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col"
      >
        <button
          type="button"
          onClick={() => setStep("cart")}
          className="flex items-center gap-1.5 self-start rounded-full py-1 pr-3 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to order
        </button>

        <div className="mt-3 rounded-[20px] bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-100 text-brand-700">
              <Landmark className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-ink-400">
                Transfer exactly
              </p>
              <p className="font-display text-[24px] font-extrabold tabular-nums tracking-tight text-ink-900">
                {naira(total)}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-cream-100 p-4">
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[12.5px] font-semibold text-ink-500">
                Bank
              </span>
              <span className="text-[13.5px] font-bold text-ink-900">
                {BUSINESS.bank.bankName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-cream-300/60 py-1.5">
              <span className="text-[12.5px] font-semibold text-ink-500">
                Account name
              </span>
              <span className="text-right text-[13px] font-bold text-ink-900">
                {BUSINESS.bank.accountName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-cream-300/60 py-1.5">
              <span className="text-[12.5px] font-semibold text-ink-500">
                Account number
              </span>
              <span className="flex items-center gap-2">
                <span className="font-display text-[16px] font-extrabold tabular-nums tracking-wide text-ink-900">
                  {BUSINESS.bank.accountNumber}
                </span>
                <button
                  type="button"
                  onClick={copyAccount}
                  aria-label="Copy account number"
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg transition-all active:scale-90",
                    copied
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-white text-ink-500 shadow-soft hover:text-brand-600"
                  )}
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </span>
            </div>
          </div>

          <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-400">
            Make the transfer from your bank app, then confirm below.
            {method === "delivery" &&
              " The delivery fee is confirmed separately on WhatsApp."}
          </p>
        </div>

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={confirmPayment}
          className="mt-4 flex h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[15px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
        >
          <Check className="h-5 w-5" strokeWidth={2.6} />
          I have made the payment
        </motion.button>
        <p className="mt-2.5 flex items-center justify-center gap-1 text-center text-[11.5px] font-medium text-ink-400">
          <MessageCircle className="h-3.5 w-3.5" />
          Your order is submitted and opens in WhatsApp for confirmation.
        </p>
      </motion.div>
    );
  }

  /* ── Step 1: cart + details ────────────────────────────────── */
  return (
    <div className={cn("flex flex-col", variant === "page" && "gap-0")}>
      <ul className="flex flex-col gap-2.5">
        <AnimatePresence initial={false}>
          {lines.map((l) => (
            <motion.li
              key={l.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="flex items-center gap-3 rounded-[20px] bg-white p-2.5 shadow-soft"
            >
              <FoodImage
                src={l.image}
                alt={l.name}
                position={l.position}
                zoom={l.zoom}
                sizes="56px"
                className="h-14 w-14 shrink-0 rounded-2xl"
                hover={false}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-bold text-ink-900">
                  {l.name}
                </p>
                <p className="text-[12px] font-semibold text-brand-600">
                  {naira(l.price)}
                  {l.category === "extras" && (
                    <span className="ml-1.5 rounded-full bg-cream-200 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-ink-500">
                      Extra
                    </span>
                  )}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <QuantityStepper
                  size="sm"
                  value={l.qty}
                  onInc={() => inc(l.id)}
                  onDec={() => dec(l.id)}
                />
                <span className="pr-1 text-[11.5px] font-bold tabular-nums text-ink-500">
                  {naira(l.price * l.qty)}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Method */}
      <div className="relative mt-4 grid grid-cols-2 rounded-2xl bg-cream-200/80 p-1">
        {(["delivery", "pickup"] as const).map((m) => {
          const active = method === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={cn(
                "relative z-10 flex h-10 items-center justify-center gap-1.5 rounded-xl text-[13px] font-bold capitalize transition-colors",
                active ? "text-ink-900" : "text-ink-400 hover:text-ink-700"
              )}
            >
              {active && (
                <motion.span
                  layoutId={`method-${variant}`}
                  className="absolute inset-0 rounded-xl bg-white shadow-soft"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {m === "delivery" ? (
                  <Bike className="h-4 w-4" />
                ) : (
                  <Store className="h-4 w-4" />
                )}
                {m}
              </span>
            </button>
          );
        })}
      </div>

      {/* Details */}
      <div className="mt-3 flex flex-col gap-2.5">
        <input
          className={field}
          placeholder="Your name *"
          value={profile.name}
          onChange={(e) => setProfile({ name: e.target.value })}
        />
        <input
          className={field}
          placeholder="Phone number (optional)"
          inputMode="tel"
          value={profile.phone}
          onChange={(e) => setProfile({ phone: e.target.value })}
        />
        <AnimatePresence initial={false}>
          {method === "delivery" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <textarea
                className={cn(field, "min-h-[72px] resize-none")}
                placeholder="Delivery address *"
                value={profile.address}
                onChange={(e) => setProfile({ address: e.target.value })}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <input
          className={field}
          placeholder="Note for the kitchen (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-brand-100 px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-800"
        >
          {error}
        </motion.p>
      )}

      {/* Summary */}
      <div className="mt-4 rounded-[20px] bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-500">
          <span>Subtotal</span>
          <span className="tabular-nums">{naira(total)}</span>
        </div>
        {method === "delivery" && (
          <p className="mt-1.5 text-[11.5px] font-medium leading-relaxed text-ink-400">
            Delivery fee is confirmed on WhatsApp based on your location.
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
          <span className="text-[14px] font-bold text-ink-900">Total</span>
          <span className="font-display text-[19px] font-extrabold tabular-nums text-ink-900">
            {naira(total)}
          </span>
        </div>
      </div>

      <motion.button
        type="button"
        whileTap={{ scale: 0.97 }}
        onClick={goToPayment}
        className="mt-3.5 flex h-[52px] items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[15px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
      >
        Continue to payment
        <ArrowRight className="h-5 w-5" />
      </motion.button>
      <p className="mt-2.5 flex items-center justify-center gap-1 text-center text-[11.5px] font-medium text-ink-400">
        <Landmark className="h-3.5 w-3.5" />
        Next: transfer to our {BUSINESS.bank.bankName} account to confirm.
      </p>
    </div>
  );
}
