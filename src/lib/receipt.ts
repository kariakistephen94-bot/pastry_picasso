"use client";

import type { Order } from "./store";
import { BUSINESS } from "./data";
import { orderRef } from "./format";

/* jsPDF's built-in fonts have no naira glyph, so amounts use "NGN". */
const money = (n: number) => `NGN ${n.toLocaleString("en-NG")}`;

async function logoDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/images/logo.png");
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Generates and downloads a branded PDF receipt for an order.
 * Status stamp: PAID once the store has verified the transfer
 * (order.paymentVerified), PENDING before that.
 */
export async function downloadReceipt(order: Order) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const W = 210;
  const M = 22;
  let y = 18;
  const paid = !!order.paymentVerified;

  /* ── Brand header ─────────────────────────────────────────── */
  const logo = await logoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", W / 2 - 13, y, 26, 26);
    y += 30;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.setTextColor(214, 24, 124);
  doc.text(BUSINESS.name, W / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(125, 110, 118);
  doc.text(BUSINESS.address, W / 2, y, { align: "center" });
  y += 4.5;
  doc.text(
    `${BUSINESS.phoneDisplay}  ·  WhatsApp ${BUSINESS.whatsappDisplay}`,
    W / 2,
    y,
    { align: "center" }
  );
  y += 9;

  doc.setDrawColor(233, 223, 212);
  doc.line(M, y, W - M, y);
  y += 10;

  /* ── Title + status stamp ─────────────────────────────────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(36, 26, 32);
  doc.text("RECEIPT", M, y);

  const stampW = 40;
  const stampH = 9.5;
  if (paid) doc.setFillColor(16, 150, 72);
  else doc.setFillColor(217, 119, 6);
  doc.roundedRect(W - M - stampW, y - 6.8, stampW, stampH, 2.2, 2.2, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10.5);
  doc.text(paid ? "PAID" : "PENDING", W - M - stampW / 2, y - 0.6, {
    align: "center",
  });
  y += 9;

  /* ── Meta ─────────────────────────────────────────────────── */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(125, 110, 118);
  doc.text(`Tracking ID: ${orderRef(order.id)}`, M, y);
  doc.text(
    new Date(order.createdAt).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    }),
    W - M,
    y,
    { align: "right" }
  );
  y += 5;
  doc.text(`Customer: ${order.customerName}`, M, y);
  doc.text(order.method === "delivery" ? "Delivery" : "Pickup", W - M, y, {
    align: "right",
  });
  y += 5;
  if (order.address) {
    doc.text(`Address: ${order.address}`.slice(0, 95), M, y);
    y += 5;
  }
  y += 3;
  doc.line(M, y, W - M, y);
  y += 8;

  /* ── Items ────────────────────────────────────────────────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(162, 147, 155);
  doc.text("ITEM", M, y);
  doc.text("QTY", W - M - 45, y, { align: "right" });
  doc.text("AMOUNT", W - M, y, { align: "right" });
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  doc.setTextColor(36, 26, 32);
  for (const l of order.lines) {
    doc.text(l.name.slice(0, 48), M, y);
    doc.text(String(l.qty), W - M - 45, y, { align: "right" });
    doc.text(money(l.price * l.qty), W - M, y, { align: "right" });
    y += 6.5;
    if (y > 255) {
      doc.addPage();
      y = 20;
    }
  }

  y += 1;
  doc.setDrawColor(233, 223, 212);
  doc.line(M, y, W - M, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12.5);
  doc.text("Total", M, y);
  doc.text(money(order.total), W - M, y, { align: "right" });
  y += 10;

  /* ── Payment info ─────────────────────────────────────────── */
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(125, 110, 118);
  doc.text(
    `Payment: bank transfer to ${BUSINESS.bank.bankName} (${BUSINESS.bank.accountNumber})`,
    M,
    y
  );
  y += 5;
  if (paid) {
    doc.setTextColor(16, 150, 72);
    doc.text(`Payment confirmed by ${BUSINESS.name}. Thank you!`, M, y);
  } else {
    doc.setTextColor(217, 119, 6);
    doc.text(
      "Awaiting payment confirmation from the store. Download this receipt again once confirmed.",
      M,
      y
    );
  }
  y += 13;

  /* ── Footer ───────────────────────────────────────────────── */
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(214, 24, 124);
  doc.text("Thank you for ordering The Pastry Picasso!", W / 2, y, {
    align: "center",
  });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(162, 147, 155);
  doc.text(
    `${BUSINESS.instagramHandle} on Instagram  ·  ${BUSINESS.tiktokHandle} on TikTok`,
    W / 2,
    y,
    { align: "center" }
  );

  doc.save(`${orderRef(order.id)}-receipt.pdf`);
}
