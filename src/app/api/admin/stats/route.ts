import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";
import { orderRowToOrder } from "@/lib/mappers";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;

interface Bucket {
  start: number;
  end: number; // exclusive
  label: string;
  isCurrent: boolean;
}

const RANGES: Record<string, { label: string }> = {
  "7d": { label: "last 7 days" },
  "30d": { label: "last 30 days" },
  "3m": { label: "last 3 months" },
  "1y": { label: "last 12 months" },
};

function startOfDay(ts: number) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Build the time buckets (oldest → newest) for a given range. */
function buildBuckets(range: string, now: number): Bucket[] {
  const today = startOfDay(now);
  const endExclusive = today + DAY;
  const buckets: Bucket[] = [];

  if (range === "7d" || range === "30d") {
    const n = range === "7d" ? 7 : 30;
    for (let i = n - 1; i >= 0; i--) {
      const start = today - i * DAY;
      buckets.push({
        start,
        end: start + DAY,
        label:
          range === "7d"
            ? new Date(start).toLocaleDateString("en-NG", { weekday: "short" })
            : new Date(start).toLocaleDateString("en-NG", { day: "numeric" }),
        isCurrent: i === 0,
      });
    }
  } else if (range === "3m") {
    const n = 13; // ~3 months of weekly buckets
    for (let i = n - 1; i >= 0; i--) {
      const end = endExclusive - i * 7 * DAY;
      const start = end - 7 * DAY;
      buckets.push({
        start,
        end,
        label: new Date(start).toLocaleDateString("en-NG", {
          day: "numeric",
          month: "short",
        }),
        isCurrent: i === 0,
      });
    }
  } else {
    // 1y: 12 calendar months.
    const base = new Date(now);
    for (let i = 11; i >= 0; i--) {
      const s = new Date(base.getFullYear(), base.getMonth() - i, 1);
      const e = new Date(base.getFullYear(), base.getMonth() - i + 1, 1);
      buckets.push({
        start: s.getTime(),
        end: e.getTime(),
        label: s.toLocaleDateString("en-NG", { month: "short" }),
        isCurrent: i === 0,
      });
    }
  }

  return buckets;
}

/** Dashboard analytics for a selectable time range. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const range = RANGES[url.searchParams.get("range") || "7d"] ? url.searchParams.get("range")! : "7d";

    const now = Date.now();
    const buckets = buildBuckets(range, now);
    const windowStart = buckets[0].start;
    const windowLen = now - windowStart;
    const prevStart = windowStart - windowLen;

    const db = admin();
    // Cancelled orders are never income, so they're excluded from every
    // revenue and volume figure below.
    const [current, previous, pendingRes, recentRes] = await Promise.all([
      db
        .from("orders")
        .select("total, created_at, order_items(name, qty)")
        .neq("status", "cancelled")
        .gte("created_at", windowStart),
      db
        .from("orders")
        .select("total")
        .neq("status", "cancelled")
        .gte("created_at", prevStart)
        .lt("created_at", windowStart),
      db
        .from("orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "preparing"]),
      db
        .from("orders")
        .select("*, order_items(*)")
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (current.error) throw current.error;

    const currentRows = current.data ?? [];
    const prevRows = previous.data ?? [];

    // Revenue series.
    const series = buckets.map((b) => {
      const value = currentRows
        .filter((o: any) => {
          const t = Number(o.created_at);
          return t >= b.start && t < b.end;
        })
        .reduce((n: number, o: any) => n + (o.total || 0), 0);
      return { label: b.label, value, isCurrent: b.isCurrent };
    });

    // Top sellers in range.
    const itemMap = new Map<string, number>();
    for (const o of currentRows as any[]) {
      for (const l of o.order_items ?? []) {
        itemMap.set(l.name, (itemMap.get(l.name) ?? 0) + l.qty);
      }
    }
    const topItems = [...itemMap.entries()]
      .map(([name, qty]) => ({ name, qty }))
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    const revenue = currentRows.reduce((n: number, o: any) => n + (o.total || 0), 0);
    const prevRevenue = prevRows.reduce((n: number, o: any) => n + (o.total || 0), 0);
    const orders = currentRows.length;
    const prevOrders = prevRows.length;

    const pct = (curr: number, prev: number) =>
      prev > 0 ? Math.round(((curr - prev) / prev) * 100) : null;

    return ok({
      range,
      rangeLabel: RANGES[range].label,
      kpis: {
        revenue,
        revDelta: pct(revenue, prevRevenue),
        orders,
        orderDelta: pct(orders, prevOrders),
        avg: orders ? Math.round(revenue / orders) : 0,
        pending: pendingRes.count ?? 0,
      },
      series,
      topItems,
      recent: (recentRes.data ?? []).map(orderRowToOrder),
    });
  });
}
