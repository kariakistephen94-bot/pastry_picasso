"use client";

import { BUSINESS } from "./data";
import { naira, orderRef } from "./format";
import type { Order } from "./store";

/**
 * Best-effort email notification to the store, with no backend, via
 * FormSubmit (formsubmit.co). The very first submission sends a one-time
 * activation email to the store's address; after the store clicks
 * "Activate", every new order arrives as an email.
 *
 * Failures are silent by design: the in-app dashboard and the customer's
 * optional WhatsApp message remain the fallback channels.
 */
export function notifyOrderByEmail(order: Order) {
  const items = order.lines
    .map((l) => `${l.qty} x ${l.name} (${naira(l.price * l.qty)})`)
    .join("; ");

  const payload = {
    _subject: `New order ${orderRef(order.id)} from ${order.customerName}`,
    _template: "table",
    _captcha: "false",
    "Tracking ID": orderRef(order.id),
    Customer: order.customerName,
    Phone: order.phone || "not provided",
    Method: order.method,
    Address: order.address || "n/a",
    Items: items,
    Total: naira(order.total),
    Note: order.note || "none",
    Payment: `Customer says they transferred ${naira(order.total)} to ${BUSINESS.bank.bankName} (${BUSINESS.bank.accountNumber}). Verify before preparing.`,
  };

  try {
    void fetch(`https://formsubmit.co/ajax/${BUSINESS.email}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* offline: dashboard + WhatsApp still carry the order */
  }
}

/** Emails a customer-submitted review to the store (same relay). */
export function notifyReviewByEmail(review: {
  name: string;
  rating: number;
  text: string;
}) {
  const payload = {
    _subject: `New ${review.rating}/5 review from ${review.name}`,
    _template: "table",
    _captcha: "false",
    Name: review.name,
    Rating: `${review.rating} / 5`,
    Review: review.text,
    Note: "Submitted via the website review link. Approve it in Dashboard → Reviews on the device it was submitted from, or add it there manually.",
  };
  try {
    void fetch(`https://formsubmit.co/ajax/${BUSINESS.email}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  } catch {
    /* best effort */
  }
}
