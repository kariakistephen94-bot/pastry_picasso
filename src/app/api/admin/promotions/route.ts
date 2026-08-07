import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import {
  buildPromotionRow,
  isDuplicateCodeError,
  type PromotionWithStats,
} from "@/lib/promo-server";
import { promoRowToPromotion } from "@/lib/promo";

export const dynamic = "force-dynamic";

/** Every promotion plus what each one has cost. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const db = admin();
    const [promos, redemptions] = await Promise.all([
      db.from("promotions").select("*").order("created_at", { ascending: false }),
      db
        .from("promo_redemptions")
        .select("promotion_id, amount")
        .eq("voided", false),
    ]);
    if (promos.error) throw promos.error;

    const spend = new Map<string, { amount: number; count: number }>();
    for (const r of redemptions.data ?? []) {
      const id = (r as any).promotion_id;
      const prev = spend.get(id) ?? { amount: 0, count: 0 };
      spend.set(id, {
        amount: prev.amount + (Number((r as any).amount) || 0),
        count: prev.count + 1,
      });
    }

    const promotions: PromotionWithStats[] = (promos.data ?? []).map((row) => {
      const promo = promoRowToPromotion(row);
      const stat = spend.get(promo.id);
      return {
        ...promo,
        discountGiven: stat?.amount ?? 0,
        redemptions: stat?.count ?? 0,
      };
    });

    return ok({
      promotions,
      totals: {
        discountGiven: promotions.reduce((n, p) => n + p.discountGiven, 0),
        redemptions: promotions.reduce((n, p) => n + p.redemptions, 0),
      },
    });
  });
}

/** Create a promotion. Admin only. */
export async function POST(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const built = buildPromotionRow(body);
    if ("error" in built) return fail(built.error);

    const { data, error } = await admin()
      .from("promotions")
      .insert({ ...built.row, created_at: Date.now() })
      .select()
      .single();

    if (error) {
      if (isDuplicateCodeError(error))
        return fail("That promo code is already in use.");
      throw error;
    }

    return ok({ promotion: promoRowToPromotion(data) }, 201);
  });
}
