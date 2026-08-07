import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";
import {
  sendPaymentConfirmedEmail,
  sendOrderCancelledEmail,
  sendOrderReinstatedEmail,
} from "@/lib/resend";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "preparing", "ready", "completed", "cancelled"];

/** Update an order's status and/or payment verification. Admin only. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const db = admin();
    // 1) Fetch current order to check previous state for transition triggers
    const { data: orderRow, error: fetchError } = await db
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !orderRow) {
      return fail(fetchError?.message || "Order not found.", 404);
    }
    const oldOrder = orderRowToOrder(orderRow);

    const patch: Record<string, unknown> = {};
    let cancelNote = "";
    // Moving off "cancelled" revokes the cancellation rather than being an
    // ordinary status step, so it clears the note and notifies the customer.
    let reinstated = false;

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return fail("Invalid status.");
      patch.status = body.status;

      if (body.status === "cancelled") {
        cancelNote = String(body.cancelNote ?? "").trim();
        if (!cancelNote) {
          return fail("A cancellation note is required for the customer.");
        }
        patch.cancel_note = cancelNote;
      } else if (oldOrder.status === "cancelled") {
        reinstated = true;
        patch.cancel_note = null;
      }
    }
    if (body.paymentVerified !== undefined) {
      patch.payment_verified = body.paymentVerified === true;
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update.");

    const { error } = await db.from("orders").update(patch).eq("id", id);
    if (error) throw error;

    // A cancelled order gives its promotion back: the usage slot returns
    // to the pool and the customer is free to use the code again.
    // Revoking the cancellation re-consumes it. Neither is worth failing
    // the status change over, so both are logged rather than thrown.
    if (patch.status === "cancelled" && oldOrder.status !== "cancelled") {
      const { error: voidErr } = await db.rpc("void_order_promotion", {
        p_order_id: id,
      });
      if (voidErr) console.error("Failed to void promo redemption:", voidErr);
    } else if (reinstated) {
      const { error: restoreErr } = await db.rpc("restore_order_promotion", {
        p_order_id: id,
      });
      if (restoreErr)
        console.error("Failed to restore promo redemption:", restoreErr);
    }

    // 2) Trigger async email notifications based on status transitions
    const updatedOrder = {
      ...oldOrder,
      status: (patch.status as any) ?? oldOrder.status,
      paymentVerified: (patch.payment_verified as boolean) ?? oldOrder.paymentVerified,
      cancelNote: reinstated ? undefined : oldOrder.cancelNote,
    };

    if (reinstated) {
      sendOrderReinstatedEmail(updatedOrder).catch((err) => {
        console.error("Failed to send order reinstated email:", err);
      });
    }

    if (patch.payment_verified === true && !oldOrder.paymentVerified) {
      sendPaymentConfirmedEmail(updatedOrder).catch((err) => {
        console.error("Failed to send payment confirmation email:", err);
      });
    }

    if (patch.status === "cancelled" && oldOrder.status !== "cancelled") {
      sendOrderCancelledEmail(updatedOrder, cancelNote).catch((err) => {
        console.error("Failed to send order cancellation email:", err);
      });
    }

    return ok();
  });
}
