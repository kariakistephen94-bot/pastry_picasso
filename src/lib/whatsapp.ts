import { BUSINESS } from "./data";
import { naira } from "./format";

export interface OrderLineInput {
  name: string;
  qty: number;
  price: number;
}

export interface CheckoutInput {
  customerName: string;
  phone?: string;
  method: "pickup" | "delivery";
  address?: string;
  note?: string;
  lines: OrderLineInput[];
  total: number;
  paymentConfirmed?: boolean;
  trackingRef?: string;
}

export function buildOrderMessage(input: CheckoutInput): string {
  const rows = input.lines
    .map((l) => `•  ${l.qty} × ${l.name} - ${naira(l.price * l.qty)}`)
    .join("\n");

  const parts = [
    `🧁 *New Order for ${BUSINESS.name}*`,
    "",
    input.trackingRef ? `🧾 *Tracking ID:* ${input.trackingRef}` : null,
    `👤 *Name:* ${input.customerName}`,
    input.phone ? `📞 *Phone:* ${input.phone}` : null,
    input.method === "delivery"
      ? `🛵 *Delivery to:* ${input.address || "(address to be shared)"}`
      : `🏪 *Pickup* at ${BUSINESS.addressLines[0]}, Egbeda`,
    "",
    "*Order*",
    rows,
    "",
    `💰 *Total: ${naira(input.total)}*`,
    input.paymentConfirmed
      ? `✅ *Payment:* I have made the transfer of ${naira(input.total)} to ${BUSINESS.bank.bankName} (${BUSINESS.bank.accountNumber})`
      : null,
    input.note ? `\n📝 *Note:* ${input.note}` : null,
    "",
    "_Sent from thepastrypicasso.com_",
  ].filter((p): p is string => p !== null);

  return parts.join("\n");
}

export function whatsappOrderUrl(input: CheckoutInput): string {
  return `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(
    buildOrderMessage(input)
  )}`;
}

export function whatsappChatUrl(text?: string): string {
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${BUSINESS.whatsappNumber}${q}`;
}
