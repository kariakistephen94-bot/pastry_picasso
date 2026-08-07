import { BUSINESS } from "./data";
import { naira, orderRef } from "./format";
import type { Order } from "./mappers";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Skipping email sending: RESEND_API_KEY is not defined.");
    return false;
  }
  const from = process.env.EMAIL_FROM || "The Pastry Picasso <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Resend API error response:", errorText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Resend fetch request failed:", err);
    return false;
  }
}

/* ── Email Styles & Wrapper ────────────────────────────────────── */

function emailWrapper(title: string, bodyContent: string) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f9f9fb;
            color: #1e1e24;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 580px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
            border: 1px solid #f1f1f5;
          }
          .header {
            text-align: center;
            margin-bottom: 28px;
            border-bottom: 2px solid #f6f6f9;
            padding-bottom: 20px;
          }
          .logo {
            font-size: 20px;
            font-weight: 800;
            color: #d6187c;
            text-decoration: none;
            letter-spacing: -0.02em;
          }
          .title {
            font-size: 18px;
            font-weight: 800;
            margin-top: 10px;
            color: #1e1e24;
          }
          .content {
            font-size: 14px;
            line-height: 1.6;
            color: #4a4a52;
          }
          .table-container {
            margin: 20px 0;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #eef0f3;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background-color: #f7f9fa;
            text-align: left;
            font-size: 11.5px;
            font-weight: 700;
            color: #8c8c9a;
            text-transform: uppercase;
            padding: 10px 14px;
            border-bottom: 1px solid #eef0f3;
          }
          td {
            padding: 12px 14px;
            font-size: 13px;
            border-bottom: 1px solid #eef0f3;
            color: #2e2e35;
          }
          tr:last-child td {
            border-bottom: none;
          }
          .total-row td {
            font-weight: 800;
            background-color: #fafbfc;
            color: #1e1e24;
            font-size: 14px;
          }
          .cta-btn {
            display: block;
            text-align: center;
            background: linear-gradient(to right, #d6187c, #e63f94);
            color: #ffffff !important;
            font-size: 14px;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 24px;
            border-radius: 14px;
            margin: 28px 0 16px;
            box-shadow: 0 4px 10px rgba(214, 24, 124, 0.2);
          }
          .footer {
            text-align: center;
            font-size: 11.5px;
            color: #8c8c9a;
            margin-top: 32px;
            border-top: 1px solid #f1f1f5;
            padding-top: 20px;
          }
          .whatsapp-link {
            color: #25D366;
            text-decoration: none;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <a href="${APP_URL}" class="logo">🧁 The Pastry Picasso</a>
          </div>
          <div class="content">
            ${bodyContent}
          </div>
          <div class="footer">
            <p>The Pastry Picasso Enterprises</p>
            <p>4 Olugbede Street, Egbeda, Alimosho, Lagos</p>
            <p>Need help? Message us on <a href="https://wa.me/${BUSINESS.whatsappNumber}" class="whatsapp-link">WhatsApp</a></p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * The order table. Pass the whole order so a discounted one grows a
 * subtotal and a discount row; an undiscounted one keeps the plain
 * single-total layout it has always had.
 */
function itemsTable(order: Order) {
  const discount = Number(order.discount) || 0;
  const promo = [order.promoLabel, order.promoCode && `(${order.promoCode})`]
    .filter(Boolean)
    .join(" ");

  return `
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${order.lines
            .map(
              (l) => `
            <tr>
              <td>${l.name}${
                l.listPrice && l.listPrice > l.price
                  ? ` <span style="color: #8c8c9a; text-decoration: line-through; font-size: 11.5px;">${naira(l.listPrice * l.qty)}</span>`
                  : ""
              }</td>
              <td style="text-align: center; font-weight: 700;">${l.qty}</td>
              <td style="text-align: right; font-weight: 700; white-space: nowrap;">${naira(l.price * l.qty)}</td>
            </tr>
          `
            )
            .join("")}
          ${
            discount > 0
              ? `
          <tr>
            <td colspan="2" style="color: #8c8c9a;">Subtotal</td>
            <td style="text-align: right; white-space: nowrap; color: #8c8c9a;">${naira(order.subtotal)}</td>
          </tr>
          <tr>
            <td colspan="2" style="color: #1f6b3a; font-weight: 700;">Discount${promo ? ` — ${promo}` : ""}</td>
            <td style="text-align: right; white-space: nowrap; color: #1f6b3a; font-weight: 700;">−${naira(discount)}</td>
          </tr>`
              : ""
          }
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align: right; white-space: nowrap;">${naira(order.total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

/* ── Notification Triggers ─────────────────────────────────────── */

/** Send order placement receipt to user and notification to admin. */
export async function sendOrderPlacedEmail(order: Order) {
  const trackingRef = orderRef(order.id);
  const trackLink = `${APP_URL}/track?id=${trackingRef}`;

  // 1) Email to Customer
  if (order.email) {
    const customerHtml = emailWrapper(
      "Your Order Receipt",
      `
      <p style="font-size: 15px; font-weight: 700; color: #1e1e24; margin-top: 0;">Hello ${order.customerName},</p>
      <p>Thank you for ordering from The Pastry Picasso! We have received your order details and payment transfer claim.</p>
      
      <p>We are currently verifying your bank transfer. Once confirmed, our kitchen will start baking your treats fresh!</p>
      
      <h3 style="margin-top: 24px; font-size: 14px; font-weight: 700; color: #1e1e24;">Order Summary (${trackingRef})</h3>
      ${itemsTable(order)}
      
      <div style="background-color: #f7f9fa; border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 12.5px;">
        <p style="margin: 0 0 6px;"><strong>Delivery Method:</strong> <span style="text-transform: capitalize;">${order.method}</span></p>
        ${order.address ? `<p style="margin: 0 0 6px;"><strong>Address:</strong> ${order.address}</p>` : ""}
        ${order.note ? `<p style="margin: 0;"><strong>Kitchen Note:</strong> "${order.note}"</p>` : ""}
      </div>
      
      <a href="${trackLink}" class="cta-btn">Track Order Live</a>
    `
    );

    await sendEmail({
      to: order.email,
      subject: `Your Pastry Picasso Receipt - ${trackingRef}`,
      html: customerHtml,
    });
  }

  // 2) Email to Admin
  const adminHtml = emailWrapper(
    "New Order Received",
    `
    <p style="font-size: 15px; font-weight: 700; color: #1e1e24; margin-top: 0; display: flex; align-items: center; gap: 8px;">
      🔔 New Order Received: <span style="color: #d6187c;">${trackingRef}</span>
    </p>
    <p>A new order has been placed by <strong>${order.customerName}</strong> (${order.phone || "no phone"}).</p>
    
    <h3>Items Ordered</h3>
    ${itemsTable(order)}
    
    <div style="background-color: #f7f9fa; border-radius: 12px; padding: 14px; margin-top: 16px; font-size: 12.5px;">
      <p style="margin: 0 0 6px;"><strong>Customer:</strong> ${order.customerName}</p>
      <p style="margin: 0 0 6px;"><strong>Phone:</strong> ${order.phone || "Not provided"}</p>
      <p style="margin: 0 0 6px;"><strong>Method:</strong> <span style="text-transform: capitalize;">${order.method}</span></p>
      ${order.address ? `<p style="margin: 0 0 6px;"><strong>Address:</strong> ${order.address}</p>` : ""}
      ${order.note ? `<p style="margin: 0;"><strong>Kitchen Note:</strong> "${order.note}"</p>` : ""}
    </div>
    
    <div style="background-color: #fff9db; border: 1px solid #ffe3e3; border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 12.5px; color: #b84a00;">
      <strong>Payment Status:</strong> Claimed Transfer. Verify <strong>${naira(order.total)}</strong> to your Moniepoint account before checking this order out in the kitchen.
    </div>
    
    <a href="${APP_URL}/admin/orders" class="cta-btn">Open Admin Orders Dashboard</a>
  `
  );

  await sendEmail({
    to: BUSINESS.email,
    subject: `🔔 New Order ${trackingRef} - ${order.customerName}`,
    html: adminHtml,
  });
}

/** Notify customer that their payment has been confirmed. */
export async function sendPaymentConfirmedEmail(order: Order) {
  if (!order.email) return;

  const trackingRef = orderRef(order.id);
  const trackLink = `${APP_URL}/track?id=${trackingRef}`;

  const html = emailWrapper(
    "Payment Confirmed",
    `
    <p style="font-size: 15px; font-weight: 700; color: #1e1e24; margin-top: 0;">Hello ${order.customerName},</p>
    <p>Good news! We have successfully verified your bank transfer payment of <strong>${naira(order.total)}</strong> for order <strong>${trackingRef}</strong>.</p>
    
    <p>Your order is now officially confirmed and is in the oven! Our kitchen team is preparing it fresh.</p>
    
    <div style="background-color: #ebfaf0; border: 1px solid #c3f0d2; border-radius: 12px; padding: 14px; margin-top: 20px; font-size: 13px; color: #1f6b3a; font-weight: 700;">
      ✓ Payment Confirmed & Verified
    </div>
    
    <a href="${trackLink}" class="cta-btn">Track Kitchen Progress</a>
  `
  );

  await sendEmail({
    to: order.email,
    subject: `✅ Payment Confirmed - Order ${trackingRef} is in the oven!`,
    html,
  });
}

/** Notify customer that their order has been cancelled and provide the admin reason. */
export async function sendOrderCancelledEmail(order: Order, cancelNote: string) {
  if (!order.email) return;

  const trackingRef = orderRef(order.id);

  const html = emailWrapper(
    "Order Update: Cancelled",
    `
    <p style="font-size: 15px; font-weight: 700; color: #1e1e24; margin-top: 0;">Hello ${order.customerName},</p>
    <p>We regret to inform you that your order <strong>${trackingRef}</strong> has been cancelled.</p>
    
    <h3 style="color: #c92a2a; margin-top: 24px; font-size: 14px; font-weight: 700;">Reason for Cancellation</h3>
    <div style="background-color: #fff5f5; border: 1px solid #ffdeeb; border-radius: 12px; padding: 16px; margin: 12px 0 20px; font-size: 13.5px; font-style: italic; color: #c92a2a; font-weight: 600; line-height: 1.5;">
      "${cancelNote}"
    </div>
    
    <p>If you have already made a payment, please get in touch with us on WhatsApp so we can process your refund immediately. Please have your order reference <strong>${trackingRef}</strong> ready.</p>
    
    <a href="https://wa.me/${BUSINESS.whatsappNumber}" class="cta-btn" style="background: #25D366; box-shadow: 0 4px 10px rgba(37, 211, 102, 0.2);">Chat with us on WhatsApp</a>
  `
  );

  await sendEmail({
    to: order.email,
    subject: `❌ Order Update - Canceled ${trackingRef}`,
    html,
  });
}

/**
 * Notify the customer that a cancellation has been revoked and their order is
 * live again. They have already had the cancellation email, so silence here
 * would leave them holding a notice that is no longer true.
 */
export async function sendOrderReinstatedEmail(order: Order) {
  if (!order.email) return;

  const trackingRef = orderRef(order.id);
  const trackLink = `${APP_URL}/track?id=${trackingRef}`;

  const html = emailWrapper(
    "Order Update: Reinstated",
    `
    <p style="font-size: 15px; font-weight: 700; color: #1e1e24; margin-top: 0;">Hello ${order.customerName},</p>
    <p>Good news! Your order <strong>${trackingRef}</strong> is no longer cancelled. We have reinstated it and it is back with our kitchen team.</p>

    <div style="background-color: #ebfaf0; border: 1px solid #c3f0d2; border-radius: 12px; padding: 14px; margin: 20px 0; font-size: 13px; color: #1f6b3a; font-weight: 700;">
      ✓ Cancellation revoked. Please disregard the earlier cancellation email.
    </div>

    <h3 style="margin-top: 24px; font-size: 14px; font-weight: 700; color: #1e1e24;">Order Summary (${trackingRef})</h3>
    ${itemsTable(order)}

    <p>If you no longer want this order, or anything looks wrong, please reach us on WhatsApp and we will sort it out straight away.</p>

    <a href="${trackLink}" class="cta-btn">Track Order Live</a>
  `
  );

  await sendEmail({
    to: order.email,
    subject: `✅ Order Reinstated - ${trackingRef} is back on`,
    html,
  });
}
