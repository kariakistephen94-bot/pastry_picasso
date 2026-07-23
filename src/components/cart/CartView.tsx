"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Bike,
  Check,
  Landmark,
  MailCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import FoodImage from "@/components/FoodImage";
import QuantityStepper from "@/components/QuantityStepper";
import BankDetails from "@/components/BankDetails";
import { useCart, useOrders, useSettings, cartTotal } from "@/lib/store";
import { notifyOrderByEmail } from "@/lib/notify";
import { BUSINESS } from "@/lib/data";
import { naira, orderRef } from "@/lib/format";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

export default function CartView({ variant }: { variant: "panel" | "page" }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);
  const clear = useCart((s) => s.clear);
  const placeOrder = useOrders((s) => s.place);
  const profile = useSettings((s) => s.profile);
  const setProfile = useSettings((s) => s.setProfile);
  const saveProfile = useSettings((s) => s.saveProfile);

  const [step, setStep] = useState<"cart" | "payment">("cart");
  const [method, setMethod] = useState<"pickup" | "delivery">("delivery");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attested, setAttested] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = cartTotal(lines);

  /* If the cart empties, always land back on the order step. */
  useEffect(() => {
    if (lines.length === 0) {
      setStep("cart");
      setAttested(false);
    }
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
    setError(null);
    setAttested(false);
    setStep("payment");
  };

  const submitOrder = async () => {
    if (!attested || submitting) return;
    setSubmitting(true);
    setError(null);

    // Save profile details to public.customers first
    try {
      await saveProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        address: method === "delivery" ? profile.address.trim() : profile.address,
      });
    } catch (e) {
      console.error("Failed to save profile during checkout:", e);
    }

    try {
      const order = await placeOrder({
        customerName: profile.name.trim(),
        phone: profile.phone.trim() || undefined,
        method,
        address: method === "delivery" ? profile.address.trim() : undefined,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty })),
        paymentConfirmed: true,
        customerId: profile.id || undefined,
      });

      notifyOrderByEmail(order);

      clear();
      setNote("");
      setStep("cart");
      setAttested(false);
      setSubmitting(false);
      router.push(`/order/placed?id=${orderRef(order.id)}`);
    } catch (e: any) {
      setError(e?.message || "Failed to place order. Please try again.");
      setSubmitting(false);
    }
  };

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

  /* ── Step 2: transfer + confirm + submit ───────────────────── */
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

          <BankDetails className="mt-4" />

          <p className="mt-3 text-[12px] font-medium leading-relaxed text-ink-400">
            Make the transfer from your bank app, then confirm below.
            {method === "delivery" &&
              " The delivery fee is confirmed separately."}
          </p>
        </div>

        {/* Confirmation check: required before the submit button appears */}
        <button
          type="button"
          role="checkbox"
          aria-checked={attested}
          onClick={() => setAttested((a) => !a)}
          className={cn(
            "mt-3.5 flex w-full items-start gap-3 rounded-2xl p-4 text-left shadow-soft transition-colors",
            attested ? "bg-brand-50 ring-1 ring-brand-300" : "bg-white"
          )}
        >
          <span
            className={cn(
              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all",
              attested
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-300 bg-white text-transparent"
            )}
          >
            <Check className="h-4 w-4" strokeWidth={3.5} />
          </span>
          <span className="text-[13px] font-semibold leading-relaxed text-ink-700">
            I have transferred {naira(total)} to the {BUSINESS.bank.bankName}{" "}
            account above.
          </span>
        </button>

        <AnimatePresence initial={false}>
          {attested && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden"
            >
              <motion.button
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={submitOrder}
                disabled={submitting}
                className="mt-3.5 flex h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[15px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg disabled:opacity-50"
              >
                {submitting ? "Submitting order..." : "Submit order"}
                {!submitting && <ArrowRight className="h-5 w-5" />}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-2.5 flex items-center justify-center gap-1.5 text-center text-[11.5px] font-medium text-ink-400">
          <MailCheck className="h-3.5 w-3.5" />
          The store is notified instantly. No WhatsApp redirect.
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
            Delivery fee is confirmed after your order, based on your location.
          </p>
        )}
        <div className="mt-3 flex items-center justify-between border-t border-cream-200 pt-3">
          <span className="text-[14px] font-bold text-ink-900">Total</span>
          <span className="font-display text-[19px] font-extrabold tabular-nums text-ink-900">
            {naira(total)}
          </span>
        </div>
      </div>

      {/* Payment account preview, every field copyable */}
      <div className="mt-3 rounded-[20px] bg-white p-4 shadow-soft">
        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
          <Landmark className="h-3.5 w-3.5 text-brand-600" />
          Payment account
        </p>
        <BankDetails />
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
        Transfer to the {BUSINESS.bank.bankName} account above to confirm your
        order.
      </p>
    </div>
  );
}
