import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";
import { makeSamples } from "@/lib/samples";

export const dynamic = "force-dynamic";

/**
 * Seed demo orders — but only into an empty table, so this can never
 * clobber real orders. Returns the full, freshly-read list. Admin only.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const db = admin();

    const { count } = await db
      .from("orders")
      .select("id", { count: "exact", head: true });

    if (!count) {
      const samples = makeSamples();
      for (const order of samples) {
        await db.from("orders").insert({
          id: order.id,
          customer_name: order.customerName,
          phone: order.phone || null,
          method: order.method,
          address: order.address || null,
          note: order.note || null,
          total: order.total,
          status: order.status,
          payment_confirmed: order.paymentConfirmed || false,
          payment_verified: order.paymentVerified || false,
          created_at: order.createdAt,
          customer_id: null,
        });
        await db.from("order_items").insert(
          order.lines.map((l) => ({
            order_id: order.id,
            name: l.name,
            qty: l.qty,
            price: l.price,
          }))
        );
      }
    }

    const { data, error } = await db
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return ok({ orders: (data ?? []).map(orderRowToOrder), seeded: !count });
  });
}
