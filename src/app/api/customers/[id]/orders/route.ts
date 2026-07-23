import { admin, ok, fail, guard } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Orders attached to a guest's locally-stored customer id. Public, because
 * a guest tracks their own orders without an account — the id is the secret.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const { id } = await params;
    if (!UUID.test(id)) return fail("Invalid customer id.");

    const { data, error } = await admin()
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", id)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;

    return ok({ orders: (data ?? []).map(orderRowToOrder) });
  });
}
