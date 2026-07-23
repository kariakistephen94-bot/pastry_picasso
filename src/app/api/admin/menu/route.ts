import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import { menuItemToRow, menuRowToItem } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** Create or update a menu item. Admin only. */
export async function POST(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const item = await req.json().catch(() => null);
    if (!item?.id || !item?.name) return fail("id and name are required.");
    if (typeof item.price !== "number" || item.price < 0)
      return fail("A valid price is required.");

    const { data, error } = await admin()
      .from("menu_items")
      .upsert(menuItemToRow(item))
      .select()
      .single();
    if (error) throw error;

    return ok({ item: menuRowToItem(data) });
  });
}
