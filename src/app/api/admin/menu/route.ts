import { NextResponse } from "next/server";
import {
  admin,
  ok,
  fail,
  guard,
  requireAdmin,
  parsePage,
  paginated,
} from "@/lib/api-server";
import { menuItemToRow, menuRowToItem } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  name: { column: "name", ascending: true },
  price_low: { column: "price", ascending: true },
  price_high: { column: "price", ascending: false },
};

/** Paginated menu list with category filter + search. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const { page, limit, from, to } = parsePage(req);
    const category = url.searchParams.get("category") || "all";
    const q = (url.searchParams.get("q") || "").trim();
    const sort = SORTS[url.searchParams.get("sort") || "name"] ?? SORTS.name;

    let query = admin()
      .from("menu_items")
      .select("*", { count: "exact" })
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    if (category !== "all") query = query.eq("category", category);
    if (q) query = query.ilike("name", `%${q}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    return paginated(
      (data ?? []).map(menuRowToItem),
      count ?? 0,
      { page, limit, from, to }
    );
  });
}

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
