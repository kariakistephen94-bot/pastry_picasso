import { NextResponse } from "next/server";
import { admin, ok, fail, guard, requireAdmin } from "@/lib/api-server";
import { buildPromotionRow, isDuplicateCodeError } from "@/lib/promo-server";
import { promoRowToPromotion } from "@/lib/promo";

export const dynamic = "force-dynamic";

/**
 * Update a promotion. Admin only.
 *
 * A body carrying only `{ active }` is the pause/resume switch and skips
 * full validation, so an owner can stop a running deal in one tap even
 * if some other field would no longer pass today's rules.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) return fail("Invalid request body.");

    const keys = Object.keys(body);
    const toggleOnly = keys.length === 1 && keys[0] === "active";

    let patch: Record<string, unknown>;
    if (toggleOnly) {
      patch = { active: body.active === true };
    } else {
      const built = buildPromotionRow(body);
      if ("error" in built) return fail(built.error);
      patch = built.row;
    }

    const { data, error } = await admin()
      .from("promotions")
      .update(patch)
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      if (isDuplicateCodeError(error))
        return fail("That promo code is already in use.");
      throw error;
    }
    if (!data) return fail("Promotion not found.", 404);

    return ok({ promotion: promoRowToPromotion(data) });
  });
}

/**
 * Delete a promotion. Admin only.
 *
 * Redemption rows cascade away with it, so past orders keep the code and
 * label they were charged under (those live on the order itself) while
 * the promotion stops counting towards "discounts given".
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const { error } = await admin().from("promotions").delete().eq("id", id);
    if (error) throw error;

    return ok();
  });
}
