import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";

export const dynamic = "force-dynamic";

export interface CustomerRow {
  key: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  role: "customer" | "admin" | null;
  orderCount: number;
  totalSpend: number;
  lastOrderAt: number | null;
}

/** Last 10 digits, so 0803…, +234803… and 234803… group together. */
function phoneKey(phone?: string | null): string {
  const digits = (phone || "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/**
 * Customer directory: registered accounts merged with guest orders, grouped
 * by phone number. Aggregated on the server so the client just renders it.
 * Admin only.
 */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const db = admin();
    const [{ data: profiles }, { data: orders }] = await Promise.all([
      db
        .from("profiles")
        .select("id, email, full_name, phone, role")
        .order("created_at", { ascending: false }),
      db.from("orders").select("user_id, customer_name, phone, total, created_at"),
    ]);

    const orderList = orders ?? [];

    const registered: CustomerRow[] = (profiles ?? []).map((p: any) => {
      const pKey = phoneKey(p.phone);
      const mine = orderList.filter(
        (o: any) =>
          o.user_id === p.id || (pKey !== "" && phoneKey(o.phone) === pKey)
      );
      return {
        key: `user:${p.id}`,
        userId: p.id,
        name: p.full_name || p.email || "Unnamed",
        email: p.email || "",
        phone: p.phone || "",
        role: p.role === "admin" ? "admin" : "customer",
        orderCount: mine.length,
        totalSpend: mine.reduce((n: number, o: any) => n + (o.total || 0), 0),
        lastOrderAt: mine.length
          ? Math.max(...mine.map((o: any) => Number(o.created_at)))
          : null,
      };
    });

    const claimedPhones = new Set(
      registered.map((r) => phoneKey(r.phone)).filter(Boolean)
    );

    const guests = new Map<string, CustomerRow>();
    for (const o of orderList as any[]) {
      if (o.user_id) continue;
      const pKey = phoneKey(o.phone);
      if (pKey && claimedPhones.has(pKey)) continue;

      const key = pKey ? `phone:${pKey}` : `name:${o.customer_name || "?"}`;
      const at = Number(o.created_at);
      const existing = guests.get(key);

      if (existing) {
        existing.orderCount += 1;
        existing.totalSpend += o.total || 0;
        if (!existing.lastOrderAt || at > existing.lastOrderAt) {
          existing.lastOrderAt = at;
          existing.name = o.customer_name || existing.name;
        }
      } else {
        guests.set(key, {
          key,
          userId: null,
          name: o.customer_name || "Guest",
          email: "",
          phone: o.phone || "",
          role: null,
          orderCount: 1,
          totalSpend: o.total || 0,
          lastOrderAt: at,
        });
      }
    }

    const customers = [...registered, ...guests.values()].sort((a, b) => {
      if (b.orderCount !== a.orderCount) return b.orderCount - a.orderCount;
      return (b.lastOrderAt ?? 0) - (a.lastOrderAt ?? 0);
    });

    return ok({ customers, currentUserId: auth.id });
  });
}
