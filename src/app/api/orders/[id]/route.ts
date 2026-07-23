import { admin, ok, fail, guard } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";
import { normalizeTrackingInput } from "@/lib/format";

export const dynamic = "force-dynamic";

/**
 * Public order lookup by tracking reference (e.g. TPP-K3F9A) or full id.
 * Guests track orders here without an account, which is why this route is
 * public — but it only ever returns the single order whose id matches.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { id } = await params;
    const suffix = normalizeTrackingInput(id);
    if (!suffix) return fail("Enter a valid tracking ID.");

    const { data, error } = await admin()
      .from("orders")
      .select("*, order_items(*)")
      .ilike("id", `%${suffix}`);
    if (error) throw error;

    const matched = (data ?? []).find(
      (o: any) => normalizeTrackingInput(o.id) === suffix
    );
    if (!matched) return fail("Order not found.", 404);

    return ok({ order: orderRowToOrder(matched) });
  });
}
