import { ok, fail, guard } from "@/lib/api-server";
import { quoteCart } from "@/lib/promo-server";

export const dynamic = "force-dynamic";

/**
 * Prices a cart: live line prices, the best automatic deal, and the
 * customer's promo code if they typed one.
 *
 * Public, because guests check out without an account. It reveals
 * nothing a customer could not learn by trying a code at checkout, and
 * it never lists codes — you have to already know one to ask about it.
 *
 * This is a preview: /api/orders re-runs the exact same calculation
 * when the order is saved, so a cart edited in another tab, an expiring
 * offer or a code claimed by someone else in the meantime is caught
 * there rather than honoured on trust.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) return fail("Your cart is empty.");
    if (items.length > 100) return fail("That is too many items for one order.");

    const code = typeof body.code === "string" ? body.code.slice(0, 64) : null;
    const email = typeof body.email === "string" ? body.email : null;

    const priced = await quoteCart({ items, code, email });
    if (!priced.ok) return fail(priced.error);

    const { quote, lines } = priced.result;

    return ok({
      subtotal: quote.subtotal,
      discount: quote.discount,
      total: quote.total,
      applied: quote.applied,
      codeError: quote.codeError ?? null,
      notice: quote.notice ?? null,
      lines: lines.map((l) => ({
        id: l.id,
        name: l.name,
        qty: l.qty,
        unitPrice: l.unitPrice,
        listPrice: l.listPrice ?? null,
      })),
    });
  });
}
