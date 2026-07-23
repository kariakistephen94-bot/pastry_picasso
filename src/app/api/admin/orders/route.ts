import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin, parsePage, paginated } from "@/lib/api-server";
import { orderRowToOrder, type OrderStatus } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "new",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  recent: { column: "created_at", ascending: false },
  oldest: { column: "created_at", ascending: true },
  total_high: { column: "total", ascending: false },
  total_low: { column: "total", ascending: true },
};

async function statusCounts() {
  const db = admin();
  const [all, ...perStatus] = await Promise.all([
    db.from("orders").select("id", { count: "exact", head: true }).neq("status", "cancelled"),
    ...STATUSES.map((s) =>
      db.from("orders").select("id", { count: "exact", head: true }).eq("status", s)
    ),
  ]);
  const counts: Record<string, number> = { all: all.count ?? 0 };
  STATUSES.forEach((s, i) => (counts[s] = perStatus[i].count ?? 0));
  return counts;
}

/** Total revenue, excluding cancelled orders (they never count as income). */
async function totalRevenue() {
  const { data } = await admin()
    .from("orders")
    .select("total")
    .neq("status", "cancelled");
  return (data ?? []).reduce((n: number, o: any) => n + (o.total || 0), 0);
}

/** Paginated order list for the dashboard. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const [counts, revenue] = await Promise.all([statusCounts(), totalRevenue()]);

    // AdminShell only needs the badge numbers, not a page of rows.
    if (url.searchParams.get("countsOnly") === "1") {
      return ok({ counts, revenue });
    }

    const { page, limit, from, to } = parsePage(req);
    const status = url.searchParams.get("status") || "all";
    const sort = SORTS[url.searchParams.get("sort") || "recent"] ?? SORTS.recent;

    let query = admin()
      .from("orders")
      .select("*, order_items(*)", { count: "exact" })
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    if (status === "all") {
      query = query.neq("status", "cancelled");
    } else if (STATUSES.includes(status as OrderStatus)) {
      query = query.eq("status", status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return paginated(
      (data ?? []).map(orderRowToOrder),
      count ?? 0,
      { page, limit, from, to },
      { counts, revenue }
    );
  });
}

/** Clear every order (and its items, via cascade). Admin only. */
export async function DELETE(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { error } = await admin().from("orders").delete().neq("id", "__none__");
    if (error) throw error;

    return ok();
  });
}
