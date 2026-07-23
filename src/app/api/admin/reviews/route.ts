import { NextResponse } from "next/server";
import { admin, ok, guard, requireAdmin } from "@/lib/api-server";
import { reviewRowToReview } from "@/lib/mappers";

export const dynamic = "force-dynamic";

/** Every review, including hidden ones, for moderation. Admin only. */
export async function GET(req: Request) {
  return guard(async () => {
    const auth = await requireAdmin(req);
    if (auth instanceof NextResponse) return auth;

    const { data, error } = await admin()
      .from("reviews")
      .select("*")
      .order("date", { ascending: false });
    if (error) throw error;

    return ok({ reviews: (data ?? []).map(reviewRowToReview) });
  });
}
