import { admin, ok, guard } from "@/lib/api-server";
import { menuRowToItem } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** Public menu. Returns every item; the client hides unavailable ones. */
export async function GET() {
  return guard(async () => {
    const { data, error } = await admin()
      .from("menu_items")
      .select("*")
      .order("name", { ascending: true });
    if (error) throw error;
    return ok({ items: (data ?? []).map(menuRowToItem) });
  });
}
