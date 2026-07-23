import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "preparing", "ready", "completed"];

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

    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(body.status)) return fail("Invalid status.");
      patch.status = body.status;
    }
    if (body.paymentVerified !== undefined) {
      patch.payment_verified = body.paymentVerified === true;
    }
    if (Object.keys(patch).length === 0) return fail("Nothing to update.");

    const { error } = await admin().from("orders").update(patch).eq("id", id);
    if (error) throw error;

    return ok();
  });
}
