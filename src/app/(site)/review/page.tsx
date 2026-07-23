"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check, Send, Star } from "lucide-react";
import { useReviews } from "@/lib/store";
import { notifyReviewByEmail } from "@/lib/notify";
import { IMG } from "@/lib/data";
import { cn } from "@/lib/cn";

const field =
  "w-full rounded-2xl bg-white px-4 py-3 text-[14px] font-medium text-ink-900 placeholder:text-ink-300 shadow-soft outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-brand-300";

export default function ReviewPage() {
  const addReview = useReviews((s) => s.addReview);

  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (rating === 0) {
      setError("Tap the stars to rate your experience.");
      return;
    }
    if (!name.trim()) {
      setError("Please add your name.");
      return;
    }
    if (!text.trim()) {
      setError("Tell us a little about your order.");
      return;
    }
    setError(null);
    const review = { name: name.trim(), rating, text: text.trim() };
    addReview(review);
    notifyReviewByEmail(review);
    setSent(true);
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-[480px] px-4 sm:px-6">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          className="mt-10 flex flex-col items-center rounded-[28px] bg-white px-6 py-10 text-center shadow-card"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.1 }}
            className="flex h-18 w-18 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 p-5 text-white shadow-pink-lg"
          >
            <Check className="h-8 w-8" strokeWidth={3} />
          </motion.span>
          <h1 className="mt-5 font-display text-[22px] font-extrabold tracking-tight text-ink-900">
            Thank you! 🧁
          </h1>
          <p className="mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-ink-500">
            Your review has been sent to The Pastry Picasso. Once approved, it
            appears on the website.
          </p>
          <Link
            href="/"
            className="mt-6 flex h-12 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 px-7 text-[14px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
          >
            Back to the app
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[520px] px-4 sm:px-6">
      <header className="flex flex-col items-center pt-8 text-center">
        <div className="relative h-16 w-16 rounded-[22px] bg-white p-1.5 shadow-soft">
          <Image
            src={IMG.logo}
            alt="The Pastry Picasso"
            fill
            sizes="64px"
            className="object-contain p-1.5"
            priority
          />
        </div>
        <h1 className="mt-4 font-display text-[24px] font-extrabold tracking-tight text-ink-900">
          How was your order?
        </h1>
        <p className="mt-1 max-w-[320px] text-[13px] font-medium leading-relaxed text-ink-500">
          Your review helps other Lagos foodies find us. It only takes a
          minute.
        </p>
      </header>

      <div className="mt-6 rounded-[26px] bg-white p-5 shadow-soft sm:p-6">
        {/* Stars */}
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <motion.button
              key={i}
              type="button"
              aria-label={`${i + 1} star${i ? "s" : ""}`}
              whileTap={{ scale: 0.85 }}
              onClick={() => setRating(i + 1)}
              className="p-1"
            >
              <Star
                className={cn(
                  "h-9 w-9 transition-colors",
                  i < rating
                    ? "fill-amber-400 text-amber-400"
                    : "fill-cream-200 text-cream-200"
                )}
              />
            </motion.button>
          ))}
        </div>
        <p className="mt-1.5 text-center text-[12px] font-semibold text-ink-400">
          {rating === 0
            ? "Tap to rate"
            : ["", "We're sorry 😔", "We'll do better", "Thanks!", "Great!", "You're the best! 🎉"][rating]}
        </p>

        <div className="mt-5 flex flex-col gap-2.5">
          <input
            className={cn(field, "bg-cream-100 focus:bg-white")}
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className={cn(field, "min-h-[110px] resize-none bg-cream-100 focus:bg-white")}
            placeholder="What did you order? How was it?"
            value={text}
            onChange={(e) => setText(e.target.value)}
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

        <motion.button
          type="button"
          whileTap={{ scale: 0.97 }}
          onClick={submit}
          className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 text-[14.5px] font-bold text-white shadow-pink transition-shadow hover:shadow-pink-lg"
        >
          <Send className="h-4 w-4" />
          Send review
        </motion.button>
        <p className="mt-3 text-center text-[11.5px] font-medium leading-relaxed text-ink-400">
          Reviews are approved by The Pastry Picasso before they appear on the
          website.
        </p>
      </div>
    </div>
  );
}
