import { admin, ok, fail, guard, currentUser } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

interface IncomingItem {
  id: string;
  qty: number;
}

/**
 * Place an order.
 *
 * Prices and the order total are computed HERE from the live menu, never
 * trusted from the client. A cart line id encodes its base item and any
 * chosen extras as `base-id::extra1+extra2`, which is enough to rebuild
 * the exact line the customer saw.
 */
export async function POST(req: Request) {
  return guard(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const customerName = String(body.customerName ?? "").trim();
    const method = body.method === "pickup" ? "pickup" : "delivery";
    const phone = body.phone ? String(body.phone).trim() : null;
    const address = body.address ? String(body.address).trim() : null;
    const note = body.note ? String(body.note).trim() : null;
    const customerId = body.customerId ? String(body.customerId) : null;
    const paymentConfirmed = body.paymentConfirmed === true;

    const items: IncomingItem[] = Array.isArray(body.items) ? body.items : [];

    if (!customerName) return fail("A customer name is required.");
    if (method === "delivery" && !address)
      return fail("A delivery address is required.");
    if (items.length === 0) return fail("Your cart is empty.");

    const db = admin();

    // Resolve every base item referenced by the cart in one query.
    const baseIds = Array.from(
      new Set(items.map((i) => String(i.id).split("::")[0]))
    );
    const { data: menuRows, error: menuErr } = await db
      .from("menu_items")
      .select("id, name, price, extras, available")
      .in("id", baseIds);
    if (menuErr) throw menuErr;

    const menu = new Map((menuRows ?? []).map((m: any) => [m.id, m]));

    const lines: { order_id: string; name: string; qty: number; price: number }[] =
      [];
    let total = 0;

    for (const item of items) {
      const qty = Math.max(1, Math.floor(Number(item.qty) || 0));
      const [baseId, extrasPart] = String(item.id).split("::");
      const base = menu.get(baseId);

      if (!base) return fail(`An item in your cart is no longer available.`);
      if (base.available === false)
        return fail(`"${base.name}" is currently unavailable.`);

      const extraIds = extrasPart ? extrasPart.split("+") : [];
      const available = Array.isArray(base.extras) ? base.extras : [];
      const chosen = available.filter((e: any) => extraIds.includes(e.id));

      let unit = base.price;
      let name = base.name;
      if (chosen.length > 0) {
        unit += chosen.reduce((n: number, c: any) => n + (c.price || 0), 0);
        name = `${base.name} (+ ${chosen.map((c: any) => c.name).join(", ")})`;
      }

      total += unit * qty;
      lines.push({ order_id: "", name, qty, price: unit });
    }

    // Attribute to the signed-in account when there is one; guests stay null.
    const user = await currentUser(req);

    const id = uid();
    const createdAt = Date.now();
    lines.forEach((l) => (l.order_id = id));

    const { error: orderErr } = await db.from("orders").insert({
      id,
      customer_name: customerName,
      phone,
      method,
      address: method === "delivery" ? address : null,
      note,
      total,
      status: "new",
      payment_confirmed: paymentConfirmed,
      payment_verified: false,
      created_at: createdAt,
      customer_id: customerId,
      user_id: user?.id ?? null,
    });
    if (orderErr) throw orderErr;

    const { error: itemsErr } = await db.from("order_items").insert(lines);
    if (itemsErr) {
      // Roll back the orphaned order so a failed line insert can't leave a
      // header with no items.
      await db.from("orders").delete().eq("id", id);
      throw itemsErr;
    }

    const order = orderRowToOrder({
      id,
      customer_name: customerName,
      phone,
      method,
      address,
      note,
      total,
      status: "new",
      payment_confirmed: paymentConfirmed,
      payment_verified: false,
      created_at: createdAt,
      order_items: lines,
    });

    return ok({ order }, 201);
  });
}
