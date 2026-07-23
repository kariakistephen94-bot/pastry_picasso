import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** Full order list for the dashboard. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { data, error } = await admin()
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return ok({ orders: (data ?? []).map(orderRowToOrder) });
  });
}

/** Clear every order (and its items, via cascade). Admin only. */
export async function DELETE(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { error } = await admin()
      .from("orders")
      .delete()
      .neq("id", "__none__");
    if (error) throw error;

    return ok();
  });
}
