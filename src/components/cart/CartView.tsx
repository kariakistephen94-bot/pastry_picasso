"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BadgePercent,
  Bike,
  Check,
  Landmark,
  MailCheck,
  ShoppingBag,
  Store,
  Tag,
  X,
} from "lucide-react";
import FoodImage from "@/components/FoodImage";
import QuantityStepper from "@/components/QuantityStepper";
import BankDetails from "@/components/BankDetails";
import {
  useCart,
  useOrders,
  useSettings,
  cartListTotal,
  cartTotal,
} from "@/lib/store";
import { api } from "@/lib/api";
import { notifyOrderByEmail } from "@/lib/notify";
import { BUSINESS } from "@/lib/data";
import type { AppliedPromo } from "@/lib/promo";
import { naira, orderRef } from "@/lib/format";
import { cn } from "@/lib/cn";

/** What POST /api/promo/quote gives back. */
interface CartQuote {
  subtotal: number;
  discount: number;
  total: number;
  applied: AppliedPromo | null;
  codeError: string | null;
  notice: string | null;
  lines: {
    id: string;
    name: string;
    qty: number;
    unitPrice: number;
    listPrice: number | null;
  }[];
}

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

export default function CartView({ variant }: { variant: "panel" | "page" }) {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);
  const clear = useCart((s) => s.clear);
  const promoCode = useCart((s) => s.promoCode);
  const setPromoCode = useCart((s) => s.setPromoCode);
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
  const [codeInput, setCodeInput] = useState(promoCode);
  const [quote, setQuote] = useState<CartQuote | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  /** Bumped to force a re-quote after a rejected checkout. */
  const [refresh, setRefresh] = useState(0);

  /* The cart, priced locally. Used until the server quote lands and as
     the fallback if it never does — the customer always sees a total. */
  const localSubtotal = cartTotal(lines);
  const localListTotal = cartListTotal(lines);

  /* Re-quote whenever the cart, the code or the email changes. The
     server owns every figure here: live menu prices, the best automatic
     deal, and whether this customer may use the code they typed. */
  const cartKey = lines.map((l) => `${l.id}x${l.qty}`).join("|");
  const email = profile.email.trim();

  useEffect(() => {
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setQuoting(true);
      try {
        const res = await api.post<CartQuote>(
          "/api/promo/quote",
          {
            items: lines.map((l) => ({ id: l.id, qty: l.qty })),
            code: promoCode || null,
            email: email || null,
          },
          { signal: controller.signal }
        );
        if (!controller.signal.aborted) {
          setQuote(res);
          setQuoteError(null);
        }
      } catch {
        // Offline or a bad response: fall back to local prices. The
        // order route re-prices everything anyway, so nothing incorrect
        // can be charged — the customer just doesn't see the deal yet.
        if (!controller.signal.aborted) {
          setQuote(null);
          // Silent unless they are waiting on a code, in which case
          // tapping Apply and getting nothing back is worse than an
          // honest "we couldn't check that".
          setQuoteError(
            promoCode
              ? "We couldn't check that code just now. Please try again."
              : null
          );
        }
      } finally {
        if (!controller.signal.aborted) setQuoting(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey, promoCode, email, lines.length, refresh]);

  const subtotal = quote?.subtotal ?? localSubtotal;
  const discount = quote?.discount ?? 0;
  const total = quote?.total ?? localSubtotal;

  /* Money saved by items being on sale, which is separate from (and
     stacks with) the order-level promotion. */
  const itemSavings = quote
    ? quote.lines.reduce(
        (n, l) => n + ((l.listPrice ?? l.unitPrice) - l.unitPrice) * l.qty,
        0
      )
    : Math.max(0, localListTotal - localSubtotal);

  /* Server-priced lines, so the cart shows today's prices even if this
     browser has been holding a stale cart since last week. */
  const priced = new Map((quote?.lines ?? []).map((l) => [l.id, l]));

  const applyCode = () => {
    const next = codeInput.trim().toUpperCase();
    setCodeInput(next);
    setPromoCode(next);
  };

  const removeCode = () => {
    setCodeInput("");
    setPromoCode("");
  };

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
    if (!profile.email.trim()) {
      setError("Please add your email so we can send your receipt and tracking ID.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profile.email.trim())) {
      setError("Please enter a valid email address.");
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
        email: profile.email.trim(),
        phone: profile.phone.trim(),
        address: method === "delivery" ? profile.address.trim() : profile.address,
      });
    } catch (e) {
      console.error("Failed to save profile during checkout:", e);
    }

    try {
      const order = await placeOrder({
        customerName: profile.name.trim(),
        email: profile.email.trim(),
        phone: profile.phone.trim() || undefined,
        method,
        address: method === "delivery" ? profile.address.trim() : undefined,
        note: note.trim() || undefined,
        items: lines.map((l) => ({ id: l.id, name: l.name, qty: l.qty })),
        paymentConfirmed: true,
        customerId: profile.id || undefined,
        promoCode: promoCode || undefined,
      });

      notifyOrderByEmail(order);

      // Navigate first, then clear. `submitting` stays true so the "Placing
      // your order" screen (below) covers the transition — we never flash the
      // empty-cart state on the way to the confirmation page.
      router.push(`/order/placed?id=${orderRef(order.id)}`);
      setNote("");
      clear();
    } catch (e: any) {
      setError(e?.message || "Failed to place order. Please try again.");
      // A rejected order often means the cart or the offer moved under
      // us (an item sold out, a code ran out). Re-price so the screen
      // stops showing a total the server has already refused.
      setRefresh((n) => n + 1);
      setSubmitting(false);
    }
  };

  /* ── Placing / redirecting ─────────────────────────────────── */
  // Shown from the moment we submit until the confirmation page takes over,
  // so the cart never appears to "empty out" in front of the customer.
  if (submitting) {
    return (
      <div className="flex flex-col items-center px-6 py-16 text-center">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
        <p className="mt-4 text-[14px] font-bold text-ink-900">
          Placing your order…
        </p>
        <p className="mt-1 text-[12.5px] font-medium text-ink-500">
          Hang tight, taking you to your receipt.
        </p>
      </div>
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

          {discount > 0 && (
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2.5">
              <BadgePercent className="h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-[12px] font-semibold leading-snug text-emerald-800">
                {naira(discount)} off with {quote?.applied?.name ?? "your offer"}
                {quote?.applied?.code ? ` (${quote.applied.code})` : ""}. Was{" "}
                <span className="line-through">{naira(subtotal)}</span>.
              </p>
            </div>
          )}

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

        {/* A failed submit lands here, not on the cart step, so the banner has
            to exist in both returns or the customer sees nothing at all. */}
        {error && (
          <motion.p
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl bg-brand-100 px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-800"
          >
            {error}
          </motion.p>
        )}

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
          {lines.map((l) => {
            /* Server price when we have one, cached price until then. */
            const server = priced.get(l.id);
            const unit = server?.unitPrice ?? l.price;
            const list = server ? (server.listPrice ?? null) : (l.listPrice ?? null);
            const onSale = list != null && list > unit;
            return (
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
                  {naira(unit)}
                  {onSale && (
                    <span className="ml-1.5 font-medium text-ink-400 line-through">
                      {naira(list)}
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
                  {naira(unit * l.qty)}
                </span>
              </div>
            </motion.li>
            );
          })}
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
          type="email"
          placeholder="Email address * (for tracking receipt)"
          value={profile.email}
          onChange={(e) => setProfile({ email: e.target.value })}
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
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl bg-brand-100 px-3.5 py-2.5 text-[12.5px] font-semibold text-brand-800"
        >
          {error}
        </motion.p>
      )}

      {/* Promo code */}
      <div className="mt-3 rounded-[20px] bg-white p-4 shadow-soft">
        <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-ink-400">
          <Tag className="h-3.5 w-3.5 text-brand-600" />
          Promo code
        </p>

        {quote?.applied?.code ? (
          <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-50 px-3.5 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[13px] font-extrabold tracking-wide text-emerald-900">
                {quote.applied.code}
              </p>
              <p className="truncate text-[11.5px] font-semibold text-emerald-700">
                {quote.applied.name} · {naira(discount)} off
              </p>
            </div>
            <button
              type="button"
              onClick={removeCode}
              aria-label="Remove promo code"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-ink-400 transition-colors hover:text-red-500"
            >
              <X className="h-4 w-4" strokeWidth={2.6} />
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              className={cn(
                field,
                "h-[46px] flex-1 py-0 font-display font-extrabold uppercase tracking-[0.1em] placeholder:font-sans placeholder:font-medium placeholder:tracking-normal"
              )}
              placeholder="Have a code?"
              maxLength={24}
              value={codeInput}
              onChange={(e) =>
                setCodeInput(
                  e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "")
                )
              }
              onKeyDown={(e) => e.key === "Enter" && applyCode()}
            />
            <button
              type="button"
              onClick={applyCode}
              disabled={!codeInput.trim() || quoting}
              className={cn(
                "h-[46px] shrink-0 rounded-2xl px-5 text-[13px] font-bold transition-all",
                codeInput.trim() && !quoting
                  ? "bg-ink-900 text-white hover:bg-ink-700 active:scale-95"
                  : "cursor-not-allowed bg-cream-200 text-ink-400"
              )}
            >
              {quoting ? "Checking…" : "Apply"}
            </button>
          </div>
        )}

        {(quote?.codeError || quoteError) && (
          <p className="mt-2.5 rounded-xl bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
            {quote?.codeError ?? quoteError}
          </p>
        )}
        {quote?.notice && (
          <p className="mt-2.5 rounded-xl bg-amber-50 px-3 py-2 text-[12px] font-semibold text-amber-800">
            {quote.notice}
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="mt-3 rounded-[20px] bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between text-[13px] font-semibold text-ink-500">
          <span>Subtotal</span>
          <span className="tabular-nums">{naira(subtotal)}</span>
        </div>

        {itemSavings > 0 && (
          <div className="mt-1.5 flex items-center justify-between text-[13px] font-semibold text-emerald-600">
            <span>Sale savings</span>
            <span className="tabular-nums">−{naira(itemSavings)}</span>
          </div>
        )}

        {discount > 0 && (
          <div className="mt-1.5 flex items-start justify-between gap-3 text-[13px] font-semibold text-emerald-600">
            <span className="flex min-w-0 items-center gap-1.5">
              <BadgePercent className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {quote?.applied?.name ?? "Discount"}
              </span>
            </span>
            <span className="shrink-0 tabular-nums">−{naira(discount)}</span>
          </div>
        )}

        {/* An automatic deal the customer never asked for deserves a
            word, or the total just looks wrong to them. */}
        {discount > 0 && !quote?.applied?.code && (
          <p className="mt-1.5 text-[11.5px] font-medium leading-relaxed text-emerald-600">
            Applied automatically. No code needed.
          </p>
        )}

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
