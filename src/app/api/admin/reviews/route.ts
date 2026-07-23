import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin, parsePage, paginated } from "@/lib/api-server";
import { reviewRowToReview } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const SORTS: Record<string, { column: string; ascending: boolean }> = {
  recent: { column: "date", ascending: false },
  oldest: { column: "date", ascending: true },
  rating_high: { column: "rating", ascending: false },
  rating_low: { column: "rating", ascending: true },
};

async function visibilityCounts() {
  const db = admin();
  const [all, visible] = await Promise.all([
    db.from("reviews").select("id", { count: "exact", head: true }),
    db.from("reviews").select("id", { count: "exact", head: true }).eq("visible", true),
  ]);
  const a = all.count ?? 0;
  const v = visible.count ?? 0;
  return { all: a, visible: v, hidden: a - v };
}

/** Paginated review list (including hidden) for moderation. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const { page, limit, from, to } = parsePage(req);
    const filter = url.searchParams.get("filter") || "all";
    const sort = SORTS[url.searchParams.get("sort") || "recent"] ?? SORTS.recent;

    let query = admin()
      .from("reviews")
      .select("*", { count: "exact" })
      .order(sort.column, { ascending: sort.ascending })
      .range(from, to);

    if (filter === "visible") query = query.eq("visible", true);
    else if (filter === "hidden") query = query.eq("visible", false);

    const { data, error, count } = await query;
    if (error) throw error;

    const counts = await visibilityCounts();

    return paginated(
      (data ?? []).map(reviewRowToReview),
      count ?? 0,
      { page, limit, from, to },
      { counts }
    );
  });
}
