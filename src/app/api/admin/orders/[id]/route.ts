import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";
import { sendPaymentConfirmedEmail, sendOrderCancelledEmail } from "@/lib/resend";

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

    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return fail("Invalid status.");
      patch.status = body.status;

      if (body.status === "cancelled") {
        cancelNote = String(body.cancelNote ?? "").trim();
        if (!cancelNote) {
          return fail("A cancellation note is required for the customer.");
        }
        patch.cancel_note = cancelNote;
      }
    }
    if (body.paymentVerified !== undefined) {
      patch.payment_verified = body.paymentVerified === true;
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update.");

    const { error } = await db.from("orders").update(patch).eq("id", id);
    if (error) throw error;

    // 2) Trigger async email notifications based on status transitions
    const updatedOrder = {
      ...oldOrder,
      status: (patch.status as any) ?? oldOrder.status,
      paymentVerified: (patch.payment_verified as boolean) ?? oldOrder.paymentVerified,
    };

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
