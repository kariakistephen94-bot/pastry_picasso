import { admin, ok, fail, guard, currentUser } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";
import { quoteCart } from "@/lib/promo-server";
import { sendOrderPlacedEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

/**
 * Place an order.
 *
 * Prices, discounts and the order total are computed HERE from the live
 * menu and the live promotions table, never trusted from the client.
 * The browser only ever sends item ids, quantities and the promo code
 * the customer typed.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const customerName = String(body.customerName ?? "").trim();
    const email = body.email ? String(body.email).trim() : null;
    const method = body.method === "pickup" ? "pickup" : "delivery";
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const note = body.note ? String(body.note).trim() : null;
    const customerId = body.customerId ? String(body.customerId) : null;
    const paymentConfirmed = body.paymentConfirmed === true;
    const promoCode =
      typeof body.promoCode === "string" ? body.promoCode.slice(0, 64) : null;

    const items = Array.isArray(body.items) ? body.items : [];

    if (!customerName) return fail("A customer name is required.");
    if (!email) return fail("An email address is required.");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return fail("Please enter a valid email address.");
    if (method === "delivery" && !address)
      return fail("A delivery address is required.");
    if (items.length === 0) return fail("Your cart is empty.");

    const db = admin();

    // Re-price everything against the live menu and promotions. The
    // customer's own email drives the first-order and per-customer
    // checks, so a code can't be recycled by re-typing it at checkout.
    const priced = await quoteCart({ items, code: promoCode, email });
    if (!priced.ok) return fail(priced.error);

    const { quote, lines, promotion } = priced.result;

    // A code that was valid in the cart preview but has since expired,
    // run out or stopped qualifying must not silently vanish: the
    // customer is about to transfer a specific amount, so send them
    // back to the cart rather than quietly charging them more.
    if (promoCode && quote.codeError) return fail(quote.codeError);

    // Attribute to the signed-in account when there is one; guests stay
    // null. Resolved before the promotion is claimed so a failure here
    // can't strand a usage slot.
    const user = await currentUser(req);

    // Claim the usage slot BEFORE writing the order. This is a single
    // conditional UPDATE in Postgres, so two people racing for the last
    // use of a limited code can never both win.
    let claimedPromotionId: string | null = null;
    if (promotion && quote.discount > 0) {
      if (promotion.usageLimit != null) {
        const { data: claimed, error: claimErr } = await db.rpc(
          "claim_promotion",
          { p_id: promotion.id }
        );
        if (claimErr) throw claimErr;
        if (claimed !== true) {
          return fail(
            promotion.code
              ? "That promo code has just been fully claimed. Please remove it and try again."
              : "That offer has just ended. Please refresh your cart."
          );
        }
      } else {
        // Unlimited promo: still count it, but nothing can fail here.
        await db.rpc("claim_promotion", { p_id: promotion.id });
      }
      claimedPromotionId = promotion.id;
    }

    /** Hands the usage slot back when anything below fails. */
    const releaseClaim = async () => {
      if (!claimedPromotionId) return;
      const { error: releaseErr } = await db.rpc("release_promotion", {
        p_id: claimedPromotionId,
      });
      if (releaseErr) console.error("Failed to release promotion:", releaseErr);
    };

    const id = uid();
    const createdAt = Date.now();
    const orderItems = lines.map((l) => ({
      order_id: id,
      name: l.name,
      qty: l.qty,
      price: l.unitPrice,
      list_price: l.listPrice ?? null,
    }));

    const { error: orderErr } = await db.from("orders").insert({
      id,
      customer_name: customerName,
      email,
      phone,
      method,
      address: method === "delivery" ? address : null,
      note,
      subtotal: quote.subtotal,
      discount: quote.discount,
      promo_code: quote.applied?.code ?? null,
      promo_label: quote.applied?.name ?? null,
      promotion_id: claimedPromotionId,
      total: quote.total,
      status: "new",
      payment_confirmed: paymentConfirmed,
      payment_verified: false,
      created_at: createdAt,
      customer_id: customerId,
      user_id: user?.id ?? null,
    });
    if (orderErr) {
      await releaseClaim();
      throw orderErr;
    }

    const { error: itemsErr } = await db.from("order_items").insert(orderItems);
    if (itemsErr) {
      // Roll back the orphaned order so a failed line insert can't leave a
      // header with no items.
      await db.from("orders").delete().eq("id", id);
      await releaseClaim();
      throw itemsErr;
    }

    // The redemption row is the audit trail: which order used which
    // offer, for how much. Cancelling the order voids it and gives the
    // usage back. A failure here is not worth losing the order over.
    if (claimedPromotionId) {
      const { error: redeemErr } = await db.from("promo_redemptions").insert({
        promotion_id: claimedPromotionId,
        order_id: id,
        code: quote.applied?.code ?? null,
        email: email.toLowerCase(),
        customer_id: customerId,
        amount: quote.discount,
        created_at: createdAt,
      });
      if (redeemErr) console.error("Failed to record redemption:", redeemErr);
    }

    const order = orderRowToOrder({
      id,
      customer_name: customerName,
      email,
      phone,
      method,
      address,
      note,
      subtotal: quote.subtotal,
      discount: quote.discount,
      promo_code: quote.applied?.code ?? null,
      promo_label: quote.applied?.name ?? null,
      total: quote.total,
      status: "new",
      payment_confirmed: paymentConfirmed,
      payment_verified: false,
      created_at: createdAt,
      order_items: orderItems,
    });

    sendOrderPlacedEmail(order).catch((err) => {
      console.error("Failed to send order placed email:", err);
    });

    return ok({ order }, 201);
  });
}
