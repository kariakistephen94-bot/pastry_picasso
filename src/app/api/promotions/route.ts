import { ok, guard } from "@/lib/api-server";
import { loadPromotions } from "@/lib/promo-server";
import { promoLabel, promoStatus } from "@/lib/promo";

export const dynamic = "force-dynamic";

/**
 * The offers worth advertising on the storefront banner.
 *
 * Only promotions the owner marked "show publicly" and that are live
 * right now. Everything a code-based promo does not need to give away
 * (usage counts, limits, which items it targets) stays server-side —
 * the banner needs a headline, not the rulebook.
 */
export async function GET() {
  return guard(async () => {
    const now = Date.now();
    const promos = (await loadPromotions())
      .filter((p) => p.showPublicly && promoStatus(p, now) === "active")
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 6)
      .map((p) => ({
        id: p.id,
        code: p.code,
        name: p.name,
        description: p.description ?? null,
        label: promoLabel(p),
        minOrder: p.minOrder,
        endsAt: p.endsAt,
      }));

    return ok({ promotions: promos });
  });
}
