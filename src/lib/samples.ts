/* ──────────────────────────────────────────────────────────────
   Demo/sample order generator.

   Pure (no Supabase, no "use client") so it can run in an API route.
   Randomness is intentional here — samples are seed/demo data.
   ────────────────────────────────────────────────────────────── */

import { BASE_MENU } from "./data";
import type { Order, OrderLine, OrderStatus } from "./mappers";

const SAMPLE_NAMES = [
  "Chiamaka O.", "Tunde A.", "Ngozi E.", "Emeka U.", "Fatima B.",
  "Seyi K.", "Amara N.", "Ibrahim S.", "Bisi L.", "Kelechi M.",
];

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/** 14 plausible orders across the last week, most already completed. */
export function makeSamples(): Order[] {
  const pool = BASE_MENU.filter((m) => m.price > 0);
  const out: Order[] = [];
  const now = Date.now();

  for (let i = 0; i < 14; i++) {
    const daysBack = Math.floor(Math.random() * 7);
    const item = pool[Math.floor(Math.random() * pool.length)];
    const second =
      Math.random() > 0.55 ? pool[Math.floor(Math.random() * pool.length)] : null;

    const lines: OrderLine[] = [
      { name: item.name, qty: 1 + Math.floor(Math.random() * 2), price: item.price },
    ];
    if (second && second.id !== item.id) {
      lines.push({ name: second.name, qty: 1, price: second.price });
    }

    const total = lines.reduce((n, l) => n + l.price * l.qty, 0);
    const claimed = Math.random() > 0.35;
    const status: OrderStatus =
      daysBack === 0
        ? (["new", "preparing", "ready"] as OrderStatus[])[i % 3]
        : "completed";

    out.push({
      id: uid() + i,
      customerName: SAMPLE_NAMES[i % SAMPLE_NAMES.length],
      method: Math.random() > 0.5 ? "delivery" : "pickup",
      lines,
      total,
      paymentConfirmed: claimed,
      paymentVerified: claimed && (status !== "new" || Math.random() > 0.5),
      status,
      createdAt:
        now - daysBack * 86_400_000 - Math.floor(Math.random() * 10) * 3_600_000,
      sample: true,
    });
  }

  return out.sort((a, b) => b.createdAt - a.createdAt);
}
