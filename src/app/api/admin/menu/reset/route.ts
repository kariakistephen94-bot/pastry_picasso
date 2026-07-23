import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";
import { menuItemToRow, menuRowToItem } from "@/lib/mappers";
import { BASE_MENU } from "@/lib/data";

export const dynamic = "force-dynamic";

/** Wipe the menu and reseed it from the built-in defaults. Admin only. */
export async function POST(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const db = admin();

    const { error: delErr } = await db
      .from("menu_items")
      .delete()
      .neq("id", "__none__");
    if (delErr) throw delErr;

    const { data, error: insErr } = await db
      .from("menu_items")
      .insert(BASE_MENU.map(menuItemToRow))
      .select();
    if (insErr) throw insErr;

    return ok({ items: (data ?? []).map(menuRowToItem) });
  });
}
